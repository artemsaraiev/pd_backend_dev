import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type Paper = ID;
type Author = ID;

// Source type for paper origin
type PaperSource = "arxiv" | "biorxiv" | "other";

/**
 * @concept PaperIndex [Author]
 * @purpose registry of papers by id (DOI, arXiv, or bioRxiv) with minimal metadata
 *
 * @principle papers can be added to the index, and paper metadata relevant to
 * us can be updated
 */

/**
 * a set of Papers with
 *   a paperId String (external unique identifier: DOI, arXiv, bioRxiv, etc.)
 *   an authors Author[]
 *   a links String[]
 *   a title String?
 *   a source "arxiv" | "biorxiv" | "other"
 *   a createdAt Date
 *
 * Note: Both _id and paperId are stored separately:
 * - _id: MongoDB's internal document identifier (generated with freshID())
 * - paperId: External unique identifier (DOI, arXiv, bioRxiv, etc.) from outside the system
 */
interface PaperDoc {
  _id: Paper; // MongoDB internal document ID (generated with freshID())
  paperId: string; // External unique identifier (DOI, arXiv, bioRxiv, etc.)
  title?: string;
  authors: Author[]; // Author IDs
  links: string[];
  source: PaperSource; // Paper source: "arxiv", "biorxiv", or "other"
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
      const url = `https://export.arxiv.org/api/query?search_query=all:${
        encodeURIComponent(query)
      }&start=0&max_results=10`;
      
      // Retry logic for rate limiting (429 errors)
      let res: Response;
      let retries = 3;
      let delay = 2000; // Start with 2 seconds
      
      while (retries > 0) {
        res = await fetch(url);
        
        if (res.status === 429) {
          // Rate limited - wait and retry
          retries--;
          if (retries > 0) {
            console.warn(`[PaperIndex._searchArxiv] Rate limited (429), retrying in ${delay}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff: 2s, 4s, 8s
          } else {
            console.error(`[PaperIndex._searchArxiv] Rate limited (429) after retries for query "${query}"`);
            return [];
          }
        } else if (!res.ok) {
          console.error(`[PaperIndex._searchArxiv] arXiv API error: ${res.status} for query "${query}"`);
          return [];
        } else {
          // Success - break out of retry loop
          break;
        }
      }
      
      const xml = await res!.text();
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
      console.log(`[PaperIndex._searchArxiv] Found ${items.length} results for query "${query}"`);
      // Queries must return an array of dictionaries, one per result
      return items.map((result) => ({ result }));
    } catch (e) {
      // On error, log and return empty array (queries should not throw)
      console.error(`[PaperIndex._searchArxiv] Error searching arXiv for "${q}":`, e);
      return [];
    }
  }

  /**
   * ensure(paperId: String, title?: String, source?: "arxiv" | "biorxiv" | "other") : (paper: Paper)
   *
   * **requires** nothing
   * **effects** if paper with given paperId is in the set of Papers, returns it.
   * Otherwise, creates a new paper with the given paperId, title (if provided),
   * source (defaults to "arxiv" if not provided), and links and authors arrays
   * set to empty arrays, and returns the new paper
   */
  async ensure(
    { paperId, title, source }: {
      paperId: string;
      title?: string;
      source?: PaperSource;
    },
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
        source: source ?? "arxiv", // Default to "arxiv" for backward compatibility
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
   * _get(paper: Paper) : (paper: PaperDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the paper document
   * for the given paper (by internal _id) in the `paper` field. Returns an array with
   * one dictionary containing `{ paper: PaperDoc }` if the paper exists, or an empty
   * array if the paper does not exist.
   */
  async _get(
    { paper }: { paper: Paper },
  ): Promise<Array<{ paper: PaperDoc }>> {
    try {
      const result = await this.papers.findOne({ _id: paper });
      if (!result) {
        return [];
      }
      // Queries must return an array of dictionaries
      return [{ paper: result }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _getByPaperId(paperId: String) : (paper: PaperDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing the paper document
   * for the given external paperId in the `paper` field. Returns an array with one dictionary
   * containing `{ paper: PaperDoc }` if the paper exists, or an empty array if the paper
   * does not exist.
   */
  async _getByPaperId(
    { paperId }: { paperId: string },
  ): Promise<Array<{ paper: PaperDoc }>> {
    try {
      const result = await this.papers.findOne({ paperId });
      if (!result) {
        return [];
      }
      // Queries must return an array of dictionaries
      return [{ paper: result }];
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _listRecent(limit?: Number, source?: "arxiv" | "biorxiv" | "other") : (paper: PaperDoc)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one paper document
   * for the most recently created papers, limited by the provided limit (default 20).
   * If source is provided, filters to only papers with that source. Results are ordered
   * by createdAt descending. Each paper includes _id, title, source, and createdAt.
   * Returns an empty array if no papers exist.
   */
  async _listRecent(
    { limit, source }: { limit?: number; source?: PaperSource },
  ): Promise<
    Array<{
      paper: {
        _id: Paper;
        paperId: string;
        title?: string;
        source?: PaperSource;
        createdAt?: number;
        authors: Author[];
        links: string[];
      };
    }>
  > {
    try {
      // Build filter based on optional source parameter
      const filter: Record<string, unknown> = {};
      if (source) {
        filter.source = source;
      }

      const cur = this.papers
        .find(filter, {
          projection: {
            _id: 1,
            paperId: 1,
            title: 1,
            source: 1,
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

  /**
   * _searchBiorxiv(q: String) : (result: {id: String, title?: String, doi?: String})
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one search result
   * from the Europe PMC API matching the query string for bioRxiv preprints. Each result
   * includes an id (bioRxiv identifier), optionally a title, and optionally a DOI.
   * Returns an empty array if no results are found.
   */
  async _searchBiorxiv(
    { q }: { q: string },
  ): Promise<Array<{ result: { id: string; title?: string; doi?: string } }>> {
    try {
      const query = q.trim();
      if (!query) return [];

      // Use Europe PMC API to search for bioRxiv preprints
      // SRC:PPR filters to preprints; bioRxiv DOIs start with 10.1101/
      const url =
        `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${
          encodeURIComponent(query)
        }%20AND%20(SRC:PPR)&format=json&pageSize=25`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Europe PMC API error: ${res.status}`);

      const data = await res.json();
      const results = data.resultList?.result ?? [];

      const items: Array<{ id: string; title?: string; doi?: string }> = [];
      for (const r of results) {
        const doi = r.doi;
        // bioRxiv DOIs start with 10.1101/ (medRxiv uses 10.1101/ too but different pattern)
        // Accept any preprint with a 10.1101 DOI
        const isBiorxiv = doi?.startsWith("10.1101/") ||
          r.bookOrReportDetails?.publisher?.toLowerCase()?.includes("biorxiv");

        if (isBiorxiv) {
          // Extract bioRxiv ID from DOI (format: 10.1101/YYYY.MM.DD.XXXXXX)
          const id = doi ? doi.replace("10.1101/", "") : r.id;
          items.push({
            id,
            title: r.title,
            doi,
          });
        }
      }

      // Queries must return an array of dictionaries, one per result
      return items.map((result) => ({ result }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _listRecentBiorxiv(limit?: Number) : (result: {id: String, title?: String, doi?: String})
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one recent bioRxiv
   * preprint from the bioRxiv API. Each result includes an id (DOI), optionally a title.
   * Results are ordered by date descending. Limited by the provided limit (default 10).
   * Returns an empty array if no results are found.
   */
  async _listRecentBiorxiv(
    { limit }: { limit?: number },
  ): Promise<Array<{ result: { id: string; title?: string; doi?: string } }>> {
    try {
      // bioRxiv API uses date ranges. Get papers from last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const formatDate = (d: Date) => d.toISOString().split("T")[0];
      const interval = `${formatDate(startDate)}/${formatDate(endDate)}`;

      const url = `https://api.biorxiv.org/details/biorxiv/${interval}/0/50`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`bioRxiv API error: ${res.status}`);

      const data = await res.json();
      const collection = data.collection ?? [];

      const maxResults = limit ?? 10;
      const items: Array<{ id: string; title?: string; doi?: string }> = [];

      for (const paper of collection) {
        if (items.length >= maxResults) break;

        const doi = paper.doi;
        // Extract ID from DOI (format: 10.1101/YYYY.MM.DD.XXXXXX)
        const id = doi ? doi.replace("10.1101/", "") : paper.biorxiv_doi;

        items.push({
          id,
          title: paper.title,
          doi,
        });
      }

      // Queries must return an array of dictionaries, one per result
      return items.map((result) => ({ result }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }
}
