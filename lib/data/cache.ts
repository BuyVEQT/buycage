// Two-tier cache: in-memory (warm container) + filesystem (across cold
// starts on the same Vercel container). Default 24h TTL.

import fs from "fs/promises";
import path from "path";

const CACHE_DIR = process.env.VERCEL
  ? "/tmp/buycage-cache"
  : path.join(process.cwd(), ".cache");

const memoryCache = new Map<string, { data: string; writtenAt: number }>();

export function getCacheKey(
  type: string,
  symbol: string,
  ...extras: string[]
): string {
  return [type, symbol, ...extras].filter(Boolean).join("-");
}

const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function readCache<T>(
  key: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS
): Promise<T | null> {
  // 1. In-memory first
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    if (Date.now() - memEntry.writtenAt > maxAgeMs) {
      memoryCache.delete(key);
    } else {
      try {
        return JSON.parse(memEntry.data) as T;
      } catch {
        /* fall through to filesystem */
      }
    }
  }

  // 2. Filesystem
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const stat = await fs.stat(filePath);
    if (Date.now() - stat.mtimeMs > maxAgeMs) return null;
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as T;
    // Backfill memory
    memoryCache.set(key, { data: raw, writtenAt: stat.mtimeMs });
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const json = JSON.stringify(data);
  memoryCache.set(key, { data: json, writtenAt: Date.now() });
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(
      path.join(CACHE_DIR, `${key}.json`),
      json,
      "utf-8"
    );
  } catch (error) {
    console.warn(
      "[Cache] FS write failed (memory cache still holds data):",
      error
    );
  }
}
