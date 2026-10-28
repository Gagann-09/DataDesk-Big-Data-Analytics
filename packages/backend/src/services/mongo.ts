/**
 * Dataset registry persistence.
 *
 * Real implementation uses the official MongoDB Node.js driver
 * (Architecture §4 / §7). An in-memory fake implements the same interface so
 * upload logic can be tested without a live MongoDB instance (real
 * integration tests are blocked when no MongoDB is running — see RUNBOOK.md).
 *
 * Cross-store transactions between MongoDB and HDFS are not assumed
 * (Architecture §1); lifecycle statuses make partial states repairable.
 */

import { MongoClient, type Db, type Filter, type UpdateFilter, type MongoClientOptions } from 'mongodb';
import type {
  DatasetDoc,
  DatasetRepository,
  DatasetStore,
  DatasetValidation,
  DatasetVersionDoc,
  DedupeClaimResult,
  ReconciliationReport,
} from '../types';

type VersionPatch = Partial<
  Omit<DatasetVersionDoc, '_id' | 'datasetId' | 'versionNumber' | 'createdAt'>
>;

export class MongoDatasetRepository implements DatasetRepository {
  private client: MongoClient;
  private dbName: string;
  private db: Db | null = null;
  private connected = false;

  constructor(mongodbUri: string, mongodbDb: string, clientOptions?: MongoClientOptions) {
    this.client = new MongoClient(mongodbUri, clientOptions);
    this.dbName = mongodbDb;
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.connected = true;
  }

  async close(): Promise<void> {
    await this.client.close();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private versionsCollection() {
    if (!this.db) throw new Error('MongoDB not connected');
    return this.db.collection<DatasetVersionDoc>('dataset_versions');
  }

  private datasetsCollection() {
    if (!this.db) throw new Error('MongoDB not connected');
    return this.db.collection<DatasetDoc>('datasets');
  }

  async ensureIndexes(): Promise<void> {
    const versions = this.versionsCollection();
    const datasets = this.datasetsCollection();
    // Unique logical dataset + version number (prevents duplicate version slots).
    await versions.createIndex({ datasetId: 1, versionNumber: 1 }, { unique: true });
    // Non-unique checksum index for duplicate lookups; dedupe is enforced at
    // the application layer (see findByShaAndSize), per Architecture §4 indexes.
    await versions.createIndex({ sha256: 1 });
    await versions.createIndex({ datasetId: 1, createdAt: -1 });
    await datasets.createIndex({ displayName: 1 }, { unique: true });
  }

  async findDatasetByDisplayName(displayName: string): Promise<DatasetDoc | null> {
    return this.datasetsCollection().findOne({ displayName });
  }

  async insertDataset(doc: DatasetDoc): Promise<void> {
    await this.datasetsCollection().insertOne(doc);
  }

  async updateDataset(id: string, patch: Partial<DatasetDoc>): Promise<void> {
    await this.datasetsCollection().updateOne(
      { _id: id },
      { $set: patch } as UpdateFilter<DatasetDoc>,
    );
  }

  /** Duplicate policy: same checksum + byte size among stored versions. */
  async findByShaAndSize(sha256: string, byteSize: number): Promise<DatasetVersionDoc | null> {
    return this.versionsCollection().findOne({
      sha256,
      byteSize,
      lifecycleStatus: 'stored',
    } as Filter<DatasetVersionDoc>);
  }

  async insertVersion(doc: DatasetVersionDoc): Promise<void> {
    await this.versionsCollection().insertOne(doc);
  }

  async updateVersion(id: string, patch: VersionPatch): Promise<void> {
    await this.versionsCollection().updateOne(
      { _id: id },
      { $set: patch } as UpdateFilter<DatasetVersionDoc>,
    );
  }

  private dedupClaimsCollection() {
    if (!this.db) throw new Error('MongoDB not connected');
    return this.db.collection<{ _id: string; versionId: string; datasetId: string; status: string; hdfsPath: string | null; createdAt: string }>('dataset_dedup_claims');
  }

  dedupeClaimKey(sha256: string, byteSize: number): string {
    return `${sha256}:${byteSize}`;
  }

  async claimDedupe(
    sha256: string,
    byteSize: number,
    versionId: string,
    datasetId: string,
  ): Promise<DedupeClaimResult> {
    const key = this.dedupeClaimKey(sha256, byteSize);
    try {
      await this.dedupClaimsCollection().insertOne({
        _id: key,
        versionId,
        datasetId,
        status: 'claimed',
        hdfsPath: null,
        createdAt: nowISO(),
      });
      return { claimed: true };
    } catch (err) {
      // E11000 duplicate _id: another upload already owns this content.
      if ((err as { code?: number }).code === 11000) {
        const existing = await this.dedupClaimsCollection().findOne({ _id: key });
        if (!existing) {
          // Raced: claim was deleted between insert failure and read. Retry once.
          return this.claimDedupe(sha256, byteSize, versionId, datasetId);
        }
        return {
          claimed: false,
          existing: {
            versionId: existing.versionId,
            datasetId: existing.datasetId,
            hdfsPath: existing.hdfsPath ?? null,
            status: (existing.status as 'claimed' | 'stored' | 'failed'),
            byteSize,
            sha256,
          },
        };
      }
      throw err;
    }
  }

  async confirmDedupe(claimKey: string, hdfsPath: string): Promise<void> {
    await this.dedupClaimsCollection().updateOne(
      { _id: claimKey },
      { $set: { status: 'stored', hdfsPath } } as UpdateFilter<{ _id: string }>,
    );
  }

  async releaseDedupe(claimKey: string): Promise<void> {
    await this.dedupClaimsCollection().deleteOne({ _id: claimKey });
  }

  async reconcile(store: DatasetStore): Promise<ReconciliationReport> {
    const details: string[] = [];
    let versionsRecovered = 0;
    let claimsCleared = 0;
    const versions = this.versionsCollection();

    // Repair pending_upload versions.
    for await (const v of versions.find({ lifecycleStatus: 'pending_upload' })) {
      if (v.hdfsPath) {
        const exists = await store.stat(v.hdfsPath);
        if (exists) {
          await versions.updateOne({ _id: v._id }, { $set: { lifecycleStatus: 'stored', stagingPath: null } } as UpdateFilter<DatasetVersionDoc>);
          versionsRecovered++;
          details.push(`reconciled version ${v._id} to stored (${v.hdfsPath})`);
        } else {
          await versions.updateOne({ _id: v._id }, { $set: { lifecycleStatus: 'failed', hdfsPath: null } } as UpdateFilter<DatasetVersionDoc>);
          versionsRecovered++;
          details.push(`marked version ${v._id} failed (no HDFS bytes at ${v.hdfsPath})`);
        }
      } else {
        // No HDFS path recorded: clean up any owned local staging and mark failed.
        if (v.stagingPath) {
          try {
            await store.removeStaging(v.stagingPath);
          } catch {
            // best effort
          }
        }
        await versions.updateOne({ _id: v._id }, { $set: { lifecycleStatus: 'failed' } } as UpdateFilter<DatasetVersionDoc>);
        versionsRecovered++;
        details.push(`marked version ${v._id} failed (no HDFS path recorded)`);
      }
    }

    // Clear stale dedup claims whose version no longer needs them.
    // A claim is cleared when its version is missing, failed, or now stored.
    // It is intentionally NOT cleared when the version is still pending_upload:
    // another concurrent upload for the same content may own the claim, and
    // releasing it early would let two identical uploads create duplicate
    // versions / HDFS copies. The stored-version lookup in findByShaAndSize
    // continues to enforce deduplication once the version is stored.
    const claims = this.dedupClaimsCollection();
    for await (const c of claims.find({ status: 'claimed' })) {
      const version = await versions.findOne({ _id: c.versionId });
      if (
        !version ||
        version.lifecycleStatus === 'stored' ||
        version.lifecycleStatus === 'failed'
      ) {
        await claims.deleteOne({ _id: c._id });
        claimsCleared++;
        details.push(`cleared stale dedup claim ${c._id}`);
      }
    }

    return { versionsRecovered, claimsCleared, details };
  }
}

/**
 * In-memory fake repository mirroring DatasetRepository. Used by tests and by
 * local runs when MongoDB is unavailable (registration then degrades safely).
 */
export class InMemoryDatasetRepository implements DatasetRepository {
  private datasets = new Map<string, DatasetDoc>();
  private versions = new Map<string, DatasetVersionDoc>();
  private byDisplayName = new Map<string, string>();
  private claims = new Map<string, {
    versionId: string;
    datasetId: string;
    status: 'claimed' | 'stored' | 'failed';
    hdfsPath: string | null;
    createdAt: string;
  }>();

  async ensureIndexes(): Promise<void> {
    return undefined;
  }

  isConnected(): boolean {
    return true;
  }

  async findDatasetByDisplayName(displayName: string): Promise<DatasetDoc | null> {
    const id = this.byDisplayName.get(displayName);
    return id ? this.datasets.get(id)! : null;
  }

  async insertDataset(doc: DatasetDoc): Promise<void> {
    if (this.byDisplayName.has(doc.displayName)) {
      const err = new Error(`Duplicate dataset display name: ${doc.displayName}`);
      (err as { code?: number }).code = 11000;
      throw err;
    }
    this.datasets.set(doc._id, doc);
    this.byDisplayName.set(doc.displayName, doc._id);
  }

  async updateDataset(id: string, patch: Partial<DatasetDoc>): Promise<void> {
    const doc = this.datasets.get(id);
    if (!doc) throw new Error(`Dataset not found: ${id}`);
    this.datasets.set(id, { ...doc, ...patch });
  }

  async findByShaAndSize(sha256: string, byteSize: number): Promise<DatasetVersionDoc | null> {
    for (const v of this.versions.values()) {
      if (v.sha256 === sha256 && v.byteSize === byteSize && v.lifecycleStatus === 'stored') {
        return v;
      }
    }
    return null;
  }

  async insertVersion(doc: DatasetVersionDoc): Promise<void> {
    const exists = [...this.versions.values()].some(
      (v) => v.datasetId === doc.datasetId && v.versionNumber === doc.versionNumber,
    );
    if (exists) {
      const err = new Error(`Duplicate version: ${doc.datasetId} v${doc.versionNumber}`);
      (err as { code?: number }).code = 11000;
      throw err;
    }
    this.versions.set(doc._id, doc);
  }

  async updateVersion(id: string, patch: VersionPatch): Promise<void> {
    const doc = this.versions.get(id);
    if (!doc) throw new Error(`Version not found: ${id}`);
    this.versions.set(id, { ...doc, ...patch });
  }

  dedupeClaimKey(sha256: string, byteSize: number): string {
    return `${sha256}:${byteSize}`;
  }

  async claimDedupe(
    sha256: string,
    byteSize: number,
    versionId: string,
    datasetId: string,
  ): Promise<DedupeClaimResult> {
    const key = this.dedupeClaimKey(sha256, byteSize);
    if (this.claims.has(key)) {
      const existing = this.claims.get(key)!;
      return {
        claimed: false,
        existing: {
          versionId: existing.versionId,
          datasetId: existing.datasetId,
          hdfsPath: existing.hdfsPath,
          status: existing.status,
          byteSize,
          sha256,
        },
      };
    }
    this.claims.set(key, {
      versionId,
      datasetId,
      status: 'claimed',
      hdfsPath: null,
      createdAt: nowISO(),
    });
    return { claimed: true };
  }

  async confirmDedupe(claimKey: string, hdfsPath: string): Promise<void> {
    const c = this.claims.get(claimKey);
    if (c) this.claims.set(claimKey, { ...c, status: 'stored', hdfsPath });
  }

  async releaseDedupe(claimKey: string): Promise<void> {
    this.claims.delete(claimKey);
  }

  async reconcile(store: DatasetStore): Promise<ReconciliationReport> {
    const details: string[] = [];
    let versionsRecovered = 0;
    let claimsCleared = 0;

    for (const [id, v] of this.versions.entries()) {
      if (v.lifecycleStatus !== 'pending_upload') continue;
      if (v.hdfsPath) {
        const exists = await store.stat(v.hdfsPath);
        if (exists) {
          v.lifecycleStatus = 'stored';
          v.stagingPath = null;
          this.versions.set(id, v);
          versionsRecovered++;
          details.push(`reconciled version ${id} to stored (${v.hdfsPath})`);
        } else {
          v.lifecycleStatus = 'failed';
          v.hdfsPath = null;
          this.versions.set(id, v);
          versionsRecovered++;
          details.push(`marked version ${id} failed (no HDFS bytes at ${v.hdfsPath})`);
        }
      } else {
        if (v.stagingPath) {
          try {
            await store.removeStaging(v.stagingPath);
          } catch {
            // best effort
          }
        }
        v.lifecycleStatus = 'failed';
        this.versions.set(id, v);
        versionsRecovered++;
        details.push(`marked version ${id} failed (no HDFS path recorded)`);
      }
    }

    for (const [key, c] of this.claims.entries()) {
      if (c.status !== 'claimed') continue;
      const version = this.versions.get(c.versionId);
      if (
        !version ||
        version.lifecycleStatus === 'stored' ||
        version.lifecycleStatus === 'failed'
      ) {
        this.claims.delete(key);
        claimsCleared++;
        details.push(`cleared stale dedup claim ${key}`);
      }
    }

    return { versionsRecovered, claimsCleared, details };
  }
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function makeValidation(
  acceptedRows: number,
  rejectedRows: number,
  errorSamples: string[],
  format: 'csv' | 'jsonl',
): DatasetValidation {
  return {
    acceptedRows,
    rejectedRows,
    errorSamples,
    policyVersion: format === 'csv' ? 'csv-v1' : 'jsonl-v1',
  };
}
