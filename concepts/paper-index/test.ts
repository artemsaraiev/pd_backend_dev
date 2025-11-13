// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { newTestDb, cleanupTestDb } from "../_test/db.ts";
import { PaperIndexService } from "./impl.ts";
import type { PaperDoc } from "./impl.ts"; 

// tiny helper so Set order doesn't bite us
const sorted = <T>(xs: T[] | undefined) => [...(xs ?? [])].sort();

Deno.test("PaperIndex OP: ensure -> updateMeta -> addAuthors -> addLink", async () => {
  // const [db, client] = await newTestDb("paper-index-op"); too long test name
  const [db, client] = await newTestDb("pi_op");
  try {
    const svc = new PaperIndexService(db);
    const pid = globalThis.crypto.randomUUID();

    const returned = await svc.ensure(pid, "Initial Title");
    assertEquals(returned, pid);

    await svc.updateMeta(pid, "Updated Title");
    await svc.addAuthors(pid, ["u1", "u2"]);
    await svc.addLink(pid, "https://example.com/paper");

    const papers = db.collection<PaperDoc>("papers");                 // ← typed
    const doc = await papers.findOne({ _id: pid });                   // ← now _id is string
    console.log("OP state:", doc);

    assertEquals(doc?._id, pid);
    assertEquals(doc?.title, "Updated Title");
    assertEquals(sorted(doc?.authors), ["u1", "u2"]);
    assertEquals(doc?.links, ["https://example.com/paper"]);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("PaperIndex variants: idempotent ensure; removeAuthors; removeLink", async () => {
  // const [db, client] = await newTestDb("paper-index-variants1");
  const [db, client] = await newTestDb("pi_v1");
  try {
    const svc = new PaperIndexService(db);
    const pid = globalThis.crypto.randomUUID();

    await svc.ensure(pid, "T1");
    await svc.ensure(pid, "T2"); // should not overwrite existing title
    await svc.addAuthors(pid, ["a", "b", "c"]);
    await svc.addLink(pid, "l1");

    await svc.removeAuthors(pid, ["b"]);
    await svc.removeLink(pid, "l1");

    const papers = db.collection<PaperDoc>("papers");
    const doc = await papers.findOne({ _id: pid });
    console.log("Variants1 state:", doc);

    assertEquals(sorted(doc?.authors), ["a", "c"]);
    assertEquals(doc?.links ?? [], []);
    assertEquals(doc?.title, "T1");
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("PaperIndex variants: dedupe authors and links", async () => {
  // const [db, client] = await newTestDb("paper-index-variants2");
  const [db, client] = await newTestDb("pi_v2");
  try {
    const svc = new PaperIndexService(db);
    const pid = globalThis.crypto.randomUUID();

    await svc.ensure(pid);
    await svc.addAuthors(pid, ["a", "a", "b"]);
    await svc.addAuthors(pid, ["b", "c"]);
    await svc.addLink(pid, "u");
    await svc.addLink(pid, "u");

    const papers = db.collection<PaperDoc>("papers");
    const doc = await papers.findOne({ _id: pid });
    console.log("Variants2 state:", doc);

    assertEquals(sorted(doc?.authors), ["a", "b", "c"]);
    assertEquals(doc?.links, ["u"]);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("PaperIndex errors: updateMeta/removeLink on missing id", async () => {
  // const [db, client] = await newTestDb("paper-index-errors");
  const [db, client] = await newTestDb("pi_err");
  try {
    const svc = new PaperIndexService(db);
    await assertRejects(() => svc.updateMeta("missing", "x"));
    await assertRejects(() => svc.removeLink("missing", "y"));
  } finally {
    await cleanupTestDb(db, client);
  }
});


Deno.test("PaperIndex errors: missing id for addAuthors/removeAuthors/addLink", async () => {
  const [db, client] = await newTestDb("pi_err2");
  try {
    const svc = new PaperIndexService(db);
    await assertRejects(() => svc.addAuthors("missing", ["a"]));
    await assertRejects(() => svc.removeAuthors("missing", ["a"]));
    await assertRejects(() => svc.addLink("missing", "u"));
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("PaperIndex variants: no-op removals when absent", async () => {
  const [db, client] = await newTestDb("pi_noop");
  try {
    const svc = new PaperIndexService(db);
    const pid = crypto.randomUUID();
    await svc.ensure(pid);
    await svc.addAuthors(pid, ["a"]);
    await svc.removeAuthors(pid, ["b"]); // removing absent author
    await svc.removeLink(pid, "u"); // removing absent link on empty list

    const papers = db.collection<PaperDoc>("papers");
    const doc = await papers.findOne({ _id: pid });
    console.log("No-op state:", doc);
    assertEquals(doc?.authors, ["a"]);
    assertEquals(doc?.links ?? [], []);
  } finally {
    await cleanupTestDb(db, client);
  }
});


