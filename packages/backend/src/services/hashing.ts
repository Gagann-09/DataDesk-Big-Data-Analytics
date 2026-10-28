/**
 * Stream hashing: compute SHA-256 and exact byte size while bytes flow.
 * A Transform passes bytes through unchanged while updating the digest.
 */

import { createHash } from 'crypto';
import { Transform, type TransformCallback } from 'stream';

export class HashSizeTransform extends Transform {
  private hash = createHash('sha256');
  private _sha256: string | null = null;
  public size = 0;

  public get sha256(): string {
    // Hash#digest is single-use; cache so repeated access is safe.
    if (this._sha256 === null) {
      this._sha256 = this.hash.digest('hex');
    }
    return this._sha256;
  }

  _transform(chunk: any, _encoding: string, callback: TransformCallback): void {
    if (chunk != null) {
      this.hash.update(chunk);
      this.size += chunk.length;
    }
    this.push(chunk);
    callback();
  }
}

/** Hash a buffer's SHA-256 (used by stores and tests). */
export function sha256Buffer(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}
