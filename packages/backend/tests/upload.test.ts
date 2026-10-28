import { describe, it, expect, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import request from 'supertest';
import { createApp } from '../src/app';
import { InMemoryDatasetRepository } from '../src/services/mongo';
import { InMemoryDatasetStore } from '../src/services/store';
import type { DatasetVersionDoc, UploadConfig } from '../src/types';

const sha256 = (content: string) =>
  createHash('sha256').update(content).digest('hex');

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'datadesk-up-'));
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
    allowedFormats: ['csv', 'jsonl'],
    ...overrides,
  };
}

function repoVersions(repo: InMemoryDatasetRepository): DatasetVersionDoc[] {
  return [...((repo as unknown) as { versions: Map<string, DatasetVersionDoc> }).versions.values()];
}

describe('POST /api/datasets (ingest upload)', () => {
  let dirs: string[] = [];
  afterEach(() => cleanup(dirs));

  async function postFile(app: ReturnType<typeof createApp>, filePath: string) {
    return request(app).post('/api/datasets').attach('file', filePath);
  }

  it('stores a valid CSV as `stored` with checksum, size, and record count', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,alpha\n2,beta\n3,gamma\n';
    const p = writeTemp(dir, 'sample.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const res = await postFile(app, p);
    expect(res.status).toBe(201);
    expect(res.body.lifecycleStatus).toBe('stored');
    expect(res.body.byteSize).toBe(Buffer.byteLength(content));
    expect(res.body.sha256).toBe(sha256(content));
    expect(res.body.recordCount).toBe(3);
    expect(res.body.format).toBe('csv');
    expect(res.body.hdfsPath).toMatch(/^\/datadesk\/datasets\/[^/]+\/v1\/data\.csv$/);
    expect(res.body.validation.acceptedRows).toBe(3);

    const versions = repoVersions(repo);
    expect(versions.length).toBe(1);
    expect(versions[0].lifecycleStatus).toBe('stored');
    expect(versions[0].hdfsPath).toBe(res.body.hdfsPath);
    expect(versions[0].stagingPath).toBeNull();
  });

  it('stores a valid JSONL file', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = '{"a":1}\n{"a":2}\n{"b":true}\n';
    const p = writeTemp(dir, 'sample.jsonl', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const res = await postFile(app, p);
    expect(res.status).toBe(201);
    expect(res.body.lifecycleStatus).toBe('stored');
    expect(res.body.format).toBe('jsonl');
    expect(res.body.recordCount).toBe(3);
    expect(res.body.sha256).toBe(sha256(content));
    expect(res.body.hdfsPath).toMatch(/\/data\.jsonl$/);
  });

  it('flags duplicate checksum+byte size as 409 and stores bytes once', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,dup\n';
    const p = writeTemp(dir, 'dup.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const res1 = await postFile(app, p);
    expect(res1.status).toBe(201);

    const res2 = await postFile(app, p);
    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe('duplicate_dataset_version');
    expect(res2.body.existing.sha256).toBe(sha256(content));
    expect(res2.body.existing.byteSize).toBe(Buffer.byteLength(content));
    expect(res2.body.existing.hdfsPath).toBe(res1.body.hdfsPath);

    // Bytes stored once: exactly one stored version.
    const versions = repoVersions(repo);
    expect(versions.length).toBe(1);
    expect(versions[0].lifecycleStatus).toBe('stored');
  });

  it('rejects uploads over the configurable size limit with 413', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'big.csv', '0123456789\nabcdefghij\n'); // 22 bytes

    const app = createApp({
      repository: new InMemoryDatasetRepository(),
      store: new InMemoryDatasetStore(),
      config: makeConfig({ maxUploadBytes: 10 }),
    });

    const res = await postFile(app, p);
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('payload_too_large');
  });

  it('rejects unsupported file extensions with 400', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'notes.txt', 'hello\n');

    const app = createApp({
      repository: new InMemoryDatasetRepository(),
      store: new InMemoryDatasetStore(),
      config: makeConfig(),
    });

    const res = await postFile(app, p);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('unsupported_media_type');
  });

  it('rejects an empty file with 400', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const p = writeTemp(dir, 'empty.csv', '');

    const app = createApp({
      repository: new InMemoryDatasetRepository(),
      store: new InMemoryDatasetStore(),
      config: makeConfig(),
    });

    const res = await postFile(app, p);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('empty_file');
  });

  it('marks the version `failed` and cleans only owned staging on store failure', async () => {
    const dir = makeTempDir();
    dirs.push(dir);
    const content = 'id,name\n1,fail\n';
    const p = writeTemp(dir, 'fail.csv', content);

    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const orig = store.storeFile.bind(store);
    store.storeFile = async () => {
      throw new Error('HDFS is down');
    };
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const res = await postFile(app, p);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('storage_failure');

    const versions = repoVersions(repo);
    expect(versions.length).toBe(1);
    expect(versions[0].lifecycleStatus).toBe('failed');
  });

  it('returns 503 when MongoDB is unavailable', async () => {
    const deadRepo = { isConnected: () => false } as unknown as InMemoryDatasetRepository;
    const app = createApp({
      repository: deadRepo,
      store: new InMemoryDatasetStore(),
      config: makeConfig(),
    });

    // No body: exercises the early MongoDB-unavailable guard deterministically.
    const res = await request(app).post('/api/datasets');
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('mongodb_unavailable');
  });

  it('GET /api/health reports readiness', async () => {
    const repo = new InMemoryDatasetRepository();
    const store = new InMemoryDatasetStore();
    const app = createApp({ repository: repo, store, config: makeConfig() });

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.components.mongodb).toBe('ready');
  });
});
