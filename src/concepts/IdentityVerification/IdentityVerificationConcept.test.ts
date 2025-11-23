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
    const { newORCID } = orcidResult as { newORCID: ID };
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
    const { newAffiliation } = affiliationResult as { newAffiliation: ID };
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
    const { newBadge: newBadge1 } = badgeResult1 as { newBadge: ID };
    assertExists(newBadge1, "Badge ID should be returned");
    console.log(`    Added badge: ${newBadge1}`);

    // 4. Verify all can be retrieved
    console.log("  Step 4: Verify all verification signals can be retrieved");
    const [orcidsResult, affiliationsResult, badgesResult] = await Promise.all([
      concept._getORCIDsByUser({ user: userAlice }),
      concept._getAffiliationsByUser({ user: userAlice }),
      concept._getBadgesByUser({ user: userAlice }),
    ]);
    assertEquals(orcidsResult.length, 1, "Should have one ORCID");
    assertEquals(orcidsResult[0].orcid.orcid, orcid1, "ORCID should match");
    assertEquals(orcidsResult[0].orcid.verified, false, "ORCID should be unverified");
    assertEquals(affiliationsResult.length, 1, "Should have one affiliation");
    assertEquals(affiliationsResult[0].affiliation.affiliation, affiliation1, "Affiliation should match");
    assertEquals(badgesResult.length, 1, "Should have one badge");
    assertEquals(badgesResult[0].badge.badge, badge1, "Badge should match");
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
    const { newORCID: orcidId1 } = result1 as { newORCID: ID };
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
    const orcidsResult = await concept._getORCIDsByUser({ user: userAlice });
    assertEquals(orcidsResult.length, 1, "Should have one ORCID");
    assertEquals(orcidsResult[0].orcid._id, orcidId1, "ORCID ID should match");
    assertEquals(orcidsResult[0].orcid.orcid, orcid1, "ORCID value should match");
    assertEquals(orcidsResult[0].orcid.verified, false, "ORCID should be unverified by default");
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
    const errorResult = await concept.removeORCID({ orcid: "orcid:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent ORCID");
    console.log("    Correctly rejects nonexistent ORCID");

    // Test: removeORCID removes ORCID
    console.log("  Testing effects: removes ORCID");
    const addResult = await concept.addORCID({
      user: userAlice,
      orcid: orcid1,
    });
    const { newORCID: orcidId } = addResult as { newORCID: ID };

    const removeResult = await concept.removeORCID({ orcid: orcidId });
    assertNotEquals("error" in removeResult, true, "Should succeed");

    const orcidsResult = await concept._getORCIDsByUser({ user: userAlice });
    assertEquals(orcidsResult.length, 0, "ORCID should be removed");
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
    const { newAffiliation: affId1 } = result1 as { newAffiliation: ID };
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
    const affiliationsResult = await concept._getAffiliationsByUser({ user: userAlice });
    assertEquals(affiliationsResult.length, 2, "Should have two affiliations");
    const affIds = affiliationsResult.map((a) => a.affiliation._id);
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
    const errorResult = await concept.removeAffiliation({ affiliation: "affiliation:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent Affiliation");
    console.log("    Correctly rejects nonexistent Affiliation");

    // Test: removeAffiliation removes Affiliation
    console.log("  Testing effects: removes Affiliation");
    const addResult = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    const { newAffiliation: affId } = addResult as { newAffiliation: ID };

    const removeResult = await concept.removeAffiliation({ affiliation: affId });
    assertNotEquals("error" in removeResult, true, "Should succeed");

    const affiliationsResult = await concept._getAffiliationsByUser({ user: userAlice });
    assertEquals(affiliationsResult.length, 0, "Affiliation should be removed");
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
      affiliation: "affiliation:nonexistent" as ID,
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
    const { newAffiliation: affId1 } = addResult1 as { newAffiliation: ID };

    const addResult2 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation2,
    });
    const { newAffiliation: affId2 } = addResult2 as { newAffiliation: ID };

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

    const affiliationsResult = await concept._getAffiliationsByUser({ user: userAlice });
    assertEquals(affiliationsResult.length, 2, "Should still have two affiliations");
    const updatedAff = affiliationsResult.find((a) => a.affiliation._id === affId1)?.affiliation;
    assertExists(updatedAff, "Updated affiliation should exist");
    assertEquals(updatedAff.affiliation, "Stanford", "Affiliation should be updated");
    assertEquals(
      affiliationsResult.find((a) => a.affiliation._id === affId2)?.affiliation.affiliation,
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
    const { newBadge: badgeId1 } = result1 as { newBadge: ID };
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
    const badgesResult = await concept._getBadgesByUser({ user: userAlice });
    assertEquals(badgesResult.length, 2, "Should have two badges");
    const badgeIds = badgesResult.map((b) => b.badge._id);
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
    const errorResult = await concept.revokeBadge({ badge: "badge:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent Badge");
    console.log("    Correctly rejects nonexistent Badge");

    // Test: revokeBadge removes Badge
    console.log("  Testing effects: removes Badge");
    const addResult = await concept.addBadge({
      user: userAlice,
      badge: badge1,
    });
    const { newBadge: badgeId } = addResult as { newBadge: ID };

    const revokeResult = await concept.revokeBadge({ badge: badgeId });
    assertNotEquals("error" in revokeResult, true, "Should succeed");

    const badgesResult = await concept._getBadgesByUser({ user: userAlice });
    assertEquals(badgesResult.length, 0, "Badge should be removed");
    console.log("    Badge removed correctly");
  } finally {
    await client.close();
  }
});

// Query: _getORCIDsByUser, _getAffiliationsByUser, _getBadgesByUser
Deno.test("Query: _getORCIDsByUser, _getAffiliationsByUser, _getBadgesByUser return all verification signals for user", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing _getORCIDsByUser, _getAffiliationsByUser, _getBadgesByUser queries");

    // Test: returns empty arrays for user with no verification signals
    console.log("  Testing user with no verification signals");
    const [orcids1, affiliations1, badges1] = await Promise.all([
      concept._getORCIDsByUser({ user: userAlice }),
      concept._getAffiliationsByUser({ user: userAlice }),
      concept._getBadgesByUser({ user: userAlice }),
    ]);
    assertEquals(orcids1.length, 0, "Should return empty ORCIDs");
    assertEquals(affiliations1.length, 0, "Should return empty affiliations");
    assertEquals(badges1.length, 0, "Should return empty badges");
    console.log("    Correctly returns empty arrays");

    // Test: returns all verification signals for user
    console.log("  Testing user with verification signals");
    const orcidResult = await concept.addORCID({ user: userAlice, orcid: orcid1 });
    const { newORCID: orcidId } = orcidResult as { newORCID: ID };

    const affResult1 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation1,
    });
    const { newAffiliation: affId1 } = affResult1 as { newAffiliation: ID };
    const affResult2 = await concept.addAffiliation({
      user: userAlice,
      affiliation: affiliation2,
    });
    const { newAffiliation: affId2 } = affResult2 as { newAffiliation: ID };

    const badgeResult1 = await concept.addBadge({ user: userAlice, badge: badge1 });
    const { newBadge: badgeId1 } = badgeResult1 as { newBadge: ID };
    const badgeResult2 = await concept.addBadge({ user: userAlice, badge: badge2 });
    const { newBadge: badgeId2 } = badgeResult2 as { newBadge: ID };

    const [orcids2, affiliations2, badges2] = await Promise.all([
      concept._getORCIDsByUser({ user: userAlice }),
      concept._getAffiliationsByUser({ user: userAlice }),
      concept._getBadgesByUser({ user: userAlice }),
    ]);

    // Verify ORCIDs
    assertEquals(orcids2.length, 1, "Should have one ORCID");
    assertEquals(orcids2[0].orcid._id, orcidId, "ORCID ID should match");
    assertEquals(orcids2[0].orcid.user, userAlice, "User should match");
    assertEquals(orcids2[0].orcid.orcid, orcid1, "ORCID value should match");

    // Verify Affiliations
    assertEquals(affiliations2.length, 2, "Should have two affiliations");
    const affIds = affiliations2.map((a) => a.affiliation._id);
    assertEquals(affIds.includes(affId1), true, "Should include first affiliation");
    assertEquals(affIds.includes(affId2), true, "Should include second affiliation");

    // Verify Badges
    assertEquals(badges2.length, 2, "Should have two badges");
    const badgeIds = badges2.map((b) => b.badge._id);
    assertEquals(badgeIds.includes(badgeId1), true, "Should include first badge");
    assertEquals(badgeIds.includes(badgeId2), true, "Should include second badge");
    console.log("    Correctly returns all verification signals");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getORCIDsByUser, _getBadgesByUser return separate results for different users", async () => {
  const [db, client] = await testDb();
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing _getORCIDsByUser, _getBadgesByUser queries - user isolation");

    await concept.addORCID({ user: userAlice, orcid: orcid1 });
    await concept.addBadge({ user: userAlice, badge: badge1 });

    await concept.addORCID({ user: userBob, orcid: orcid2 });
    await concept.addBadge({ user: userBob, badge: badge2 });

    const [aliceOrcids, aliceBadges] = await Promise.all([
      concept._getORCIDsByUser({ user: userAlice }),
      concept._getBadgesByUser({ user: userAlice }),
    ]);
    const [bobOrcids, bobBadges] = await Promise.all([
      concept._getORCIDsByUser({ user: userBob }),
      concept._getBadgesByUser({ user: userBob }),
    ]);

    assertEquals(aliceOrcids.length, 1, "Alice should have one ORCID");
    assertEquals(aliceOrcids[0].orcid.orcid, orcid1, "Alice's ORCID should match");
    assertEquals(aliceBadges.length, 1, "Alice should have one badge");
    assertEquals(aliceBadges[0].badge.badge, badge1, "Alice's badge should match");

    assertEquals(bobOrcids.length, 1, "Bob should have one ORCID");
    assertEquals(bobOrcids[0].orcid.orcid, orcid2, "Bob's ORCID should match");
    assertEquals(bobBadges.length, 1, "Bob should have one badge");
    assertEquals(bobBadges[0].badge.badge, badge2, "Bob's badge should match");
    console.log("    Users correctly isolated");
  } finally {
    await client.close();
  }
});

// OAuth Verification Tests
Deno.test("Action: initiateORCIDVerification generates OAuth URL and stores state", async () => {
  const [db, client] = await testDb();
  
  // Set up environment variables for OAuth
  Deno.env.set("ORCID_CLIENT_ID", "test-client-id");
  Deno.env.set("ORCID_CLIENT_SECRET", "test-client-secret");
  Deno.env.set("ORCID_REDIRECT_URI", "http://localhost:8000/api/IdentityVerification/completeVerification");
  Deno.env.set("ORCID_API_BASE_URL", "https://sandbox.orcid.org");
  
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing initiateORCIDVerification action");

    // First, add an ORCID
    const addResult = await concept.addORCID({
      user: userAlice,
      orcid: orcid1,
    });
    const { newORCID: orcidId } = addResult as { newORCID: ID };

    // Test: initiateORCIDVerification generates auth URL
    console.log("  Testing: generates OAuth URL and state");
    const initiateResult = await concept.initiateORCIDVerification({
      orcid: orcidId,
      redirectUri: "http://localhost:8000/api/IdentityVerification/completeVerification",
    });

    assertNotEquals("error" in initiateResult, true, "Should succeed");
    const { authUrl, state } = initiateResult as { authUrl: string; state: string };
    assertExists(authUrl, "Auth URL should be returned");
    assertExists(state, "State should be returned");
    assertEquals(authUrl.includes("sandbox.orcid.org"), true, "Auth URL should point to ORCID");
    assertEquals(authUrl.includes("client_id=test-client-id"), true, "Auth URL should include client ID");
    assertEquals(authUrl.includes(`state=${state}`), true, "Auth URL should include state");
    console.log("    OAuth URL and state generated correctly");
  } finally {
    await client.close();
    // Clean up environment variables
    Deno.env.delete("ORCID_CLIENT_ID");
    Deno.env.delete("ORCID_CLIENT_SECRET");
    Deno.env.delete("ORCID_REDIRECT_URI");
    Deno.env.delete("ORCID_API_BASE_URL");
  }
});

Deno.test("Action: initiateORCIDVerification fails for non-existent ORCID", async () => {
  const [db, client] = await testDb();
  
  Deno.env.set("ORCID_CLIENT_ID", "test-client-id");
  Deno.env.set("ORCID_CLIENT_SECRET", "test-client-secret");
  Deno.env.set("ORCID_REDIRECT_URI", "http://localhost:8000/api/IdentityVerification/completeVerification");
  Deno.env.set("ORCID_API_BASE_URL", "https://sandbox.orcid.org");
  
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing initiateORCIDVerification with non-existent ORCID");

    const result = await concept.initiateORCIDVerification({
      orcid: "nonexistent-orcid" as ID,
      redirectUri: "http://localhost:8000/api/IdentityVerification/completeVerification",
    });

    assertEquals("error" in result, true, "Should fail for non-existent ORCID");
    console.log("    Correctly rejects non-existent ORCID");
  } finally {
    await client.close();
    Deno.env.delete("ORCID_CLIENT_ID");
    Deno.env.delete("ORCID_CLIENT_SECRET");
    Deno.env.delete("ORCID_REDIRECT_URI");
    Deno.env.delete("ORCID_API_BASE_URL");
  }
});

Deno.test("Action: completeORCIDVerification fails with invalid state", async () => {
  const [db, client] = await testDb();
  
  Deno.env.set("ORCID_CLIENT_ID", "test-client-id");
  Deno.env.set("ORCID_CLIENT_SECRET", "test-client-secret");
  Deno.env.set("ORCID_REDIRECT_URI", "http://localhost:8000/api/IdentityVerification/completeVerification");
  Deno.env.set("ORCID_API_BASE_URL", "https://sandbox.orcid.org");
  
  const concept = new IdentityVerificationConcept(db);

  try {
    console.log("Testing completeORCIDVerification with invalid state");

    // First, add an ORCID
    const addResult = await concept.addORCID({
      user: userAlice,
      orcid: orcid1,
    });
    const { newORCID: orcidId } = addResult as { newORCID: ID };

    const result = await concept.completeORCIDVerification({
      orcid: orcidId,
      code: "test-code",
      state: "invalid-state",
    });

    assertEquals("error" in result, true, "Should fail with invalid state");
    const { error } = result as { error: string };
    assertEquals(error.includes("Invalid or expired"), true, "Error should mention invalid state");
    console.log("    Correctly rejects invalid state");
  } finally {
    await client.close();
    Deno.env.delete("ORCID_CLIENT_ID");
    Deno.env.delete("ORCID_CLIENT_SECRET");
    Deno.env.delete("ORCID_REDIRECT_URI");
    Deno.env.delete("ORCID_API_BASE_URL");
  }
});

// Note: Full OAuth flow test with mocked ORCID API would require mocking fetch
// This is a more complex integration test that would be better suited for e2e testing
// The above tests verify the state management and error handling logic

