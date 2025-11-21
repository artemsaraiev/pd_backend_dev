import { Collection, Db, ObjectId } from "npm:mongodb";
import { ID } from "@utils/types.ts";

// Generic types of this concept
type Highlight = ID;
type User = ID;
type Context = ID;

// Valid anchor kinds in the system
export type AnchorKind = "Section" | "Figure" | "Lines";

/**
 * @concept HighlightedContext [Highlight, User]
 * @purpose store regions of papers (lines, figures, sections) highlighted by users
 * as well as the parent context in which the region is highlighted
 *
 * @principle the user provides a location of the paper and kind of the region so that
 * this context can later be referenced by discussion/other users
 */

/**
 * a set of Contexts with
 *   a paperID String
 *   an author User
 *   a location Highlight
 *   a createdAt Date
 *   a parent Context?
 *   a kind Literal['Section'|'Figure'|'Lines']?
 */
interface ContextDoc {
  _id: ObjectId;
  paperId: string;
  author: string; // User ID
  location: string; // Highlight ID
  createdAt: number;
  parentContext?: string; // Context ID (optional)
  kind?: AnchorKind;
}

export default class HighlightedContextConcept {
  private readonly contexts: Collection<ContextDoc>;

  constructor(private readonly db: Db) {
    this.contexts = this.db.collection("anchors"); // Keep collection name for backward compatibility
  }

  /**
   * create(paperID: String, author: User, location: Highlight, kind?: Literal['Section'|'Figure'|'Lines'], parentContext?: Context) : (newContext: Context)
   *
   * **requires** parentContext, if provided, should be in a set of Contexts
   * **effects** inserts new Context into a set of Contexts with provided fields,
   * current creation timestamp and missing editedAt timestamp and returns newContext
   */
  async create(
    {
      paperId,
      author,
      location,
      kind,
      parentContext,
    }: {
      paperId: string;
      author: string; // User ID
      location: string; // Highlight ID
      kind?: AnchorKind;
      parentContext?: string; // Context ID
    },
  ): Promise<{ newContext: string } | { error: string }> {
    try {
      // Validate parentContext exists if provided
      if (parentContext) {
        const parent = await this.contexts.findOne({
          _id: new ObjectId(parentContext),
        }).catch(() => null);
        if (!parent) {
          return { error: "Parent context not found" };
        }
      }

      const now = Date.now();
      const doc = {
        paperId,
        author,
        location,
        createdAt: now,
        ...(kind !== undefined && { kind }),
        ...(parentContext !== undefined && { parentContext }),
      };

      // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
      // This cast matches the pattern used in DiscussionPub and other concepts
      // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
      const res = await this.contexts.insertOne(doc);
      return { newContext: String(res.insertedId) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getFilteredContexts(filter: (user: User, paper: String) => Boolean) : (filteredContexts: Context[])
   *
   * **requires** nothing
   * **effects** returns a subset of Contexts with users and papers that match the
   * filter (e.g. for all contexts specific to a group of users for a specific paper)
   *
   * Note: Since JavaScript functions cannot be serialized over HTTP, this implementation
   * accepts filter criteria as parameters (paperIds and authors arrays) instead of a function.
   */
  async _getFilteredContexts(
    { paperIds, authors }: { paperIds?: string[]; authors?: string[] },
  ): Promise<
    Array<
      {
        filteredContexts: Array<
          {
            _id: string;
            paperId: string;
            author: string;
            location: string;
            kind?: AnchorKind;
            parentContext?: string;
            createdAt: number;
          }
        >;
      }
    >
  > {
    try {
      const filter: Record<string, unknown> = {};
      if (paperIds && paperIds.length > 0) {
        filter.paperId = { $in: paperIds };
      }
      if (authors && authors.length > 0) {
        filter.author = { $in: authors };
      }

      const cur = this.contexts.find(filter).sort({ createdAt: 1 });
      const items = await cur.toArray();
      const filteredContexts = items.map((c) => ({
        _id: String(c._id),
        paperId: c.paperId,
        author: c.author,
        location: c.location,
        kind: c.kind,
        parentContext: c.parentContext,
        createdAt: c.createdAt,
      }));

      // Queries must return an array of dictionaries
      return [{ filteredContexts }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [{ filteredContexts: [] }];
    }
  }
}
