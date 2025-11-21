import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import HighlightedContextConcept from "./HighlightedContextConcept.ts";

const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID;
const paper1 = "paper:1234.5678";
const paper2 = "paper:9876.5432";
const highlight1 = "highlight:ref1" as ID;
const highlight2 = "highlight:ref2" as ID;
const highlight3 = "highlight:ref3" as ID;

/**
 * # trace: Principle fulfillment
 * 
 * The principle states: "the user provides a location of the paper and kind of the region
 * so that this context can later be referenced by discussion/other users"
 * 
 * Trace:
 * 1. User Alice creates a highlighted context for a paper with a location (highlight) and kind
 * 2. User Bob creates another context referencing the same paper with a different location
 * 3. Both contexts can be retrieved and referenced by their IDs, demonstrating they can be
 *    used by discussion/other users
 */
Deno.test("Principle: User provides location and kind, context can be referenced by others", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Trace: Testing principle - user provides location and kind for referencing");

    // 1. User Alice creates a highlighted context with location and kind
    console.log("  Step 1: Alice creates context with Section kind");
    const create1Result = await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
      kind: "Section",
    });
    assertNotEquals(
      "error" in create1Result,
      true,
      "Alice's context creation should succeed",
    );
    const { newContext: context1 } = create1Result as { newContext: ID };
    assertExists(context1, "Context 1 ID should be returned");
    console.log(`    Created context: ${context1}`);

    // 2. User Bob creates another context for the same paper with different location
    console.log("  Step 2: Bob creates context with Figure kind");
    const create2Result = await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight2,
      kind: "Figure",
    });
    assertNotEquals(
      "error" in create2Result,
      true,
      "Bob's context creation should succeed",
    );
    const { newContext: context2 } = create2Result as { newContext: ID };
    assertExists(context2, "Context 2 ID should be returned");
    console.log(`    Created context: ${context2}`);

    // 3. Verify both contexts can be retrieved and referenced
    console.log("  Step 3: Verify contexts can be retrieved by filtering");
    const allContexts = await concept._getFilteredContexts({});
    assertEquals(
      allContexts.length,
      1,
      "Query should return one result dictionary",
    );
    const { filteredContexts } = allContexts[0];
    assertEquals(
      filteredContexts.length,
      2,
      "Should find both contexts for the paper",
    );

    // Verify contexts have correct fields and can be referenced by ID
    const ctx1 = filteredContexts.find((c) => c._id === context1);
    const ctx2 = filteredContexts.find((c) => c._id === context2);
    assertExists(ctx1, "Context 1 should be retrievable by ID");
    assertExists(ctx2, "Context 2 should be retrievable by ID");
    assertEquals(ctx1.paperId, paper1, "Context 1 should reference correct paper");
    assertEquals(ctx2.paperId, paper1, "Context 2 should reference correct paper");
    assertEquals(ctx1.author, userAlice, "Context 1 should have correct author");
    assertEquals(ctx2.author, userBob, "Context 2 should have correct author");
    assertEquals(ctx1.location, highlight1, "Context 1 should have correct location");
    assertEquals(ctx2.location, highlight2, "Context 2 should have correct location");
    assertEquals(ctx1.kind, "Section", "Context 1 should have Section kind");
    assertEquals(ctx2.kind, "Figure", "Context 2 should have Figure kind");
    console.log("    Both contexts are retrievable and have correct fields - principle fulfilled");
  } finally {
    await client.close();
  }
});

Deno.test("Action: create successfully creates context with all fields", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing create action - all fields provided");

    const beforeTime = Date.now();
    const result = await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
      kind: "Lines",
      parentContext: undefined,
    });
    const afterTime = Date.now();

    // Effects: should return newContext ID
    assertNotEquals("error" in result, true, "Creation should succeed");
    const { newContext } = result as { newContext: ID };
    assertExists(newContext, "Should return context ID");

    // Verify effects: context exists with correct fields
    const allContexts = await concept._getFilteredContexts({});
    const { filteredContexts } = allContexts[0];
    const created = filteredContexts.find((c) => c._id === newContext);
    assertExists(created, "Created context should exist in state");
    assertEquals(created.paperId, paper1, "paperId should be stored correctly");
    assertEquals(created.author, userAlice, "author should be stored correctly");
    assertEquals(created.location, highlight1, "location should be stored correctly");
    assertEquals(created.kind, "Lines", "kind should be stored correctly");
    assertExists(created.createdAt, "createdAt should be set");
    assertEquals(
      created.createdAt >= beforeTime && created.createdAt <= afterTime,
      true,
      "createdAt should be current timestamp",
    );
    console.log("  ✓ All fields stored correctly, createdAt set, newContext returned");
  } finally {
    await client.close();
  }
});

Deno.test("Action: create with optional fields", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing create action - optional fields");

    // Create without kind
    const result1 = await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    });
    assertNotEquals("error" in result1, true, "Creation without kind should succeed");
    const { newContext: ctx1 } = result1 as { newContext: ID };

    // Create with kind
    const result2 = await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight2,
      kind: "Section",
    });
    assertNotEquals("error" in result2, true, "Creation with kind should succeed");
    const { newContext: ctx2 } = result2 as { newContext: ID };

    // Verify both contexts exist
    const allContexts = await concept._getFilteredContexts({});
    const { filteredContexts } = allContexts[0];
    const created1 = filteredContexts.find((c) => c._id === ctx1);
    const created2 = filteredContexts.find((c) => c._id === ctx2);

    assertExists(created1, "Context without kind should exist");
    assertEquals(created1.kind, undefined, "Context without kind should have undefined kind");

    assertExists(created2, "Context with kind should exist");
    assertEquals(created2.kind, "Section", "Context with kind should store it correctly");

    console.log("  ✓ Optional fields handled correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Action: create requires parentContext to exist if provided", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing create action - parentContext requirement");

    // Requires: parentContext must exist if provided
    const fakeParentId = "context:fake" as ID; // Fake context ID that doesn't exist
    const result1 = await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
      parentContext: fakeParentId,
    });
    assertEquals(
      "error" in result1,
      true,
      "Creating with non-existent parentContext should fail",
    );
    assertEquals(
      (result1 as { error: string }).error,
      "Parent context not found",
      "Should return appropriate error message",
    );
    console.log("  ✓ Non-existent parentContext correctly rejected");

    // Create a valid parent context first
    const parentResult = await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    });
    assertNotEquals("error" in parentResult, true, "Parent creation should succeed");
    const { newContext: parentId } = parentResult as { newContext: ID };

    // Now create child with valid parent
    const result2 = await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight2,
      parentContext: parentId,
    });
    assertNotEquals(
      "error" in result2,
      true,
      "Creating with valid parentContext should succeed",
    );
    const { newContext: childId } = result2 as { newContext: ID };

    // Verify child has parentContext set
    const allContexts = await concept._getFilteredContexts({});
    const { filteredContexts } = allContexts[0];
    const child = filteredContexts.find((c) => c._id === childId);
    assertExists(child, "Child context should exist");
    assertEquals(child.parentContext, parentId, "Child should reference parent");

    console.log("  ✓ Valid parentContext correctly accepted and stored");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFilteredContexts filters by paperIds", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing _getFilteredContexts - filter by paperIds");

    // Create contexts for different papers
    const { newContext: ctx1 } = (await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    })) as { newContext: ID };

    const { newContext: ctx2 } = (await concept.create({
      paperId: paper2,
      author: userAlice,
      location: highlight2,
    })) as { newContext: ID };

    const { newContext: ctx3 } = (await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight3,
    })) as { newContext: ID };

    // Filter by paper1 only
    const result = await concept._getFilteredContexts({ paperIds: [paper1] });
    assertEquals(result.length, 1, "Should return one result dictionary");
    const { filteredContexts } = result[0];
    assertEquals(
      filteredContexts.length,
      2,
      "Should find 2 contexts for paper1",
    );
    assertEquals(
      filteredContexts.every((c) => c.paperId === paper1),
      true,
      "All results should be for paper1",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx1),
      true,
      "Should include ctx1",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx3),
      true,
      "Should include ctx3",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx2),
      false,
      "Should not include ctx2 (different paper)",
    );

    console.log("  ✓ Filtering by paperIds works correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFilteredContexts filters by authors", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing _getFilteredContexts - filter by authors");

    // Create contexts by different authors
    const { newContext: ctx1 } = (await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    })) as { newContext: ID };

    const { newContext: ctx2 } = (await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight2,
    })) as { newContext: ID };

    const { newContext: ctx3 } = (await concept.create({
      paperId: paper2,
      author: userAlice,
      location: highlight3,
    })) as { newContext: ID };

    // Filter by userAlice only
    const result = await concept._getFilteredContexts({ authors: [userAlice] });
    assertEquals(result.length, 1, "Should return one result dictionary");
    const { filteredContexts } = result[0];
    assertEquals(
      filteredContexts.length,
      2,
      "Should find 2 contexts by userAlice",
    );
    assertEquals(
      filteredContexts.every((c) => c.author === userAlice),
      true,
      "All results should be by userAlice",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx1),
      true,
      "Should include ctx1",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx3),
      true,
      "Should include ctx3",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx2),
      false,
      "Should not include ctx2 (different author)",
    );

    console.log("  ✓ Filtering by authors works correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFilteredContexts filters by both paperIds and authors", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing _getFilteredContexts - filter by both paperIds and authors");

    // Create contexts
    const { newContext: ctx1 } = (await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    })) as { newContext: ID };

    const { newContext: ctx2 } = (await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight2,
    })) as { newContext: ID };

    const { newContext: ctx3 } = (await concept.create({
      paperId: paper2,
      author: userAlice,
      location: highlight3,
    })) as { newContext: ID };

    // Filter by paper1 AND userAlice (should only match ctx1)
    const result = await concept._getFilteredContexts({
      paperIds: [paper1],
      authors: [userAlice],
    });
    assertEquals(result.length, 1, "Should return one result dictionary");
    const { filteredContexts } = result[0];
    assertEquals(
      filteredContexts.length,
      1,
      "Should find exactly 1 context matching both criteria",
    );
    assertEquals(filteredContexts[0]._id, ctx1, "Should be ctx1");
    assertEquals(
      filteredContexts[0].paperId === paper1 && filteredContexts[0].author === userAlice,
      true,
      "Should match both criteria",
    );

    console.log("  ✓ Filtering by both paperIds and authors works correctly (AND logic)");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFilteredContexts returns all contexts when no filters provided", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing _getFilteredContexts - no filters (returns all)");

    // Create multiple contexts
    const { newContext: ctx1 } = (await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    })) as { newContext: ID };

    const { newContext: ctx2 } = (await concept.create({
      paperId: paper2,
      author: userBob,
      location: highlight2,
    })) as { newContext: ID };

    const { newContext: ctx3 } = (await concept.create({
      paperId: paper1,
      author: userCharlie,
      location: highlight3,
    })) as { newContext: ID };

    // Query with no filters
    const result = await concept._getFilteredContexts({});
    assertEquals(result.length, 1, "Should return one result dictionary");
    const { filteredContexts } = result[0];
    assertEquals(
      filteredContexts.length,
      3,
      "Should return all 3 contexts",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx1),
      true,
      "Should include ctx1",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx2),
      true,
      "Should include ctx2",
    );
    assertEquals(
      filteredContexts.some((c) => c._id === ctx3),
      true,
      "Should include ctx3",
    );

    console.log("  ✓ Returns all contexts when no filters provided");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getFilteredContexts results are ordered by createdAt", async () => {
  const [db, client] = await testDb();
  const concept = new HighlightedContextConcept(db);

  try {
    console.log("Testing _getFilteredContexts - results ordered by createdAt");

    // Create contexts with small delays to ensure different timestamps
    const { newContext: ctx1 } = (await concept.create({
      paperId: paper1,
      author: userAlice,
      location: highlight1,
    })) as { newContext: ID };
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

    const { newContext: ctx2 } = (await concept.create({
      paperId: paper1,
      author: userBob,
      location: highlight2,
    })) as { newContext: ID };
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

    const { newContext: ctx3 } = (await concept.create({
      paperId: paper1,
      author: userCharlie,
      location: highlight3,
    })) as { newContext: ID };

    // Query all contexts
    const result = await concept._getFilteredContexts({});
    const { filteredContexts } = result[0];

    // Verify ordering: createdAt should be ascending
    for (let i = 1; i < filteredContexts.length; i++) {
      assertEquals(
        filteredContexts[i].createdAt >= filteredContexts[i - 1].createdAt,
        true,
        `Context at index ${i} should have createdAt >= previous context`,
      );
    }

    // Verify first context is the one created first
    assertEquals(
      filteredContexts[0]._id,
      ctx1,
      "First result should be the first created context",
    );

    console.log("  ✓ Results are correctly ordered by createdAt (ascending)");
  } finally {
    await client.close();
  }
});

