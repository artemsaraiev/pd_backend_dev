import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type Highlight = ID;
type Paper = ID;

/**
 * @concept PdfHighlighter [Paper]
 * @purpose Store precise geometric locations and text content of highlights within PDF documents
 *
 * @principle highlights are defined by a set of normalized rectangles on a specific page of a paper,
 * optionally capturing the text contained within those rectangles
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * a set of Highlights with
 *   a paper Paper
 *   a page Number
 *   a rects Array<{x: Number, y: Number, w: Number, h: Number}>
 *   a quote String?
 */
interface HighlightDoc {
  _id: Highlight;
  paper: Paper;
  page: number;
  rects: Rect[];
  quote?: string;
  color?: string;
}

export default class PdfHighlighterConcept {
  constructor(private readonly db: Db) {
    // Fire-and-forget index initialization
    void this.initIndexes();
  }

  private get highlights(): Collection<HighlightDoc> {
    return this.db.collection("pdf_highlights");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.highlights.createIndex({ paper: 1 });
    } catch {
      // best-effort
    }
  }

  /**
   * createHighlight(paper: Paper, page: Number, rects: Array<{x: Number, y: Number, w: Number, h: Number}>, quote?: String) : (highlightId: Highlight)
   *
   * **requires** nothing
   * **effects** creates a new Highlight with the given paper, page, rects, and quote (if provided), and returns its ID
   */
  async createHighlight(
    { paper, page, rects, quote, color }: {
      paper: Paper;
      page: number;
      rects: Rect[];
      quote?: string;
      color?: string;
    },
  ): Promise<{ highlightId: Highlight } | { error: string }> {
    try {
      const highlightId = freshID() as Highlight;
      const doc: HighlightDoc = {
        _id: highlightId,
        paper,
        page,
        rects,
        ...(quote !== undefined && { quote }),
        ...(color !== undefined && { color }),
      };

      await this.highlights.insertOne(doc);
      return { highlightId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _get(highlight: Highlight) : (highlight: HighlightDoc | null)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the highlight document
   * for the given highlight ID in the `highlight` field, or null if it does not exist.
   */
  async _get(
    { highlight }: { highlight: Highlight },
  ): Promise<Array<{ highlight: HighlightDoc | null }>> {
    try {
      const doc = await this.highlights.findOne({ _id: highlight });
      return [{ highlight: doc ?? null }];
    } catch {
      return [{ highlight: null }];
    }
  }

  /**
   * _listByPaper(paper: Paper) : (highlight: HighlightDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one highlight
   * document for the given paper in the `highlight` field.
   */
  async _listByPaper(
    { paper }: { paper: Paper },
  ): Promise<Array<{ highlight: HighlightDoc }>> {
    try {
      const items = await this.highlights.find({ paper }).toArray();
      const docs = items as HighlightDoc[];
      // Queries must return an array of dictionaries, one per highlight
      // Return empty array if no highlights found (handled in sync's where clause)
      return docs.map((doc) => ({ highlight: doc }));
    } catch (e) {
      console.error("[PdfHighlighter._listByPaper] Error:", e);
      // On error, return empty array (queries should not throw)
      return [];
    }
  }
}
