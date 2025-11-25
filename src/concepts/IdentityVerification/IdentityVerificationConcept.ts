import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type User = ID;
type ORCID = ID;
type Affiliation = ID;
type Badge = ID;
type OAuthState = ID;

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
 *   a verified Flag
 *   an optional verifiedAt Date
 *   an optional accessToken String
 */
interface ORCIDDoc {
  _id: ORCID;
  user: User;
  orcid: string;
  verified: boolean;
  verifiedAt?: Date;
  accessToken?: string;
}

/**
 * Temporary storage for OAuth state during verification flow
 */
interface OAuthStateDoc {
  _id: OAuthState;
  orcid: ORCID;
  expiresAt: Date;
}

/**
 * a set of Affiliations with
 *   a user User
 *   an affiliation String
 */
interface AffiliationDoc {
  _id: Affiliation;
  user: User;
  affiliation: string;
}

/**
 * a set of Badges with
 *   a user User
 *   a badge String
 */
interface BadgeDoc {
  _id: Badge;
  user: User;
  badge: string;
}

export default class IdentityVerificationConcept {
  private readonly orcidClientId: string;
  private readonly orcidClientSecret: string;
  private readonly orcidRedirectUri: string;
  private readonly orcidApiBaseUrl: string;

  constructor(private readonly db: Db) {
    // Fire-and-forget index initialization
    void this.initIndexes();

    // Load ORCID OAuth configuration from environment
    this.orcidClientId = Deno.env.get("ORCID_CLIENT_ID") ?? "";
    this.orcidClientSecret = Deno.env.get("ORCID_CLIENT_SECRET") ?? "";
    this.orcidRedirectUri = Deno.env.get("ORCID_REDIRECT_URI") ??
      "https://pubdiscuss-frontend.onrender.com";
    this.orcidApiBaseUrl = Deno.env.get("ORCID_API_BASE_URL") ??
      "https://orcid.org";
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

  private get oauthStates(): Collection<OAuthStateDoc> {
    return this.db.collection("oauth_states");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.orcids.createIndex({ user: 1 }, { unique: true });
      await this.affiliations.createIndex({ user: 1, affiliation: 1 }, {
        unique: true,
      });
      await this.badges.createIndex({ user: 1, badge: 1 }, { unique: true });
      // TTL index for OAuth states - expires after 10 minutes
      await this.oauthStates.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 },
      );
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
    { user, orcid }: { user: User; orcid: string },
  ): Promise<{ newORCID: ORCID } | { error: string }> {
    try {
      // Check if ORCID already exists for this user
      const existing = await this.orcids.findOne({ user });
      if (existing) {
        throw new Error("ORCID already exists for this user");
      }
      const orcidId = freshID() as ORCID;
      await this.orcids.insertOne({
        _id: orcidId,
        user,
        orcid,
        verified: false,
      });
      return { newORCID: orcidId };
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
    { orcid }: { orcid: ORCID },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.orcids.deleteOne({ _id: orcid });
      if (res.deletedCount === 0) throw new Error("ORCID not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * initiateORCIDVerification(orcid: ORCID, redirectUri: String, user: User) : (authUrl: String, state: String)
   *
   * **requires** the ORCID exists in the set of ORCIDs and belongs to the user
   * **effects** generates an OAuth authorization URL with a state parameter, stores the state temporarily, and returns the authorization URL and state
   */
  async initiateORCIDVerification(
    { orcid, redirectUri, user }: {
      orcid: ORCID;
      redirectUri: string;
      user: User;
    },
  ): Promise<{ authUrl: string; state: string } | { error: string }> {
    try {
      // Check if ORCID exists and belongs to the user
      const orcidDoc = await this.orcids.findOne({ _id: orcid });
      if (!orcidDoc) {
        throw new Error("ORCID not found");
      }
      if (orcidDoc.user !== user) {
        throw new Error("ORCID does not belong to this user");
      }

      if (!this.orcidClientId || !this.orcidClientSecret) {
        throw new Error(
          "ORCID OAuth credentials not configured. Please set ORCID_CLIENT_ID and ORCID_CLIENT_SECRET environment variables.",
        );
      }

      // Generate a fresh ID for the OAuth state (used for CSRF protection)
      const state = freshID() as OAuthState;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store state in database with TTL
      await this.oauthStates.insertOne({
        _id: state,
        orcid,
        expiresAt,
      });

      // Build OAuth authorization URL
      const authUrl = new URL(`${this.orcidApiBaseUrl}/oauth/authorize`);
      authUrl.searchParams.set("client_id", this.orcidClientId);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "/authenticate");
      authUrl.searchParams.set(
        "redirect_uri",
        redirectUri || this.orcidRedirectUri,
      );
      authUrl.searchParams.set("state", state);

      return { authUrl: authUrl.toString(), state };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * completeORCIDVerification(orcid: ORCID, code: String, state: String) : ()
   *
   * **requires** the ORCID exists, the state is valid and matches the stored state, and the authorization code is valid
   * **effects** exchanges the authorization code for an access token, fetches the ORCID profile to verify ownership, updates the ORCID record with verified=true and verifiedAt=now, and removes the stored state. Returns an error if verification fails.
   */
  async completeORCIDVerification(
    { orcid, code, state, redirectUri }: {
      orcid: ORCID;
      code: string;
      state: string;
      redirectUri?: string;
    },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      // Verify state exists and matches
      const stateDoc = await this.oauthStates.findOne({
        _id: state as OAuthState,
      });
      if (!stateDoc) {
        throw new Error("Invalid or expired verification state");
      }

      if (stateDoc.orcid !== orcid) {
        throw new Error("State does not match ORCID");
      }

      // Check if ORCID exists
      const orcidDoc = await this.orcids.findOne({ _id: orcid });
      if (!orcidDoc) {
        throw new Error("ORCID not found");
      }

      if (!this.orcidClientId || !this.orcidClientSecret) {
        throw new Error(
          "ORCID OAuth credentials not configured. Please set ORCID_CLIENT_ID and ORCID_CLIENT_SECRET environment variables.",
        );
      }

      // Use the redirect URI from the request, or fall back to the configured one
      // The redirect URI must match exactly what was used in the authorization request
      const finalRedirectUri = redirectUri || this.orcidRedirectUri;

      // Exchange authorization code for access token
      const tokenUrl = `${this.orcidApiBaseUrl}/oauth/token`;
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          client_id: this.orcidClientId,
          client_secret: this.orcidClientSecret,
          grant_type: "authorization_code",
          code: code,
          redirect_uri: finalRedirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(
          `Failed to exchange code for token: ${tokenResponse.status} ${errorText}`,
        );
      }

      const tokenData = await tokenResponse.json() as {
        access_token: string;
        orcid?: string;
      };

      const accessToken = tokenData.access_token;
      const verifiedOrcid = tokenData.orcid;

      // Fetch ORCID profile to verify ownership
      const profileUrl =
        `${this.orcidApiBaseUrl}/v3.0/${orcidDoc.orcid}/person`;
      const profileResponse = await fetch(profileUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (!profileResponse.ok) {
        throw new Error(
          `Failed to fetch ORCID profile: ${profileResponse.status}`,
        );
      }

      // Verify that the ORCID in the token matches the stored ORCID
      // ORCID API returns the ORCID in the token response, so we can verify it matches
      if (verifiedOrcid && verifiedOrcid !== orcidDoc.orcid) {
        throw new Error(
          "ORCID in token does not match stored ORCID",
        );
      }

      // Update ORCID record with verified status
      await this.orcids.updateOne(
        { _id: orcid },
        {
          $set: {
            verified: true,
            verifiedAt: new Date(),
            accessToken: accessToken, // Store token (consider encrypting in production)
          },
        },
      );

      // Remove the used state
      await this.oauthStates.deleteOne({ _id: state as OAuthState });

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
    { user, affiliation }: { user: User; affiliation: string },
  ): Promise<{ newAffiliation: Affiliation } | { error: string }> {
    try {
      // Check if this affiliation already exists for this user
      const existing = await this.affiliations.findOne({ user, affiliation });
      if (existing) {
        throw new Error("Affiliation already exists for this user");
      }
      const affiliationId = freshID() as Affiliation;
      await this.affiliations.insertOne({
        _id: affiliationId,
        user,
        affiliation,
      });
      return { newAffiliation: affiliationId };
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
    { affiliation }: { affiliation: Affiliation },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.affiliations.deleteOne({ _id: affiliation });
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
    { affiliation, newAffiliation }: {
      affiliation: Affiliation;
      newAffiliation: string;
    },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      // Get the existing affiliation to check user
      const existing = await this.affiliations.findOne({ _id: affiliation });
      if (!existing) throw new Error("Affiliation not found");

      // Check if another affiliation with same user and newAffiliation already exists
      const duplicate = await this.affiliations.findOne({
        user: existing.user,
        affiliation: newAffiliation,
        _id: { $ne: affiliation },
      });
      if (duplicate) {
        throw new Error("Affiliation already exists for this user");
      }

      // Update the affiliation
      const res = await this.affiliations.updateOne(
        { _id: affiliation },
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
    { user, badge }: { user: User; badge: string },
  ): Promise<{ newBadge: Badge } | { error: string }> {
    try {
      // Check if this badge already exists for this user
      const existing = await this.badges.findOne({ user, badge });
      if (existing) {
        throw new Error("Badge already exists for this user");
      }
      const badgeId = freshID() as Badge;
      await this.badges.insertOne({ _id: badgeId, user, badge });
      return { newBadge: badgeId };
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
    { badge }: { badge: Badge },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.badges.deleteOne({ _id: badge });
      if (res.deletedCount === 0) throw new Error("Badge not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getORCIDsByUser(user: User) : (orcid: ORCIDDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one ORCID document
   * for the given user. Returns an empty array if no ORCIDs exist.
   */
  async _getORCIDsByUser(
    { user }: { user: User },
  ): Promise<
    Array<{
      orcid: {
        _id: ORCID;
        user: User;
        orcid: string;
        verified: boolean;
        verifiedAt?: Date;
        accessToken?: string;
      };
    }>
  > {
    try {
      const items = await this.orcids.find({ user }).toArray();
      // Queries must return an array of dictionaries, one per ORCID
      return items.map((o) => ({
        orcid: {
          _id: o._id,
          user: o.user,
          orcid: o.orcid,
          verified: o.verified,
          verifiedAt: o.verifiedAt,
          accessToken: o.accessToken,
        },
      }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _getAffiliationsByUser(user: User) : (affiliation: AffiliationDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one Affiliation document
   * for the given user. Returns an empty array if no affiliations exist.
   */
  async _getAffiliationsByUser(
    { user }: { user: User },
  ): Promise<
    Array<
      { affiliation: { _id: Affiliation; user: User; affiliation: string } }
    >
  > {
    try {
      const items = await this.affiliations.find({ user }).toArray();
      // Queries must return an array of dictionaries, one per affiliation
      return items.map((a) => ({
        affiliation: {
          _id: a._id,
          user: a.user,
          affiliation: a.affiliation,
        },
      }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _getBadgesByUser(user: User) : (badge: BadgeDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one Badge document
   * for the given user. Returns an empty array if no badges exist.
   */
  async _getBadgesByUser(
    { user }: { user: User },
  ): Promise<Array<{ badge: { _id: Badge; user: User; badge: string } }>> {
    try {
      const items = await this.badges.find({ user }).toArray();
      // Queries must return an array of dictionaries, one per badge
      return items.map((b) => ({
        badge: {
          _id: b._id,
          user: b.user,
          badge: b.badge,
        },
      }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _getORCIDFromState(state: String): (orcid: ORCID)
   *
   * **requires** the state exists and is not expired
   * **effects** returns the ORCID ID associated with the given OAuth state
   */
  async _getORCIDFromState(
    { state }: { state: string },
  ): Promise<Array<{ orcid: ORCID }>> {
    try {
      const stateDoc = await this.oauthStates.findOne({
        _id: state as OAuthState,
      });
      if (!stateDoc) {
        // State not found or expired
        return [];
      }
      // Check if state has expired
      if (stateDoc.expiresAt < new Date()) {
        return [];
      }
      return [{ orcid: stateDoc.orcid }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }
}
