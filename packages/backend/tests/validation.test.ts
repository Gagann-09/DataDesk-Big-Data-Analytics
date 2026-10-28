import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateFile } from '../src/services/validation';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'datadesk-val-'));
}
function writeTemp(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

describe('validateFile (bounded CSV/JSONL validation)', () => {
  let dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
    dirs = [];
  });

  it('accepts a valid CSV file and counts data rows', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'a.csv', 'id,name\n1,alpha\n2,beta\n3,gamma\n');
    const result = await validateFile(p, 'csv');
    expect(result.acceptedRows).toBe(3);
    expect(result.rejectedRows).toBe(0);
    expect(result.recordCount).toBe(3);
    expect(result.errorSamples).toEqual([]);
    expect(result.policyVersion).toBe('csv-v1');
  });

  it('accepts a valid JSONL file', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'a.jsonl', '{"a":1}\n{"a":2}\n{"b":true}\n');
    const result = await validateFile(p, 'jsonl');
    expect(result.acceptedRows).toBe(3);
    expect(result.rejectedRows).toBe(0);
    expect(result.recordCount).toBe(3);
  });

  it('rejects invalid JSONL lines and bounds retained samples', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(
      dir,
      'a.jsonl',
      '{"a":1}\nnot json\n{"a":2}\nalso bad\n{"a":3}\n',
    );
    const result = await validateFile(p, 'jsonl', { maxErrors: 2 });
    expect(result.acceptedRows).toBe(3);
    expect(result.rejectedRows).toBe(2);
    expect(result.errorSamples.length).toBeLessThanOrEqual(2);
  });

  it('rejects CSV rows with unbalanced quotes', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'a.csv', 'id,name\n1,ok\n2,"unterminated\n3,ok\n');
    const result = await validateFile(p, 'csv', { maxErrors: 10 });
    expect(result.rejectedRows).toBe(1); // the unterminated-quoted row
    expect(result.acceptedRows).toBe(2); // the two well-formed data rows
    expect(result.errorSamples.length).toBeGreaterThan(0);
  });

  it('skips blank lines', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'a.jsonl', '{"a":1}\n\n{"a":2}\n\n');
    const result = await validateFile(p, 'jsonl');
    expect(result.acceptedRows).toBe(2);
    expect(result.rejectedRows).toBe(0);
  });
});
