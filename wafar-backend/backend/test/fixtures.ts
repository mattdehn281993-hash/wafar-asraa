import { readFileSync } from 'node:fs';

// Fixtures live outside backend/ (language-neutral, shared with a future port).
const FIXTURES_DIR = new URL('../../fixtures/', import.meta.url);
const SCHEMAS_DIR = new URL('../../schemas/', import.meta.url);

/** Reads fixtures/<path> as JSON. The caller states the shape it expects. */
export function loadFixture<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, FIXTURES_DIR), 'utf8')) as T;
}

/** Reads schemas/<path> as JSON. */
export function loadSchema<T>(path: string): T {
  return JSON.parse(readFileSync(new URL(path, SCHEMAS_DIR), 'utf8')) as T;
}

/** Shallow merge used by fixtures: `overrides` replaces top-level keys, then `remove` deletes keys. */
export function mergeTopLevel(
  base: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
  remove: string[] = [],
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base, ...overrides };
  for (const key of remove) delete merged[key];
  return merged;
}
