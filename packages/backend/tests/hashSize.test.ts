import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { HashSizeTransform } from '../src/services/hashing';

describe('HashSizeTransform (stream SHA-256 + exact size)', () => {
  it('computes the digest and byte size while streaming', async () => {
    const chunks = [
      Buffer.from('hello '),
      Buffer.from('world\n'),
      Buffer.from('héllo wörld 🚀'),
    ];
    const expected = Buffer.concat(chunks);
    const expectedDigest = createHash('sha256').update(expected).digest('hex');

    const hashSize = new HashSizeTransform();
    const out: Buffer[] = [];
    for await (const chunk of Readable.from(chunks).pipe(hashSize)) {
      out.push(Buffer.from(chunk as Buffer));
    }

    expect(hashSize.size).toBe(expected.length);
    expect(hashSize.size).toBe(Buffer.concat(out).length);
    expect(hashSize.sha256).toBe(expectedDigest);
  });

  it('handles an empty stream', async () => {
    const hashSize = new HashSizeTransform();
    for await (const _chunk of Readable.from([] as Buffer[]).pipe(hashSize)) {
      // none
    }
    expect(hashSize.size).toBe(0);
    expect(hashSize.sha256).toBe(
      createHash('sha256').update(Buffer.alloc(0)).digest('hex'),
    );
  });
});
