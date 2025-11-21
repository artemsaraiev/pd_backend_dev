import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import PaperIndexConcept from "./PaperIndexConcept.ts";

const paper1 = "arxiv:1234.5678";
const paper2 = "doi:10.1234/example";
const paper3 = "arxiv:9876.5432";

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
    const { paper } = ensureResult as { paper: string };
    assertExists(paper, "Paper ID should be returned");
    assertEquals(paper, paper1, "Paper ID should match");
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
      authors: ["Alice", "Bob"],
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
    assertEquals(paperDoc!._id, paper1, "Paper ID should match");
    assertEquals(paperDoc!.title, "Updated Title", "Title should be updated");
    assertEquals(
      paperDoc!.authors.length,
      2,
      "Should have two authors",
    );
    assertEquals(
      paperDoc!.authors.includes("Alice"),
      true,
      "Should include Alice",
    );
    assertEquals(paperDoc!.authors.includes("Bob"), true, "Should include Bob");
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
    const { paper: paperId1 } = result1 as { paper: string };
    assertEquals(paperId1, paper1, "Should return the paperId");

    // Verify paper was created
    const getResult1 = await concept._get({ paper: paperId1 });
    assertEquals(getResult1[0].paper?._id, paper1, "Paper should exist");
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
    const { paper: paperId2 } = result2 as { paper: string };
    assertEquals(paperId2, paper1, "Should return same paperId");

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
    const { paper: paperId3 } = result3 as { paper: string };
    assertEquals(paperId3, paper2, "Should return the paperId");

    const getResult3 = await concept._get({ paper: paperId3 });
    assertEquals(getResult3[0].paper?._id, paper2, "Paper should exist");
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
      paper: "nonexistent",
      title: "New Title",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: updateMeta sets title
    console.log("  Testing effects: sets title");
    await concept.ensure({ paperId: paper1, title: "Original Title" });
    const updateResult = await concept.updateMeta({
      paper: paper1,
      title: "Updated Title",
    });
    assertNotEquals("error" in updateResult, true, "Should succeed");

    const getResult = await concept._get({ paper: paper1 });
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
      paper: "nonexistent",
      authors: ["Alice"],
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: addAuthors adds unique authors (set semantics)
    console.log("  Testing effects: adds unique authors");
    await concept.ensure({ paperId: paper1 });
    await concept.addAuthors({ paper: paper1, authors: ["Alice", "Bob"] });
    await concept.addAuthors({ paper: paper1, authors: ["Bob", "Charlie"] }); // Bob already exists

    const getResult = await concept._get({ paper: paper1 });
    const authors = getResult[0].paper?.authors ?? [];
    assertEquals(authors.length, 3, "Should have three unique authors");
    assertEquals(authors.includes("Alice"), true, "Should include Alice");
    assertEquals(authors.includes("Bob"), true, "Should include Bob");
    assertEquals(authors.includes("Charlie"), true, "Should include Charlie");
    // Verify Bob appears only once
    const bobCount = authors.filter((a) => a === "Bob").length;
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
      paper: "nonexistent",
      authors: ["Alice"],
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: removeAuthors removes authors if present
    console.log("  Testing effects: removes authors if present");
    await concept.ensure({ paperId: paper1 });
    await concept.addAuthors({ paper: paper1, authors: ["Alice", "Bob", "Charlie"] });
    await concept.removeAuthors({ paper: paper1, authors: ["Bob", "David"] }); // David doesn't exist

    const getResult = await concept._get({ paper: paper1 });
    const authors = getResult[0].paper?.authors ?? [];
    assertEquals(authors.length, 2, "Should have two authors remaining");
    assertEquals(authors.includes("Alice"), true, "Should include Alice");
    assertEquals(authors.includes("Charlie"), true, "Should include Charlie");
    assertEquals(authors.includes("Bob"), false, "Should not include Bob");
    assertEquals(authors.includes("David"), false, "Should not include David");
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
      paper: "nonexistent",
      url: "https://example.com",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: addLink adds url if not present (set semantics)
    console.log("  Testing effects: adds url if not present");
    await concept.ensure({ paperId: paper1 });
    await concept.addLink({ paper: paper1, url: "https://example.com/1" });
    await concept.addLink({ paper: paper1, url: "https://example.com/2" });
    await concept.addLink({ paper: paper1, url: "https://example.com/1" }); // Duplicate

    const getResult = await concept._get({ paper: paper1 });
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
      paper: "nonexistent",
      url: "https://example.com",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent paper");
    console.log("    Correctly rejects nonexistent paper");

    // Test: removeLink removes url if present (no-op if not present)
    console.log("  Testing effects: removes url if present");
    await concept.ensure({ paperId: paper1 });
    await concept.addLink({ paper: paper1, url: "https://example.com/1" });
    await concept.addLink({ paper: paper1, url: "https://example.com/2" });
    await concept.removeLink({ paper: paper1, url: "https://example.com/1" });
    await concept.removeLink({ paper: paper1, url: "https://example.com/nonexistent" }); // No-op

    const getResult = await concept._get({ paper: paper1 });
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
    const result1 = await concept._get({ paper: "nonexistent" });
    assertEquals(
      result1.length,
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(result1[0].paper, null, "Should return null for nonexistent paper");
    console.log("    Correctly returns null for nonexistent paper");

    // Test: returns paper document for existing paper
    console.log("  Testing existing paper");
    await concept.ensure({ paperId: paper1, title: "Test Paper" });
    await concept.addAuthors({ paper: paper1, authors: ["Alice"] });
    await concept.addLink({ paper: paper1, url: "https://example.com" });

    const result2 = await concept._get({ paper: paper1 });
    assertEquals(
      result2.length,
      1,
      "Query should return array with one dictionary",
    );
    const { paper: paperDoc } = result2[0];
    assertExists(paperDoc, "Paper should exist");
    assertEquals(paperDoc!._id, paper1, "Paper ID should match");
    assertEquals(paperDoc!.title, "Test Paper", "Title should match");
    assertEquals(paperDoc!.authors.length, 1, "Should have one author");
    assertEquals(paperDoc!.authors[0], "Alice", "Author should match");
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
    await concept.ensure({ paperId: paper1, title: "First Paper" });
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    await concept.ensure({ paperId: paper2, title: "Second Paper" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await concept.ensure({ paperId: paper3, title: "Third Paper" });

    const result = await concept._listRecent({ limit: 10 });
    assertEquals(
      result.length,
      1,
      "Query should return array with one dictionary",
    );
    const { papers } = result[0];
    assertEquals(papers.length, 3, "Should return three papers");

    // Verify ordering (most recent first)
    assertEquals(papers[0]._id, paper3, "First should be most recent");
    assertEquals(papers[1]._id, paper2, "Second should be middle");
    assertEquals(papers[2]._id, paper1, "Third should be oldest");
    console.log("    Papers correctly ordered by createdAt (descending)");

    // Verify limit works
    const limitedResult = await concept._listRecent({ limit: 2 });
    assertEquals(
      limitedResult[0].papers.length,
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
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(result[0].papers.length, 0, "Should return empty array");
    console.log("    Correctly returns empty array");
  } finally {
    await client.close();
  }
});

