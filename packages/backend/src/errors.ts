/**
 * Application errors with an HTTP status code and a stable error code.
 * Responses never include file contents, credentials, or stack traces.
 */

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export const Errors = {
  unsupportedMediaType: (received: string) =>
    new AppError(400, 'unsupported_media_type', `Unsupported file type: ${received}. Allowed: csv, jsonl.`),
  fileRequired: () => new AppError(400, 'file_required', 'A "file" part is required.'),
  sizeLimitExceeded: (limit: number) =>
    new AppError(413, 'payload_too_large', `Upload exceeds the configured size limit of ${limit} bytes.`),
  duplicate: () =>
    new AppError(409, 'duplicate_dataset_version', 'A dataset version with this checksum and byte size already exists. Bytes are not stored twice.'),
  mongodbUnavailable: () =>
    new AppError(503, 'mongodb_unavailable', 'Dataset registration is temporarily unavailable; MongoDB is not ready.'),
  storageFailure: (cause: string) =>
    new AppError(500, 'storage_failure', `Failed to store dataset bytes: ${cause}`),
  internal: (cause: string) => new AppError(500, 'internal', cause),
} as const;
