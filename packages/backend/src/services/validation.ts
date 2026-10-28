/**
 * Bounded CSV / JSONL validation on a staged file.
 *
 * Validation work is bounded by the upload size limit (bytes) plus a cap on
 * retained rejected-row samples. Invalid rows are counted and sampled; parsing
 * never fails the whole upload for a few bad rows (skip-and-count policy).
 *
 * PRD FR-01 (record count when parseable), §11 invalid-row policy.
 */

import { createReadStream } from 'fs';
import readline from 'readline';
import type { DatasetFormat, DatasetValidation } from '../types';

export interface ValidationOptions {
  maxErrors?: number;
}

export interface ValidationResult {
  acceptedRows: number;
  rejectedRows: number;
  recordCount: number;
  errorSamples: string[];
  policyVersion: string;
}

const MAX_LINES_LOGGED = 200;

function truncate(s: string, n = 160): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

/**
 * Minimal CSV line splitter: handles quoted fields, escaped quotes (""),
 * commas inside quotes, and CRLF/LF. Returns null when a line ends inside an
 * unterminated quoted field (treated as a rejected row).
 */
function parseCsvLine(line: string): string[] | null {
  const fields: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (inQuotes) return null;
  fields.push(cur);
  return fields;
}

export async function validateFile(
  filePath: string,
  format: DatasetFormat,
  opts: ValidationOptions = {},
): Promise<ValidationResult> {
  const maxErrors = Math.max(0, opts.maxErrors ?? 0);
  const errorSamples: string[] = [];
  let acceptedRows = 0;
  let rejectedRows = 0;
  let expectedFieldCount: number | null = null;
  let headerSeen = false;

  const stream = createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (line === '') continue; // blank lines carry no record

    if (format === 'csv' && !headerSeen) {
      const fields = parseCsvLine(line);
      if (fields === null) {
        rejectedRows++;
        if (errorSamples.length < maxErrors) {
          errorSamples.push(`header: unbalanced quotes`);
        }
        headerSeen = true;
        continue;
      }
      expectedFieldCount = fields.length;
      headerSeen = true;
      continue;
    }

    let ok = false;
    let detail = '';
    if (format === 'jsonl') {
      try {
        JSON.parse(line);
        ok = true;
      } catch (err) {
        ok = false;
        detail = err instanceof Error ? err.message : 'invalid json';
      }
    } else {
      const fields = parseCsvLine(line);
      if (fields === null) {
        ok = false;
        detail = 'unbalanced quotes';
      } else if (expectedFieldCount != null && fields.length !== expectedFieldCount) {
        ok = false;
        detail = `expected ${expectedFieldCount} fields, got ${fields.length}`;
      } else {
        ok = true;
      }
    }

    if (ok) {
      acceptedRows++;
    } else {
      rejectedRows++;
      if (errorSamples.length < maxErrors) {
        errorSamples.push(`line: ${truncate(line)} (${detail})`);
      }
    }
  }

  return {
    acceptedRows,
    rejectedRows,
    recordCount: acceptedRows,
    errorSamples,
    policyVersion: format === 'csv' ? 'csv-v1' : 'jsonl-v1',
  };
}
