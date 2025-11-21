import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import IdentityVerificationConcept from "./IdentityVerificationConcept.ts";

const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const orcid1 = "0000-0000-0000-0001";
const orcid2 = "0000-0000-0000-0002";
const affiliation1 = "MIT";
const affiliation2 = "Harvard";
const badge1 = "verified";
const badge2 = "expert";

/**
 * # trace: Principle fulfillment
 *
 * The principle states: "user can add ORCID, institution affiliation, and badges to their
 * account, and these can be used to verify the user's identity"
 *
 * Trace:
 * 1. User adds ORCID to their account
 * 2. User adds institution affiliation to their account
 * 3. User adds badges to their account
 * 4. All verification signals can be retrieved and used to verify identity
 */
Deno.test("Principle: User can add ORCID, affiliation, and badges to verify identity", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Trace: Testing principle - add ORCID, affiliation, badges");

    // 1. User adds ORCID
    console.log("  Step 1: Add ORCID");
    const orcidResult = await concept.addORCID({
      user: userAlice,
      orcid: orcid1,
    });
    assertNotEquals("error" in orcidResult, true, "ORCID addition should succeed");
    const { newORCID } = orcidResult as { newORCID: string };
    assertExists(newORCID, "ORCID ID should be returned");
    console.log(`    Added ORCID: ${newORCID}`);

    // 2. User adds institution affiliation
    console.log("  Step 2: Add affiliation");
    const affiliationResult = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    assertNotEquals(
      "error" in affiliationResult,
      true,
      "Affiliation addition should succeed",
    );
    const { newAffiliation } = affiliationResult as { newAffiliation: string };
    assertExists(newAffiliation, "Affiliation ID should be returned");
    console.log(`    Added affiliation: ${newAffiliation}`);

    // 3. User adds badges
    console.log("  Step 3: Add badges");
    const badgeResult1 = await concept.addBadge({
      user: userAlice,
      badge: badge1,
    });
    assertNotEquals(
      "error" in badgeResult1,
      true,
      "Badge addition should succeed",
    );
    const { newBadge: newBadge1 } = badgeResult1 as { newBadge: string };
    assertExists(newBadge1, "Badge ID should be returned");
    console.log(`    Added badge: ${newBadge1}`);

    // 4. Verify all can be retrieved
    console.log("  Step 4: Verify all verification signals can be retrieved");
    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(
      getResult.length,
      1,
      "Query should return array with one dictionary",
    );
    const { orcids, affiliations, badges } = getResult[0];
    assertEquals(orcids.length, 1, "Should have one ORCID");
    assertEquals(orcids[0].orcid, orcid1, "ORCID should match");
    assertEquals(affiliations.length, 1, "Should have one affiliation");
    assertEquals(affiliations[0].affiliation, affiliation1, "Affiliation should match");
    assertEquals(badges.length, 1, "Should have one badge");
    assertEquals(badges[0].badge, badge1, "Badge should match");
    console.log("    All verification signals verified");
  } finally {
    await client.close();
  }
});

// Action: addORCID
Deno.test("Action: addORCID requires no existing ORCID, returns new ORCID", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing addORCID action - requires/effects");

    // Test: addORCID requires no existing ORCID for user
    console.log("  Testing requires: no existing ORCID for user");
    const result1 = await concept.addORCID({
      user: userAlice,
      orcid: orcid1,
    });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newORCID: orcidId1 } = result1 as { newORCID: string };
    assertExists(orcidId1, "Should return ORCID ID");

    // Try to add another ORCID for same user (should fail)
    const errorResult = await concept.addORCID({
      user: userAlice,
      orcid: orcid2,
    });
    assertEquals("error" in errorResult, true, "Should fail - ORCID already exists");
    console.log("    Correctly rejects duplicate ORCID for user");

    // Test: addORCID returns new ORCID ID
    console.log("  Testing effects: returns new ORCID ID");
    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].orcids.length, 1, "Should have one ORCID");
    assertEquals(getResult[0].orcids[0]._id, orcidId1, "ORCID ID should match");
    assertEquals(getResult[0].orcids[0].orcid, orcid1, "ORCID value should match");
    console.log("    ORCID added and returned correctly");
  } finally {
    await client.close();
  }
});

// Action: removeORCID
Deno.test("Action: removeORCID requires ORCID exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing removeORCID action - requires/effects");

    // Test: removeORCID requires ORCID exists
    console.log("  Testing requires: ORCID must exist");
    const errorResult = await concept.removeORCID({ orcid: "nonexistent" });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent ORCID");
    console.log("    Correctly rejects nonexistent ORCID");

    // Test: removeORCID removes ORCID
    console.log("  Testing effects: removes ORCID");
    const addResult = await concept.addORCID({
      user: userAlice,
      orcid: orcid1,
    });
    const { newORCID: orcidId } = addResult as { newORCID: string };

    const removeResult = await concept.removeORCID({ orcid: orcidId });
    assertNotEquals("error" in removeResult, true, "Should succeed");

    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].orcids.length, 0, "ORCID should be removed");
    console.log("    ORCID removed correctly");
  } finally {
    await client.close();
  }
});

// Action: addAffiliation
Deno.test("Action: addAffiliation requires no duplicate, returns new Affiliation", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing addAffiliation action - requires/effects");

    // Test: addAffiliation requires no duplicate (user, affiliation) pair
    console.log("  Testing requires: no duplicate affiliation for user");
    const result1 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newAffiliation: affId1 } = result1 as { newAffiliation: string };
    assertExists(affId1, "Should return Affiliation ID");

    // Try to add same affiliation for same user (should fail)
    const errorResult = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    assertEquals("error" in errorResult, true, "Should fail - duplicate affiliation");
    console.log("    Correctly rejects duplicate affiliation");

    // Test: can add different affiliation for same user
    const result2 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation2,
    });
    assertNotEquals("error" in result2, true, "Should succeed for different affiliation");
    console.log("    Allows different affiliations for same user");

    // Test: addAffiliation returns new Affiliation ID
    console.log("  Testing effects: returns new Affiliation ID");
    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].affiliations.length, 2, "Should have two affiliations");
    const affIds = getResult[0].affiliations.map((a) => a._id);
    assertEquals(affIds.includes(affId1), true, "Should include first affiliation");
    console.log("    Affiliations added and returned correctly");
  } finally {
    await client.close();
  }
});

// Action: removeAffiliation
Deno.test("Action: removeAffiliation requires Affiliation exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing removeAffiliation action - requires/effects");

    // Test: removeAffiliation requires Affiliation exists
    console.log("  Testing requires: Affiliation must exist");
    const errorResult = await concept.removeAffiliation({ affiliation: "nonexistent" });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent Affiliation");
    console.log("    Correctly rejects nonexistent Affiliation");

    // Test: removeAffiliation removes Affiliation
    console.log("  Testing effects: removes Affiliation");
    const addResult = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    const { newAffiliation: affId } = addResult as { newAffiliation: string };

    const removeResult = await concept.removeAffiliation({ affiliation: affId });
    assertNotEquals("error" in removeResult, true, "Should succeed");

    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].affiliations.length, 0, "Affiliation should be removed");
    console.log("    Affiliation removed correctly");
  } finally {
    await client.close();
  }
});

// Action: updateAffiliation
Deno.test("Action: updateAffiliation requires Affiliation exists and no duplicate, updates it", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing updateAffiliation action - requires/effects");

    // Test: updateAffiliation requires Affiliation exists
    console.log("  Testing requires: Affiliation must exist");
    const errorResult = await concept.updateAffiliation({
      affiliation: "nonexistent",
      newAffiliation: affiliation1,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent Affiliation");
    console.log("    Correctly rejects nonexistent Affiliation");

    // Test: updateAffiliation requires no duplicate (user, newAffiliation) pair
    console.log("  Testing requires: no duplicate affiliation for user");
    const addResult1 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    const { newAffiliation: affId1 } = addResult1 as { newAffiliation: string };

    const addResult2 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation2,
    });
    const { newAffiliation: affId2 } = addResult2 as { newAffiliation: string };

    // Try to update affId1 to affiliation2 (should fail - duplicate)
    const duplicateError = await concept.updateAffiliation({
      affiliation: affId1,
      newAffiliation: affiliation2,
    });
    assertEquals("error" in duplicateError, true, "Should fail - duplicate affiliation");
    console.log("    Correctly rejects duplicate affiliation");

    // Test: updateAffiliation updates the affiliation string
    console.log("  Testing effects: updates affiliation string");
    const updateResult = await concept.updateAffiliation({
      affiliation: affId1,
      newAffiliation: "Stanford",
    });
    assertNotEquals("error" in updateResult, true, "Should succeed");

    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].affiliations.length, 2, "Should still have two affiliations");
    const updatedAff = getResult[0].affiliations.find((a) => a._id === affId1);
    assertExists(updatedAff, "Updated affiliation should exist");
    assertEquals(updatedAff.affiliation, "Stanford", "Affiliation should be updated");
    assertEquals(
      getResult[0].affiliations.find((a) => a._id === affId2)?.affiliation,
      affiliation2,
      "Other affiliation should be unchanged",
    );
    console.log("    Affiliation updated correctly");
  } finally {
    await client.close();
  }
});

// Action: addBadge
Deno.test("Action: addBadge requires no duplicate, returns new Badge", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing addBadge action - requires/effects");

    // Test: addBadge requires no duplicate (user, badge) pair
    console.log("  Testing requires: no duplicate badge for user");
    const result1 = await concept.addBadge({
      user: userAlice,
      badge: badge1,
    });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newBadge: badgeId1 } = result1 as { newBadge: string };
    assertExists(badgeId1, "Should return Badge ID");

    // Try to add same badge for same user (should fail)
    const errorResult = await concept.addBadge({
      user: userAlice,
      badge: badge1,
    });
    assertEquals("error" in errorResult, true, "Should fail - duplicate badge");
    console.log("    Correctly rejects duplicate badge");

    // Test: can add different badge for same user
    const result2 = await concept.addBadge({
      user: userAlice,
      badge: badge2,
    });
    assertNotEquals("error" in result2, true, "Should succeed for different badge");
    console.log("    Allows different badges for same user");

    // Test: addBadge returns new Badge ID
    console.log("  Testing effects: returns new Badge ID");
    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].badges.length, 2, "Should have two badges");
    const badgeIds = getResult[0].badges.map((b) => b._id);
    assertEquals(badgeIds.includes(badgeId1), true, "Should include first badge");
    console.log("    Badges added and returned correctly");
  } finally {
    await client.close();
  }
});

// Action: revokeBadge
Deno.test("Action: revokeBadge requires Badge exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing revokeBadge action - requires/effects");

    // Test: revokeBadge requires Badge exists
    console.log("  Testing requires: Badge must exist");
    const errorResult = await concept.revokeBadge({ badge: "nonexistent" });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent Badge");
    console.log("    Correctly rejects nonexistent Badge");

    // Test: revokeBadge removes Badge
    console.log("  Testing effects: removes Badge");
    const addResult = await concept.addBadge({
      user: userAlice,
      badge: badge1,
    });
    const { newBadge: badgeId } = addResult as { newBadge: string };

    const revokeResult = await concept.revokeBadge({ badge: badgeId });
    assertNotEquals("error" in revokeResult, true, "Should succeed");

    const getResult = await concept._getByUser({ user: userAlice });
    assertEquals(getResult[0].badges.length, 0, "Badge should be removed");
    console.log("    Badge removed correctly");
  } finally {
    await client.close();
  }
});

// Query: _getByUser
Deno.test("Query: _getByUser returns all verification signals for user", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing _getByUser query");

    // Test: returns empty arrays for user with no verification signals
    console.log("  Testing user with no verification signals");
    const result1 = await concept._getByUser({ user: userAlice });
    assertEquals(
      result1.length,
      1,
      "Query should return array with one dictionary",
    );
    assertEquals(result1[0].orcids.length, 0, "Should return empty ORCIDs");
    assertEquals(result1[0].affiliations.length, 0, "Should return empty affiliations");
    assertEquals(result1[0].badges.length, 0, "Should return empty badges");
    console.log("    Correctly returns empty arrays");

    // Test: returns all verification signals for user
    console.log("  Testing user with verification signals");
    const orcidResult = await concept.addORCID({ user: userAlice, orcid: orcid1 });
    const { newORCID: orcidId } = orcidResult as { newORCID: string };

    const affResult1 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    const { newAffiliation: affId1 } = affResult1 as { newAffiliation: string };
    const affResult2 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation2,
    });
    const { newAffiliation: affId2 } = affResult2 as { newAffiliation: string };

    const badgeResult1 = await concept.addBadge({ user: userAlice, badge: badge1 });
    const { newBadge: badgeId1 } = badgeResult1 as { newBadge: string };
    const badgeResult2 = await concept.addBadge({ user: userAlice, badge: badge2 });
    const { newBadge: badgeId2 } = badgeResult2 as { newBadge: string };

    const result2 = await concept._getByUser({ user: userAlice });
    assertEquals(
      result2.length,
      1,
      "Query should return array with one dictionary",
    );
    const { orcids, affiliations, badges } = result2[0];

    // Verify ORCIDs
    assertEquals(orcids.length, 1, "Should have one ORCID");
    assertEquals(orcids[0]._id, orcidId, "ORCID ID should match");
    assertEquals(orcids[0].user, userAlice, "User should match");
    assertEquals(orcids[0].orcid, orcid1, "ORCID value should match");

    // Verify Affiliations
    assertEquals(affiliations.length, 2, "Should have two affiliations");
    const affIds = affiliations.map((a) => a._id);
    assertEquals(affIds.includes(affId1), true, "Should include first affiliation");
    assertEquals(affIds.includes(affId2), true, "Should include second affiliation");

    // Verify Badges
    assertEquals(badges.length, 2, "Should have two badges");
    const badgeIds = badges.map((b) => b._id);
    assertEquals(badgeIds.includes(badgeId1), true, "Should include first badge");
    assertEquals(badgeIds.includes(badgeId2), true, "Should include second badge");
    console.log("    Correctly returns all verification signals");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getByUser returns separate results for different users", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing _getByUser query - user isolation");

    await concept.addORCID({ user: userAlice, orcid: orcid1 });
    await concept.addBadge({ user: userAlice, badge: badge1 });

    await concept.addORCID({ user: userBob, orcid: orcid2 });
    await concept.addBadge({ user: userBob, badge: badge2 });

    const aliceResult = await concept._getByUser({ user: userAlice });
    const bobResult = await concept._getByUser({ user: userBob });

    assertEquals(aliceResult[0].orcids.length, 1, "Alice should have one ORCID");
    assertEquals(aliceResult[0].orcids[0].orcid, orcid1, "Alice's ORCID should match");
    assertEquals(aliceResult[0].badges.length, 1, "Alice should have one badge");
    assertEquals(aliceResult[0].badges[0].badge, badge1, "Alice's badge should match");

    assertEquals(bobResult[0].orcids.length, 1, "Bob should have one ORCID");
    assertEquals(bobResult[0].orcids[0].orcid, orcid2, "Bob's ORCID should match");
    assertEquals(bobResult[0].badges.length, 1, "Bob should have one badge");
    assertEquals(bobResult[0].badges[0].badge, badge2, "Bob's badge should match");
    console.log("    Users correctly isolated");
  } finally {
    await client.close();
  }
});

