import { Collection, Db, ObjectId } from "npm:mongodb";
import { ID } from "@utils/types.ts";

// Generic types of this concept
type User = ID;
type Anchor = ID;
type Pub = ID;
type Thread = ID;
type Reply = ID;

/**
 * @concept DiscussionPub [User, Anchor]
 * @purpose per-paper forum with threads and replies, anchored to some context
 *
 * @principle pub is created for a paper to be discussed; threads are created by the
 * users of the paper in relation to some context, replies are created by the users in
 * relation to a thread
 */

/**
 * a set of Pubs with
 *   a paperId String
 *   a createdAt Date
 */
interface PubDoc {
  _id: ObjectId;
  paperId: string;
  createdAt: number;
}

/**
 * a set of Threads with
 *   an author User
 *   a pub Pub
 *   an anchor Anchor
 *   a title String
 *   a body String
 *   a deleted Boolean
 *   a createdAt Date
 *   an editedAt Date?
 */
interface ThreadDoc {
  _id: ObjectId;
  pubId: string;
  author: string; // User ID
  anchorId?: string; // Anchor ID (optional)
  title: string;
  body: string;
  deleted: boolean;
  createdAt: number;
  editedAt?: number;
}

/**
 * a set of Replies with
 *   a thread Thread
 *   an author User
 *   an anchor Anchor
 *   a body String
 *   a deleted Boolean
 *   a createdAt Date
 *   a parent Reply?
 *   an editedAt Date?
 */
interface ReplyDoc {
  _id: ObjectId;
  threadId: string;
  parentId?: string; // Reply ID (optional)
  author: string; // User ID
  anchorId?: string; // Anchor ID (optional)
  body: string;
  deleted: boolean;
  createdAt: number;
  editedAt?: number;
}

interface ReplyTreeNode {
  _id: string;
  author: string;
  body: string;
  anchorId?: string;
  createdAt: number;
  editedAt?: number;
  parentId?: string;
  children: ReplyTreeNode[];
}

export default class DiscussionPubConcept {
  constructor(private readonly db: Db) {
    // Fire-and-forget index initialization
    void this.initIndexes();
  }

  private get pubs(): Collection<PubDoc> {
    return this.db.collection("pubs");
  }
  private get threads(): Collection<ThreadDoc> {
    return this.db.collection("threads");
  }
  private get replies(): Collection<ReplyDoc> {
    return this.db.collection("replies");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.pubs.createIndex({ paperId: 1 }, { unique: true });
      await this.threads.createIndex({ pubId: 1 });
      await this.replies.createIndex({ threadId: 1 });
      await this.replies.createIndex({ parentId: 1 });
    } catch {
      // best-effort
    }
  }

  /**
   * open(paperId: String) : (newPub: Pub)
   *
   * **requires** there is no pub with the given paperId in the set of Pubs
   * **effects** inserts a new pub with the given paperId and current timestamp into
   * the set of Pubs and returns it
   */
  async open(
    { paperId }: { paperId: string },
  ): Promise<{ newPub: string } | { result: string } | { error: string }> {
    try {
      const now = Date.now();
      try {
        // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
        // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
        const res = await this.pubs.insertOne({ paperId, createdAt: now });
        const pubId = String(res.insertedId);
        // Support both return types for backward compatibility
        return { newPub: pubId, result: pubId } as {
          newPub: string;
          result: string;
        };
      } catch (e) {
        if (String(e).includes("duplicate key")) {
          throw new Error("Pub already exists for paperId");
        }
        throw e;
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * startThread(pub: Pub, author: User, anchor: Anchor, title: String, body: String) : (newThread: Thread)
   *
   * **requires** the pub is in the set of Pubs
   * **effects** inserts a new thread with the given pub, author, anchor, title, body,
   * current timestamp, deleted flag set to false and editedAt set to null and returns it
   *
   * Note: title is optional for backward compatibility (defaults to empty string if not provided)
   */
  async startThread(
    {
      pubId,
      author,
      anchorId,
      title,
      body,
    }: {
      pubId: string; // Pub ID
      author: string; // User ID
      anchorId?: string; // Anchor ID (optional)
      title?: string; // Optional for backward compatibility
      body: string;
    },
  ): Promise<{ newThread: string } | { result: string } | { error: string }> {
    try {
      const pub = await this.pubs.findOne({ _id: new ObjectId(pubId) }).catch(
        () => null,
      );
      if (!pub) throw new Error("Pub not found");
      const now = Date.now();
      const doc = {
        pubId,
        author,
        title: title ?? "", // Default to empty string for backward compatibility
        body,
        deleted: false,
        createdAt: now,
        ...(anchorId !== undefined && { anchorId }),
      };
      // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
      // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
      const res = await this.threads.insertOne(doc);
      const threadId = String(res.insertedId);
      // Support both return types for backward compatibility
      return { newThread: threadId, result: threadId } as {
        newThread: string;
        result: string;
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * makeReply(thread: Thread, author: User, anchor: Anchor, body: String, parentReply?: Reply) : (newReply: Reply)
   *
   * **requires** the thread is in the set of Threads; the parentReply, if provided,
   * should be in the set of Replies and the thread of the parentReply should be the
   * same as the thread.
   * **effects** inserts a new reply with the given thread, author, anchor, body,
   * current timestamp, deleted flag set to false, and editedAt set to null into the
   * set of Replies and returns it. If a parentReply is provided, it is set as the
   * parent of the new reply.
   */
  async makeReply(
    {
      threadId,
      author,
      anchorId,
      body,
      parentReply,
    }: {
      threadId: string; // Thread ID
      author: string; // User ID
      anchorId?: string; // Anchor ID (optional)
      body: string;
      parentReply?: string; // Reply ID (optional)
    },
  ): Promise<{ newReply: string } | { result: string } | { error: string }> {
    try {
      const th = await this.threads.findOne({ _id: new ObjectId(threadId) })
        .catch(() => null);
      if (!th) throw new Error("Thread not found");
      if (parentReply) {
        const parent = await this.replies.findOne({
          _id: new ObjectId(parentReply),
        }).catch(() => null);
        if (!parent) throw new Error("Parent reply not found");
        if (String(parent.threadId) !== String(threadId)) {
          throw new Error("Parent/thread mismatch");
        }
      }
      const now = Date.now();
      const doc = {
        threadId,
        author,
        body,
        deleted: false,
        createdAt: now,
        ...(anchorId !== undefined && { anchorId }),
        ...(parentReply !== undefined && { parentId: parentReply }),
      };
      // MongoDB insertOne accepts documents without _id (it generates one), but our Collection type requires it
      // @ts-expect-error - MongoDB generates _id automatically, type definition is too strict
      const res = await this.replies.insertOne(doc);
      const replyId = String(res.insertedId);
      // Support both return types for backward compatibility
      return { newReply: replyId, result: replyId } as {
        newReply: string;
        result: string;
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * @deprecated Use makeReply instead. This method is kept for backward compatibility.
   */
  async reply(
    { threadId, author, body }: {
      threadId: string;
      author: string;
      body: string;
    },
  ): Promise<{ result: string } | { error: string }> {
    const result = await this.makeReply({ threadId, author, body });
    if ("error" in result) return result;
    // makeReply returns both newReply and result for compatibility
    const replyResult = result as { newReply: string; result: string };
    return { result: replyResult.newReply };
  }

  /**
   * @deprecated Use makeReply instead. This method is kept for backward compatibility.
   */
  async replyTo(
    { threadId, parentId, author, body }: {
      threadId: string;
      parentId?: string;
      author: string;
      body: string;
    },
  ): Promise<{ result: string } | { error: string }> {
    const result = await this.makeReply({
      threadId,
      author,
      body,
      parentReply: parentId,
    });
    if ("error" in result) return result;
    // makeReply returns both newReply and result for compatibility
    const replyResult = result as { newReply: string; result: string };
    return { result: replyResult.newReply };
  }

  /**
   * editThread(thread: Thread, newTitle: String, newBody: String) : ()
   *
   * **requires** the thread is in the set of Threads
   * **effects** updates the title and body of the thread with the new values and
   * sets the editedAt to current timestamp
   */
  async editThread(
    {
      threadId,
      newTitle,
      newBody,
    }: {
      threadId: string; // Thread ID
      newTitle?: string; // Optional for backward compatibility
      newBody: string;
    },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const update: Record<string, unknown> = {
        body: newBody,
        editedAt: Date.now(),
      };
      if (newTitle !== undefined) update.title = newTitle;
      const res = await this.threads.updateOne(
        { _id: new ObjectId(threadId) },
        { $set: update },
      );
      if (res.matchedCount === 0) throw new Error("Thread not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * deleteThread(thread: Thread) : ()
   *
   * **requires** the thread is in the set of Threads
   * **effects** sets the deleted flag of the thread to true and sets the editedAt to
   * current timestamp
   */
  async deleteThread(
    { threadId }: { threadId: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.threads.updateOne(
        { _id: new ObjectId(threadId) },
        { $set: { deleted: true, editedAt: Date.now() } },
      );
      if (res.matchedCount === 0) throw new Error("Thread not found");
      // Also mark all replies as deleted (cascade soft delete)
      await this.replies.updateMany(
        { threadId },
        { $set: { deleted: true, editedAt: Date.now() } },
      );
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  async editReply(
    { replyId, newBody }: { replyId: string; newBody: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.replies.updateOne(
        { _id: new ObjectId(replyId) },
        { $set: { body: newBody, editedAt: Date.now() } },
      );
      if (res.matchedCount === 0) throw new Error("Reply not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * deleteReply(reply: Reply) : ()
   *
   * **requires** the reply is in the set of Replies
   * **effects** sets the deleted flag of the reply to true and sets the editedAt to
   * current timestamp
   */
  async deleteReply(
    { replyId }: { replyId: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.replies.updateOne(
        { _id: new ObjectId(replyId) },
        { $set: { deleted: true, editedAt: Date.now() } },
      );
      if (res.matchedCount === 0) throw new Error("Reply not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _getPubIdByPaper(paperId: String) : (result: Pub | null)
   *
   * **requires** nothing
   * **effects** returns the Pub ID for the given paperId, or null if no pub exists
   */
  async _getPubIdByPaper(
    { paperId }: { paperId: string },
  ): Promise<{ result: string | null } | { error: string }> {
    try {
      const doc = await this.pubs.findOne({ paperId });
      return { result: doc?._id ? String(doc._id) : null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _listThreads(pub: Pub, anchor?: Anchor) : (threads: Thread[])
   *
   * **requires** nothing
   * **effects** returns all non-deleted threads for the given pub, optionally filtered
   * by anchor. Results are ordered by createdAt.
   */
  async _listThreads(
    { pubId, anchorId }: { pubId: string; anchorId?: string },
  ): Promise<
    {
      result: Array<
        {
          _id: string;
          author: string;
          title: string;
          body: string;
          anchorId?: string;
          createdAt: number;
          editedAt?: number;
        }
      >;
    } | {
      error: string;
    }
  > {
    try {
      const filter: Record<string, unknown> = {
        pubId,
        $or: [{ deleted: false }, { deleted: { $exists: false } }],
      };
      if (anchorId) filter.anchorId = anchorId;
      const cur = this.threads.find(filter).sort({ createdAt: 1 });
      const items = await cur.toArray();
      const result = items.map((t) => ({
        _id: String(t._id),
        author: t.author,
        title: t.title ?? "", // Default for backward compatibility
        body: t.body,
        anchorId: t.anchorId,
        createdAt: t.createdAt,
        editedAt: t.editedAt,
      }));
      return { result };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _listReplies(thread: Thread) : (replies: Reply[])
   *
   * **requires** nothing
   * **effects** returns all non-deleted replies for the given thread, ordered by
   * createdAt. Each reply includes _id, author, body, anchorId, parentId, createdAt,
   * and editedAt.
   */
  async _listReplies(
    { threadId }: { threadId: string },
  ): Promise<
    {
      result: Array<
        {
          _id: string;
          author: string;
          body: string;
          anchorId?: string;
          parentId?: string;
          createdAt: number;
          editedAt?: number;
        }
      >;
    } | {
      error: string;
    }
  > {
    try {
      const cur = this.replies.find({
        threadId,
        $or: [{ deleted: false }, { deleted: { $exists: false } }],
      }).sort({ createdAt: 1 });
      const items = await cur.toArray();
      const result = items.map((r) => ({
        _id: String(r._id),
        author: r.author,
        body: r.body,
        anchorId: r.anchorId,
        parentId: r.parentId,
        createdAt: r.createdAt,
        editedAt: r.editedAt,
      }));
      return { result };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * _listRepliesTree(thread: Thread) : (replies: ReplyTree[])
   *
   * **requires** nothing
   * **effects** returns all non-deleted replies for the given thread organized as a
   * tree structure, where each reply has a children array containing its child replies.
   * Results are ordered by createdAt.
   */
  async _listRepliesTree(
    { threadId }: { threadId: string },
  ): Promise<{ result: Array<ReplyTreeNode> } | { error: string }> {
    try {
      const cur = this.replies.find({
        threadId,
        $or: [{ deleted: false }, { deleted: { $exists: false } }],
      }).sort({ createdAt: 1 });
      const items = await cur.toArray();
      // Build id->node
      const nodeById: Record<string, ReplyTreeNode> = {};
      for (const r of items) {
        nodeById[String(r._id)] = {
          _id: String(r._id),
          author: r.author,
          body: r.body,
          anchorId: r.anchorId,
          createdAt: r.createdAt,
          editedAt: r.editedAt,
          parentId: r.parentId ? String(r.parentId) : undefined,
          children: [],
        };
      }
      const roots: ReplyTreeNode[] = [];
      for (const n of Object.values(nodeById)) {
        if (n.parentId && nodeById[n.parentId]) {
          nodeById[n.parentId].children.push(n);
        } else {
          roots.push(n);
        }
      }
      return { result: roots };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }
}
