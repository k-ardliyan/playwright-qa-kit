import * as crypto from 'node:crypto';

export function normalizeContentForHash(content: string): string {
  if (!content) return '';
  return content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

export function computeSourceHash(content: string): string {
  const normalized = normalizeContentForHash(content);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export function deterministicStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => deterministicStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (key) =>
      `${JSON.stringify(key)}:${deterministicStringify((obj as Record<string, unknown>)[key])}`,
  );
  return `{${pairs.join(',')}}`;
}

export function computeObjectHash(obj: unknown): string {
  const json = deterministicStringify(obj);
  return crypto.createHash('sha256').update(json, 'utf8').digest('hex');
}
