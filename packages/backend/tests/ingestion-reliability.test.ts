/**
 * Regression tests for Phase 1 ingestion reliability fixes.
 *
 * These run against the in-memory fake repository/store, so they exercise the
 * upload route's dedup-claim and failure-recovery logic without live MongoDB
 * or HDFS. Real integration against a live MongoDB/NameNode is blocked in
 * this environment (no services running; see RUNBOOK.md) and is reported as
 * such, not claimed as passed.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { createApp } from '../src/app';
import { InMemoryDatasetRepository, nowISO, makeValidation } from '../src/services/mongo';
import { InMemoryDatasetStore } from '../src/services/store';
import { HashSizeTransform } from '../src/services/hashing';
import { buildFinalHdfsPath } from '../src/services/paths';
import type { DatasetVersionDoc, UploadConfig } from '../src/types';

const sha256 = (content: string) =>
  createHash('sha256').update(content).digest('hex');

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'datadesk-rel-'));
}
function writeTemp(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}
function cleanup(dirs: string[]): void {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

function makeConfig(overrides: Partial<UploadConfig> = {}): UploadConfig {
  return {
    port: 0,
    host: '127.0.0.1',
    nodeEnv: 'test',
    mongodbUri: 'mongodb://127.0.0.1:27017',
    mongodbDb: 'datadesk_test',
    maxUploadBytes: 104857600,
    maxValidationErrors: 50,
    webhdfsBase: 'http://127.0.0.1:50070/webhdfs/v1',
    webhdfsUser: 'hadoop',
    datadeskPrefix: '/datadesk',
    allowedFormats: ['csv', 'jsonl'] as const,
    ...overrides,
  };
}

function repoVersions(repo: InMemoryDatasetRepository): DatasetVersionDoc[] {
  return [...((repo as unknown) as { versions: Map<string, DatasetVersionDoc> }).versions.values()];
}

describe('ingestion reliability (in-memory fakes)', () => {
  let dirs: string[] = [];
  afterEach(() => cleanup(dirs));

  it('SHA-256 getter is safe against repeated access', () => {
    const hashSize = new HashSizeTransform();
    const buf = Buffer.from('deterministic payload for digest stability');
    hashSize.write(buf);
    hashSize.end();
    const first = hashSize.sha256;
    const second = hashSize.sha256;
    expect(first).toBe(second);
    expect(first).toBe(createHash('sha256').update(buf).digest('hex'));
    expect(hashSize.size).toBe(buf.length);
  });

  it('concurrent identical uploads: exactly one version stored, other gets 409', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,concurrent\n2,concurrent\n';
    const p = writeTemp(dir, 'concurrent.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const [first, second] = await Promise.all([
      request(app).post('/api/datasets').attach('file', p),
      request(app).post('/api/datasets').attach('file', p),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);

    // Exactly one version record exists and it is stored.
    const versions = repoVersions(repo);
    expect(versions.length).toBe(1);
    expect(versions[0].lifecycleStatus).toBe('stored');
    expect(versions[0].sha256).toBe(sha256(content));
    expect(versions[0].byteSize).toBe(Buffer.byteLength(content));

    // Bytes stored once: one HDFS path.
    const stored = versions[0];
    expect(store.has(stored.hdfsPath!)).toBe(true);
  });

  it('HDFS promotion succeeds but MongoDB finalization fails: version preserved for reconciliation', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,recover\n';
    const p = writeTemp(dir, 'recover.csv', content);

    // A repository whose finalize (pending_upload -> stored) update fails,
    // simulating MongoDB being unable to persist the finalization.
    class FinalizeFailingRepository extends InMemoryDatasetRepository {
      async updateVersion(
        id: string,
        patch: Partial<DatasetVersionDoc>,
      ): Promise<void> {
        if (patch.lifecycleStatus === 'stored') {
          throw new Error('MongoDB finalization failed');
        }
        return super.updateVersion(id, patch);
      }
    }

    const repo = new FinalizeFailingRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const res = await request(app).post('/api/datasets').attach('file', p);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('storage_failure');

    // The version record was preserved (pending_upload) with the final HDFS
    // path recorded; bytes are in HDFS but not yet finalized in MongoDB.
    const versions = repoVersions(repo);
    expect(versions.length).toBe(1);
    const v = versions[0];
    expect(v.lifecycleStatus).toBe('pending_upload');
    expect(v.hdfsPath).toBeTruthy();
    expect(store.has(v.hdfsPath!)).toBe(true); // HDFS has the verified bytes

    // Startup reconciliation detects the stored bytes and recovers to `stored`.
    const report = await repo.reconcile(store);
    expect(report.versionsRecovered).toBeGreaterThan(0);

    const recovered = repoVersions(repo)[0];
    expect(recovered.lifecycleStatus).toBe('stored');
    expect(recovered.hdfsPath).toBe(v.hdfsPath);
  });

  it('reconciliation clears stale dedup claims for failed versions', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,stale\n';
    writeTemp(dir, 'stale.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    // Claim the content but never store (simulate an interrupted upload).
    const claimKey = repo.dedupeClaimKey(sha256(content), Buffer.byteLength(content));
    const claimed = await repo.claimDedupe(
      sha256(content),
      Buffer.byteLength(content),
      'version-interrupted',
      'dataset-interrupted',
    );
    expect(claimed.claimed).toBe(true);

    // No version exists for the claim; reconciliation should clear the claim.
    const report = await repo.reconcile(store);
    expect(report.claimsCleared).toBeGreaterThan(0);

    // A subsequent identical upload can now claim the content again.
    const retry = await repo.claimDedupe(
      sha256(content),
      Buffer.byteLength(content),
      'version-retry',
      'dataset-retry',
    );
    expect(retry.claimed).toBe(true);
  });

  it('recovered stored version clears its dedup claim; identical upload gets 409 duplicate', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,recover\n';
    const p = writeTemp(dir, 'recover.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    // Simulate the post-crash state: HDFS promotion succeeded (bytes present)
    // but MongoDB finalization was interrupted, leaving the version
    // pending_upload with hdfsPath recorded and an active dedup claim.
    const datasetId = randomUUID();
    const versionId = randomUUID();
    const sha = sha256(content);
    const size = Buffer.byteLength(content);
    const hdfsPath = buildFinalHdfsPath(datasetId, 1, 'csv');
    const claimKey = repo.dedupeClaimKey(sha, size);

    await repo.insertDataset({
      _id: datasetId,
      displayName: 'recover',
      createdAt: nowISO(),
      latestVersionId: null,
      tags: [],
      lifecycleStatus: 'active',
    });
    await repo.insertVersion({
      _id: versionId,
      datasetId,
      versionNumber: 1,
      originalFilename: 'recover.csv',
      format: 'csv',
      mediaType: 'text/csv',
      byteSize: size,
      sha256: sha,
      recordCount: null,
      hdfsPath,
      stagingPath: p,
      createdAt: nowISO(),
      lifecycleStatus: 'pending_upload',
      validation: makeValidation(0, 0, [], 'csv'),
      source: { kind: 'upload', licenseUrl: null },
    });
    const claim = await repo.claimDedupe(sha, size, versionId, datasetId);
    expect(claim.claimed).toBe(true);
    // Simulate HDFS having the verified bytes via the public store API
    // (storeFile records the file at buildFinalHdfsPath(datasetId, 1, ext)).
    await store.storeFile(p, versionId, datasetId, 1, 'csv');

    // Startup reconciliation recovers the version to stored and clears the claim.
    const report = await repo.reconcile(store);
    expect(report.versionsRecovered).toBeGreaterThan(0);
    expect(report.claimsCleared).toBeGreaterThan(0);

    const versions = repoVersions(repo);
    expect(versions.length).toBe(1);
    expect(versions[0].lifecycleStatus).toBe('stored');
    expect(versions[0].hdfsPath).toBe(hdfsPath);

    // The claim must be gone: a subsequent identical upload should hit the
    // stored-version duplicate check (409 duplicate), not create a second
    // version or return "being processed".
    const res = await request(app).post('/api/datasets').attach('file', p);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('duplicate_dataset_version');
    expect(res.body.existing.sha256).toBe(sha);
    expect(res.body.existing.byteSize).toBe(size);
    expect(repoVersions(repo).length).toBe(1);
    expect(store.has(hdfsPath)).toBe(true); // bytes stored once
  });

  it('repeated reconciliation is idempotent and safe', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,idem\n';
    const p = writeTemp(dir, 'idem.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    // First upload succeeds normally.
    const res1 = await request(app).post('/api/datasets').attach('file', p);
    expect(res1.status).toBe(201);

    // Running reconcile again on an already-stored version is a no-op.
    const report1 = await repo.reconcile(store);
    expect(report1.versionsRecovered).toBe(0);
    expect(report1.claimsCleared).toBe(0);

    // A second identical upload returns 409 duplicate (no new version).
    const res2 = await request(app).post('/api/datasets').attach('file', p);
    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe('duplicate_dataset_version');
    expect(repoVersions(repo).length).toBe(1);
  });
});
