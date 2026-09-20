import fs from "node:fs";
import path from "node:path";
import { buildSeed, SEED_VERSION } from "./seed";
import type { Store } from "./types";

/**
 * File-backed JSON store.
 *
 * All access goes through getStore / mutate / resetStore so the storage engine can be swapped
 * for Supabase later without touching feature code. Reads are served from memory; every
 * mutation is written atomically (temp file + rename) so a crash never leaves a torn file.
 */

const DB_PATH = process.env.AURA_DB_PATH
  ? path.resolve(process.env.AURA_DB_PATH)
  : process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "store.json")
    : path.join(process.cwd(), "data", "store.json");

const globalForDb = globalThis as unknown as { __auraStore?: Store };

function persist(store: Store) {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const tmp = `${DB_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.warn(`[AURA DB] Could not persist to ${DB_PATH}:`, err);
  }
}

function load(): Store {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version === SEED_VERSION) return parsed;
  } catch {
    /* missing or corrupt file: check bundled seed before generating fresh */
  }

  const defaultBundledPath = path.join(process.cwd(), "data", "store.json");
  if (DB_PATH !== defaultBundledPath) {
    try {
      const bundledRaw = fs.readFileSync(defaultBundledPath, "utf8");
      const parsed = JSON.parse(bundledRaw) as Store;
      if (parsed.version === SEED_VERSION) {
        persist(parsed);
        return parsed;
      }
    } catch {
      /* bundled seed missing or unreadable */
    }
  }

  const fresh = buildSeed(new Date());
  persist(fresh);
  return fresh;
}

/** Current store. Treat as read-only; use mutate() to change data. */
export function getStore(): Store {
  if (!globalForDb.__auraStore) globalForDb.__auraStore = load();
  return globalForDb.__auraStore;
}

/** Apply a change and persist it. The updater may mutate the draft in place. */
export function mutate<T>(updater: (draft: Store) => T): T {
  const store = getStore();
  const result = updater(store);
  persist(store);
  return result;
}

/** Restore the deterministic demo story. */
export function resetStore(): Store {
  const fresh = buildSeed(new Date());
  globalForDb.__auraStore = fresh;
  persist(fresh);
  return fresh;
}

export function dbHealth() {
  const s = getStore();
  return {
    engine: "json-file",
    path: DB_PATH,
    version: s.version,
    counts: { users: s.users.length, topics: s.topics.length, questions: s.questions.length, attempts: s.attempts.length },
  };
}
