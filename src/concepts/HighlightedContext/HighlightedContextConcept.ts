import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

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
  _id: Context;
  paperId: string;
  author: User;
  location: Highlight;
  createdAt: number;
  parentContext?: Context;
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
      author: User;
      location: Highlight;
      kind?: AnchorKind;
      parentContext?: Context;
    },
  ): Promise<{ newContext: Context } | { error: string }> {
    try {
      console.log("[HighlightedContext.create] called with", {
        paperId,
        author,
        location,
        kind,
        parentContext,
      });
      // Validate parentContext exists if provided
      if (parentContext) {
        const parent = await this.contexts.findOne({ _id: parentContext });
        if (!parent) {
          console.warn(
            "[HighlightedContext.create] Parent context not found",
            parentContext,
          );
          return { error: "Parent context not found" };
        }
      }

      const now = Date.now();
      const contextId = freshID() as Context;
      const doc: ContextDoc = {
        _id: contextId,
        paperId,
        author,
        location,
        createdAt: now,
        ...(kind !== undefined && { kind }),
        ...(parentContext !== undefined && { parentContext }),
      };

      await this.contexts.insertOne(doc);
      console.log(
        "[HighlightedContext.create] Inserted context",
        contextId,
        "for paper",
        paperId,
      );
      return { newContext: contextId };
    } catch (e) {
      console.error(
        "[HighlightedContext.create] Error creating context",
        e,
      );
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getFilteredContexts(paperIds?: String[], authors?: User[]) : (filteredContext: Context)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one context for the given
   * paperIds (if provided) and/or authors (if provided). If both are provided, returns
   * contexts matching both criteria. Returns all contexts if neither parameter is provided.
   * Results are ordered by createdAt. Each context includes _id, paperId, author, location,
   * kind, parentContext, and createdAt. Returns an empty array if no contexts match the criteria.
   */
  async _getFilteredContexts(
    { paperIds, authors }: { paperIds?: string[]; authors?: User[] },
  ): Promise<
    Array<{
      filteredContext: {
        _id: Context;
        paperId: string;
        author: User;
        location: Highlight;
        kind?: AnchorKind;
        parentContext?: Context;
        createdAt: number;
      };
    }>
  > {
    try {
      const filter: Record<string, unknown> = {};
      if (paperIds && paperIds.length > 0) {
        filter.paperId = { $in: paperIds };
      }
      if (authors && authors.length > 0) {
        // Convert User[] to string[] for MongoDB (ID is a branded string)
        const authorStrings = authors as unknown as string[];
        filter.author = { $in: authorStrings };
      }

      const cur = this.contexts.find(filter).sort({ createdAt: 1 });
      const items = await cur.toArray();
      // Queries must return an array of dictionaries, one per context
      return items.map((c) => ({
        filteredContext: {
          _id: c._id,
          paperId: c.paperId,
          author: c.author,
          location: c.location,
          kind: c.kind,
          parentContext: c.parentContext,
          createdAt: c.createdAt,
        },
      }));
    } catch (e) {
      console.error("[HighlightedContext._getFilteredContexts] Error:", e);
      // On error, return empty array (queries should not throw)
      return [];
    }
  }
}
