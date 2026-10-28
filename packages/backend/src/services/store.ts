/**
 * Dataset byte store abstraction.
 *
 * InMemoryDatasetStore: test double that records managed /datadesk/ paths
 * without HDFS (used by automated tests; real HDFS integration is blocked
 * when no NameNode is running — see RUNBOOK.md).
 * WebHdfsDatasetStore: production adapter using the verified WebHDFS HTTP
 * flow (memory.md §8e): MKDIRS/CREATE staging -> byte-exact OPEN
 * verification -> RENAME to immutable final path under
 * /datadesk/datasets/<id>/v<n>/.
 *
 * Only bytes owned by this upload are ever staged or removed.
 */

import { unlink } from 'fs/promises';
import { readFile } from 'fs/promises';
import { URL } from 'url';
import * as http from 'http';
import * as https from 'https';
import type { DatasetStore, StoredFile, UploadConfig } from '../types';
import {
  assertManagedPath,
  buildFinalHdfsPath,
  buildStagingHdfsPath,
} from './paths';
import { sha256Buffer } from './hashing';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export class InMemoryDatasetStore implements DatasetStore {
  private files = new Map<string, { size: number; sha256: string }>();

  async storeFile(
    localFilePath: string,
    uploadId: string,
    datasetId: string,
    version: number,
    ext: string,
  ): Promise<StoredFile> {
    const content = await readFile(localFilePath);
    const hdfsPath = buildFinalHdfsPath(datasetId, version, ext);
    this.files.set(hdfsPath, {
      size: content.length,
      sha256: sha256Buffer(content),
    });
    return { hdfsPath, size: content.length, sha256: sha256Buffer(content) };
  }

  async removeStaging(localFilePath: string): Promise<void> {
    try {
      await unlink(localFilePath);
    } catch {
      // Best-effort cleanup of our own staging bytes.
    }
  }

  has(hdfsPath: string): boolean {
    return this.files.has(hdfsPath);
  }

  async stat(hdfsPath: string): Promise<boolean> {
    return this.files.has(hdfsPath);
  }
}

interface HttpResponse {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
}

type HttpLib = typeof http | typeof https;
function requestLib(parsed: URL): HttpLib {
  return parsed.protocol === 'https:' ? https : http;
}

function httpRequest(
  parsed: URL,
  method: string,
  body: Buffer | null,
  extraHeaders: Record<string, string>,
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const opts: http.RequestOptions = {
      method,
      hostname: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : undefined,
      path: parsed.pathname + parsed.search,
      headers: {
        'content-type': 'application/octet-stream',
        ...extraHeaders,
        ...(body ? { 'content-length': String(body.length) } : {}),
      },
    };
    const req = requestLib(parsed).request(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () =>
        resolve({
          statusCode: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        }),
      );
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.setTimeout(30000);
    if (body) req.write(body);
    req.end();
  });
}

/** Follow WebHDFS 307 redirects (method and body preserved for 307/308). */
async function requestWithRedirect(
  href: string,
  method: string,
  body: Buffer | null,
  extraHeaders: Record<string, string>,
): Promise<HttpResponse> {
  let parsed = new URL(href);
  let response = await httpRequest(parsed, method, body, extraHeaders);
  let hops = 0;
  while (REDIRECT_STATUSES.has(response.statusCode) && hops++ < 5) {
    const location = response.headers.location;
    if (!location) break;
    parsed = new URL(location, parsed);
    // 303 switches to GET without body; 307/308 keep method and body.
    const nextMethod = response.statusCode === 303 ? 'GET' : method;
    const nextBody = response.statusCode === 303 ? null : body;
    response = await httpRequest(parsed, nextMethod, nextBody, extraHeaders);
  }
  return response;
}

function webHdfsUrl(base: string, user: string, hdfsPath: string, op: string, extra = ''): string {
  // hdfsPath always begins with '/'; filter empty segments so the leading slash
  // is not duplicated between the base and the encoded path (e.g.
  // /webhdfs/v1//datadesk/... would be rejected by HDFS as InvalidPath).
  const encoded = hdfsPath.split('/').filter((s) => s.length > 0).map((s) => encodeURI(s)).join('/');
  return `${base}/${encoded}?op=${op}&user.name=${user}${extra}`;
}

export class WebHdfsDatasetStore implements DatasetStore {
  private base: string;
  private user: string;

  constructor(config: Pick<UploadConfig, 'webhdfsBase' | 'webhdfsUser'>) {
    this.base = config.webhdfsBase.replace(/\/$/, '');
    this.user = config.webhdfsUser;
  }

  async storeFile(
    localFilePath: string,
    uploadId: string,
    datasetId: string,
    version: number,
    ext: string,
  ): Promise<StoredFile> {
    const stagingPath = buildStagingHdfsPath(uploadId, ext);
    const finalPath = buildFinalHdfsPath(datasetId, version, ext);
    assertManagedPath(stagingPath);
    assertManagedPath(finalPath);

    const content = await readFile(localFilePath);
    const size = content.length;
    const sha256 = sha256Buffer(content);

    // 1. Ensure the staging parent directory exists. WebHDFS CREATE does not
    //    auto-create parents, so the parent must exist before the upload.
    const stagingParent = stagingPath.substring(0, stagingPath.lastIndexOf('/'));
    const mkdirStagingParentUrl = webHdfsUrl(this.base, this.user, stagingParent, 'MKDIRS');
    let res = await requestWithRedirect(mkdirStagingParentUrl, 'PUT', null, {});
    if (res.statusCode >= 400) {
      throw new Error(`WebHDFS MKDIRS staging parent ${stagingParent} failed: HTTP ${res.statusCode}`);
    }

    // 2. CREATE staging path (WebHDFS returns 307 to the datanode).
    const createUrl = webHdfsUrl(this.base, this.user, stagingPath, 'CREATE', '&overwrite=true');
    res = await requestWithRedirect(createUrl, 'PUT', content, {});
    if (res.statusCode >= 400) {
      throw new Error(`WebHDFS CREATE staging failed: HTTP ${res.statusCode}`);
    }

    // 3. Verify staged bytes match source (byte-exact read-back).
    const openUrl = webHdfsUrl(this.base, this.user, stagingPath, 'OPEN');
    res = await requestWithRedirect(openUrl, 'GET', null, {});
    if (res.statusCode >= 400) {
      throw new Error(`WebHDFS OPEN verify failed: HTTP ${res.statusCode}`);
    }
    if (res.body.length !== size || sha256Buffer(res.body) !== sha256) {
      throw new Error('WebHDFS stored bytes do not match source checksum/size');
    }

    // 4. Ensure the destination parent directory exists. WebHDFS RENAME does
    //    not auto-create parents (unlike CREATE), so the parent must exist
    //    before the rename, otherwise it returns HTTP 200 with {"boolean":false}.
    const finalParent = finalPath.substring(0, finalPath.lastIndexOf('/'));
    const mkdirParentUrl = webHdfsUrl(this.base, this.user, finalParent, 'MKDIRS');
    res = await requestWithRedirect(mkdirParentUrl, 'PUT', null, {});
    if (res.statusCode >= 400) {
      throw new Error(`WebHDFS MKDIRS parent ${finalParent} failed: HTTP ${res.statusCode}`);
    }

    // 5. Rename staging -> immutable final path.
    const renameUrl = webHdfsUrl(
      this.base,
      this.user,
      stagingPath,
      'RENAME',
      `&destination=${encodeURI(finalPath)}`,
    );
    res = await requestWithRedirect(renameUrl, 'PUT', null, {});
    if (res.statusCode >= 400) {
      throw new Error(`WebHDFS RENAME to final failed: HTTP ${res.statusCode}`);
    }
    const renameOk = res.body.toString().includes('"boolean":true');
    if (!renameOk) {
      throw new Error(`WebHDFS RENAME to final returned false: ${res.body.toString()}`);
    }

    return { hdfsPath: finalPath, size, sha256 };
  }

  async removeStaging(localFilePath: string): Promise<void> {
    try {
      await unlink(localFilePath);
    } catch {
      // Best-effort cleanup of our own staging bytes.
    }
  }

  async stat(hdfsPath: string): Promise<boolean> {
    const statUrl = webHdfsUrl(this.base, this.user, hdfsPath, 'GETFILESTATUS');
    try {
      const res = await requestWithRedirect(statUrl, 'GET', null, {});
      return res.statusCode < 400;
    } catch {
      return false;
    }
  }
}
