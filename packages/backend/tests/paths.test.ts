import { describe, it, expect } from 'vitest';
import {
  isManagedPath,
  assertManagedPath,
  buildFinalHdfsPath,
  buildStagingHdfsPath,
  formatFromExt,
} from '../src/services/paths';

describe('managed-path guards (/datadesk/ prefix)', () => {
  it('accepts paths under the managed prefix', () => {
    expect(isManagedPath('/datadesk/datasets/ds_1/v1/data.csv')).toBe(true);
    expect(isManagedPath('/datadesk/staging/uploads/u1/data.jsonl')).toBe(true);
    expect(isManagedPath('/datadesk/')).toBe(true);
  });

  it('rejects traversal attempts', () => {
    expect(isManagedPath('/datadesk/../etc/passwd')).toBe(false);
    expect(isManagedPath('/datadesk/datasets/../../etc')).toBe(false);
    expect(isManagedPath('/datadesk/..%2Fetc')).toBe(false);
  });

  it('rejects paths outside the managed prefix', () => {
    expect(isManagedPath('/etc/passwd')).toBe(false);
    expect(isManagedPath('/datadesk2/x')).toBe(false);
    expect(isManagedPath('/')).toBe(false);
    expect(isManagedPath('')).toBe(false);
    expect(isManagedPath(undefined as unknown as string)).toBe(false);
  });

  it('assertManagedPath throws on unmanaged paths', () => {
    let err: unknown = null;
    try {
      assertManagedPath('/etc/passwd');
    } catch (e) {
      err = e;
    }
    expect(err).not.toBeNull();
    expect((err as { code?: string }).code).toBe('path_not_managed');
    expect(() => assertManagedPath('/datadesk/datasets/ds_1/v1/data.csv')).not.toThrow();
  });

  it('builds immutable final paths under /datadesk/', () => {
    const p = buildFinalHdfsPath('ds_abc123', 1, 'csv');
    expect(p).toBe('/datadesk/datasets/ds_abc123/v1/data.csv');
    expect(isManagedPath(p)).toBe(true);
  });

  it('builds unique staging paths under /datadesk/', () => {
    const p = buildStagingHdfsPath('upload-001', 'jsonl');
    expect(p).toBe('/datadesk/staging/uploads/upload-001/data.jsonl');
    expect(isManagedPath(p)).toBe(true);
  });

  it('detects supported formats from extension', () => {
    expect(formatFromExt('.CSV')).toBe('csv');
    expect(formatFromExt('.jsonl')).toBe('jsonl');
    expect(formatFromExt('.txt')).toBeNull();
    expect(formatFromExt('')).toBeNull();
  });
});
