import { Collection, Db, ObjectId } from "npm:mongodb";
import { ID } from "@utils/types.ts";

// Generic types of this concept
type User = ID;
type ORCID = ID;
type Affiliation = ID;
type Badge = ID;

/**
 * @concept IdentityVerification [User]
 * @purpose optional trust signals attached to a user
 *
 * @principle user can add ORCID, institution affiliation, and badges to their
 * account, and these can be used to verify the user's identity
 */

/**
 * a set of ORCIDs with
 *   a user User
 *   an orcid String
 */
interface ORCIDDoc {
  _id: ObjectId;
  user: string; // User ID
  orcid: string;
}

/**
 * a set of Affiliations with
 *   a user User
 *   an affiliation String
 */
interface AffiliationDoc {
  _id: ObjectId;
  user: string; // User ID
  affiliation: string;
}

/**
 * a set of Badges with
 *   a user User
 *   a badge String
 */
interface BadgeDoc {
  _id: ObjectId;
  user: string; // User ID
  badge: string;
}

export default class IdentityVerificationConcept {
  constructor(private readonly db: Db) {
    // Fire-and-forget index initialization
    void this.initIndexes();
  }

  private get orcids(): Collection<ORCIDDoc> {
    return this.db.collection("orcids");
  }

  private get affiliations(): Collection<AffiliationDoc> {
    return this.db.collection("affiliations");
  }

  private get badges(): Collection<BadgeDoc> {
    return this.db.collection("badges");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.orcids.createIndex({ user: 1 }, { unique: true });
      await this.affiliations.createIndex({ user: 1, affiliation: 1 }, { unique: true });
      await this.badges.createIndex({ user: 1, badge: 1 }, { unique: true });
    } catch {
      // best-effort
    }
  }

  /**
   * addORCID(user: User, orcid: String) : (newORCID: ORCID)
   *
   * **requires** there is no ORCID for the given user in the set of ORCIDs
   * **effects** inserts new ORCID into the set of ORCIDs for the given user and
   * returns the new ORCID
   */
  async addORCID(
    { user, orcid }: { user: string; orcid: string },
  ): Promise<{ newORCID: string } | { error: string }> {
    try {
      // Check if ORCID already exists for this user
      const existing = await this.orcids.findOne({ user });
      if (existing) {
        throw new Error("ORCID already exists for this user");
      }
      // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
      // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
      const res = await this.orcids.insertOne({ user, orcid });
      return { newORCID: String(res.insertedId) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * removeORCID(orcid: ORCID) : ()
   *
   * **requires** the ORCID is in the set of ORCIDs
   * **effects** removes the ORCID from the set of ORCIDs
   */
  async removeORCID(
    { orcid }: { orcid: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.orcids.deleteOne({ _id: new ObjectId(orcid) });
      if (res.deletedCount === 0) throw new Error("ORCID not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * addAffiliation(user: User, affiliation: String) : (newAffiliation: Affiliation)
   *
   * **requires** there is no Affiliation with provided user User and affiliation
   * String in the set of Affiliations
   * **effects** adds a new Affiliation into the set of Affiliations for the given
   * user and returns the new Affiliation
   */
  async addAffiliation(
    { user, affiliation }: { user: string; affiliation: string },
  ): Promise<{ newAffiliation: string } | { error: string }> {
    try {
      // Check if this affiliation already exists for this user
      const existing = await this.affiliations.findOne({ user, affiliation });
      if (existing) {
        throw new Error("Affiliation already exists for this user");
      }
      // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
      // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
      const res = await this.affiliations.insertOne({ user, affiliation });
      return { newAffiliation: String(res.insertedId) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * removeAffiliation(affiliation: Affiliation) : ()
   *
   * **requires** the affiliation is in the set of Affiliations
   * **effects** removes the affiliation from the set of Affiliations
   */
  async removeAffiliation(
    { affiliation }: { affiliation: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.affiliations.deleteOne({ _id: new ObjectId(affiliation) });
      if (res.deletedCount === 0) throw new Error("Affiliation not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * updateAffiliation(affiliation: Affiliation, newAffiliation: String) : ()
   *
   * **requires** the affiliation is in the set of Affiliations, and there is no other
   * Affiliation with the same user and newAffiliation String in the set of Affiliations
   * **effects** updates the affiliation String of the given Affiliation to the newAffiliation
   * String
   */
  async updateAffiliation(
    { affiliation, newAffiliation }: { affiliation: string; newAffiliation: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      // Get the existing affiliation to check user
      const existing = await this.affiliations.findOne({ _id: new ObjectId(affiliation) });
      if (!existing) throw new Error("Affiliation not found");

      // Check if another affiliation with same user and newAffiliation already exists
      const duplicate = await this.affiliations.findOne({
        user: existing.user,
        affiliation: newAffiliation,
        _id: { $ne: new ObjectId(affiliation) },
      });
      if (duplicate) {
        throw new Error("Affiliation already exists for this user");
      }

      // Update the affiliation
      const res = await this.affiliations.updateOne(
        { _id: new ObjectId(affiliation) },
        { $set: { affiliation: newAffiliation } },
      );
      if (res.matchedCount === 0) throw new Error("Affiliation not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * addBadge(user: User, badge: String) : (newBadge: Badge)
   *
   * **requires** there is no Badge with provided user User and badge String in the
   * set of Badges
   * **effects** adds a new Badge into the set of Badges for the given user and
   * returns the new Badge
   */
  async addBadge(
    { user, badge }: { user: string; badge: string },
  ): Promise<{ newBadge: string } | { error: string }> {
    try {
      // Check if this badge already exists for this user
      const existing = await this.badges.findOne({ user, badge });
      if (existing) {
        throw new Error("Badge already exists for this user");
      }
      // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
      // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
      const res = await this.badges.insertOne({ user, badge });
      return { newBadge: String(res.insertedId) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * revokeBadge(badge: Badge) : ()
   *
   * **requires** the badge is in the set of Badges
   * **effects** the badge is removed from the set of Badges
   */
  async revokeBadge(
    { badge }: { badge: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.badges.deleteOne({ _id: new ObjectId(badge) });
      if (res.deletedCount === 0) throw new Error("Badge not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getByUser(user: User) : (orcids: ORCIDDoc[], affiliations: AffiliationDoc[], badges: BadgeDoc[])
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing all ORCIDs, Affiliations,
   * and Badges for the given user. Returns an array with one dictionary containing
   * `{ orcids: ORCIDDoc[], affiliations: AffiliationDoc[], badges: BadgeDoc[] }`.
   */
  async _getByUser(
    { user }: { user: string },
  ): Promise<
    Array<{
      orcids: Array<{ _id: string; user: string; orcid: string }>;
      affiliations: Array<{ _id: string; user: string; affiliation: string }>;
      badges: Array<{ _id: string; user: string; badge: string }>;
    }>
  > {
    try {
      const [orcids, affiliations, badges] = await Promise.all([
        this.orcids.find({ user }).toArray(),
        this.affiliations.find({ user }).toArray(),
        this.badges.find({ user }).toArray(),
      ]);
      // Queries must return an array of dictionaries
      return [{
        orcids: orcids.map((o) => ({
          _id: String(o._id),
          user: o.user,
          orcid: o.orcid,
        })),
        affiliations: affiliations.map((a) => ({
          _id: String(a._id),
          user: a.user,
          affiliation: a.affiliation,
        })),
        badges: badges.map((b) => ({
          _id: String(b._id),
          user: b.user,
          badge: b.badge,
        })),
      }];
    } catch {
      // On error, return empty arrays (queries should not throw)
      return [{ orcids: [], affiliations: [], badges: [] }];
    }
  }
}

