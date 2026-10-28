/**
 * Managed-path guards. Every application-managed HDFS path must resolve under
 * the DataDesk prefix (default /datadesk). Traversal, root, and out-of-prefix
 * paths are rejected before any store operation.
 *
 * PRD FR-05; Architecture §5; rules.md §6.
 */

import type { DatasetFormat } from '../types';

export const DEFAULT_PREFIX = '/datadesk';

export function normalizePath(p: string): string {
  // Collapse duplicate slashes and trailing slashes; keep leading slash.
  const parts = p.split('/').filter((s) => s.length > 0 && s !== '.');
  let depth = 0;
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      if (depth > 0) {
        resolved.pop();
        depth--;
      }
      // ".." at or above root simply drops; result stays under root.
      continue;
    }
    resolved.push(part);
    depth++;
  }
  return '/' + resolved.join('/');
}

export function hasTraversal(p: string): boolean {
  const lower = p.toLowerCase();
  return (
    p.split('/').some((seg) => seg === '..') ||
    p.includes('..\\') ||
    lower.includes('%2f') || // encoded slash could alter path structure if decoded
    lower.includes('%2e%2e') // encoded ".."
  );
}

export function isManagedPath(p: string, prefix = DEFAULT_PREFIX): boolean {
  if (!p || typeof p !== 'string') return false;
  if (p.includes('\0')) return false;
  if (hasTraversal(p)) return false;
  const norm = normalizePath(p);
  const normPrefix = normalizePath(prefix);
  return norm === normPrefix || norm.startsWith(normPrefix + '/');
}

export function assertManagedPath(p: string, prefix = DEFAULT_PREFIX): void {
  if (!isManagedPath(p, prefix)) {
    const err = new Error(`Path is outside the managed DataDesk prefix (${prefix}): ${p}`);
    (err as { code?: string }).code = 'path_not_managed';
    throw err;
  }
}

export function buildFinalHdfsPath(datasetId: string, version: number, ext: string): string {
  // datasetId is application-generated (a UUID), never a raw user path.
  const cleanExt = ext.replace(/^\./, '');
  return `${DEFAULT_PREFIX}/datasets/${datasetId}/v${version}/data.${cleanExt.toLowerCase()}`;
}

export function buildStagingHdfsPath(uploadId: string, ext: string): string {
  const cleanExt = ext.replace(/^\./, '');
  return `${DEFAULT_PREFIX}/staging/uploads/${uploadId}/data.${cleanExt.toLowerCase()}`;
}

export function formatFromExt(ext: string): DatasetFormat | null {
  const e = ext.toLowerCase().replace(/^\./, '');
  if (e === 'csv') return 'csv';
  if (e === 'jsonl') return 'jsonl';
  return null;
}

export function extensionOf(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx <= 0 || idx === filename.length - 1) return '';
  return filename.slice(idx);
}

export function sanitizeDisplayName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 200) || 'dataset';
}
