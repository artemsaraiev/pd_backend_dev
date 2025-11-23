import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type Paper = ID;
type Author = ID;

/**
 * @concept PaperIndex [Author]
 * @purpose registry of papers by id (DOI or arXiv) with minimal metadata
 *
 * @principle papers can be added to the index, and paper metadata relevant to
 * us can be updated
 */

/**
 * a set of Papers with
 *   a paperId String (external unique identifier: DOI, arXiv, etc.)
 *   an authors Author[]
 *   a links String[]
 *   a title String?
 *   a createdAt Date
 *
 * Note: Both _id and paperId are stored separately:
 * - _id: MongoDB's internal document identifier (generated with freshID())
 * - paperId: External unique identifier (DOI, arXiv, etc.) from outside the system
 */
interface PaperDoc {
  _id: Paper; // MongoDB internal document ID (generated with freshID())
  paperId: string; // External unique identifier (DOI, arXiv, etc.)
  title?: string;
  authors: Author[]; // Author IDs
  links: string[];
  createdAt?: number; // Implementation detail for ordering
}

export default class PaperIndexConcept {
  constructor(private readonly db: Db) {
  }

  private get papers(): Collection<PaperDoc> {
    return this.db.collection("papers");
  }

  /**
   * _searchArxiv(q: String) : (result: {id: String, title?: String})
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one search result
   * from the arXiv API matching the query string. Each result includes an id (arXiv identifier)
   * and optionally a title. Returns an empty array if no results are found.
   */
  async _searchArxiv(
    { q }: { q: string },
  ): Promise<Array<{ result: { id: string; title?: string } }>> {
    try {
      const query = q.trim();
      if (!query) return [];
      const url = `http://export.arxiv.org/api/query?search_query=all:${
        encodeURIComponent(query)
      }&start=0&max_results=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);
      const xml = await res.text();
      const items: Array<{ id: string; title?: string }> = [];
      const entryRegex = /<entry[\s\S]*?<\/entry>/g;
      const entries = xml.match(entryRegex) ?? [];
      for (const e of entries) {
        const idMatch = e.match(/<id>\s*([^<]+)\s*<\/id>/);
        const titleMatch = e.match(/<title>\s*([\s\S]*?)\s*<\/title>/);
        if (!idMatch) continue;
        const linkText = idMatch[1];
        const m = linkText.match(/arxiv\.org\/abs\/([^/]+)$/);
        const id = m ? m[1] : linkText;
        const title = titleMatch
          ? titleMatch[1].replace(/\s+/g, " ").trim()
          : undefined;
        items.push({ id, title });
      }
      // Queries must return an array of dictionaries, one per result
      return items.map((result) => ({ result }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * ensure(paperId: String, title?: String) : (paper: Paper)
   *
   * **requires** nothing
   * **effects** if paper with given paperId is in the set of Papers, returns it.
   * Otherwise, creates a new paper with the given paperId and title (if provided),
   * and links and authors arrays set to empty arrays, and returns the new paper
   */
  async ensure(
    { paperId, title }: { paperId: string; title?: string },
  ): Promise<{ paper: Paper } | { error: string }> {
    try {
      // Check if paper with this paperId already exists
      const existing = await this.papers.findOne({ paperId });
      if (existing) {
        return { paper: existing._id };
      }

      // Create new paper with fresh internal ID
      const internalId = freshID() as Paper;
      const doc: PaperDoc = {
        _id: internalId,
        paperId: paperId,
        authors: [],
        links: [],
        createdAt: Date.now(),
      };
      if (title !== undefined) doc.title = title;

      await this.papers.insertOne(doc);
      return { paper: internalId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * updateMeta(paper: Paper, title: String) : ()
   *
   * **requires** the paper is in the set of Papers
   * **effects** sets the title of the paper to the provided title
   */
  async updateMeta(
    { paper, title }: { paper: Paper; title: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.papers.updateOne(
        { _id: paper },
        { $set: { title } },
      );
      if (res.matchedCount === 0) throw new Error("Paper not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * addAuthors(paper: Paper, authors: Author[]) : ()
   *
   * **requires** the paper is in the set of Papers
   * **effects** for each author in the provided authors array, if the author is not
   * in the authors array of the paper, adds the author to the authors array of the
   * paper
   */
  async addAuthors(
    { paper, authors }: { paper: Paper; authors: Author[] },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      // Convert Author[] to string[] for MongoDB (ID is a branded string)
      const authorStrings = authors as unknown as string[];
      const res = await this.papers.updateOne(
        { _id: paper },
        // @ts-expect-error - MongoDB types don't understand branded ID types, but at runtime these are strings
        { $addToSet: { authors: { $each: authorStrings } } },
      );
      if (res.matchedCount === 0) throw new Error("Paper not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * removeAuthors(paper: Paper, authors: Author[]) : ()
   *
   * **requires** the paper is in the set of Papers
   * **effects** for each author in the provided authors array, if the author is in
   * the authors array of the paper, removes the author from the authors array of the
   * paper
   */
  async removeAuthors(
    { paper, authors }: { paper: Paper; authors: Author[] },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      // Convert Author[] to string[] for MongoDB (ID is a branded string)
      const authorStrings = authors as unknown as string[];
      const res = await this.papers.updateOne(
        { _id: paper },
        // @ts-expect-error - MongoDB types don't understand branded ID types, but at runtime these are strings
        { $pull: { authors: { $in: authorStrings } } },
      );
      if (res.matchedCount === 0) throw new Error("Paper not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * addLink(paper: Paper, url: String) : ()
   *
   * **requires** the paper is in the set of Papers
   * **effects** if the url is not in the links array of the paper, adds the url to
   * the links array of the paper
   */
  async addLink(
    { paper, url }: { paper: Paper; url: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.papers.updateOne(
        { _id: paper },
        { $addToSet: { links: url } },
      );
      if (res.matchedCount === 0) throw new Error("Paper not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * removeLink(paper: Paper, url: String) : ()
   *
   * **requires** the paper is in the set of Papers
   * **effects** if the url is in the links array of the paper, removes the url from
   * the links array of the paper. If url is not in the links array of the paper, does
   * nothing
   */
  async removeLink(
    { paper, url }: { paper: Paper; url: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.papers.updateOne(
        { _id: paper },
        { $pull: { links: url } },
      );
      if (res.matchedCount === 0) throw new Error("Paper not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _get(paper: Paper) : (paper: PaperDoc | null)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the paper document
   * for the given paper (by internal _id) in the `paper` field, or null if the paper does not exist.
   * Returns an array with one dictionary containing `{ paper: PaperDoc | null }`.
   */
  async _get(
    { paper }: { paper: Paper },
  ): Promise<Array<{ paper: PaperDoc | null }>> {
    try {
      const result = await this.papers.findOne({ _id: paper });
      // Queries must return an array of dictionaries
      return [{ paper: result ?? null }];
    } catch {
      // On error, return array with null (queries should not throw)
      return [{ paper: null }];
    }
  }

  /**
   * _getByPaperId(paperId: String) : (paper: PaperDoc | null)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the paper document
   * for the given external paperId in the `paper` field, or null if the paper does not exist.
   * Returns an array with one dictionary containing `{ paper: PaperDoc | null }`.
   */
  async _getByPaperId(
    { paperId }: { paperId: string },
  ): Promise<Array<{ paper: PaperDoc | null }>> {
    try {
      const result = await this.papers.findOne({ paperId });
      // Queries must return an array of dictionaries
      return [{ paper: result ?? null }];
    } catch {
      // On error, return array with null (queries should not throw)
      return [{ paper: null }];
    }
  }

  /**
   * _listRecent(limit?: Number) : (paper: PaperDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one paper document
   * for the most recently created papers, limited by the provided limit (default 20).
   * Results are ordered by createdAt descending. Each paper includes _id, title, and
   * createdAt. Returns an empty array if no papers exist.
   */
  async _listRecent(
    { limit }: { limit?: number },
  ): Promise<
    Array<{
      paper: {
        _id: Paper;
        paperId: string;
        title?: string;
        createdAt?: number;
        authors: Author[];
        links: string[];
      };
    }>
  > {
    try {
      const cur = this.papers
        .find({}, {
          projection: {
            _id: 1,
            paperId: 1,
            title: 1,
            createdAt: 1,
            authors: 1,
            links: 1,
          },
        })
        .sort({ createdAt: -1 })
        .limit(limit ?? 20);
      const items = await cur.toArray();
      const papers = items as Array<PaperDoc>;
      // Queries must return an array of dictionaries, one per paper
      return papers.map((paper) => ({ paper }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }
}
