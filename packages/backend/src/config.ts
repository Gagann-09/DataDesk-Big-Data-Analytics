/**
 * Runtime configuration. Values come from environment variables with safe
 * defaults for a local teaching lab. See .env.example. Secrets are never
 * read from the repository and `.env` is gitignored.
 */

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

import type { DatasetFormat } from './types';

export function loadConfig(env: Record<string, string | undefined> = process.env): UploadConfig {
  const port = Number(env.PORT ?? '3456');
  const maxUploadBytes = Number(env.MAX_UPLOAD_BYTES ?? '104857600');
  const maxValidationErrors = Number(env.MAX_VALIDATION_ERRORS ?? '50');

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${env.PORT}`);
  }
  if (!Number.isFinite(maxUploadBytes) || maxUploadBytes <= 0) {
    throw new Error(`Invalid MAX_UPLOAD_BYTES: ${env.MAX_UPLOAD_BYTES}`);
  }
  if (!Number.isFinite(maxValidationErrors) || maxValidationErrors < 0) {
    throw new Error(`Invalid MAX_VALIDATION_ERRORS: ${env.MAX_VALIDATION_ERRORS}`);
  }

  return {
    port,
    host: env.HOST ?? '127.0.0.1',
    nodeEnv: env.NODE_ENV ?? 'development',
    mongodbUri: env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017',
    mongodbDb: env.MONGODB_DB ?? 'datadesk',
    maxUploadBytes,
    maxValidationErrors,
    webhdfsBase: env.WEBHDFS_BASE ?? 'http://127.0.0.1:50070/webhdfs/v1',
    webhdfsUser: env.WEBHDFS_USER ?? 'hadoop',
    datadeskPrefix: env.DATADESK_HDFS_PREFIX ?? '/datadesk',
    allowedFormats: ['csv', 'jsonl'],
  };
}

export const config = loadConfig();
