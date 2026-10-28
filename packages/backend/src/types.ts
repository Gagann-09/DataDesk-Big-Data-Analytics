/**
 * DataDesk Phase 1 — dataset ingestion domain types.
 *
 * Lifecycle states follow Architecture.md §5 (upload state machine):
 * pending_upload -> stored | failed ; failed -> pending_upload (explicit retry).
 * Only the upload path is implemented in Phase 1; deleting/deleted states are
 * modelled for completeness but not exposed by an endpoint.
 */

export type DatasetFormat = 'csv' | 'jsonl';

export type VersionLifecycleStatus =
  | 'pending_upload'
  | 'stored'
  | 'failed'
  | 'deleting'
  | 'deleted';

export interface DatasetValidation {
  acceptedRows: number;
  rejectedRows: number;
  /** Number of rejected-row samples retained (bounded by config). */
  errorSamples: string[];
  policyVersion: string;
}

export interface DatasetVersionDoc {
  _id: string;
  datasetId: string;
  versionNumber: number;
  originalFilename: string;
  format: DatasetFormat;
  mediaType: string;
  byteSize: number;
  sha256: string;
  recordCount: number | null;
  hdfsPath: string | null;
  stagingPath: string | null;
  createdAt: string;
  lifecycleStatus: VersionLifecycleStatus;
  validation: DatasetValidation;
  source: { kind: 'upload'; licenseUrl: string | null };
}

export interface DatasetDoc {
  _id: string;
  displayName: string;
  createdAt: string;
  latestVersionId: string | null;
  tags: string[];
  lifecycleStatus: 'active';
}

/** Result of an atomic dedup claim. Only one upload can claim a (sha256, byteSize) pair. */
export interface DedupeClaimResult {
  claimed: boolean;
  /** Present when claimed === false: the claim won by another upload. */
  existing?: {
    versionId: string;
    datasetId: string;
    hdfsPath: string | null;
    status: 'claimed' | 'stored' | 'failed';
    byteSize: number;
    sha256: string;
  };
}

export interface ReconciliationReport {
  versionsRecovered: number;
  claimsCleared: number;
  details: string[];
}

export interface StoredFile {
  hdfsPath: string;
  size: number;
  sha256: string;
}

export interface DuplicateInfo {
  datasetId: string;
  versionId: string;
  versionNumber: number;
  hdfsPath: string | null;
  byteSize: number;
  sha256: string;
}

export interface UploadDependencies {
  repository: DatasetRepository;
  store: DatasetStore;
  config: UploadConfig;
}

export interface UploadConfig {
  port: number;
  host: string;
  nodeEnv: string;
  mongodbUri: string;
  mongodbDb: string;
  maxUploadBytes: number;
  maxValidationErrors: number;
  webhdfsBase: string;
  webhdfsUser: string;
  datadeskPrefix: string;
  allowedFormats: readonly DatasetFormat[];
}

export interface DatasetRepository {
  isConnected(): boolean;
  ensureIndexes(): Promise<void>;
  findDatasetByDisplayName(displayName: string): Promise<DatasetDoc | null>;
  insertDataset(doc: DatasetDoc): Promise<void>;
  updateDataset(id: string, patch: Partial<DatasetDoc>): Promise<void>;
  findByShaAndSize(sha256: string, byteSize: number): Promise<DatasetVersionDoc | null>;
  insertVersion(doc: DatasetVersionDoc): Promise<void>;
  updateVersion(id: string, patch: Partial<DatasetVersionDoc>): Promise<void>;
  /**
   * Atomically claim the dedup slot for (sha256, byteSize). Only one upload
   * can win; losers learn which upload owns the content and can surface a
   * duplicate or a transient "being processed" response.
   */
  /** Compute the dedup claim key for a (sha256, byteSize) pair. */
  dedupeClaimKey(sha256: string, byteSize: number): string;
  claimDedupe(
    sha256: string,
    byteSize: number,
    versionId: string,
    datasetId: string,
  ): Promise<DedupeClaimResult>;
  /** Mark the dedup claim as stored (bytes verified + metadata finalized). */
  confirmDedupe(claimKey: string, hdfsPath: string): Promise<void>;
  /** Release a failed claim so an identical upload may retry. */
  releaseDedupe(claimKey: string): Promise<void>;
  /**
   * Startup reconciliation: repair pending_upload/failed versions and stale
   * dedup claims using the byte store to confirm whether HDFS bytes exist.
   */
  reconcile(store: DatasetStore): Promise<ReconciliationReport>;
}

export interface DatasetStore {
  /**
   * Promote a local staging file to its immutable managed HDFS path.
   * Returns the final stored location. The caller remains responsible for
   * removing the local staging file on both success and failure.
   */
  storeFile(localFilePath: string, uploadId: string, datasetId: string, version: number, ext: string): Promise<StoredFile>;
  /** Remove only this upload's local staging bytes. Never touches other data. */
  removeStaging(localFilePath: string): Promise<void>;
  /** Confirm whether a managed HDFS path currently exists. */
  stat(hdfsPath: string): Promise<boolean>;
}
