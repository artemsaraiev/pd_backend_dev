// @ts-nocheck
/// <reference lib="dom" />
declare const Deno: any;
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { newTestDb, cleanupTestDb } from "../_test/db.ts";
import { AnchoredContextService } from "./impl.ts";

Deno.test("AnchoredContext OP: create -> edit -> delete", async () => {
  const [db, client] = await newTestDb("anchored-op");
  try {
    const svc = new AnchoredContextService(db);
    const id = await svc.create("paper-1", "Section", "3.2", "Assumption text");
    await svc.edit(id, undefined, "Assumption text updated");
    const doc = await db.collection("anchors").findOne({ paperId: "paper-1", ref: "3.2" });
    console.log("OP anchor:", doc);
    assertEquals(doc?.snippet, "Assumption text updated");
    await svc.delete(id);
    const gone = await db.collection("anchors").findOne({ paperId: "paper-1", ref: "3.2" });
    assertEquals(gone, null);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("AnchoredContext variants: create multiple kinds; partial edits", async () => {
  const [db, client] = await newTestDb("anchored-variants");
  try {
    const svc = new AnchoredContextService(db);
    const a = await svc.create("p", "Figure", "Fig2", "caption");
    const b = await svc.create("p", "Lines", "12-20", "snippet");
    await svc.edit(a, "Fig3");
    const ad = await db.collection("anchors").findOne({ paperId: "p", ref: "Fig3" });
    const bd = await db.collection("anchors").findOne({ paperId: "p", ref: "12-20" });
    console.log("Variants anchors:", ad, bd);
    assertEquals(ad?.ref, "Fig3");
    assertEquals(bd?.ref, "12-20");
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("AnchoredContext errors: edit/delete unknown id", async () => {
  const [db, client] = await newTestDb("anchored-errors");
  try {
    const svc = new AnchoredContextService(db);
    await assertRejects(() => svc.edit("deadbeefdeadbeefdeadbeef", "x"));
    await assertRejects(() => svc.delete("deadbeefdeadbeefdeadbeef"));
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("AnchoredContext variant: delete twice -> second delete errors (strict)", async () => {
  const [db, client] = await newTestDb("anchored-v3");
  try {
    const svc = new AnchoredContextService(db);
    const id = await svc.create("paper-2", "Section", "2.1", "Init");
    const before = await db.collection("anchors").findOne({ paperId: "paper-2", ref: "2.1" });
    console.log("Variant3 before delete:", before);
    await svc.delete(id);
    const after = await db.collection("anchors").findOne({ paperId: "paper-2", ref: "2.1" });
    console.log("Variant3 after first delete:", after);
    await assertRejects(() => svc.delete(id));
  } finally {
    await cleanupTestDb(db, client);
  }
});


Deno.test("AnchoredContext timestamps: createdAt and editedAt semantics", async () => {
  const [db, client] = await newTestDb("anchored-ts");
  try {
    const svc = new AnchoredContextService(db);
    const id = await svc.create("p-ts", "Section", "R", "S");

    const before = await db.collection("anchors").findOne({ paperId: "p-ts", ref: "R" });
    console.log("Timestamp before:", before);
    assertEquals(typeof before?.createdAt, "number");
    assertEquals("editedAt" in (before ?? {}), false);

    await new Promise((r) => setTimeout(r, 2));
    await svc.edit(id); // no-field edit should only set editedAt

    const after = await db.collection("anchors").findOne({ paperId: "p-ts", ref: "R" });
    console.log("Timestamp after:", after);
    assertEquals(typeof after?.editedAt, "number");
    assertEquals((after?.editedAt ?? 0) >= (before?.createdAt ?? 0), true);
    assertEquals(after?.ref, "R");
    assertEquals(after?.snippet, "S");
  } finally {
    await cleanupTestDb(db, client);
  }
});


