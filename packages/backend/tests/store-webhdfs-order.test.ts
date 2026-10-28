/**
 * Focused regression test for HIGH-2: WebHDFS staging parent is MKDIRS'd
 * before CREATE.
 *
 * This uses a local in-process mock HTTP server (Node `http`) to stand in for
 * a WebHDFS NameNode/datanode. It verifies call ORDER only; it does NOT claim
 * real WebHDFS compatibility or test against a live Hadoop cluster.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { WebHdfsDatasetStore } from '../src/services/store';
import type { StoredFile } from '../src/types';

type RecordedRequest = {
  method: string;
  path: string;
  body: string | null;
};

const FILE_CONTENT = 'id,name\n1,mock\n';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'datadesk-wh-'));
}
function writeTemp(dir: string, name: string, content: string): string {
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}
function cleanup(dirs: string[]): void {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

describe('WebHdfsDatasetStore staging-parent ordering (mock HTTP)', () => {
  let server: HttpServer;
  let baseUrl: string;
  let dirs: string[] = [];
  let recorded: RecordedRequest[] = [];

  beforeEach(async () => {
    dirs = [];
    recorded = [];

    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        recorded.push({
          method: req.method ?? 'UNKNOWN',
          path: req.url ?? 'UNKNOWN',
          body: body || null,
        });

        const url = new URL(req.url ?? '', `http://${req.headers.host}`);
        const op = url.searchParams.get('op');

        // All WebHDFS ops succeed in the mock.
        if (op === 'MKDIRS' || op === 'RENAME') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ boolean: true }));
        } else if (op === 'CREATE') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ boolean: true }));
        } else if (op === 'OPEN') {
          res.writeHead(200, { 'content-type': 'application/octet-stream' });
          res.end(FILE_CONTENT);
        } else if (op === 'GETFILESTATUS') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ FileStatus: {} }));
        } else {
          res.writeHead(400);
          res.end('unknown op');
        }
      });
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${addr.port}/webhdfs/v1`;
  });

  afterEach(() => {
    cleanup(dirs);
    server.close();
  });

  it('MKDIRS staging parent precedes CREATE staging', async () => {
    const store = new WebHdfsDatasetStore({
      webhdfsBase: baseUrl,
      webhdfsUser: 'hadoop',
    });

    const dir = makeTempDir();
    dirs.push(dir);
    const localPath = writeTemp(dir, 'mock.csv', FILE_CONTENT);

    const result = await store.storeFile(localPath, 'upload-001', 'ds_abc', 1, 'csv');

    expect(result.hdfsPath).toBe('/datadesk/datasets/ds_abc/v1/data.csv');

    const mkdirsStaging = recorded.find(
      (r) =>
        r.path.includes('/staging/uploads/upload-001') &&
        r.path.includes('op=MKDIRS'),
    );
    const createStaging = recorded.find(
      (r) =>
        r.path.includes('/staging/uploads/upload-001') &&
        r.path.includes('op=CREATE'),
    );

    expect(mkdirsStaging).toBeDefined();
    expect(createStaging).toBeDefined();
    expect(mkdirsStaging!.method).toBe('PUT');
    expect(createStaging!.method).toBe('PUT');
    // ORDER: MKDIRS staging parent must come before CREATE staging.
    expect(recorded.indexOf(mkdirsStaging!)).toBeLessThan(
      recorded.indexOf(createStaging!),
    );
  });

  it('returns the stored file metadata', async () => {
    const store = new WebHdfsDatasetStore({
      webhdfsBase: baseUrl,
      webhdfsUser: 'hadoop',
    });

    const dir = makeTempDir();
    dirs.push(dir);
    const localPath = writeTemp(dir, 'mock.csv', FILE_CONTENT);

    const result: StoredFile = await store.storeFile(
      localPath,
      'upload-002',
      'ds_def',
      1,
      'csv',
    );

    expect(result.hdfsPath).toBe('/datadesk/datasets/ds_def/v1/data.csv');
    expect(result.size).toBeGreaterThan(0);
    expect(result.sha256).toBeTruthy();
  });
});
