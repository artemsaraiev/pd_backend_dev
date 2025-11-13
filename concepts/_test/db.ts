import "jsr:@std/dotenv/load";
import { MongoClient, Db } from "npm:mongodb";

// MongoDB hard-limit: 38 bytes for a database name.
// We'll sanitize + truncate the name to stay within the limit.
function safeDbName(nameSuffix: string): string {
  const base = (Deno.env.get("DB_NAME") ?? "pubdiscuss")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12); // leave room for suffix

  const suffix = nameSuffix.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 6); // 4 chars

  // final name pattern: base + '_' + suffix + '_' + rand
  return `${base}_${suffix}_${rand}`.slice(0, 38);
}

export async function newTestDb(nameSuffix: string): Promise<[Db, MongoClient]> {
  const mongoUrl = Deno.env.get("MONGODB_URL");
  if (!mongoUrl) throw new Error("MONGODB_URL env var is required for tests");

  const dbName = safeDbName(nameSuffix);
  const client = new MongoClient(mongoUrl);
  await client.connect();
  const db = client.db(dbName);
  return [db, client];
}

export async function cleanupTestDb(db: Db, client: MongoClient) {
  try {
    await db.dropDatabase();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("dropDatabase warning:", msg);
  } finally {
    await client.close();
  }
}
