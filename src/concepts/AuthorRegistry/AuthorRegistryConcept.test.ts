import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import AuthorRegistryConcept from "./AuthorRegistryConcept.ts";

const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID;

/**
 * # trace: Principle fulfillment
 *
 * The principle states: "authors are entities that can have multiple name variations (as they appear in papers). A system user can be linked to an author entity, claiming those works as their own."
 *
 * Trace:
 * 1. Create an author entity
 * 2. Add name variations to the author
 * 3. Link a system user to the author
 * 4. Verify the user is linked to the author and can be resolved
 * 5. Verify name variations resolve to the author
 */
Deno.test("Principle: Authors have variations, users claim authors", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Trace: Testing principle - create author -> add variations -> claim");

    // 1. Create an author entity
    console.log("  Step 1: Create author entity");
    const createResult = await concept.createAuthor({
      canonicalName: "John Doe",
      affiliations: ["MIT"],
    });
    assertNotEquals("error" in createResult, true, "Author creation should succeed");
    const { newAuthor: authorId } = createResult as { newAuthor: string };
    assertExists(authorId, "Author ID should be returned");
    console.log(`    Created author: ${authorId}`);

    // 2. Add name variations to the author
    console.log("  Step 2: Add name variations");
    const addVarResult = await concept.addNameVariation({
      author: authorId,
      name: "J. Doe",
    });
    assertNotEquals("error" in addVarResult, true, "Adding variation should succeed");
    console.log("    Added variation 'J. Doe'");

    // 3. Link a system user to the author
    console.log("  Step 3: Link user to author");
    const claimResult = await concept.claimAuthor({
      user: userAlice,
      author: authorId,
    });
    assertNotEquals("error" in claimResult, true, "Claiming author should succeed");
    console.log("    User Alice claimed author");

    // 4. Verify the user is linked to the author and can be resolved
    console.log("  Step 4: Verify user link");
    const userAuthorResult = await concept._getAuthorByUser({ user: userAlice });
    assertEquals(userAuthorResult.length, 1, "Query should return array");
    assertExists(userAuthorResult[0].author, "Author should be found for user");
    assertEquals(
      userAuthorResult[0].author!._id.toString(),
      authorId,
      "User should be linked to correct author",
    );
    console.log("    User link verified");

    // 5. Verify name variations resolve to the author
    console.log("  Step 5: Verify name resolution");
    const resolveCanonical = await concept._resolveAuthor({ exactName: "John Doe" });
    assertEquals(
      resolveCanonical[0].author?._id.toString(),
      authorId,
      "Canonical name should resolve",
    );
    const resolveVariation = await concept._resolveAuthor({ exactName: "J. Doe" });
    assertEquals(
      resolveVariation[0].author?._id.toString(),
      authorId,
      "Variation should resolve",
    );
    console.log("    Name resolution verified");
  } finally {
    await client.close();
  }
});

// Action: createAuthor
Deno.test("Action: createAuthor creates author and canonical variation", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing createAuthor action");

    const result = await concept.createAuthor({
      canonicalName: "Jane Smith",
      affiliations: ["Stanford"],
    });
    assertNotEquals("error" in result, true, "Should succeed");
    const { newAuthor } = result as { newAuthor: string };

    const getResult = await concept._getAuthor({ author: newAuthor });
    const author = getResult[0].author;
    assertExists(author, "Author should exist");
    assertEquals(author!.canonicalName, "Jane Smith", "Canonical name matches");
    assertEquals(author!.affiliations, ["Stanford"], "Affiliations match");

    // Check canonical variation exists
    const resolve = await concept._resolveAuthor({ exactName: "Jane Smith" });
    assertEquals(resolve[0].author?._id.toString(), newAuthor, "Canonical variation exists");
    console.log("    Author and canonical variation created");
  } finally {
    await client.close();
  }
});

// Action: addNameVariation
Deno.test("Action: addNameVariation requires author exists and unique name", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing addNameVariation action");

    const { newAuthor } = (await concept.createAuthor({
      canonicalName: "Author One",
      affiliations: [],
    })) as { newAuthor: string };

    // Test: requires author exists
    const error1 = await concept.addNameVariation({
      author: "nonexistent",
      name: "A. One",
    });
    assertEquals("error" in error1, true, "Should fail for nonexistent author");

    // Test: requires name not already used
    await concept.addNameVariation({ author: newAuthor, name: "A. One" });
    const error2 = await concept.addNameVariation({
      author: newAuthor,
      name: "A. One",
    });
    assertEquals("error" in error2, true, "Should fail for duplicate variation");

    // Verify effect
    const resolve = await concept._resolveAuthor({ exactName: "A. One" });
    assertEquals(resolve[0].author?._id.toString(), newAuthor, "Variation added");
    console.log("    Requirements checked and effect verified");
  } finally {
    await client.close();
  }
});

// Action: removeNameVariation
Deno.test("Action: removeNameVariation requires author, existing variation, not canonical", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing removeNameVariation action");

    const { newAuthor } = (await concept.createAuthor({
      canonicalName: "Canonical Name",
      affiliations: [],
    })) as { newAuthor: string };
    await concept.addNameVariation({ author: newAuthor, name: "Variation" });

    // Test: requires author exists
    const error1 = await concept.removeNameVariation({
      author: "nonexistent",
      name: "Variation",
    });
    assertEquals("error" in error1, true, "Should fail for nonexistent author");

    // Test: requires variation exists
    const error2 = await concept.removeNameVariation({
      author: newAuthor,
      name: "Nonexistent Variation",
    });
    assertEquals("error" in error2, true, "Should fail for nonexistent variation");

    // Test: requires not canonical
    const error3 = await concept.removeNameVariation({
      author: newAuthor,
      name: "Canonical Name",
    });
    assertEquals("error" in error3, true, "Should fail for canonical name");

    // Test: success
    const result = await concept.removeNameVariation({
      author: newAuthor,
      name: "Variation",
    });
    assertNotEquals("error" in result, true, "Should succeed");

    const resolve = await concept._resolveAuthor({ exactName: "Variation" });
    assertEquals(resolve[0].author, null, "Variation removed");
    console.log("    Requirements checked and effect verified");
  } finally {
    await client.close();
  }
});

// Action: updateAuthorProfile
Deno.test("Action: updateAuthorProfile updates fields if provided", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing updateAuthorProfile action");

    const { newAuthor } = (await concept.createAuthor({
      canonicalName: "Author",
      affiliations: ["Old Affiliation"],
    })) as { newAuthor: string };

    // Update website
    await concept.updateAuthorProfile({
      author: newAuthor,
      website: "example.com",
    });
    let author = (await concept._getAuthor({ author: newAuthor }))[0].author!;
    assertEquals(author.website, "example.com", "Website updated");
    assertEquals(author.affiliations, ["Old Affiliation"], "Affiliations unchanged");

    // Update affiliations
    await concept.updateAuthorProfile({
      author: newAuthor,
      affiliations: ["New Affiliation"],
    });
    author = (await concept._getAuthor({ author: newAuthor }))[0].author!;
    assertEquals(author.affiliations, ["New Affiliation"], "Affiliations updated");
    assertEquals(author.website, "example.com", "Website unchanged");

    console.log("    Updates applied correctly");
  } finally {
    await client.close();
  }
});

// Action: claimAuthor
Deno.test("Action: claimAuthor requires user/author exist, no existing link", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing claimAuthor action");

    const { newAuthor } = (await concept.createAuthor({
      canonicalName: "Author",
      affiliations: [],
    })) as { newAuthor: string };

    // Test: requires author exists
    const error1 = await concept.claimAuthor({
      user: userAlice,
      author: "nonexistent",
    });
    assertEquals("error" in error1, true, "Should fail for nonexistent author");

    // Test: success
    const result = await concept.claimAuthor({ user: userAlice, author: newAuthor });
    assertNotEquals("error" in result, true, "Should succeed");

    // Test: requires no existing link
    const error2 = await concept.claimAuthor({ user: userAlice, author: newAuthor });
    assertEquals("error" in error2, true, "Should fail for duplicate claim");

    // Verify effect
    const linked = await concept._getAuthorByUser({ user: userAlice });
    assertEquals(linked[0].author?._id.toString(), newAuthor, "Link created");
    console.log("    Requirements checked and effect verified");
  } finally {
    await client.close();
  }
});

// Action: unclaimAuthor
Deno.test("Action: unclaimAuthor requires link exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing unclaimAuthor action");

    const { newAuthor } = (await concept.createAuthor({
      canonicalName: "Author",
      affiliations: [],
    })) as { newAuthor: string };
    await concept.claimAuthor({ user: userAlice, author: newAuthor });

    // Test: requires link exists
    const error1 = await concept.unclaimAuthor({
      user: userBob,
      author: newAuthor,
    });
    assertEquals("error" in error1, true, "Should fail if no link");

    // Test: success
    const result = await concept.unclaimAuthor({
      user: userAlice,
      author: newAuthor,
    });
    assertNotEquals("error" in result, true, "Should succeed");

    // Verify effect
    const linked = await concept._getAuthorByUser({ user: userAlice });
    assertEquals(linked[0].author, null, "Link removed");
    console.log("    Requirements checked and effect verified");
  } finally {
    await client.close();
  }
});

// Action: mergeAuthors
Deno.test("Action: mergeAuthors moves variations and links, deletes secondary", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing mergeAuthors action");

    const resA = await concept.createAuthor({
      canonicalName: "Primary",
      affiliations: [],
    });
    const idA = (resA as { newAuthor: string }).newAuthor;
    const resB = await concept.createAuthor({
      canonicalName: "Secondary",
      affiliations: [],
    });
    const idB = (resB as { newAuthor: string }).newAuthor;

    await concept.addNameVariation({ author: idB, name: "Sec Var" });
    await concept.claimAuthor({ user: userBob, author: idB });

    // Test: requires different authors
    const error1 = await concept.mergeAuthors({ primary: idA, secondary: idA });
    assertEquals("error" in error1, true, "Should fail for self-merge");

    // Test: success
    const result = await concept.mergeAuthors({ primary: idA, secondary: idB });
    assertNotEquals("error" in result, true, "Should succeed");

    // Verify variations moved
    const resolveSec = await concept._resolveAuthor({ exactName: "Secondary" });
    assertEquals(
      resolveSec[0].author?._id.toString(),
      idA,
      "Secondary name moved to Primary",
    );
    const resolveVar = await concept._resolveAuthor({ exactName: "Sec Var" });
    assertEquals(
      resolveVar[0].author?._id.toString(),
      idA,
      "Secondary variation moved to Primary",
    );

    // Verify user link moved
    const userAuthor = await concept._getAuthorByUser({ user: userBob });
    assertEquals(
      userAuthor[0].author?._id.toString(),
      idA,
      "User link moved to Primary",
    );

    // Verify secondary deleted
    const getB = await concept._getAuthor({ author: idB });
    assertEquals(getB[0].author, null, "Secondary author deleted");

    console.log("    Merge logic verified");
  } finally {
    await client.close();
  }
});

// Query: _findAuthorsByName
Deno.test("Query: _findAuthorsByName matches canonical and variations", async () => {
  const [db, client] = await testDb();
  const concept = new AuthorRegistryConcept(db);

  try {
    console.log("Testing _findAuthorsByName query");

    const { newAuthor } = (await concept.createAuthor({
      canonicalName: "Jonathan Smith",
      affiliations: [],
    })) as { newAuthor: string };
    await concept.addNameVariation({ author: newAuthor, name: "Jonny S" });

    // Partial match on canonical
    const res1 = await concept._findAuthorsByName({ nameQuery: "Jon" });
    assertEquals(res1[0].matches.some((m) => m.author._id.toString() === newAuthor), true);

    // Partial match on variation
    const res2 = await concept._findAuthorsByName({ nameQuery: "nny" });
    assertEquals(res2[0].matches.some((m) => m.author._id.toString() === newAuthor), true);

    console.log("    Search finds matches correctly");
  } finally {
    await client.close();
  }
});
