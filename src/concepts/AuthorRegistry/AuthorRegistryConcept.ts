import { Collection, Db, ObjectId } from "npm:mongodb";
import { ID } from "@utils/types.ts";

// Generic types of this concept
type User = ID;
type Author = ID;
type NameVariation = ID;
type UserLink = ID;

/**
 * @concept AuthorRegistry [User]
 * @purpose maintain unique identities for authors of papers, managing their name variations and linking them to system users
 *
 * @principle authors are entities that can have multiple name variations (as they appear in papers). A system user can be linked to an author entity, claiming those works as their own.
 */

/**
 * a set of Authors with
 *   a canonicalName String
 *   an affiliations String[]
 *   an externalIds String[] 
 *   a website String?
 */
interface AuthorDoc {
  _id: ObjectId;
  canonicalName: string;
  affiliations: string[];
  externalIds: string[];
  website?: string;
}

/**
 * a set of NameVariations with
 *   a name String
 *   an author Author
 */
interface NameVariationDoc {
  _id: ObjectId;
  name: string;
  authorId: string; // Author ID
}

/**
 * a set of UserLinks with
 *   a user User
 *   an author Author
 */
interface UserLinkDoc {
  _id: ObjectId;
  user: string; // User ID
  authorId: string; // Author ID
}

export default class AuthorRegistryConcept {
  constructor(private readonly db: Db) {
    // Fire-and-forget index initialization
    void this.initIndexes();
  }

  private get authors(): Collection<AuthorDoc> {
    return this.db.collection("authors");
  }

  private get nameVariations(): Collection<NameVariationDoc> {
    return this.db.collection("nameVariations");
  }

  private get userLinks(): Collection<UserLinkDoc> {
    return this.db.collection("userLinks");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.nameVariations.createIndex({ name: 1 });
      await this.nameVariations.createIndex({ authorId: 1 });
      await this.userLinks.createIndex({ user: 1 }, { unique: true }); // One author per user? Or one link per user-author pair? Spec says "no existing UserLink for this user" in claimAuthor, implying one author per user?
      // Re-reading spec: "requires ... there is no existing UserLink for this user".
      // This implies a user can only claim one author.
      // But can an author be claimed by multiple users? Spec doesn't forbid it.
      await this.userLinks.createIndex({ authorId: 1 });
    } catch {
      // best-effort
    }
  }

  /**
   * createAuthor(canonicalName: String, affiliations: String[]) : (newAuthor: Author)
   *
   * **requires** nothing
   * **effects** creates a new Author with the given canonicalName and affiliations, and returns it. Also creates a NameVariation with the canonicalName pointing to this new author.
   */
  async createAuthor(
    { canonicalName, affiliations }: { canonicalName: string; affiliations: string[] },
  ): Promise<{ newAuthor: string } | { error: string }> {
    try {
      // Create author
      // @ts-expect-error - MongoDB generates _id automatically
      const authorRes = await this.authors.insertOne({
        canonicalName,
        affiliations,
        externalIds: [],
      });
      const authorId = String(authorRes.insertedId);

      // Create name variation
      // @ts-expect-error - MongoDB generates _id automatically
      await this.nameVariations.insertOne({
        name: canonicalName,
        authorId,
      });

      return { newAuthor: authorId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * addNameVariation(author: Author, name: String) : ()
   *
   * **requires** author exists, and name is not already in NameVariations
   * **effects** creates a new NameVariation linking the given name string to the author
   */
  async addNameVariation(
    { author, name }: { author: string; name: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      // Check if author exists
      const authorDoc = await this.authors.findOne({ _id: new ObjectId(author) });
      if (!authorDoc) throw new Error("Author not found");

      // Check if name variation exists (globally? or just for this author? Spec says "name is not already in NameVariations".
      // Usually this means globally unique name variations to avoid ambiguity.
      // If "J. Smith" points to Author A, it can't also point to Author B.
      // Let's assume global uniqueness for resolution purposes.)
      const existing = await this.nameVariations.findOne({ name });
      if (existing) {
        throw new Error("Name variation already exists");
      }

      // Create variation
      // @ts-expect-error - MongoDB generates _id automatically
      await this.nameVariations.insertOne({
        name,
        authorId: author,
      });

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * removeNameVariation(author: Author, name: String) : ()
   *
   * **requires** author exists, name is in NameVariations for this author, and name is not the author's canonicalName
   * **effects** removes the NameVariation
   */
  async removeNameVariation(
    { author, name }: { author: string; name: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const authorDoc = await this.authors.findOne({ _id: new ObjectId(author) });
      if (!authorDoc) throw new Error("Author not found");

      if (authorDoc.canonicalName === name) {
        throw new Error("Cannot remove canonical name variation");
      }

      const res = await this.nameVariations.deleteOne({
        authorId: author,
        name,
      });

      if (res.deletedCount === 0) throw new Error("Name variation not found for this author");

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * updateAuthorProfile(author: Author, website?: String, affiliations?: String[]) : ()
   *
   * **requires** author exists
   * **effects** updates the provided fields (website, affiliations). If a field is not provided, it remains unchanged.
   */
  async updateAuthorProfile(
    { author, website, affiliations }: { author: string; website?: string; affiliations?: string[] },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const authorDoc = await this.authors.findOne({ _id: new ObjectId(author) });
      if (!authorDoc) throw new Error("Author not found");

      const updateFields: { website?: string; affiliations?: string[] } = {};
      if (website !== undefined) updateFields.website = website;
      if (affiliations !== undefined) updateFields.affiliations = affiliations;

      if (Object.keys(updateFields).length === 0) return { ok: true };

      await this.authors.updateOne(
        { _id: new ObjectId(author) },
        { $set: updateFields },
      );

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * claimAuthor(user: User, author: Author) : ()
   *
   * **requires** user exists, author exists, and there is no existing UserLink for this user
   * **effects** creates a UserLink between the user and the author
   */
  async claimAuthor(
    { user, author }: { user: string; author: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const authorDoc = await this.authors.findOne({ _id: new ObjectId(author) });
      if (!authorDoc) throw new Error("Author not found");

      const existing = await this.userLinks.findOne({ user });
      if (existing) throw new Error("User already claimed an author");

      // @ts-expect-error - MongoDB generates _id automatically
      await this.userLinks.insertOne({
        user,
        authorId: author,
      });

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * unclaimAuthor(user: User, author: Author) : ()
   *
   * **requires** a UserLink exists between user and author
   * **effects** removes the UserLink
   */
  async unclaimAuthor(
    { user, author }: { user: string; author: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.userLinks.deleteOne({
        user,
        authorId: author,
      });

      if (res.deletedCount === 0) throw new Error("UserLink not found");

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * mergeAuthors(primary: Author, secondary: Author) : ()
   *
   * **requires** both authors exist and are not the same
   * **effects** moves all NameVariations from secondary to primary. Moves all UserLinks from secondary to primary (if a link for that user doesn't already exist on primary). Deletes the secondary Author.
   */
  async mergeAuthors(
    { primary, secondary }: { primary: string; secondary: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      if (primary === secondary) throw new Error("Cannot merge author into itself");

      const primaryDoc = await this.authors.findOne({ _id: new ObjectId(primary) });
      const secondaryDoc = await this.authors.findOne({ _id: new ObjectId(secondary) });

      if (!primaryDoc || !secondaryDoc) throw new Error("One or both authors not found");

      // Move NameVariations
      await this.nameVariations.updateMany(
        { authorId: secondary },
        { $set: { authorId: primary } },
      );

      // Move UserLinks
      // This is tricky because of the unique constraint on user.
      // If secondary has a user link that primary DOES NOT have, move it.
      // If primary already has a link for that user (unlikely given spec says 1 author per user, but if users claim multiple...), skip/delete.
      // Given spec: "requires ... no existing UserLink for this user", a user has AT MOST one author.
      // So if User A claims Secondary, User A CANNOT claim Primary.
      // So we can just update the authorId.
      await this.userLinks.updateMany(
        { authorId: secondary },
        { $set: { authorId: primary } },
      );

      // Delete secondary author
      await this.authors.deleteOne({ _id: new ObjectId(secondary) });

      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getAuthor(author: Author) : (author: AuthorDoc | null)
   *
   * **requires** nothing
   * **effects** returns the author document or null
   */
  async _getAuthor(
    { author }: { author: string },
  ): Promise<Array<{ author: AuthorDoc | null }>> {
    try {
      const doc = await this.authors.findOne({ _id: new ObjectId(author) });
      return [{ author: doc ?? null }];
    } catch {
      return [{ author: null }];
    }
  }

  /**
   * _getAuthorByUser(user: User) : (author: AuthorDoc | null)
   *
   * **requires** nothing
   * **effects** returns the author linked to this user, or null if none
   */
  async _getAuthorByUser(
    { user }: { user: string },
  ): Promise<Array<{ author: AuthorDoc | null }>> {
    try {
      const link = await this.userLinks.findOne({ user });
      if (!link) return [{ author: null }];

      const doc = await this.authors.findOne({ _id: new ObjectId(link.authorId) });
      return [{ author: doc ?? null }];
    } catch {
      return [{ author: null }];
    }
  }

  /**
   * _findAuthorsByName(nameQuery: String) : (matches: { author: AuthorDoc, matchType: String }[])
   *
   * **requires** nothing
   * **effects** returns authors where the canonicalName or any NameVariation matches the query string (partial or exact).
   */
  async _findAuthorsByName(
    { nameQuery }: { nameQuery: string },
  ): Promise<Array<{ matches: Array<{ author: AuthorDoc; matchType: string }> }>> {
    try {
      // Find matching name variations
      const regex = new RegExp(nameQuery, "i");
      const variations = await this.nameVariations.find({ name: regex }).toArray();
      
      const authorIds = [...new Set(variations.map(v => v.authorId))];
      const authors = await this.authors.find({ 
        _id: { $in: authorIds.map(id => new ObjectId(id)) } 
      }).toArray();

      const matches = authors.map(author => {
        // Find best match type (Canonical or Variation)
        const isCanonical = regex.test(author.canonicalName);
        return {
          author,
          matchType: isCanonical ? "Canonical" : "Variation"
        };
      });

      return [{ matches }];
    } catch {
      return [{ matches: [] }];
    }
  }

  /**
   * _resolveAuthor(exactName: String) : (author: AuthorDoc | null)
   *
   * **requires** nothing
   * **effects** returns the author that owns this specific name string variation, if any.
   */
  async _resolveAuthor(
    { exactName }: { exactName: string },
  ): Promise<Array<{ author: AuthorDoc | null }>> {
    try {
      const variation = await this.nameVariations.findOne({ name: exactName });
      if (!variation) return [{ author: null }];

      const doc = await this.authors.findOne({ _id: new ObjectId(variation.authorId) });
      return [{ author: doc ?? null }];
    } catch {
      return [{ author: null }];
    }
  }
}

