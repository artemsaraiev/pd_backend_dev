import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import PaperIndexConcept from "./PaperIndexConcept.ts";

const paper1 = "arxiv:1234.5678" as ID;
const paper2 = "doi:10.1234/example" as ID;
const paper3 = "arxiv:9876.5432" as ID;
const author1 = "author:Alice" as ID;
const author2 = "author:Bob" as ID;
const author3 = "author:Charlie" as ID;

/**
 * # trace: Principle fulfillment
 *
 * The principle states: "papers can be added to the index, and paper metadata relevant to
 * us can be updated"
 *
 * Trace:
 * 1. A paper is added to the index using ensure
 * 2. Paper metadata (title, authors, links) can be updated
 * 3. The paper can be retrieved and its metadata reflects the updates
 */
Deno.test("Principle: Papers can be added to index and metadata can be updated", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Trace: Testing principle - add paper -> update metadata");

    // 1. Paper is added to the index
    console.log("  Step 1: Add paper to index");
    const ensureResult = await concept.ensure({
      paperId: paper1,
      title: "Test Paper",
    });
    assertNotEquals(
      "error" in ensureResult,
      true,
      "Paper ensure should succeed",
    );
    const { paper } = ensureResult as { paper: ID };
    assertExists(paper, "Paper ID should be returned");
    // paper is the internal _id, which should be different from paperId
    assertNotEquals(paper, paper1, "Internal _id should be different from external paperId");
    console.log(`    Added paper: ${paper}`);

    // 2. Paper metadata can be updated
    console.log("  Step 2: Update paper metadata");
    const updateTitleResult = await concept.updateMeta({
      paper,
      title: "Updated Title",
    });
    assertNotEquals(
      "error" in updateTitleResult,
      true,
      "Title update should succeed",
    );
    console.log("    Updated title");

    const addAuthorsResult = await concept.addAuthors({
      paper,
      authors: [author1, author2],
    });
    assertNotEquals(
      "error" in addAuthorsResult,
      true,
      "Add authors should succeed",
    );
    console.log("    Added authors");

    const addLinkResult = await concept.addLink({
      paper,
      url: "https://example.com/paper",
    });
    assertNotEquals("error" in addLinkResult, true, "Add link should succeed");
    console.log("    Added link");

    // 3. Verify paper can be retrieved and metadata reflects updates
    console.log("  Step 3: Verify paper metadata");
    const getResult = await concept._get({ paper });
    assertEquals(
      getResult.length,
      1,
      "Query should return array with one dictionary",
    );
    const { paper: paperDoc } = getResult[0];
    assertExists(paperDoc, "Paper should exist");
    assertEquals(paperDoc!._id, paper, "Paper _id should match returned internal ID");
    assertEquals(paperDoc!.paperId, paper1, "Paper paperId should match external identifier");
    assertNotEquals(paperDoc!._id, paperDoc!.paperId, "_id and paperId should be different");
    assertEquals(paperDoc!.title, "Updated Title", "Title should be updated");
    assertEquals(
      paperDoc!.authors.length,
      2,
      "Should have two authors",
    );
    assertEquals(
      paperDoc!.authors.includes(author1),
      true,
      "Should include Alice",
    );
    assertEquals(paperDoc!.authors.includes(author2), true, "Should include Bob");
    assertEquals(paperDoc!.links.length, 1, "Should have one link");
    assertEquals(
      paperDoc!.links.includes("https://example.com/paper"),
      true,
      "Should include the link",
    );
    console.log("    Paper metadata verified");
  } finally {
    await client.close();
  }
});

// Action: ensure
Deno.test("Action: ensure creates paper if not exists, returns existing if exists", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing ensure action - requires/effects");

    // Test: ensure with new paperId should create paper
    console.log("  Creating new paper");
    const result1 = await concept.ensure({
      paperId: paper1,
      title: "First Paper",
    });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { paper: paperId1 } = result1 as { paper: ID };
    // paperId1 is the internal _id, which should be different from paper1 (external paperId)
    assertNotEquals(paperId1, paper1, "Internal _id should be different from external paperId");

    // Verify paper was created
    const getResult1 = await concept._get({ paper: paperId1 });
    assertEquals(getResult1[0].paper?._id, paperId1, "Paper _id should match returned internal ID");
    assertEquals(getResult1[0].paper?.paperId, paper1, "Paper paperId should match external identifier");
    assertEquals(
      getResult1[0].paper?.title,
      "First Paper",
      "Title should be set",
    );
    assertEquals(
      getResult1[0].paper?.authors.length,
      0,
      "Authors should be empty",
    );
    assertEquals(getResult1[0].paper?.links.length, 0, "Links should be empty");
    console.log("    Paper created with correct initial state");

    // Test: ensure with existing paperId should return existing (idempotent)
    console.log("  Ensuring existing paper (idempotent)");
    const result2 = await concept.ensure({
      paperId: paper1,
      title: "Different Title", // Should not update
    });
    assertNotEquals("error" in result2, true, "Should succeed");
    const { paper: paperId2 } = result2 as { paper: ID };
    assertEquals(paperId2, paperId1, "Should return same internal _id for same paperId");

    // Verify paper was not updated (idempotent)
    const getResult2 = await concept._get({ paper: paperId2 });
    assertEquals(
      getResult2[0].paper?.title,
      "First Paper",
      "Title should not change",
    );
    console.log("    Paper not updated (idempotent)");

    // Test: ensure without title
    console.log("  Creating paper without title");
    const result3 = await concept.ensure({ paperId: paper2 });
    assertNotEquals("error" in result3, true, "Should succeed");
    const { paper: paperId3 } = result3 as { paper: ID };
    // paperId3 is the internal _id, which should be different from paper2 (external paperId)
    assertNotEquals(paperId3, paper2, "Internal _id should be different from external paperId");

    const getResult3 = await concept._get({ paper: paperId3 });
    assertEquals(getResult3[0].paper?._id, paperId3, "Paper _id should match returned internal ID");
    assertEquals(getResult3[0].paper?.paperId, paper2, "Paper paperId should match external identifier");
    assertEquals(
      getResult3[0].paper?.title,
      undefined,
      "Title should be undefined",
    );
    console.log("    Paper created without title");
  } finally {
    await client.close();
  }
});

// Action: updateMeta
Deno.test("Action: updateMeta requires paper exists, sets title", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing updateMeta action - requires/effects");

    // Test: updateMeta requires paper exists
    console.log("  Testing requires: paper must exist");
    const errorResult = await concept.updateMeta({
      paper: "nonexistent" as ID,
      title: "New Title",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: updateMeta sets title
    console.log("  Testing effects: sets title");
    const ensureResult = await concept.ensure({ paperId: paper1, title: "Original Title" });
    const { paper: internalId } = ensureResult as { paper: ID };
    const updateResult = await concept.updateMeta({
      paper: internalId,
      title: "Updated Title",
    });
    assertNotEquals("error" in updateResult, true, "Should succeed");

    const getResult = await concept._get({ paper: internalId });
    assertEquals(
      getResult[0].paper?.title,
      "Updated Title",
      "Title should be updated",
    );
    console.log("    Title updated correctly");
  } finally {
    await client.close();
  }
});

// Action: addAuthors
Deno.test("Action: addAuthors requires paper exists, adds unique authors", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing addAuthors action - requires/effects");

    // Test: addAuthors requires paper exists
    console.log("  Testing requires: paper must exist");
    const errorResult = await concept.addAuthors({
      paper: "nonexistent" as ID,
      authors: [author1],
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: addAuthors adds unique authors (set semantics)
    console.log("  Testing effects: adds unique authors");
    const ensureResult = await concept.ensure({ paperId: paper1 });
    const { paper: internalId } = ensureResult as { paper: ID };
    await concept.addAuthors({ paper: internalId, authors: [author1, author2] });
    await concept.addAuthors({ paper: internalId, authors: [author2, author3] }); // author2 already exists

    const getResult = await concept._get({ paper: internalId });
    const authors = getResult[0].paper?.authors ?? [];
    assertEquals(authors.length, 3, "Should have three unique authors");
    assertEquals(authors.includes(author1), true, "Should include Alice");
    assertEquals(authors.includes(author2), true, "Should include Bob");
    assertEquals(authors.includes(author3), true, "Should include Charlie");
    // Verify Bob appears only once
    const bobCount = authors.filter((a) => a === author2).length;
    assertEquals(bobCount, 1, "Bob should appear only once");
    console.log("    Authors added with set semantics (no duplicates)");
  } finally {
    await client.close();
  }
});

// Action: removeAuthors
Deno.test("Action: removeAuthors requires paper exists, removes authors if present", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing removeAuthors action - requires/effects");

    // Test: removeAuthors requires paper exists
    console.log("  Testing requires: paper must exist");
    const errorResult = await concept.removeAuthors({
      paper: "nonexistent" as ID,
      authors: [author1],
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: removeAuthors removes authors if present
    console.log("  Testing effects: removes authors if present");
    const ensureResult = await concept.ensure({ paperId: paper1 });
    const { paper: internalId } = ensureResult as { paper: ID };
    await concept.addAuthors({ paper: internalId, authors: [author1, author2, author3] });
    await concept.removeAuthors({ paper: internalId, authors: [author2, "nonexistent" as ID] }); // nonexistent doesn't exist

    const getResult = await concept._get({ paper: internalId });
    const authors = getResult[0].paper?.authors ?? [];
    assertEquals(authors.length, 2, "Should have two authors remaining");
    assertEquals(authors.includes(author1), true, "Should include Alice");
    assertEquals(authors.includes(author3), true, "Should include Charlie");
    assertEquals(authors.includes(author2), false, "Should not include Bob");
    console.log("    Authors removed correctly (no-op for non-existent)");
  } finally {
    await client.close();
  }
});

// Action: addLink
Deno.test("Action: addLink requires paper exists, adds url if not present", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing addLink action - requires/effects");

    // Test: addLink requires paper exists
    console.log("  Testing requires: paper must exist");
    const errorResult = await concept.addLink({
      paper: "nonexistent" as ID,
      url: "https://example.com",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: addLink adds url if not present (set semantics)
    console.log("  Testing effects: adds url if not present");
    const ensureResult = await concept.ensure({ paperId: paper1 });
    const { paper: internalId } = ensureResult as { paper: ID };
    await concept.addLink({ paper: internalId, url: "https://example.com/1" });
    await concept.addLink({ paper: internalId, url: "https://example.com/2" });
    await concept.addLink({ paper: internalId, url: "https://example.com/1" }); // Duplicate

    const getResult = await concept._get({ paper: internalId });
    const links = getResult[0].paper?.links ?? [];
    assertEquals(links.length, 2, "Should have two unique links");
    assertEquals(
      links.includes("https://example.com/1"),
      true,
      "Should include first link",
    );
    assertEquals(
      links.includes("https://example.com/2"),
      true,
      "Should include second link",
    );
    console.log("    Links added with set semantics (no duplicates)");
  } finally {
    await client.close();
  }
});

// Action: removeLink
Deno.test("Action: removeLink requires paper exists, removes url if present", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing removeLink action - requires/effects");

    // Test: removeLink requires paper exists
    console.log("  Testing requires: paper must exist");
    const errorResult = await concept.removeLink({
      paper: "nonexistent" as ID,
      url: "https://example.com",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: removeLink removes url if present (no-op if not present)
    console.log("  Testing effects: removes url if present");
    const ensureResult = await concept.ensure({ paperId: paper1 });
    const { paper: internalId } = ensureResult as { paper: ID };
    await concept.addLink({ paper: internalId, url: "https://example.com/1" });
    await concept.addLink({ paper: internalId, url: "https://example.com/2" });
    await concept.removeLink({ paper: internalId, url: "https://example.com/1" });
    await concept.removeLink({ paper: internalId, url: "https://example.com/nonexistent" }); // No-op

    const getResult = await concept._get({ paper: internalId });
    const links = getResult[0].paper?.links ?? [];
    assertEquals(links.length, 1, "Should have one link remaining");
    assertEquals(
      links.includes("https://example.com/2"),
      true,
      "Should include remaining link",
    );
    assertEquals(
      links.includes("https://example.com/1"),
      false,
      "Should not include removed link",
    );
    console.log("    Link removed correctly (no-op for non-existent)");
  } finally {
    await client.close();
  }
});

// Query: _get
Deno.test("Query: _get returns paper document or null", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing _get query");

    // Test: returns null for nonexistent paper
    console.log("  Testing nonexistent paper");
    const result1 = await concept._get({ paper: "nonexistent" as ID });
    assertEquals(
      result1.length,
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(result1[0].paper, null, "Should return null for nonexistent paper");
    console.log("    Correctly returns null for nonexistent paper");

    // Test: returns paper document for existing paper
    console.log("  Testing existing paper");
    const ensureResult = await concept.ensure({ paperId: paper1, title: "Test Paper" });
    const { paper: internalId } = ensureResult as { paper: ID };
    await concept.addAuthors({ paper: internalId, authors: [author1] });
    await concept.addLink({ paper: internalId, url: "https://example.com" });

    const result2 = await concept._get({ paper: internalId });
    assertEquals(
      result2.length,
      1,
      "Query should return array with one dictionary",
    );
    const { paper: paperDoc } = result2[0];
    assertExists(paperDoc, "Paper should exist");
    assertEquals(paperDoc!._id, internalId, "Paper _id should match internal ID");
    assertEquals(paperDoc!.paperId, paper1, "Paper paperId should match external identifier");
    assertEquals(paperDoc!.title, "Test Paper", "Title should match");
    assertEquals(paperDoc!.authors.length, 1, "Should have one author");
    assertEquals(paperDoc!.authors[0], author1, "Author should match");
    assertEquals(paperDoc!.links.length, 1, "Should have one link");
    assertEquals(paperDoc!.links[0], "https://example.com", "Link should match");
    console.log("    Correctly returns paper document");
  } finally {
    await client.close();
  }
});

// Query: _listRecent
Deno.test("Query: _listRecent returns recent papers ordered by createdAt", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing _listRecent query - ordering");

    // Create papers with delays to ensure different createdAt
    const ensure1 = await concept.ensure({ paperId: paper1, title: "First Paper" });
    const { paper: internalId1 } = ensure1 as { paper: ID };
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    const ensure2 = await concept.ensure({ paperId: paper2, title: "Second Paper" });
    const { paper: internalId2 } = ensure2 as { paper: ID };
    await new Promise((resolve) => setTimeout(resolve, 10));
    const ensure3 = await concept.ensure({ paperId: paper3, title: "Third Paper" });
    const { paper: internalId3 } = ensure3 as { paper: ID };

    const result = await concept._listRecent({ limit: 10 });
    assertEquals(
      result.length,
      3,
      "Query should return array with one dictionary per paper",
    );
    const papers = result.map((r) => r.paper);
    assertEquals(papers.length, 3, "Should return three papers");

    // Verify ordering (most recent first) - check internal _id
    assertEquals(papers[0]._id, internalId3, "First should be most recent");
    assertEquals(papers[1]._id, internalId2, "Second should be middle");
    assertEquals(papers[2]._id, internalId1, "Third should be oldest");
    console.log("    Papers correctly ordered by createdAt (descending)");

    // Verify limit works
    const limitedResult = await concept._listRecent({ limit: 2 });
    assertEquals(
      limitedResult.length,
      2,
      "Should respect limit",
    );
    console.log("    Limit correctly applied");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listRecent returns empty array when no papers exist", async () => {
  const [db, client] = await testDb();
  const concept = new PaperIndexConcept(db);

  try {
    console.log("Testing _listRecent query - empty result");

    const result = await concept._listRecent({ limit: 10 });
    assertEquals(
      result.length,
      0,
      "Query should return empty array when no papers exist",
    );
    console.log("    Correctly returns empty array");
  } finally {
    await client.close();
  }
});
