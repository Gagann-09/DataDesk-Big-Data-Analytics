/**
 * POST /api/datasets — single dataset upload/registration endpoint.
 *
 * Stream bytes to a unique staging file while computing SHA-256 and exact
 * size; run bounded CSV/JSONL validation; enforce the duplicate policy
 * atomically via a dedup claim (same checksum + byte size -> 409, existing
 * version returned, bytes never stored twice); then promote to an immutable
 * managed path under /datadesk/ and finalize the MongoDB version record as
 * `stored` (or `failed` on any error). Only this upload's staging bytes are
 * ever removed.
 *
 * Concurrency safety: claimDedupe() is the atomic gate for a (sha256,
 * byteSize) pair, so simultaneous identical uploads cannot both create
 * versions or HDFS copies.
 *
 * Failure recovery: the deterministic final HDFS path is pre-recorded on the
 * pending_upload version before HDFS promotion. If promotion succeeds but
 * MongoDB finalization fails, the version stays pending_upload with hdfsPath
 * set, and startup reconciliation (store.stat) recovers it. Only this
 * upload's local/HDFS staging bytes are cleaned up; immutable data is never
 * deleted.
 *
 * PRD FR-01/FR-02/FR-03; Architecture §5/§6; rules.md §6/§7.
 */

import { Router } from 'express';
import { finished } from 'stream/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import Busboy from 'busboy';
import type { IncomingHttpHeaders } from 'http';
import { AppError, Errors } from '../errors';
import { HashSizeTransform } from '../services/hashing';
import { validateFile } from '../services/validation';
import {
  buildFinalHdfsPath,
  extensionOf,
  formatFromExt,
  sanitizeDisplayName,
} from '../services/paths';
import type { DatasetDoc, DatasetVersionDoc, UploadDependencies } from '../types';
import { nowISO, makeValidation } from '../services/mongo';

export function createUploadRoute(deps: UploadDependencies) {
  const router = Router();
  const { repository, store, config } = deps;

  async function removeTemp(filePath: string | null): Promise<void> {
    if (!filePath) return;
    try {
      const fs = await import('fs/promises');
      await fs.unlink(filePath);
    } catch {
      // Best-effort cleanup of this upload's own staging bytes only.
    }
  }

  router.post('/datasets', async (req, res, next) => {
    let tempPath: string | null = null;
    try {
      const mongo = repository as { isConnected?: () => boolean };
      if (typeof mongo.isConnected === 'function' && !mongo.isConnected()) {
        // We will not consume the request body; drain it so the connection
        // closes cleanly instead of resetting on the unread entity bytes.
        req.resume();
        throw Errors.mongodbUnavailable();
      }

      const busboy = Busboy({
        headers: req.headers as IncomingHttpHeaders,
        limits: { fileSize: config.maxUploadBytes },
      });

      let sizeLimitExceeded = false;
      const sink: {
        file:
          | { stream: NodeJS.ReadableStream; filename: string; mimetype: string }
          | null;
      } = { file: null };
      let busboyError: unknown = null;
      let displayName = '';

      busboy.on(
        'file',
        (
          fieldname: string,
          stream: NodeJS.ReadableStream,
          fileInfo: unknown,
          _encoding: unknown,
          mime: unknown,
        ) => {
          const info =
            fileInfo && typeof fileInfo === 'object' ? (fileInfo as Record<string, unknown>) : {};
          const filename =
            typeof info.filename === 'string'
              ? info.filename
              : typeof fileInfo === 'string'
                ? fileInfo
                : '';
          const mimetype =
            typeof info.mimeType === 'string'
              ? info.mimeType
              : typeof mime === 'string'
                ? mime
                : '';
          if (fieldname !== 'file') {
            stream.resume();
            return;
          }
          if (sink.file) {
            stream.resume();
            return; // only one file part is accepted
          }
          stream.on('limit', () => {
            sizeLimitExceeded = true;
          });
          sink.file = { stream, filename, mimetype };
        },
      );
      busboy.on('field', (name: string, value: string) => {
        if (name === 'displayName') {
          displayName = String(value).slice(0, 200);
        }
      });
      busboy.on('error', (err: unknown) => {
        busboyError = err;
      });

      req.pipe(busboy);
      await finished(req);

      if (busboyError !== null) {
        throw busboyError;
      }

      const file:
        | { stream: NodeJS.ReadableStream; filename: string; mimetype: string }
        | null = sink.file;
      if (file === null) throw Errors.fileRequired();
      if (sizeLimitExceeded) throw Errors.sizeLimitExceeded(config.maxUploadBytes);

      const ext = extensionOf(file.filename);
      const format = formatFromExt(ext);
      if (format === null) {
        throw Errors.unsupportedMediaType(ext || 'no extension');
      }

      const uploadId = randomUUID();
      tempPath = join(tmpdir(), `datadesk-upload-${uploadId}${ext}`);
      const hashSize = new HashSizeTransform();
      const out = createWriteStream(tempPath);

      file.stream.pipe(hashSize).pipe(out);
      await finished(hashSize);
      await finished(out);

      const { sha256, size } = hashSize;
      if (size > config.maxUploadBytes) {
        throw Errors.sizeLimitExceeded(config.maxUploadBytes);
      }
      if (size === 0) {
        throw new AppError(400, 'empty_file', 'Uploaded file is empty.');
      }

      // If a previous upload already stored this exact content (same
      // sha256 + byte size as a `stored` version), return the existing
      // version as a duplicate. This also covers the recovery case where
      // startup reconciliation recovered a version to `stored` and cleared
      // its dedup claim: the stored version itself enforces deduplication.
      const existingStored = await repository.findByShaAndSize(sha256, size);
      if (existingStored) {
        await removeTemp(tempPath);
        tempPath = null;
        return res.status(409).json({
          error: 'duplicate_dataset_version',
          message:
            'A dataset version with this checksum and byte size already exists; bytes are not stored twice.',
          existing: {
            datasetId: existingStored.datasetId,
            versionId: existingStored._id,
            versionNumber: existingStored.versionNumber,
            hdfsPath: existingStored.hdfsPath,
            byteSize: existingStored.byteSize,
            sha256: existingStored.sha256,
          },
        });
      }

      // Bounded validation on the staged file (skip-and-count policy).
      const validation = await validateFile(
        tempPath,
        format,
        { maxErrors: config.maxValidationErrors },
      );

      // Generate identifiers and the deterministic final HDFS path before
      // claiming, so the claim references the version that will own the bytes.
      const datasetId = randomUUID();
      const versionId = randomUUID();
      const versionNumber = 1;
      const claimKey = repository.dedupeClaimKey(sha256, size);
      const finalHdfsPath = buildFinalHdfsPath(datasetId, versionNumber, ext);

      // Atomic dedup claim: only one upload can own this (sha256, byteSize).
      const claim = await repository.claimDedupe(sha256, size, versionId, datasetId);
      if (!claim.claimed) {
        await removeTemp(tempPath);
        tempPath = null;
        const existing = claim.existing!;
        if (existing.status === 'stored') {
          return res.status(409).json({
            error: 'duplicate_dataset_version',
            message:
              'A dataset version with this checksum and byte size already exists; bytes are not stored twice.',
            existing: {
              datasetId: existing.datasetId,
              versionId: existing.versionId,
              versionNumber: 1,
              hdfsPath: existing.hdfsPath,
              byteSize: existing.byteSize,
              sha256: existing.sha256,
            },
          });
        }
        // 'claimed': another upload is actively processing this content.
        return res.status(409).json({
          error: 'dataset_version_being_processed',
          message: 'An identical upload is already being processed; please retry.',
          existing: {
            datasetId: existing.datasetId,
            versionId: existing.versionId,
            byteSize: existing.byteSize,
            sha256: existing.sha256,
          },
        });
      }

      const createdAt = nowISO();
      const safeDisplay = sanitizeDisplayName(displayName || file.filename);

      const datasetDoc: DatasetDoc = {
        _id: datasetId,
        displayName: safeDisplay,
        createdAt,
        latestVersionId: null,
        tags: [],
        lifecycleStatus: 'active',
      };
      await repository.insertDataset(datasetDoc);

      // Pre-record the deterministic final HDFS path so that, if HDFS
      // promotion succeeds but MongoDB finalization fails, restart
      // reconciliation can detect the stored bytes and recover.
      const versionDoc: DatasetVersionDoc = {
        _id: versionId,
        datasetId,
        versionNumber,
        originalFilename: file.filename,
        format,
        mediaType: file.mimetype || 'application/octet-stream',
        byteSize: size,
        sha256,
        recordCount: validation.recordCount,
        hdfsPath: finalHdfsPath,
        stagingPath: tempPath,
        createdAt,
        lifecycleStatus: 'pending_upload',
        validation: makeValidation(
          validation.acceptedRows,
          validation.rejectedRows,
          validation.errorSamples,
          format,
        ),
        source: { kind: 'upload', licenseUrl: null },
      };
      await repository.insertVersion(versionDoc);

      // Promote staged bytes to the immutable managed HDFS path.
      let stored;
      try {
        stored = await store.storeFile(
          tempPath,
          uploadId,
          datasetId,
          versionNumber,
          ext,
        );
      } catch (err) {
        await repository.updateVersion(versionId, {
          lifecycleStatus: 'failed',
        });
        try {
          await repository.releaseDedupe(claimKey);
        } catch {
          // Best effort; we already throw storageFailure below.
        }
        await removeTemp(tempPath);
        tempPath = null;
        throw Errors.storageFailure(
          err instanceof Error ? err.message : String(err),
        );
      }

      // storeFile succeeded: bytes are in HDFS at stored.hdfsPath (verified).
      // Finalize MongoDB metadata. If this fails, the version stays
      // pending_upload with hdfsPath set, so restart reconciliation recovers
      // it. Release the claim so an identical upload may retry after recovery.
      try {
        await repository.updateVersion(versionId, {
          lifecycleStatus: 'stored',
          stagingPath: null,
        });
        await repository.updateDataset(datasetId, { latestVersionId: versionId });
        await repository.confirmDedupe(claimKey, stored.hdfsPath);
      } catch (err) {
        try {
          await repository.releaseDedupe(claimKey);
        } catch {
          // Best effort; we already throw storageFailure below.
        }
        await removeTemp(tempPath);
        tempPath = null;
        throw Errors.storageFailure(
          `HDFS stored at ${stored.hdfsPath} but MongoDB finalization failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      await removeTemp(tempPath);
      tempPath = null;

      return res.status(201).json({
        datasetId,
        versionId,
        versionNumber,
        displayName: safeDisplay,
        originalFilename: file.filename,
        format,
        mediaType: versionDoc.mediaType,
        byteSize: size,
        sha256,
        recordCount: validation.recordCount,
        hdfsPath: stored.hdfsPath,
        createdAt,
        lifecycleStatus: 'stored',
        validation: versionDoc.validation,
      });
    } catch (err) {
      await removeTemp(tempPath);
      next(err);
    }
  });

  return router;
}
