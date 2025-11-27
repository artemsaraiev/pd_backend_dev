import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import AccessControlConcept from "./AccessControlConcept.ts";

const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID;
const resource1 = "resource:paper1" as ID;
const resource2 = "resource:paper2" as ID;

/**
 * # trace: Principle fulfillment
 *
 * The principle states: "users can create groups, add and remove other users to groups, and
 * get access to resources based on the groups they are in. Also provides a way to grant
 * universal access to a resource to all users."
 *
 * Trace:
 * 1. User creates a group
 * 2. User adds other users to the group
 * 3. Group is granted access to a resource
 * 4. Users in the group can access the resource
 * 5. Universal access can be granted to a resource
 */
Deno.test("Principle: Users create groups, manage members, and control resource access", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Trace: Testing principle - create group -> add users -> grant access");

    // 1. User creates a group
    console.log("  Step 1: Alice creates a group");
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Research Team",
      description: "Team working on research project",
    });
    assertNotEquals("error" in groupResult, true, "Group creation should succeed");
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    assertExists(groupId, "Group ID should be returned");
    console.log(`    Created group: ${groupId}`);

    // 2. User adds other users to the group
    console.log("  Step 2: Add users to group");
    const membershipResult1 = await concept.addUser({
      group: groupId,
      user: userBob,
    });
    assertNotEquals(
      "error" in membershipResult1,
      true,
      "Add user should succeed",
    );
    const { newMembership: membershipId1 } = membershipResult1 as {
      newMembership: string;
    };
    assertExists(membershipId1, "Membership ID should be returned");
    console.log(`    Added user: ${membershipId1}`);

    // 3. Group is granted access to a resource
    console.log("  Step 3: Grant group access to resource");
    const accessResult = await concept.givePrivateAccess({
      group: groupId,
      resource: resource1,
    });
    assertNotEquals(
      "error" in accessResult,
      true,
      "Grant access should succeed",
    );
    const { newPrivateAccess: accessId } = accessResult as {
      newPrivateAccess: string;
    };
    assertExists(accessId, "Access ID should be returned");
    console.log(`    Granted access: ${accessId}`);

    // 4. Users in the group can access the resource
    console.log("  Step 4: Verify users have access");
    const hasAccessResult1 = await concept._hasAccess({
      user: userAlice,
      resource: resource1,
    });
    assertEquals(hasAccessResult1[0].hasAccess, true, "Alice should have access");
    const hasAccessResult2 = await concept._hasAccess({
      user: userBob,
      resource: resource1,
    });
    assertEquals(hasAccessResult2[0].hasAccess, true, "Bob should have access");
    console.log("    Users have access via group");

    // 5. Universal access can be granted to a resource
    console.log("  Step 5: Grant universal access");
    const universalResult = await concept.giveUniversalAccess({
      resource: resource2,
    });
    assertNotEquals(
      "error" in universalResult,
      true,
      "Grant universal access should succeed",
    );
    const { newUniversalAccess: universalId } = universalResult as {
      newUniversalAccess: string;
    };
    assertExists(universalId, "Universal access ID should be returned");

    const hasAccessResult3 = await concept._hasAccess({
      user: userCharlie,
      resource: resource2,
    });
    assertEquals(
      hasAccessResult3[0].hasAccess,
      true,
      "Charlie should have universal access",
    );
    console.log("    Universal access works for all users");
  } finally {
    await client.close();
  }
});

// Action: createGroup
Deno.test("Action: createGroup creates group and membership for creator", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing createGroup action - requires/effects");

    // Test: createGroup requires nothing
    console.log("  Testing requires: no requirements");
    const result = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test Description",
    });
    assertNotEquals("error" in result, true, "Should succeed");
    const { newGroup: groupId } = result as { newGroup: ID };
    assertExists(groupId, "Should return group ID");
    console.log("    Group created successfully");

    // Test: createGroup effects - group exists with correct fields
    console.log("  Testing effects: group created with correct fields");
    const getGroupResult = await concept._getGroup({ group: groupId });
    assertEquals(
      getGroupResult.length,
      1,
      "Query should return array with one dictionary",
    );
    const { group: groupDoc } = getGroupResult[0];
    assertExists(groupDoc, "Group should exist");
    assertEquals(groupDoc!.name, "Test Group", "Name should match");
    assertEquals(groupDoc!.description, "Test Description", "Description should match");
    assertEquals(groupDoc!.admin, userAlice, "Admin should be creator");
    console.log("    Group has correct fields");

    // Test: createGroup effects - membership created for creator
    console.log("  Testing effects: membership created for creator");
    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    assertEquals(
      membershipsResult.length,
      1,
      "Should have one membership",
    );
    assertEquals(membershipsResult[0].membership.user, userAlice, "User should be creator");
    assertEquals(membershipsResult[0].membership.isAdmin, true, "Creator should be admin");
    console.log("    Creator membership created correctly");
  } finally {
    await client.close();
  }
});

// Action: updateGroup
Deno.test("Action: updateGroup requires group exists, updates name and/or description", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing updateGroup action - requires/effects");

    // Create a group first
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Original Description",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };

    // Test: updateGroup requires group exists
    console.log("  Testing requires: group must exist");
    const errorResult = await concept.updateGroup({
      group: "group:nonexistent" as ID,
      name: "New Name",
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent group");
    console.log("    Correctly rejects nonexistent group");

    // Test: updateGroup effects - updates name
    console.log("  Testing effects: updates name");
    const updateNameResult = await concept.updateGroup({
      group: groupId,
      name: "Updated Name",
    });
    assertNotEquals("error" in updateNameResult, true, "Should succeed");

    const getGroupResult1 = await concept._getGroup({ group: groupId });
    const { group: groupDoc1 } = getGroupResult1[0];
    assertExists(groupDoc1, "Group should exist");
    assertEquals(groupDoc1!.name, "Updated Name", "Name should be updated");
    assertEquals(
      groupDoc1!.description,
      "Original Description",
      "Description should remain unchanged",
    );
    console.log("    Name updated correctly");

    // Test: updateGroup effects - updates description
    console.log("  Testing effects: updates description");
    const updateDescResult = await concept.updateGroup({
      group: groupId,
      description: "Updated Description",
    });
    assertNotEquals("error" in updateDescResult, true, "Should succeed");

    const getGroupResult2 = await concept._getGroup({ group: groupId });
    const { group: groupDoc2 } = getGroupResult2[0];
    assertExists(groupDoc2, "Group should exist");
    assertEquals(groupDoc2!.name, "Updated Name", "Name should remain unchanged");
    assertEquals(
      groupDoc2!.description,
      "Updated Description",
      "Description should be updated",
    );
    console.log("    Description updated correctly");

    // Test: updateGroup effects - updates both name and description
    console.log("  Testing effects: updates both name and description");
    const updateBothResult = await concept.updateGroup({
      group: groupId,
      name: "Final Name",
      description: "Final Description",
    });
    assertNotEquals("error" in updateBothResult, true, "Should succeed");

    const getGroupResult3 = await concept._getGroup({ group: groupId });
    const { group: groupDoc3 } = getGroupResult3[0];
    assertExists(groupDoc3, "Group should exist");
    assertEquals(groupDoc3!.name, "Final Name", "Name should be updated");
    assertEquals(
      groupDoc3!.description,
      "Final Description",
      "Description should be updated",
    );
    console.log("    Both fields updated correctly");

    // Test: updateGroup with no fields provided (should succeed but do nothing)
    console.log("  Testing effects: no fields provided");
    const updateNoneResult = await concept.updateGroup({ group: groupId });
    assertNotEquals("error" in updateNoneResult, true, "Should succeed");

    const getGroupResult4 = await concept._getGroup({ group: groupId });
    const { group: groupDoc4 } = getGroupResult4[0];
    assertExists(groupDoc4, "Group should exist");
    assertEquals(groupDoc4!.name, "Final Name", "Name should remain unchanged");
    assertEquals(
      groupDoc4!.description,
      "Final Description",
      "Description should remain unchanged",
    );
    console.log("    No changes when no fields provided");
  } finally {
    await client.close();
  }
});

// Action: addUser
Deno.test("Action: addUser requires group exists and no duplicate, creates membership", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing addUser action - requires/effects");

    // Create a group first
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };

    // Test: addUser requires group exists
    console.log("  Testing requires: group must exist");
    const errorResult = await concept.addUser({
      group: "group:nonexistent" as ID,
      user: userBob,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent group");
    console.log("    Correctly rejects nonexistent group");

    // Test: addUser requires no duplicate membership
    console.log("  Testing requires: no duplicate membership");
    const result1 = await concept.addUser({ group: groupId, user: userBob });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newMembership: membershipId1 } = result1 as { newMembership: ID };

    const duplicateResult = await concept.addUser({
      group: groupId,
      user: userBob,
    });
    assertEquals("error" in duplicateResult, true, "Should fail - duplicate membership");
    console.log("    Correctly rejects duplicate membership");

    // Test: addUser effects - creates membership with isAdmin=false
    console.log("  Testing effects: creates membership with isAdmin=false");
    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    assertEquals(
      membershipsResult.length,
      2,
      "Should have two memberships",
    );
    const bobMembership = membershipsResult.find(
      (m) => m.membership._id === membershipId1,
    )?.membership;
    assertExists(bobMembership, "Bob's membership should exist");
    assertEquals(bobMembership.isAdmin, false, "Bob should not be admin");
    console.log("    Membership created correctly");
  } finally {
    await client.close();
  }
});

// Action: revokeMembership
Deno.test("Action: revokeMembership requires membership exists and not last, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing revokeMembership action - requires/effects");

    // Create a group with multiple members
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const addResult = await concept.addUser({ group: groupId, user: userBob });
    const { newMembership: membershipId } = addResult as { newMembership: ID };

    // Test: revokeMembership requires membership exists
    console.log("  Testing requires: membership must exist");
    const errorResult = await concept.revokeMembership({ membership: "membership:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent membership");
    console.log("    Correctly rejects nonexistent membership");

    // Test: revokeMembership requires not last membership
    console.log("  Testing requires: cannot revoke last membership");
    // First revoke one membership
    await concept.revokeMembership({ membership: membershipId });

    // Try to revoke the last membership (should fail)
    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    const lastMembershipId = membershipsResult[0].membership._id;
    const lastErrorResult = await concept.revokeMembership({
      membership: lastMembershipId,
    });
    assertEquals(
      "error" in lastErrorResult,
      true,
      "Should fail - cannot revoke last membership",
    );
    console.log("    Correctly rejects revoking last membership");

    // Test: revokeMembership effects - removes membership
    console.log("  Testing effects: removes membership");
    // Re-add a member first
    const addResult2 = await concept.addUser({ group: groupId, user: userBob });
    const { newMembership: membershipId2 } = addResult2 as { newMembership: ID };

    const revokeResult = await concept.revokeMembership({ membership: membershipId2 });
    assertNotEquals("error" in revokeResult, true, "Should succeed");

    const membershipsResult2 = await concept._getMembershipsByGroup({ group: groupId });
    assertEquals(
      membershipsResult2.length,
      1,
      "Should have one membership remaining",
    );
    console.log("    Membership removed correctly");
  } finally {
    await client.close();
  }
});

// Action: promoteUser
Deno.test("Action: promoteUser requires membership exists, sets isAdmin to true", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing promoteUser action - requires/effects");

    // Create a group and add a user
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const addResult = await concept.addUser({ group: groupId, user: userBob });
    const { newMembership: membershipId } = addResult as { newMembership: ID };

    // Test: promoteUser requires membership exists
    console.log("  Testing requires: membership must exist");
    const errorResult = await concept.promoteUser({ membership: "membership:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent membership");
    console.log("    Correctly rejects nonexistent membership");

    // Test: promoteUser effects - sets isAdmin to true
    console.log("  Testing effects: sets isAdmin to true");
    const promoteResult = await concept.promoteUser({ membership: membershipId });
    assertNotEquals("error" in promoteResult, true, "Should succeed");

    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    const bobMembership = membershipsResult.find(
      (m) => m.membership._id === membershipId,
    )?.membership;
    assertExists(bobMembership, "Bob's membership should exist");
    assertEquals(bobMembership.isAdmin, true, "Bob should be admin");
    console.log("    User promoted correctly");
  } finally {
    await client.close();
  }
});

// Action: demoteUser
Deno.test("Action: demoteUser requires membership exists and not last admin, sets isAdmin to false", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing demoteUser action - requires/effects");

    // Create a group with multiple admins
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const addResult = await concept.addUser({ group: groupId, user: userBob });
    const { newMembership: membershipId } = addResult as { newMembership: ID };
    await concept.promoteUser({ membership: membershipId });

    // Test: demoteUser requires membership exists
    console.log("  Testing requires: membership must exist");
    const errorResult = await concept.demoteUser({ membership: "membership:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent membership");
    console.log("    Correctly rejects nonexistent membership");

    // Test: demoteUser requires not last admin
    console.log("  Testing requires: cannot demote last admin");
    // Demote one admin
    await concept.demoteUser({ membership: membershipId });

    // Try to demote the last admin (should fail)
    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    const lastAdminMembership = membershipsResult.find((m) => m.membership.isAdmin)?.membership;
    assertExists(lastAdminMembership, "Last admin membership should exist");
    const lastAdminErrorResult = await concept.demoteUser({
      membership: lastAdminMembership!._id,
    });
    assertEquals(
      "error" in lastAdminErrorResult,
      true,
      "Should fail - cannot demote last admin",
    );
    console.log("    Correctly rejects demoting last admin");

    // Test: demoteUser effects - sets isAdmin to false
    console.log("  Testing effects: sets isAdmin to false");
    // Promote again first
    await concept.promoteUser({ membership: membershipId });
    const demoteResult = await concept.demoteUser({ membership: membershipId });
    assertNotEquals("error" in demoteResult, true, "Should succeed");

    const membershipsResult2 = await concept._getMembershipsByGroup({ group: groupId });
    const bobMembership = membershipsResult2.find(
      (m) => m.membership._id === membershipId,
    )?.membership;
    assertExists(bobMembership, "Bob's membership should exist");
    assertEquals(bobMembership.isAdmin, false, "Bob should not be admin");
    console.log("    User demoted correctly");
  } finally {
    await client.close();
  }
});

// Action: givePrivateAccess
Deno.test("Action: givePrivateAccess requires group exists and no duplicate, creates access", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing givePrivateAccess action - requires/effects");

    // Create a group
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };

    // Test: givePrivateAccess requires group exists
    console.log("  Testing requires: group must exist");
    const errorResult = await concept.givePrivateAccess({
      group: "group:nonexistent" as ID,
      resource: resource1,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent group");
    console.log("    Correctly rejects nonexistent group");

    // Test: givePrivateAccess requires no duplicate access
    console.log("  Testing requires: no duplicate access");
    const result1 = await concept.givePrivateAccess({
      group: groupId,
      resource: resource1,
    });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newPrivateAccess: accessId1 } = result1 as { newPrivateAccess: ID };

    const duplicateResult = await concept.givePrivateAccess({
      group: groupId,
      resource: resource1,
    });
    assertEquals("error" in duplicateResult, true, "Should fail - duplicate access");
    console.log("    Correctly rejects duplicate access");

    // Test: givePrivateAccess effects - creates access
    console.log("  Testing effects: creates private access");
    const hasAccessResult = await concept._hasAccess({
      user: userAlice,
      resource: resource1,
    });
    assertEquals(hasAccessResult[0].hasAccess, true, "User should have access");
    console.log("    Private access created correctly");
  } finally {
    await client.close();
  }
});

// Action: revokePrivateAccess
Deno.test("Action: revokePrivateAccess requires access exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing revokePrivateAccess action - requires/effects");

    // Create a group and grant access
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const accessResult = await concept.givePrivateAccess({
      group: groupId,
      resource: resource1,
    });
    const { newPrivateAccess: accessId } = accessResult as { newPrivateAccess: ID };

    // Test: revokePrivateAccess requires access exists
    console.log("  Testing requires: access must exist");
    const errorResult = await concept.revokePrivateAccess({
      privateAccess: "privateAccess:nonexistent" as ID,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent access");
    console.log("    Correctly rejects nonexistent access");

    // Test: revokePrivateAccess effects - removes access
    console.log("  Testing effects: removes access");
    const revokeResult = await concept.revokePrivateAccess({ privateAccess: accessId });
    assertNotEquals("error" in revokeResult, true, "Should succeed");

    const hasAccessResult = await concept._hasAccess({
      user: userAlice,
      resource: resource1,
    });
    assertEquals(hasAccessResult[0].hasAccess, false, "User should not have access");
    console.log("    Private access removed correctly");
  } finally {
    await client.close();
  }
});

// Action: giveUniversalAccess
Deno.test("Action: giveUniversalAccess requires no duplicate, creates universal access", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing giveUniversalAccess action - requires/effects");

    // Test: giveUniversalAccess requires no duplicate
    console.log("  Testing requires: no duplicate universal access");
    const result1 = await concept.giveUniversalAccess({ resource: resource1 });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newUniversalAccess: accessId1 } = result1 as { newUniversalAccess: ID };

    const duplicateResult = await concept.giveUniversalAccess({ resource: resource1 });
    assertEquals(
      "error" in duplicateResult,
      true,
      "Should fail - duplicate universal access",
    );
    console.log("    Correctly rejects duplicate universal access");

    // Test: giveUniversalAccess effects - creates universal access
    console.log("  Testing effects: creates universal access");
    const hasAccessResult = await concept._hasAccess({
      user: userAlice,
      resource: resource1,
    });
    assertEquals(hasAccessResult[0].hasAccess, true, "User should have access");
    const hasAccessResult2 = await concept._hasAccess({
      user: userBob,
      resource: resource1,
    });
    assertEquals(hasAccessResult2[0].hasAccess, true, "Any user should have access");
    console.log("    Universal access created correctly");
  } finally {
    await client.close();
  }
});

// Action: revokeUniversalAccess
Deno.test("Action: revokeUniversalAccess requires access exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing revokeUniversalAccess action - requires/effects");

    // Grant universal access
    const accessResult = await concept.giveUniversalAccess({ resource: resource1 });
    const { newUniversalAccess: accessId } = accessResult as { newUniversalAccess: ID };

    // Test: revokeUniversalAccess requires access exists
    console.log("  Testing requires: access must exist");
    const errorResult = await concept.revokeUniversalAccess({
      universalAccess: "universalAccess:nonexistent" as ID,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent access");
    console.log("    Correctly rejects nonexistent access");

    // Test: revokeUniversalAccess effects - removes access
    console.log("  Testing effects: removes universal access");
    const revokeResult = await concept.revokeUniversalAccess({
      universalAccess: accessId,
    });
    assertNotEquals("error" in revokeResult, true, "Should succeed");

    const hasAccessResult = await concept._hasAccess({
      user: userAlice,
      resource: resource1,
    });
    assertEquals(hasAccessResult[0].hasAccess, false, "User should not have access");
    console.log("    Universal access removed correctly");
  } finally {
    await client.close();
  }
});

// Action: removeGroup
Deno.test("Action: removeGroup requires group exists, removes group and associated data", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing removeGroup action - requires/effects");

    // Create a group with members, access, and invitations
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    await concept.addUser({ group: groupId, user: userBob });
    await concept.givePrivateAccess({ group: groupId, resource: resource1 });
    const inviteResult = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userCharlie,
    });
    const { newInvitation: invitationId } = inviteResult as { newInvitation: ID };

    // Test: removeGroup requires group exists
    console.log("  Testing requires: group must exist");
    const errorResult = await concept.removeGroup({ group: "group:nonexistent" as ID });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent group");
    console.log("    Correctly rejects nonexistent group");

    // Test: removeGroup effects - removes group and associated data
    console.log("  Testing effects: removes group and associated data");
    const removeResult = await concept.removeGroup({ group: groupId });
    assertNotEquals("error" in removeResult, true, "Should succeed");

    // Verify group is removed
    const getGroupResult = await concept._getGroup({ group: groupId });
    assertEquals(getGroupResult.length, 0, "Group should be removed");

    // Verify memberships are removed
    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    assertEquals(
      membershipsResult.length,
      0,
      "Memberships should be removed",
    );

    // Verify private accesses are removed
    const hasAccessResult = await concept._hasAccess({
      user: userAlice,
      resource: resource1,
    });
    assertEquals(hasAccessResult[0].hasAccess, false, "Access should be removed");

    // Verify invitations are removed
    const getInvitationResult = await concept._getInvitation({ invitation: invitationId });
    assertEquals(getInvitationResult.length, 0, "Invitations should be removed");
    console.log("    Group and associated data removed correctly");
  } finally {
    await client.close();
  }
});

// Query: _getGroup
Deno.test("Query: _getGroup returns group document or empty array", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _getGroup query");

    // Test: returns empty array for nonexistent group
    console.log("  Testing nonexistent group");
    const result1 = await concept._getGroup({ group: "group:nonexistent" as ID });
    assertEquals(
      result1.length,
      0,
      "Query should return empty array for nonexistent group",
    );
    console.log("    Correctly returns empty array for nonexistent group");

    // Test: returns group document for existing group
    console.log("  Testing existing group");
    const createResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test Description",
    });
    const { newGroup: groupId } = createResult as { newGroup: ID };

    const result2 = await concept._getGroup({ group: groupId });
    assertEquals(
      result2.length,
      1,
      "Query should return array with one dictionary",
    );
    const { group: groupDoc } = result2[0];
    assertExists(groupDoc, "Group should exist");
    assertEquals(groupDoc._id.toString(), groupId, "Group ID should match");
    assertEquals(groupDoc.name, "Test Group", "Name should match");
    assertEquals(groupDoc.description, "Test Description", "Description should match");
    assertEquals(groupDoc.admin, userAlice, "Admin should match");
    console.log("    Correctly returns group document");
  } finally {
    await client.close();
  }
});

// Query: _getMembershipsByGroup
Deno.test("Query: _getMembershipsByGroup returns all memberships for group", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _getMembershipsByGroup query");

    // Create a group with multiple members
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const addResult1 = await concept.addUser({ group: groupId, user: userBob });
    const { newMembership: membershipId1 } = addResult1 as { newMembership: ID };
    const addResult2 = await concept.addUser({ group: groupId, user: userCharlie });
    const { newMembership: membershipId2 } = addResult2 as { newMembership: ID };

    const result = await concept._getMembershipsByGroup({ group: groupId });
    assertEquals(
      result.length,
      3,
      "Query should return array with one dictionary per membership",
    );
    const membershipIds = result.map((m) => m.membership._id);
    assertEquals(membershipIds.includes(membershipId1), true, "Should include Bob's membership");
    assertEquals(
      membershipIds.includes(membershipId2),
      true,
      "Should include Charlie's membership",
    );
    const aliceMembership = result.find((m) => m.membership.user === userAlice)?.membership;
    assertExists(aliceMembership, "Should include Alice's membership");
    assertEquals(aliceMembership.isAdmin, true, "Alice should be admin");
    console.log("    Correctly returns all memberships");
  } finally {
    await client.close();
  }
});

// Query: _getMembershipsByUser
Deno.test("Query: _getMembershipsByUser returns all memberships for user", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _getMembershipsByUser query");

    // Create multiple groups and add user to them
    const groupResult1 = await concept.createGroup({
      creator: userAlice,
      name: "Group 1",
      description: "Test",
    });
    const { newGroup: groupId1 } = groupResult1 as { newGroup: ID };
    const groupResult2 = await concept.createGroup({
      creator: userBob,
      name: "Group 2",
      description: "Test",
    });
    const { newGroup: groupId2 } = groupResult2 as { newGroup: ID };
    await concept.addUser({ group: groupId2, user: userAlice });

    const result = await concept._getMembershipsByUser({ user: userAlice });
    assertEquals(
      result.length,
      2,
      "Query should return array with one dictionary per membership",
    );
    const groupIds = result.map((m) => m.membership.groupId);
    assertEquals(groupIds.includes(groupId1), true, "Should include Group 1");
    assertEquals(groupIds.includes(groupId2), true, "Should include Group 2");
    console.log("    Correctly returns all memberships for user");
  } finally {
    await client.close();
  }
});

// Query: _hasAccess
Deno.test("Query: _hasAccess returns true for universal access", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _hasAccess query - universal access");

    await concept.giveUniversalAccess({ resource: resource1 });

    const result1 = await concept._hasAccess({ user: userAlice, resource: resource1 });
    assertEquals(result1[0].hasAccess, true, "Alice should have access");
    const result2 = await concept._hasAccess({ user: userBob, resource: resource1 });
    assertEquals(result2[0].hasAccess, true, "Bob should have access");
    console.log("    Universal access works for all users");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _hasAccess returns true for group member with private access", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _hasAccess query - private access via group");

    // Create group and grant access
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    await concept.addUser({ group: groupId, user: userBob });
    await concept.givePrivateAccess({ group: groupId, resource: resource1 });

    const result1 = await concept._hasAccess({ user: userAlice, resource: resource1 });
    assertEquals(result1[0].hasAccess, true, "Alice should have access");
    const result2 = await concept._hasAccess({ user: userBob, resource: resource1 });
    assertEquals(result2[0].hasAccess, true, "Bob should have access");
    const result3 = await concept._hasAccess({ user: userCharlie, resource: resource1 });
    assertEquals(result3[0].hasAccess, false, "Charlie should not have access");
    console.log("    Private access works for group members only");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _hasAccess returns false when no access", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _hasAccess query - no access");

    const result = await concept._hasAccess({ user: userAlice, resource: resource1 });
    assertEquals(result[0].hasAccess, false, "Should return false when no access");
    console.log("    Correctly returns false when no access");
  } finally {
    await client.close();
  }
});

// Query: _getGroupsForUser
Deno.test("Query: _getGroupsForUser returns all groups for user", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _getGroupsForUser query");

    // Create multiple groups and add user to them
    const groupResult1 = await concept.createGroup({
      creator: userAlice,
      name: "Group 1",
      description: "Test",
    });
    const { newGroup: groupId1 } = groupResult1 as { newGroup: ID };
    const groupResult2 = await concept.createGroup({
      creator: userBob,
      name: "Group 2",
      description: "Test",
    });
    const { newGroup: groupId2 } = groupResult2 as { newGroup: ID };
    await concept.addUser({ group: groupId2, user: userAlice });

    const result = await concept._getGroupsForUser({ user: userAlice });
    assertEquals(result.length, 2, "Should return two groups");
    const groupIds = result.map((r) => r.group);
    assertEquals(groupIds.includes(groupId1), true, "Should include Group 1");
    assertEquals(groupIds.includes(groupId2), true, "Should include Group 2");
    console.log("    Correctly returns all groups for user");
  } finally {
    await client.close();
  }
});

// Action: inviteUser
Deno.test("Action: inviteUser requires admin inviter, no duplicate, no existing member", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing inviteUser action - requires/effects");

    // Create a group
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };

    // Test: inviteUser requires inviter is admin
    console.log("  Testing requires: inviter must be admin");
    const addResult = await concept.addUser({ group: groupId, user: userBob });
    const { newMembership: membershipId } = addResult as { newMembership: ID };
    // userBob is not admin, so this should fail
    const errorResult1 = await concept.inviteUser({
      group: groupId,
      inviter: userBob,
      invitee: userCharlie,
    });
    assertEquals("error" in errorResult1, true, "Should fail - inviter not admin");
    console.log("    Correctly rejects non-admin inviter");

    // Test: inviteUser requires invitee not already a member
    console.log("  Testing requires: invitee not already a member");
    const errorResult2 = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userBob,
    });
    assertEquals("error" in errorResult2, true, "Should fail - invitee already member");
    console.log("    Correctly rejects existing member");

    // Test: inviteUser requires no duplicate invitation
    console.log("  Testing requires: no duplicate invitation");
    const result1 = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userCharlie,
      message: "Welcome!",
    });
    assertNotEquals("error" in result1, true, "Should succeed");
    const { newInvitation: invitationId1 } = result1 as { newInvitation: ID };

    const duplicateResult = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userCharlie,
    });
    assertEquals("error" in duplicateResult, true, "Should fail - duplicate invitation");
    console.log("    Correctly rejects duplicate invitation");

    // Test: inviteUser effects - creates invitation
    console.log("  Testing effects: creates invitation");
    const getInvitationResult = await concept._getInvitation({ invitation: invitationId1 });
    assertEquals(getInvitationResult.length, 1, "Should return invitation");
    const { invitation: invitationDoc } = getInvitationResult[0];
    assertEquals(invitationDoc.groupId, groupId, "Group should match");
    assertEquals(invitationDoc.inviter, userAlice, "Inviter should match");
    assertEquals(invitationDoc.invitee, userCharlie, "Invitee should match");
    assertEquals(invitationDoc.message, "Welcome!", "Message should match");
    assertExists(invitationDoc.createdAt, "CreatedAt should be set");
    console.log("    Invitation created correctly");
  } finally {
    await client.close();
  }
});

// Action: removeInvitation
Deno.test("Action: removeInvitation requires invitation exists, removes it", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing removeInvitation action - requires/effects");

    // Create a group and invitation
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const inviteResult = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userBob,
    });
    const { newInvitation: invitationId } = inviteResult as { newInvitation: ID };

    // Test: removeInvitation requires invitation exists
    console.log("  Testing requires: invitation must exist");
    const errorResult = await concept.removeInvitation({
      invitation: "invitation:nonexistent" as ID,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent invitation");
    console.log("    Correctly rejects nonexistent invitation");

    // Test: removeInvitation effects - removes invitation
    console.log("  Testing effects: removes invitation");
    const removeResult = await concept.removeInvitation({ invitation: invitationId });
    assertNotEquals("error" in removeResult, true, "Should succeed");

    const getInvitationResult = await concept._getInvitation({ invitation: invitationId });
    assertEquals(getInvitationResult.length, 0, "Invitation should be removed");
    console.log("    Invitation removed correctly");
  } finally {
    await client.close();
  }
});

// Action: acceptInvitation
Deno.test("Action: acceptInvitation requires invitation exists, creates membership and removes invitation", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing acceptInvitation action - requires/effects");

    // Create a group and invitation
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const inviteResult = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userBob,
      message: "Join us!",
    });
    const { newInvitation: invitationId } = inviteResult as { newInvitation: ID };

    // Test: acceptInvitation requires invitation exists
    console.log("  Testing requires: invitation must exist");
    const errorResult = await concept.acceptInvitation({
      invitation: "invitation:nonexistent" as ID,
    });
    assertEquals("error" in errorResult, true, "Should fail for nonexistent invitation");
    console.log("    Correctly rejects nonexistent invitation");

    // Test: acceptInvitation effects - creates membership and removes invitation
    console.log("  Testing effects: creates membership and removes invitation");
    const acceptResult = await concept.acceptInvitation({ invitation: invitationId });
    assertNotEquals("error" in acceptResult, true, "Should succeed");
    const { newMembership: membershipId } = acceptResult as { newMembership: ID };

    // Verify membership was created
    const membershipsResult = await concept._getMembershipsByGroup({ group: groupId });
    const bobMembership = membershipsResult.find(
      (m) => m.membership._id === membershipId,
    )?.membership;
    assertExists(bobMembership, "Bob's membership should exist");
    assertEquals(bobMembership.user, userBob, "User should be Bob");
    assertEquals(bobMembership.isAdmin, false, "Bob should not be admin");
    console.log("    Membership created correctly");

    // Verify invitation was removed
    const getInvitationResult = await concept._getInvitation({ invitation: invitationId });
    assertEquals(getInvitationResult.length, 0, "Invitation should be removed");
    console.log("    Invitation removed correctly");

    // Test: acceptInvitation fails if invitee already a member (race condition)
    console.log("  Testing: fails if invitee already a member");
    const inviteResult2 = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userBob,
    });
    const { newInvitation: invitationId2 } = inviteResult2 as { newInvitation: ID };
    // Bob is already a member, so accepting should fail
    const errorResult2 = await concept.acceptInvitation({ invitation: invitationId2 });
    assertEquals("error" in errorResult2, true, "Should fail - invitee already member");
    // Invitation should be removed even on error
    const getInvitationResult2 = await concept._getInvitation({ invitation: invitationId2 });
    assertEquals(getInvitationResult2.length, 0, "Invitation should be removed on error");
    console.log("    Correctly handles race condition");
  } finally {
    await client.close();
  }
});

// Query: _listPendingInvitationsByUser
Deno.test("Query: _listPendingInvitationsByUser returns pending invitations for user", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _listPendingInvitationsByUser query");

    // Create groups and invitations
    const groupResult1 = await concept.createGroup({
      creator: userAlice,
      name: "Group 1",
      description: "Test",
    });
    const { newGroup: groupId1 } = groupResult1 as { newGroup: ID };
    const groupResult2 = await concept.createGroup({
      creator: userAlice,
      name: "Group 2",
      description: "Test",
    });
    const { newGroup: groupId2 } = groupResult2 as { newGroup: ID };

    const inviteResult1 = await concept.inviteUser({
      group: groupId1,
      inviter: userAlice,
      invitee: userBob,
      message: "Join Group 1",
    });
    const { newInvitation: invitationId1 } = inviteResult1 as { newInvitation: ID };
    const inviteResult2 = await concept.inviteUser({
      group: groupId2,
      inviter: userAlice,
      invitee: userBob,
      message: "Join Group 2",
    });
    const { newInvitation: invitationId2 } = inviteResult2 as { newInvitation: ID };

    const result = await concept._listPendingInvitationsByUser({ invitee: userBob });
    assertEquals(result.length, 2, "Should return two invitations");
    const invitationIds = result.map((r) => r.invitation._id);
    assertEquals(invitationIds.includes(invitationId1), true, "Should include invitation 1");
    assertEquals(invitationIds.includes(invitationId2), true, "Should include invitation 2");

    // Accept one invitation
    await concept.acceptInvitation({ invitation: invitationId1 });

    // Should now return only one invitation
    const result2 = await concept._listPendingInvitationsByUser({ invitee: userBob });
    assertEquals(result2.length, 1, "Should return one invitation");
    assertEquals(result2[0].invitation._id, invitationId2, "Should be the remaining invitation");
    console.log("    Correctly returns pending invitations for user");
  } finally {
    await client.close();
  }
});

// Query: _getInvitation
Deno.test("Query: _getInvitation returns invitation or empty array", async () => {
  const [db, client] = await testDb();
  const concept = new AccessControlConcept(db);

  try {
    console.log("Testing _getInvitation query");

    // Test: returns empty array for nonexistent invitation
    console.log("  Testing nonexistent invitation");
    const result1 = await concept._getInvitation({ invitation: "invitation:nonexistent" as ID });
    assertEquals(result1.length, 0, "Should return empty array for nonexistent invitation");
    console.log("    Correctly returns empty array for nonexistent invitation");

    // Test: returns invitation for existing invitation
    console.log("  Testing existing invitation");
    const groupResult = await concept.createGroup({
      creator: userAlice,
      name: "Test Group",
      description: "Test",
    });
    const { newGroup: groupId } = groupResult as { newGroup: ID };
    const inviteResult = await concept.inviteUser({
      group: groupId,
      inviter: userAlice,
      invitee: userBob,
      message: "Test message",
    });
    const { newInvitation: invitationId } = inviteResult as { newInvitation: ID };

    const result2 = await concept._getInvitation({ invitation: invitationId });
    assertEquals(result2.length, 1, "Should return one invitation");
    const { invitation: invitationDoc } = result2[0];
    assertEquals(invitationDoc._id, invitationId, "Invitation ID should match");
    assertEquals(invitationDoc.groupId, groupId, "Group should match");
    assertEquals(invitationDoc.inviter, userAlice, "Inviter should match");
    assertEquals(invitationDoc.invitee, userBob, "Invitee should match");
    assertEquals(invitationDoc.message, "Test message", "Message should match");
    console.log("    Correctly returns invitation document");
  } finally {
    await client.close();
  }
});

