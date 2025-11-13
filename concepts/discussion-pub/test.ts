// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { ObjectId } from "npm:mongodb";
import { newTestDb, cleanupTestDb } from "../_test/db.ts";
import { DiscussionPubService } from "./impl.ts";

Deno.test("DiscussionPub OP: open -> startThread -> reply -> editThread -> editReply", async () => {
  const [db, client] = await newTestDb("discussion-pub-op");
  try {
    const svc = new DiscussionPubService(db);
    await svc.initIndexes();
    const pubId = await svc.open("paper-x");
    const threadId = await svc.startThread(pubId, "u1", "Hello", "anchor-123");
    const replyId = await svc.reply(threadId, "u2", "Hi");
    await svc.editThread(threadId, "Hello edited");
    await svc.editReply(replyId, "Hi edited");
    const t = await db.collection("threads").findOne({ _id: new ObjectId(threadId) });
    const r = await db.collection("replies").findOne({ _id: new ObjectId(replyId) });
    console.log("OP thread:", t);
    console.log("OP reply:", r);
    assertEquals(t?.body, "Hello edited");
    assertEquals(r?.body, "Hi edited");
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("DiscussionPub variants: deleteReply then reply again; deleteThread cascades", async () => {
  const [db, client] = await newTestDb("discussion-pub-variants1");
  try {
    const svc = new DiscussionPubService(db);
    await svc.initIndexes();
    const pubId = await svc.open("paper-y");
    const threadId = await svc.startThread(pubId, "u1", "Body");
    const r1 = await svc.reply(threadId, "u2", "r1");
    await svc.deleteReply(r1);
    await svc.reply(threadId, "u3", "r2");
    await svc.deleteThread(threadId);
    const replies = await db.collection("replies").find({ threadId }).toArray();
    console.log("Variants1 replies after cascade:", replies);
    assertEquals(replies.length, 0);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("DiscussionPub variants: startThread without anchor; multiple threads", async () => {
  const [db, client] = await newTestDb("discussion-pub-variants2");
  try {
    const svc = new DiscussionPubService(db);
    await svc.initIndexes();
    const pubId = await svc.open("paper-z");
    const t1 = await svc.startThread(pubId, "u1", "A");
    const t2 = await svc.startThread(pubId, "u2", "B");
    console.log("Variants2 threads:", t1, t2);
    assertEquals(typeof t1, "string");
    assertEquals(typeof t2, "string");
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("DiscussionPub errors: duplicate pub; reply missing thread; edit/delete missing ids", async () => {
  const [db, client] = await newTestDb("discussion-pub-errors");
  try {
    const svc = new DiscussionPubService(db);
    await svc.initIndexes();
    await svc.open("paper-dup");
    await assertRejects(() => svc.open("paper-dup"));
    await assertRejects(() => svc.reply("deadbeefdeadbeefdeadbeef", "u", "x"));
    await assertRejects(() => svc.editThread("deadbeefdeadbeefdeadbeef", "x"));
    await assertRejects(() => svc.deleteThread("deadbeefdeadbeefdeadbeef"));
    await assertRejects(() => svc.editReply("deadbeefdeadbeefdeadbeef", "x"));
    await assertRejects(() => svc.deleteReply("deadbeefdeadbeefdeadbeef"));
  } finally {
    await cleanupTestDb(db, client);
  }
});


Deno.test("DiscussionPub errors: startThread with invalid pubId", async () => {
  const [db, client] = await newTestDb("discussion-pub-badpub");
  try {
    const svc = new DiscussionPubService(db);
    await svc.initIndexes();
    await assertRejects(() => svc.startThread("deadbeefdeadbeefdeadbeef", "u", "x"));
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("DiscussionPub variants: deleteReply twice errors; edit sets editedAt", async () => {
  const [db, client] = await newTestDb("discussion-pub-del2");
  try {
    const svc = new DiscussionPubService(db);
    await svc.initIndexes();
    const pubId = await svc.open("paper-t");
    const threadId = await svc.startThread(pubId, "u1", "B");
    const replyId = await svc.reply(threadId, "u2", "r");

    // capture before edit
    const before = await db.collection("threads").findOne({ _id: new ObjectId(threadId) });
    await new Promise((r) => setTimeout(r, 2));
    await svc.editThread(threadId, "B2");
    const afterT = await db.collection("threads").findOne({ _id: new ObjectId(threadId) });
    console.log("Thread before/after:", before, afterT);
    assertEquals(typeof afterT?.editedAt, "number");
    assertEquals((afterT?.editedAt ?? 0) >= (before?.createdAt ?? 0), true);

    await svc.editReply(replyId, "r2");
    const afterR = await db.collection("replies").findOne({ _id: new ObjectId(replyId) });
    assertEquals(typeof afterR?.editedAt, "number");

    await svc.deleteReply(replyId);
    await assertRejects(() => svc.deleteReply(replyId));
  } finally {
    await cleanupTestDb(db, client);
  }
});


