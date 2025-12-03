import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import DiscussionPubConcept from "./DiscussionPubConcept.ts";

const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID;
const paper1 = "paper:1234.5678";
const paper2 = "paper:9876.5432";
const anchor1 = "anchor:ref1" as ID;
const anchor2 = "anchor:ref2" as ID;
const anchor3 = "anchor:ref3" as ID;

/**
 * # trace: Principle fulfillment
 *
 * The principle states: "pub is created for a paper to be discussed; threads are created by the
 * users of the paper in relation to some context, replies are created by the users in
 * relation to a thread"
 *
 * Trace:
 * 1. A pub is created for a paper to be discussed
 * 2. Users create threads in relation to some context (anchor)
 * 3. Users create replies in relation to a thread
 * 4. The pub, threads, and replies can all be retrieved and referenced
 */
Deno.test("Principle: Pub created, threads created in relation to context, replies created in relation to thread", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Trace: Testing principle - pub -> threads -> replies");

    // 1. Pub is created for a paper to be discussed
    console.log("  Step 1: Create pub for paper");
    const openResult = await concept.open({ paperId: paper1 });
    assertNotEquals("error" in openResult, true, "Pub creation should succeed");
    const { newPub } = openResult as { newPub: ID };
    assertExists(newPub, "Pub ID should be returned");
    console.log(`    Created pub: ${newPub}`);

    // 2. Users create threads in relation to some context (anchor)
    console.log("  Step 2: Alice creates thread with anchor");
    const threadResult = await concept.startThread({
      pubId: newPub,
      author: userAlice,
      anchorId: anchor1,
      title: "Discussion about Section 3",
      body: "This section is interesting",
    });
    assertNotEquals(
      "error" in threadResult,
      true,
      "Thread creation should succeed",
    );
    const { newThread } = threadResult as { newThread: ID };
    assertExists(newThread, "Thread ID should be returned");
    console.log(`    Created thread: ${newThread}`);

    // 3. Users create replies in relation to a thread
    console.log("  Step 3: Bob creates reply to thread");
    const replyResult = await concept.makeReply({
      threadId: newThread,
      author: userBob,
      anchorId: anchor2,
      body: "I agree with your point",
    });
    assertNotEquals(
      "error" in replyResult,
      true,
      "Reply creation should succeed",
    );
    const { newReply } = replyResult as { newReply: ID };
    assertExists(newReply, "Reply ID should be returned");
    console.log(`    Created reply: ${newReply}`);

    // 4. Verify all can be retrieved and referenced
    console.log("  Step 4: Verify pub, thread, and reply can be retrieved");
    const pubIdResult = await concept._getPubIdByPaper({ paperId: paper1 });
    assertEquals(
      pubIdResult.length,
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(pubIdResult[0].result, newPub, "Should find the pub");

    const threadsResult = await concept._listThreads({ pubId: newPub });
    assertEquals(
      threadsResult.length,
      1,
      "Query should return array with one dictionary per thread",
    );
    assertEquals(
      threadsResult[0].thread._id,
      newThread,
      "Should be the created thread",
    );
    assertEquals(
      threadsResult[0].thread.anchorId,
      anchor1,
      "Thread should have correct anchor",
    );

    const repliesResult = await concept._listReplies({ threadId: newThread });
    assertEquals(
      repliesResult.length,
      1,
      "Query should return array with one dictionary per reply",
    );
    assertEquals(
      repliesResult[0].reply._id,
      newReply,
      "Should be the created reply",
    );
    assertEquals(
      repliesResult[0].reply.anchorId,
      anchor2,
      "Reply should have correct anchor",
    );

    console.log("    All components retrievable - principle fulfilled");
  } finally {
    await client.close();
  }
});

Deno.test("Action: open successfully creates pub", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing open action - successful creation");

    const beforeTime = Date.now();
    const result = await concept.open({ paperId: paper1 });
    const afterTime = Date.now();

    // Effects: should return newPub ID
    assertNotEquals("error" in result, true, "Creation should succeed");
    const { newPub } = result as { newPub: ID };
    assertExists(newPub, "Should return pub ID");

    // Verify effects: pub exists with correct fields
    const pubIdResult = await concept._getPubIdByPaper({ paperId: paper1 });
    assertEquals(
      pubIdResult.length,
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(pubIdResult[0].result, newPub, "Pub should exist");

    // Verify createdAt is set
    const pubDoc = await db.collection("pubs").findOne({
      _id: newPub,
    });
    assertExists(pubDoc, "Pub document should exist");
    assertExists(pubDoc.createdAt, "createdAt should be set");
    assertEquals(
      pubDoc.createdAt >= beforeTime && pubDoc.createdAt <= afterTime,
      true,
      "createdAt should be current timestamp",
    );
    assertEquals(pubDoc.paperId, paper1, "paperId should be stored correctly");

    console.log(
      "  ✓ Pub created with correct fields, createdAt set, newPub returned",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: open requires no duplicate pub", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing open action - duplicate prevention");

    // First open should succeed
    const result1 = await concept.open({ paperId: paper1 });
    assertNotEquals("error" in result1, true, "First open should succeed");

    // Second open with same paperId should fail
    const result2 = await concept.open({ paperId: paper1 });
    assertEquals("error" in result2, true, "Duplicate open should fail");
    assertEquals(
      (result2 as { error: string }).error,
      "Pub already exists for paperId",
      "Should return appropriate error message",
    );

    console.log("  ✓ Duplicate pub creation correctly prevented");
  } finally {
    await client.close();
  }
});

Deno.test("Action: startThread successfully creates thread with all fields", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing startThread action - all fields provided");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const beforeTime = Date.now();
    const result = await concept.startThread({
      pubId: newPub,
      author: userAlice,
      anchorId: anchor1,
      title: "Test Thread Title",
      body: "Test thread body",
    });
    const afterTime = Date.now();

    // Effects: should return newThread ID
    assertNotEquals("error" in result, true, "Thread creation should succeed");
    const { newThread } = result as { newThread: ID };
    assertExists(newThread, "Should return thread ID");

    // Verify effects: thread exists with correct fields
    const threadsResult = await concept._listThreads({ pubId: newPub });
    assertEquals(
      threadsResult.length,
      1,
      "Query should return array with one dictionary per thread",
    );
    const thread = threadsResult.find((t) => t.thread._id === newThread)
      ?.thread;
    assertExists(thread, "Thread should exist");
    assertEquals(thread.author, userAlice, "author should be stored correctly");
    assertEquals(
      thread.title,
      "Test Thread Title",
      "title should be stored correctly",
    );
    assertEquals(
      thread.body,
      "Test thread body",
      "body should be stored correctly",
    );
    assertEquals(
      thread.anchorId,
      anchor1,
      "anchorId should be stored correctly",
    );
    assertExists(thread.createdAt, "createdAt should be set");
    assertEquals(
      thread.createdAt >= beforeTime && thread.createdAt <= afterTime,
      true,
      "createdAt should be current timestamp",
    );
    assertEquals(
      thread.editedAt,
      undefined,
      "editedAt should not be set initially",
    );

    console.log(
      "  ✓ All fields stored correctly, deleted=false, createdAt set, newThread returned",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: startThread requires pub to exist", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing startThread action - pub requirement");

    const fakePubId = "pub:fake" as ID; // Fake pub ID that doesn't exist
    const result = await concept.startThread({
      pubId: fakePubId,
      author: userAlice,
      title: "Test",
      body: "Test body",
    });
    assertEquals(
      "error" in result,
      true,
      "Creating thread with non-existent pub should fail",
    );
    assertEquals(
      (result as { error: string }).error,
      "Pub not found",
      "Should return appropriate error message",
    );

    console.log("  ✓ Non-existent pub correctly rejected");
  } finally {
    await client.close();
  }
});

Deno.test("Action: editThread successfully updates title and body", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing editThread action - update title and body");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Original Title",
      body: "Original body",
    })) as { newThread: ID };

    const beforeTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    const result = await concept.editThread({
      threadId: newThread,
      newTitle: "Updated Title",
      newBody: "Updated body",
    });
    const afterTime = Date.now();

    assertNotEquals("error" in result, true, "Edit should succeed");

    // Verify effects: title and body updated, editedAt set
    const threadsResult = await concept._listThreads({ pubId: newPub });
    assertEquals(
      threadsResult.length,
      1,
      "Query should return array with one dictionary per thread",
    );
    const thread = threadsResult.find((t) => t.thread._id === newThread)
      ?.thread;
    assertExists(thread, "Thread should exist");
    assertEquals(thread.title, "Updated Title", "title should be updated");
    assertEquals(thread.body, "Updated body", "body should be updated");
    assertExists(thread.editedAt, "editedAt should be set");
    assertEquals(
      thread.editedAt >= beforeTime && thread.editedAt <= afterTime,
      true,
      "editedAt should be current timestamp",
    );

    console.log("  ✓ Title and body updated, editedAt set");
  } finally {
    await client.close();
  }
});

Deno.test("Action: editThread requires thread to exist", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing editThread action - thread requirement");

    const fakeThreadId = "thread:fake" as ID;
    const result = await concept.editThread({
      threadId: fakeThreadId,
      newBody: "Updated body",
    });
    assertEquals(
      "error" in result,
      true,
      "Editing non-existent thread should fail",
    );
    assertEquals(
      (result as { error: string }).error,
      "Thread not found",
      "Should return appropriate error message",
    );

    console.log("  ✓ Non-existent thread correctly rejected");
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteThread sets deleted flag (soft delete)", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing deleteThread action - soft delete");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "To be deleted",
      body: "This will be deleted",
    })) as { newThread: ID };

    const beforeTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    const result = await concept.deleteThread({ threadId: newThread });
    const afterTime = Date.now();

    assertNotEquals("error" in result, true, "Delete should succeed");

    // Verify effects: deleted flag set, editedAt set, thread not in list
    const threadsResult = await concept._listThreads({ pubId: newPub });
    assertEquals(
      threadsResult.length,
      0,
      "Deleted thread should not appear in list",
    );

    // Verify in database that deleted flag is set
    const threadDoc = await db.collection("threads").findOne({
      _id: newThread,
    });
    assertExists(threadDoc, "Thread document should still exist");
    assertEquals(threadDoc.deleted, true, "deleted flag should be set to true");
    assertExists(threadDoc.editedAt, "editedAt should be set");
    assertEquals(
      threadDoc.editedAt >= beforeTime && threadDoc.editedAt <= afterTime,
      true,
      "editedAt should be current timestamp",
    );

    console.log(
      "  ✓ Thread soft-deleted (deleted=true), editedAt set, excluded from queries",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteThread cascades to replies (soft delete)", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing deleteThread action - cascade to replies");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Thread with replies",
      body: "Body",
    })) as { newThread: ID };

    const { newReply: reply1 } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "Reply 1",
    })) as { newReply: ID };

    const { newReply: reply2 } = (await concept.makeReply({
      threadId: newThread,
      author: userCharlie,
      body: "Reply 2",
    })) as { newReply: ID };

    await concept.deleteThread({ threadId: newThread });

    // Verify replies are also soft-deleted
    const repliesResult = await concept._listReplies({ threadId: newThread });
    assertEquals(
      repliesResult.length,
      0,
      "Deleted replies should not appear in list",
    );

    // Verify in database that deleted flags are set
    const reply1Doc = await db.collection("replies").findOne({
      _id: reply1,
    });
    const reply2Doc = await db.collection("replies").findOne({
      _id: reply2,
    });
    assertEquals(reply1Doc?.deleted, true, "Reply 1 should be soft-deleted");
    assertEquals(reply2Doc?.deleted, true, "Reply 2 should be soft-deleted");

    console.log("  ✓ Thread deletion cascades to replies (soft delete)");
  } finally {
    await client.close();
  }
});

Deno.test("Action: makeReply successfully creates reply", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing makeReply action - successful creation");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };

    const beforeTime = Date.now();
    const result = await concept.makeReply({
      threadId: newThread,
      author: userBob,
      anchorId: anchor1,
      body: "Test reply body",
    });
    const afterTime = Date.now();

    // Effects: should return newReply ID
    assertNotEquals("error" in result, true, "Reply creation should succeed");
    const { newReply } = result as { newReply: ID };
    assertExists(newReply, "Should return reply ID");

    // Verify effects: reply exists with correct fields
    const repliesResult = await concept._listReplies({ threadId: newThread });
    assertEquals(
      repliesResult.length,
      1,
      "Query should return array with one dictionary per reply",
    );
    const reply = repliesResult.find((r) => r.reply._id === newReply)?.reply;
    assertExists(reply, "Reply should exist");
    assertEquals(reply.author, userBob, "author should be stored correctly");
    assertEquals(
      reply.body,
      "Test reply body",
      "body should be stored correctly",
    );
    assertEquals(
      reply.anchorId,
      anchor1,
      "anchorId should be stored correctly",
    );
    assertExists(reply.createdAt, "createdAt should be set");
    assertEquals(
      reply.createdAt >= beforeTime && reply.createdAt <= afterTime,
      true,
      "createdAt should be current timestamp",
    );
    assertEquals(
      reply.editedAt,
      undefined,
      "editedAt should not be set initially",
    );
    assertEquals(
      reply.parentId,
      undefined,
      "parentId should not be set for root reply",
    );

    console.log(
      "  ✓ All fields stored correctly, deleted=false, createdAt set, newReply returned",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: makeReply with parentReply creates nested reply", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing makeReply action - nested reply");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };

    const { newReply: parentReply } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "Parent reply",
    })) as { newReply: ID };

    const { newReply: childReply } = (await concept.makeReply({
      threadId: newThread,
      author: userCharlie,
      body: "Child reply",
      parentReply: parentReply,
    })) as { newReply: ID };

    // Verify child reply has parentId set
    const repliesResult = await concept._listReplies({ threadId: newThread });
    assertEquals(
      repliesResult.length,
      2,
      "Query should return array with one dictionary per reply",
    );
    const child = repliesResult.find((r) => r.reply._id === childReply)?.reply;
    assertExists(child, "Child reply should exist");
    assertEquals(
      child.parentId,
      parentReply,
      "Child reply should reference parent",
    );

    console.log("  ✓ Nested reply created with correct parentId");
  } finally {
    await client.close();
  }
});

Deno.test("Action: makeReply requires thread to exist", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing makeReply action - thread requirement");

    const fakeThreadId = "thread:fake" as ID;
    const result = await concept.makeReply({
      threadId: fakeThreadId,
      author: userAlice,
      body: "Test reply",
    });
    assertEquals(
      "error" in result,
      true,
      "Replying to non-existent thread should fail",
    );
    assertEquals(
      (result as { error: string }).error,
      "Thread not found",
      "Should return appropriate error message",
    );

    console.log("  ✓ Non-existent thread correctly rejected");
  } finally {
    await client.close();
  }
});

Deno.test("Action: makeReply requires parentReply to exist and match thread", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing makeReply action - parentReply validation");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };

    // Non-existent parentReply
    const fakeParentId = "reply:fake" as ID;
    const result1 = await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "Reply",
      parentReply: fakeParentId,
    });
    assertEquals(
      "error" in result1,
      true,
      "Replying to non-existent parent should fail",
    );
    assertEquals(
      (result1 as { error: string }).error,
      "Parent reply not found",
      "Should return appropriate error message",
    );

    // ParentReply from different thread
    const { newPub: pub2 } = (await concept.open({ paperId: paper2 })) as {
      newPub: ID;
    };
    const { newThread: thread2 } = (await concept.startThread({
      pubId: pub2,
      author: userAlice,
      title: "Other Thread",
      body: "Body",
    })) as { newThread: ID };
    const { newReply: otherReply } = (await concept.makeReply({
      threadId: thread2,
      author: userBob,
      body: "Other reply",
    })) as { newReply: ID };

    const result2 = await concept.makeReply({
      threadId: newThread,
      author: userCharlie,
      body: "Reply",
      parentReply: otherReply,
    });
    assertEquals(
      "error" in result2,
      true,
      "Replying with parent from different thread should fail",
    );
    assertEquals(
      (result2 as { error: string }).error,
      "Parent/thread mismatch",
      "Should return appropriate error message",
    );

    console.log("  ✓ ParentReply validation works correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Action: editReply successfully updates body", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing editReply action - update body");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };
    const { newReply } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "Original reply body",
    })) as { newReply: ID };

    const beforeTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    const result = await concept.editReply({
      replyId: newReply,
      newBody: "Updated reply body",
    });
    const afterTime = Date.now();

    assertNotEquals("error" in result, true, "Edit should succeed");

    // Verify effects: body updated, editedAt set
    const repliesResult = await concept._listReplies({ threadId: newThread });
    assertEquals(
      repliesResult.length,
      1,
      "Query should return array with one dictionary per reply",
    );
    const reply = repliesResult.find((r) => r.reply._id === newReply)?.reply;
    assertExists(reply, "Reply should exist");
    assertEquals(reply.body, "Updated reply body", "body should be updated");
    assertExists(reply.editedAt, "editedAt should be set");
    assertEquals(
      reply.editedAt >= beforeTime && reply.editedAt <= afterTime,
      true,
      "editedAt should be current timestamp",
    );

    console.log("  ✓ Body updated, editedAt set");
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteReply sets deleted flag (soft delete)", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing deleteReply action - soft delete");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };
    const { newReply } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "To be deleted",
    })) as { newReply: ID };

    const beforeTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    const result = await concept.deleteReply({ replyId: newReply });
    const afterTime = Date.now();

    assertNotEquals("error" in result, true, "Delete should succeed");

    // Verify effects: deleted flag set, editedAt set, reply not in list
    const repliesResult = await concept._listReplies({ threadId: newThread });
    assertEquals(
      repliesResult.length,
      0,
      "Deleted reply should not appear in list",
    );

    // Verify in database that deleted flag is set
    const replyDoc = await db.collection("replies").findOne({
      _id: newReply,
    });
    assertExists(replyDoc, "Reply document should still exist");
    assertEquals(replyDoc.deleted, true, "deleted flag should be set to true");
    assertExists(replyDoc.editedAt, "editedAt should be set");
    assertEquals(
      replyDoc.editedAt >= beforeTime && replyDoc.editedAt <= afterTime,
      true,
      "editedAt should be current timestamp",
    );

    console.log(
      "  ✓ Reply soft-deleted (deleted=true), editedAt set, excluded from queries",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getPubIdByPaper returns pub ID or null", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _getPubIdByPaper query");

    // Query non-existent paper
    const result1 = await concept._getPubIdByPaper({ paperId: paper1 });
    assertEquals(
      result1.length,
      0,
      "Query should return empty array for non-existent paper",
    );

    // Create pub and query
    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const result2 = await concept._getPubIdByPaper({ paperId: paper1 });
    assertEquals(
      result2.length,
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(result2[0].result, newPub, "Should return pub ID");

    console.log(
      "  ✓ Returns pub ID when exists, empty array when doesn't exist",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listThreads filters by pub and optionally by anchor", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _listThreads query - filtering");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread: thread1 } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      anchorId: anchor1,
      title: "Thread 1",
      body: "Body 1",
    })) as { newThread: ID };

    const { newThread: thread2 } = (await concept.startThread({
      pubId: newPub,
      author: userBob,
      anchorId: anchor2,
      title: "Thread 2",
      body: "Body 2",
    })) as { newThread: ID };

    const { newThread: thread3 } = (await concept.startThread({
      pubId: newPub,
      author: userCharlie,
      anchorId: anchor1,
      title: "Thread 3",
      body: "Body 3",
    })) as { newThread: ID };

    // List all threads
    const allResult = await concept._listThreads({ pubId: newPub });
    assertEquals(
      allResult.length,
      3,
      "Query should return array with one dictionary per thread",
    );

    // Filter by anchorId
    const filteredResult = await concept._listThreads({
      pubId: newPub,
      anchorId: anchor1,
    });
    assertEquals(
      filteredResult.length,
      2,
      "Query should return array with one dictionary per thread",
    );
    assertEquals(
      filteredResult.every((t) => t.thread.anchorId === anchor1),
      true,
      "All results should have anchor1",
    );
    assertEquals(
      filteredResult.some((t) => t.thread._id === thread1),
      true,
      "Should include thread1",
    );
    assertEquals(
      filteredResult.some((t) => t.thread._id === thread3),
      true,
      "Should include thread3",
    );

    console.log("  ✓ Filtering by pub and anchor works correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listThreads excludes deleted threads", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _listThreads query - excludes deleted");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread: thread1 } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Thread 1",
      body: "Body 1",
    })) as { newThread: ID };

    const { newThread: thread2 } = (await concept.startThread({
      pubId: newPub,
      author: userBob,
      title: "Thread 2",
      body: "Body 2",
    })) as { newThread: ID };

    // Delete thread1
    await concept.deleteThread({ threadId: thread1 });

    // List threads - should only return thread2
    const result = await concept._listThreads({ pubId: newPub });
    assertEquals(
      result.length,
      1,
      "Query should return array with one dictionary per thread",
    );
    assertEquals(result[0].thread._id, thread2, "Should be thread2");

    console.log("  ✓ Deleted threads excluded from results");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listThreads results are ordered by createdAt", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _listThreads query - ordering");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread: thread1 } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Thread 1",
      body: "Body 1",
    })) as { newThread: ID };
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { newThread: thread2 } = (await concept.startThread({
      pubId: newPub,
      author: userBob,
      title: "Thread 2",
      body: "Body 2",
    })) as { newThread: ID };
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { newThread: thread3 } = (await concept.startThread({
      pubId: newPub,
      author: userCharlie,
      title: "Thread 3",
      body: "Body 3",
    })) as { newThread: ID };

    const result = await concept._listThreads({ pubId: newPub });
    assertEquals(
      result.length,
      3,
      "Query should return array with one dictionary per thread",
    );

    // Verify ordering: createdAt should be ascending
    for (let i = 1; i < result.length; i++) {
      assertEquals(
        result[i].thread.createdAt >= result[i - 1].thread.createdAt,
        true,
        `Thread at index ${i} should have createdAt >= previous thread`,
      );
    }

    // Verify first thread is the one created first
    assertEquals(
      result[0].thread._id,
      thread1,
      "First result should be the first created thread",
    );

    console.log("  ✓ Results are correctly ordered by createdAt (ascending)");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listReplies returns all replies for thread", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _listReplies query");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };

    const { newReply: reply1 } = (await concept.makeReply({
      threadId: newThread,
      author: userAlice,
      body: "Reply 1",
    })) as { newReply: ID };

    const { newReply: reply2 } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      anchorId: anchor1,
      body: "Reply 2",
    })) as { newReply: ID };

    const { newReply: reply3 } = (await concept.makeReply({
      threadId: newThread,
      author: userCharlie,
      body: "Reply 3",
      parentReply: reply1,
    })) as { newReply: ID };

    const result = await concept._listReplies({ threadId: newThread });
    assertEquals(
      result.length,
      3,
      "Query should return array with one dictionary per reply",
    );

    // Verify all replies are present
    const replyIds = result.map((r) => r.reply._id);
    assertEquals(replyIds.includes(reply1), true, "Should include reply1");
    assertEquals(replyIds.includes(reply2), true, "Should include reply2");
    assertEquals(replyIds.includes(reply3), true, "Should include reply3");

    // Verify reply2 has anchorId
    const reply2Data = result.find((r) => r.reply._id === reply2)?.reply;
    assertEquals(reply2Data?.anchorId, anchor1, "Reply2 should have anchorId");

    // Verify reply3 has parentId
    const reply3Data = result.find((r) => r.reply._id === reply3)?.reply;
    assertEquals(reply3Data?.parentId, reply1, "Reply3 should have parentId");

    console.log("  ✓ All replies returned with correct fields");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listReplies excludes deleted replies", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _listReplies query - excludes deleted");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };

    const { newReply: reply1 } = (await concept.makeReply({
      threadId: newThread,
      author: userAlice,
      body: "Reply 1",
    })) as { newReply: ID };

    const { newReply: reply2 } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "Reply 2",
    })) as { newReply: ID };

    // Delete reply1
    await concept.deleteReply({ replyId: reply1 });

    // List replies - should only return reply2
    const result = await concept._listReplies({ threadId: newThread });
    assertEquals(
      result.length,
      1,
      "Query should return array with one dictionary per reply",
    );
    assertEquals(result[0].reply._id, reply2, "Should be reply2");

    console.log("  ✓ Deleted replies excluded from results");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listRepliesTree returns tree structure", async () => {
  const [db, client] = await testDb();
  const concept = new DiscussionPubConcept(db);

  try {
    console.log("Testing _listRepliesTree query - tree structure");

    const { newPub } = (await concept.open({ paperId: paper1 })) as {
      newPub: ID;
    };
    const { newThread } = (await concept.startThread({
      pubId: newPub,
      author: userAlice,
      title: "Test Thread",
      body: "Test body",
    })) as { newThread: ID };

    // Create reply tree:
    // reply1 (root)
    //   reply2 (child of reply1)
    //     reply4 (child of reply2)
    // reply3 (root)

    const { newReply: reply1 } = (await concept.makeReply({
      threadId: newThread,
      author: userAlice,
      body: "Root reply 1",
    })) as { newReply: ID };

    const { newReply: reply2 } = (await concept.makeReply({
      threadId: newThread,
      author: userBob,
      body: "Child of reply1",
      parentReply: reply1,
    })) as { newReply: ID };

    const { newReply: reply3 } = (await concept.makeReply({
      threadId: newThread,
      author: userCharlie,
      body: "Root reply 2",
    })) as { newReply: ID };

    const { newReply: reply4 } = (await concept.makeReply({
      threadId: newThread,
      author: userAlice,
      body: "Child of reply2",
      parentReply: reply2,
    })) as { newReply: ID };

    const result = await concept._listRepliesTree({ threadId: newThread });
    assertEquals(
      result.length,
      2,
      "Query should return array with one dictionary per root reply",
    );

    // Find reply1 in tree
    const root1 = result.find((r) => r.reply._id === reply1)?.reply;
    assertExists(root1, "Reply1 should be a root");
    assertEquals(root1.children.length, 1, "Reply1 should have 1 child");
    assertEquals(
      root1.children[0]._id,
      reply2,
      "Reply1's child should be reply2",
    );
    assertEquals(
      root1.children[0].children.length,
      1,
      "Reply2 should have 1 child",
    );
    assertEquals(
      root1.children[0].children[0]._id,
      reply4,
      "Reply2's child should be reply4",
    );

    // Find reply3 in tree
    const root2 = result.find((r) => r.reply._id === reply3)?.reply;
    assertExists(root2, "Reply3 should be a root");
    assertEquals(root2.children.length, 0, "Reply3 should have no children");

    console.log(
      "  ✓ Tree structure correctly built with parent-child relationships",
    );
  } finally {
    await client.close();
  }
});
