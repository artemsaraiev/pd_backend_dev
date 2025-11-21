import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";

// Generic types of this concept
type Paper = ID;
type Author = ID;

/**
 * @concept PaperIndex
 * @purpose registry of papers by id (DOI or arXiv) with minimal metadata
 *
 * @principle papers can be added to the index, and paper metadata relevant to
 * us can be updated
 */

/**
 * a set of Papers with
 *   a paperId String
 *   an authors Author[]
 *   a links String[]
 *   a title String?
 */
interface PaperDoc {
  _id: string; // paperId (external unique identifier)
  title?: string;
  authors: string[]; // Author IDs
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
   * searchArxiv: simple arXiv search by query string.
   * Returns up to 10 items with arXiv id and title.
   */
  async searchArxiv(
    { q }: { q: string },
  ): Promise<
    { result: Array<{ id: string; title?: string }> } | { error: string }
  > {
    try {
      const query = q.trim();
      if (!query) return { result: [] };
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
      return { result: items };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
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
  ): Promise<{ paper: string } | { error: string }> {
    try {
      const setOnInsert: Record<string, unknown> = {
        _id: paperId,
        authors: [],
        links: [],
        createdAt: Date.now(),
      };
      if (title !== undefined) setOnInsert.title = title;
      await this.papers.updateOne(
        { _id: paperId },
        { $setOnInsert: setOnInsert },
        { upsert: true },
      );
      return { paper: paperId };
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
    { paper, title }: { paper: string; title: string },
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
    { paper, authors }: { paper: string; authors: string[] },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.papers.updateOne(
        { _id: paper },
        { $addToSet: { authors: { $each: authors } } },
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
    { paper, authors }: { paper: string; authors: string[] },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.papers.updateOne(
        { _id: paper },
        { $pull: { authors: { $in: authors } } },
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
    { paper, url }: { paper: string; url: string },
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
    { paper, url }: { paper: string; url: string },
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
   * for the given paper in the `paper` field, or null if the paper does not exist.
   * Returns an array with one dictionary containing `{ paper: PaperDoc | null }`.
   */
  async _get(
    { paper }: { paper: string },
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
   * _listRecent(limit?: Number) : (papers: PaperDoc[])
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the most recently
   * created papers in the `papers` field, limited by the provided limit (default 20).
   * Results are ordered by createdAt descending. Each paper includes _id, title, and
   * createdAt. Returns an array with one dictionary containing `{ papers: PaperDoc[] }`.
   */
  async _listRecent(
    { limit }: { limit?: number },
  ): Promise<
    Array<
      { papers: Array<{ _id: string; title?: string; createdAt?: number }> }
    >
  > {
    try {
      const cur = this.papers
        .find({}, {
          projection: { _id: 1, title: 1, createdAt: 1, authors: 1, links: 1 },
        })
        .sort({ createdAt: -1 })
        .limit(limit ?? 20);
      const items = await cur.toArray();
      const papers = items as Array<PaperDoc>;
      // Queries must return an array of dictionaries
      return [{ papers }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [{ papers: [] }];
    }
  }
}
