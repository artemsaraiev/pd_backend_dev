import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type User = ID;
type Resource = ID;
type Group = ID;
type Membership = ID;
type PrivateAccess = ID;
type UniversalAccess = ID;

/**
 * @concept AccessControl [User, Resource]
 * @purpose control who can access which resources by organizing users into groups and granting permissions
 *
 * @principle users can create groups, add and remove other users to groups, and
 * get access to resources based on the groups they are in. Also provides a way to grant
 * universal access to a resource to all users.
 */

/**
 * a set of Groups with
 *   a name String
 *   a description String
 *   an admin User
 */
interface GroupDoc {
  _id: Group;
  name: string;
  description: string;
  admin: User;
}

/**
 * a set of Memberships with
 *   a group Group
 *   a user User
 *   a isAdmin Boolean
 */
interface MembershipDoc {
  _id: Membership;
  groupId: Group;
  user: User;
  isAdmin: boolean;
}

/**
 * a set of PrivateAccesses with
 *   a group Group
 *   a resource Resource
 */
interface PrivateAccessDoc {
  _id: PrivateAccess;
  groupId: Group;
  resource: Resource;
}

/**
 * a set of UniversalAccesses with
 *   a resource Resource
 */
interface UniversalAccessDoc {
  _id: UniversalAccess;
  resource: Resource;
}

export default class AccessControlConcept {
  constructor(private readonly db: Db) {
    // Fire-and-forget index initialization
    void this.initIndexes();
  }

  private get groups(): Collection<GroupDoc> {
    return this.db.collection("groups");
  }

  private get memberships(): Collection<MembershipDoc> {
    return this.db.collection("memberships");
  }

  private get privateAccesses(): Collection<PrivateAccessDoc> {
    return this.db.collection("privateAccesses");
  }

  private get universalAccesses(): Collection<UniversalAccessDoc> {
    return this.db.collection("universalAccesses");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.memberships.createIndex({ groupId: 1, user: 1 }, { unique: true });
      await this.memberships.createIndex({ groupId: 1 });
      await this.memberships.createIndex({ user: 1 });
      await this.privateAccesses.createIndex({ groupId: 1, resource: 1 }, { unique: true });
      await this.privateAccesses.createIndex({ resource: 1 });
      await this.universalAccesses.createIndex({ resource: 1 }, { unique: true });
    } catch {
      // best-effort
    }
  }

  /**
   * createGroup(creator: User, name: String, description: String) : (newGroup: Group)
   *
   * **requires** nothing
   * **effects** creates a new Group with the given name, description, and admin set
   * to the creator, adds it to the set of Groups and returns it. Also creates a new
   * Membership with the new group, the creator as the User, and isAdmin set to true,
   * and adds it to the set of Memberships
   */
  async createGroup(
    { creator, name, description }: { creator: User; name: string; description: string },
    ): Promise<{ newGroup: Group } | { error: string }> {
    try {
      // Create the group
      const groupId = freshID() as Group;
      await this.groups.insertOne({
        _id: groupId,
        name,
        description,
        admin: creator,
      });

      // Create the membership for the creator
      const membershipId = freshID() as Membership;
      await this.memberships.insertOne({
        _id: membershipId,
        groupId,
        user: creator,
        isAdmin: true,
      });

      return { newGroup: groupId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * updateGroup(group: Group, name?: String, description?: String) : ()
   *
   * **requires** the group is in the set of Groups
   * **effects** updates the name and/or description of the group to the provided values.
   * If a value is not provided, that field remains unchanged.
   */
  async updateGroup(
    { group, name, description }: { group: Group; name?: string; description?: string },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      // Check if group exists
      const groupDoc = await this.groups.findOne({ _id: group });
      if (!groupDoc) throw new Error("Group not found");

      // Build update object with only provided fields
      const updateFields: { name?: string; description?: string } = {};
      if (name !== undefined) {
        updateFields.name = name;
      }
      if (description !== undefined) {
        updateFields.description = description;
      }

      // If no fields to update, return success
      if (Object.keys(updateFields).length === 0) {
        return { ok: true };
      }

      // Update the group
      const res = await this.groups.updateOne(
        { _id: group },
        { $set: updateFields },
      );
      if (res.matchedCount === 0) throw new Error("Group not found");

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * addUser(group: Group, user: User) : (newMembership: Membership)
   *
   * **requires** the group is in the set of Groups, there is no Membership with the
   * given group and user in the set of Memberships
   * **effects** creates a new Membership with the given group and user, and isAdmin
   * set to false, and adds it to the set of Memberships
   */
  async addUser(
    { group, user }: { group: Group; user: User },
    ): Promise<{ newMembership: Membership } | { error: string }> {
    try {
      // Check if group exists
      const groupDoc = await this.groups.findOne({ _id: group });
      if (!groupDoc) throw new Error("Group not found");

      // Check if membership already exists
      const existing = await this.memberships.findOne({ groupId: group, user });
      if (existing) {
        throw new Error("Membership already exists");
      }

      // Create the membership
      const membershipId = freshID() as Membership;
      await this.memberships.insertOne({
        _id: membershipId,
        groupId: group,
        user,
        isAdmin: false,
      });

      return { newMembership: membershipId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * revokeMembership(membership: Membership) : ()
   *
   * **requires** the membership is in the set of Memberships. Can't be the last
   * membership for the group
   * **effects** removes the membership from the set of Memberships
   */
  async revokeMembership(
    { membership }: { membership: Membership },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      // Get the membership to check group
      const membershipDoc = await this.memberships.findOne({
        _id: membership,
      });
      if (!membershipDoc) throw new Error("Membership not found");

      // Check if this is the last membership for the group
      const count = await this.memberships.countDocuments({
        groupId: membershipDoc.groupId,
      });
      if (count <= 1) {
        throw new Error("Cannot revoke last membership for group");
      }

      // Delete the membership
      const res = await this.memberships.deleteOne({ _id: membership });
      if (res.deletedCount === 0) throw new Error("Membership not found");

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * promoteUser(membership: Membership) : ()
   *
   * **requires** the membership is in the set of Memberships
   * **effects** sets the isAdmin field of the membership to true
   */
  async promoteUser(
    { membership }: { membership: Membership },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.memberships.updateOne(
        { _id: membership },
        { $set: { isAdmin: true } },
      );
      if (res.matchedCount === 0) throw new Error("Membership not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * demoteUser(membership: Membership) : ()
   *
   * **requires** the membership is in the set of Memberships, can't be the last
   * admin membership for the group
   * **effects** sets the isAdmin field of the membership to false
   */
  async demoteUser(
    { membership }: { membership: Membership },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      // Get the membership to check group
      const membershipDoc = await this.memberships.findOne({
        _id: membership,
      });
      if (!membershipDoc) throw new Error("Membership not found");

      // Check if this is the last admin membership for the group
      const adminCount = await this.memberships.countDocuments({
        groupId: membershipDoc.groupId,
        isAdmin: true,
      });
      if (adminCount <= 1 && membershipDoc.isAdmin) {
        throw new Error("Cannot demote last admin membership for group");
      }

      // Update the membership
      const res = await this.memberships.updateOne(
        { _id: membership },
        { $set: { isAdmin: false } },
      );
      if (res.matchedCount === 0) throw new Error("Membership not found");

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * givePrivateAccess(group: Group, resource: Resource) : (newPrivateAccess: PrivateAccess)
   *
   * **requires** the group is in the set of Groups, there is no Access with the
   * given group and resource in the set of PrivateAccesses
   * **effects** creates a new PrivateAccess with the given group and resource, and adds it
   * to the set of PrivateAccesses.
   */
  async givePrivateAccess(
    { group, resource }: { group: Group; resource: Resource },
    ): Promise<{ newPrivateAccess: PrivateAccess } | { error: string }> {
    try {
      // Check if group exists
      const groupDoc = await this.groups.findOne({ _id: group });
      if (!groupDoc) throw new Error("Group not found");

      // Check if access already exists
      const existing = await this.privateAccesses.findOne({ groupId: group, resource });
      if (existing) {
        throw new Error("PrivateAccess already exists");
      }

      // Create the private access
      const accessId = freshID() as PrivateAccess;
      await this.privateAccesses.insertOne({
        _id: accessId,
        groupId: group,
        resource,
      });

      return { newPrivateAccess: accessId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * revokePrivateAccess(privateAccess: PrivateAccess) : ()
   *
   * **requires** the privateAccess is in the set of PrivateAccesses
   * **effects** removes the privateAccess from the set of PrivateAccesses
   */
  async revokePrivateAccess(
    { privateAccess }: { privateAccess: PrivateAccess },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.privateAccesses.deleteOne({
        _id: privateAccess,
      });
      if (res.deletedCount === 0) throw new Error("PrivateAccess not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * giveUniversalAccess(resource: Resource) : (newUniversalAccess: UniversalAccess)
   *
   * **requires** there is no UniversalAccess with the given resource in the set of
   * UniversalAccesses
   * **effects** creates a new UniversalAccess with the given resource, and adds it
   * to the set of UniversalAccesses
   */
  async giveUniversalAccess(
    { resource }: { resource: Resource },
    ): Promise<{ newUniversalAccess: UniversalAccess } | { error: string }> {
    try {
      // Check if universal access already exists
      const existing = await this.universalAccesses.findOne({ resource });
      if (existing) {
        throw new Error("UniversalAccess already exists");
      }

      // Create the universal access
      const accessId = freshID() as UniversalAccess;
      await this.universalAccesses.insertOne({ _id: accessId, resource });

      return { newUniversalAccess: accessId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * revokeUniversalAccess(universalAccess: UniversalAccess) : ()
   *
   * **requires** the universalAccess is in the set of UniversalAccesses
   * **effects** removes the UniversalAccess from the set of UniversalAccesses
   */
  async revokeUniversalAccess(
    { universalAccess }: { universalAccess: UniversalAccess },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.universalAccesses.deleteOne({
        _id: universalAccess,
      });
      if (res.deletedCount === 0) throw new Error("UniversalAccess not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * removeGroup(group: Group) : ()
   *
   * **requires** the group is in the set of Groups
   * **effects** removes the group from the set of Groups. Also removes all
   * Memberships and Accesses associated with the group.
   */
  async removeGroup(
    { group }: { group: Group },
    ): Promise<{ ok: true } | { error: string }> {
    try {
      // Check if group exists
      const groupDoc = await this.groups.findOne({ _id: group });
      if (!groupDoc) throw new Error("Group not found");

      // Remove all memberships for this group
      await this.memberships.deleteMany({ groupId: group });

      // Remove all private accesses for this group
      await this.privateAccesses.deleteMany({ groupId: group });

      // Remove the group
      const res = await this.groups.deleteOne({ _id: group });
      if (res.deletedCount === 0) throw new Error("Group not found");

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getGroup(group: Group) : (group: GroupDoc | null)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the group document
   * for the given group in the `group` field, or null if the group does not exist.
   * Returns an array with one dictionary containing `{ group: GroupDoc | null }`.
   */
  async _getGroup(
    { group }: { group: Group },
    ): Promise<Array<{ group: GroupDoc | null }>> {
    try {
      const result = await this.groups.findOne({ _id: group });
      // Queries must return an array of dictionaries
      return [{ group: result ?? null }];
    } catch {
      // On error, return array with null (queries should not throw)
      return [{ group: null }];
    }
  }

  /**
   * _getMembershipsByGroup(group: Group) : (memberships: MembershipDoc[])
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing all memberships
   * for the given group in the `memberships` field. Returns an array with one dictionary
   * containing `{ memberships: MembershipDoc[] }`.
   */
  async _getMembershipsByGroup(
    { group }: { group: Group },
    ): Promise<Array<{ memberships: Array<{ _id: Membership; groupId: Group; user: User; isAdmin: boolean }> }>> {
    try {
      const items = await this.memberships.find({ groupId: group }).toArray();
      const memberships = items.map((m) => ({
        _id: m._id,
        groupId: m.groupId,
        user: m.user,
        isAdmin: m.isAdmin,
      }));
      // Queries must return an array of dictionaries
      return [{ memberships }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [{ memberships: [] }];
    }
  }

  /**
   * _getMembershipsByUser(user: User) : (memberships: MembershipDoc[])
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing all memberships
   * for the given user in the `memberships` field. Returns an array with one dictionary
   * containing `{ memberships: MembershipDoc[] }`.
   */
  async _getMembershipsByUser(
    { user }: { user: User },
    ): Promise<Array<{ memberships: Array<{ _id: Membership; groupId: Group; user: User; isAdmin: boolean }> }>> {
    try {
      const items = await this.memberships.find({ user }).toArray();
      const memberships = items.map((m) => ({
        _id: m._id,
        groupId: m.groupId,
        user: m.user,
        isAdmin: m.isAdmin,
      }));
      // Queries must return an array of dictionaries
      return [{ memberships }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [{ memberships: [] }];
    }
  }

  /**
   * _hasAccess(user: User, resource: Resource) : (hasAccess: Boolean)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing whether the user
   * has access to the resource. Returns true if the resource has universal access,
   * or if the user is a member of a group that has private access to the resource.
   * Returns an array with one dictionary containing `{ hasAccess: boolean }`.
   */
  async _hasAccess(
    { user, resource }: { user: User; resource: Resource },
    ): Promise<Array<{ hasAccess: boolean }>> {
    try {
      // Check for universal access
      const universal = await this.universalAccesses.findOne({ resource });
      if (universal) {
        return [{ hasAccess: true }];
      }

      // Get all groups the user is a member of
      const userMemberships = await this.memberships.find({ user }).toArray();
      const groupIds = userMemberships.map((m) => m.groupId);

      if (groupIds.length === 0) {
        return [{ hasAccess: false }];
      }

      // Check if any of these groups have private access to the resource
      const privateAccess = await this.privateAccesses.findOne({
        groupId: { $in: groupIds },
        resource,
      });

      return [{ hasAccess: privateAccess !== null }];
    } catch {
      // On error, return false (queries should not throw)
      return [{ hasAccess: false }];
    }
  }
}

