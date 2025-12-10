import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Generic types of this concept
type User = ID;
type Anchor = ID;
type Pub = ID;
type Thread = ID;
type Reply = ID;

// Pseudonym generation for anonymous posting
const PSEUDONYM_ADJECTIVES = [
  "Curious", "Thoughtful", "Eager", "Brilliant", "Insightful",
  "Methodical", "Analytical", "Creative", "Diligent", "Skeptical",
  "Passionate", "Inquisitive", "Focused", "Determined", "Rigorous",
  "Innovative", "Perceptive", "Attentive", "Inspired", "Dedicated"
];

const PSEUDONYM_NOUNS = [
  "Researcher", "Scholar", "Thinker", "Analyst", "Explorer",
  "Reviewer", "Reader", "Observer", "Theorist", "Contributor",
  "Investigator", "Learner", "Critic", "Collaborator", "Scientist", "Fellow"
];

/**
 * Generate a deterministic pseudonym for anonymous posting.
 * Same userId + pubId always produces the same pseudonym.
 */
function generatePseudonym(userId: string, pubId: string): string {
  // Simple hash function for deterministic selection
  const combined = `${userId}:${pubId}:anonymous_salt_2024`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  hash = Math.abs(hash);
  
  const adjIndex = hash % PSEUDONYM_ADJECTIVES.length;
  const nounIndex = Math.floor(hash / PSEUDONYM_ADJECTIVES.length) % PSEUDONYM_NOUNS.length;
  
  return `${PSEUDONYM_ADJECTIVES[adjIndex]} ${PSEUDONYM_NOUNS[nounIndex]}`;
}

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
  _id: Pub;
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
 *   an isAnonymous Boolean?
 */
interface ThreadDoc {
  _id: Thread;
  pubId: Pub;
  author: User;
  anchorId?: Anchor;
  title: string;
  body: string;
  deleted: boolean;
  createdAt: number;
  editedAt?: number;
  upvotes: number;
  downvotes: number;
  isAnonymous?: boolean;
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
 *   an isAnonymous Boolean?
 */
interface ReplyDoc {
  _id: Reply;
  threadId: Thread;
  parentId?: Reply;
  author: User;
  anchorId?: Anchor;
  body: string;
  deleted: boolean;
  createdAt: number;
  editedAt?: number;
  upvotes: number;
  downvotes: number;
  isAnonymous?: boolean;
}

interface ReplyTreeNode {
  _id: Reply;
  author: User;
  body: string;
  anchorId?: Anchor;
  createdAt: number;
  editedAt?: number;
  parentId?: Reply;
  children: ReplyTreeNode[];
  deleted?: boolean;
  upvotes: number;
  downvotes: number;
  isAnonymous?: boolean;
}

/**
 * UserVote tracks which users have voted on threads/replies
 * to prevent double voting
 */
interface UserVoteDoc {
  _id: string; // composite key: `${userId}:${type}:${targetId}` where type is 'thread' or 'reply'
  userId: User;
  type: 'thread' | 'reply';
  targetId: Thread | Reply;
  vote: 1 | -1; // 1 for upvote, -1 for downvote
  createdAt: number;
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
  private get userVotes(): Collection<UserVoteDoc> {
    return this.db.collection("userVotes");
  }

  private async initIndexes(): Promise<void> {
    try {
      await this.pubs.createIndex({ paperId: 1 }, { unique: true });
      await this.threads.createIndex({ pubId: 1 });
      await this.replies.createIndex({ threadId: 1 });
      await this.replies.createIndex({ parentId: 1 });
      await this.userVotes.createIndex({ userId: 1, type: 1, targetId: 1 }, { unique: true });
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
  ): Promise<{ newPub: Pub } | { result: Pub } | { error: string }> {
    try {
      const now = Date.now();
      try {
        const pubId = freshID() as Pub;
        await this.pubs.insertOne({ _id: pubId, paperId, createdAt: now });
        // Support both return types for backward compatibility
        return { newPub: pubId, result: pubId } as {
          newPub: Pub;
          result: Pub;
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
   * startThread(pub: Pub, author: User, anchor: Anchor, title: String, body: String, isAnonymous?: Boolean) : (newThread: Thread)
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
      isAnonymous,
    }: {
      pubId: Pub;
      author: User;
      anchorId?: Anchor;
      title?: string; // Optional for backward compatibility
      body: string;
      isAnonymous?: boolean;
    },
  ): Promise<{ newThread: Thread } | { result: Thread } | { error: string }> {
    try {
      const pub = await this.pubs.findOne({ _id: pubId });
      if (!pub) throw new Error("Pub not found");
      const now = Date.now();
      const threadId = freshID() as Thread;
      // Treat empty string as no anchor (for sync pattern matching compatibility)
      const effectiveAnchorId = anchorId && anchorId !== ""
        ? anchorId
        : undefined;
      const doc: ThreadDoc = {
        _id: threadId,
        pubId,
        author,
        title: title ?? "", // Default to empty string for backward compatibility
        body,
        deleted: false,
        createdAt: now,
        upvotes: 0,
        downvotes: 0,
        ...(effectiveAnchorId !== undefined && { anchorId: effectiveAnchorId }),
        ...(isAnonymous && { isAnonymous: true }),
      };
      await this.threads.insertOne(doc);
      // Support both return types for backward compatibility
      return { newThread: threadId, result: threadId } as {
        newThread: Thread;
        result: Thread;
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * makeReply(thread: Thread, author: User, anchor: Anchor, body: String, parentReply?: Reply, isAnonymous?: Boolean) : (newReply: Reply)
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
      isAnonymous,
    }: {
      threadId: Thread;
      author: User;
      anchorId?: Anchor;
      body: string;
      parentReply?: Reply;
      isAnonymous?: boolean;
    },
  ): Promise<{ newReply: Reply } | { result: Reply } | { error: string }> {
    try {
      const th = await this.threads.findOne({ _id: threadId });
      if (!th) throw new Error("Thread not found");
      if (parentReply) {
        const parent = await this.replies.findOne({ _id: parentReply });
        if (!parent) throw new Error("Parent reply not found");
        if (parent.threadId !== threadId) {
          throw new Error("Parent/thread mismatch");
        }
      }
      const now = Date.now();
      const replyId = freshID() as Reply;
      const doc: ReplyDoc = {
        _id: replyId,
        threadId,
        author,
        body,
        deleted: false,
        createdAt: now,
        upvotes: 0,
        downvotes: 0,
        ...(anchorId !== undefined && { anchorId }),
        ...(parentReply !== undefined && { parentId: parentReply }),
        ...(isAnonymous && { isAnonymous: true }),
      };
      await this.replies.insertOne(doc);
      // Support both return types for backward compatibility
      return { newReply: replyId, result: replyId } as {
        newReply: Reply;
        result: Reply;
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * @deprecated Use makeReply instead. This method is kept for backward compatibility.
   */
  async reply(
    { threadId, author, body, anchorId, isAnonymous }: {
      threadId: Thread;
      author: User;
      body: string;
      anchorId?: Anchor;
      isAnonymous?: boolean;
    },
  ): Promise<{ result: Reply } | { error: string }> {
    const result = await this.makeReply({ threadId, author, body, anchorId, isAnonymous });
    if ("error" in result) return result;
    // makeReply returns both newReply and result for compatibility
    const replyResult = result as { newReply: Reply; result: Reply };
    return { result: replyResult.newReply };
  }

  /**
   * @deprecated Use makeReply instead. This method is kept for backward compatibility.
   */
  async replyTo(
    { threadId, parentId, author, body, anchorId, isAnonymous }: {
      threadId: Thread;
      parentId?: Reply;
      author: User;
      body: string;
      anchorId?: Anchor;
      isAnonymous?: boolean;
    },
  ): Promise<{ result: Reply } | { error: string }> {
    const result = await this.makeReply({
      threadId,
      author,
      body,
      anchorId,
      parentReply: parentId,
      isAnonymous,
    });
    if ("error" in result) return result;
    // makeReply returns both newReply and result for compatibility
    const replyResult = result as { newReply: Reply; result: Reply };
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
      threadId: Thread;
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
        { _id: threadId },
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
    { threadId }: { threadId: Thread },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.threads.updateOne(
        { _id: threadId },
        { $set: { deleted: true, editedAt: Date.now() } },
      );
      if (res.matchedCount === 0) throw new Error("Thread not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  async editReply(
    { replyId, newBody }: { replyId: Reply; newBody: string },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.replies.updateOne(
        { _id: replyId },
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
    { replyId }: { replyId: Reply },
  ): Promise<{ ok: true } | { error: string }> {
    try {
      const res = await this.replies.updateOne(
        { _id: replyId },
        { $set: { deleted: true, editedAt: Date.now() } },
      );
      if (res.matchedCount === 0) throw new Error("Reply not found");
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /**
   * voteThread(threadId: Thread, userId: User, vote: 1 | -1) : (ok: true)
   *
   * **requires** the thread exists
   * **effects** records the user's vote on the thread, updating vote counts.
   * If the user already voted, updates their vote. If voting the same way again, removes the vote.
   */
  async voteThread(
    { threadId, userId, vote }: { threadId: Thread; userId: User; vote: 1 | -1 },
  ): Promise<{ ok: true; upvotes: number; downvotes: number; userVote: 1 | -1 | null } | { error: string }> {
    try {
      console.log(`\nDiscussionPub.voteThread { threadId: '${threadId}', userId: '${userId}', vote: ${vote} }`);
      const thread = await this.threads.findOne({ _id: threadId });
      if (!thread) throw new Error("Thread not found");
      console.log(`  => { ok: true, upvotes: ${thread.upvotes ?? 0}, downvotes: ${thread.downvotes ?? 0} }`);

      const voteKey = `${userId}:thread:${threadId}`;
      const existingVote = await this.userVotes.findOne({
        userId,
        type: 'thread',
        targetId: threadId,
      });

      let upvoteDelta = 0;
      let downvoteDelta = 0;
      let finalUserVote: 1 | -1 | null = vote;

      if (existingVote) {
        // User already voted
        if (existingVote.vote === vote) {
          // Same vote - remove it
          await this.userVotes.deleteOne({ _id: voteKey });
          if (vote === 1) {
            upvoteDelta = -1;
          } else {
            downvoteDelta = -1;
          }
          finalUserVote = null;
        } else {
          // Different vote - change it
          await this.userVotes.updateOne(
            { _id: voteKey },
            { $set: { vote, createdAt: Date.now() } },
          );
          if (vote === 1) {
            upvoteDelta = 1;
            downvoteDelta = -1;
          } else {
            upvoteDelta = -1;
            downvoteDelta = 1;
          }
        }
      } else {
        // New vote
        await this.userVotes.insertOne({
          _id: voteKey,
          userId,
          type: 'thread',
          targetId: threadId,
          vote,
          createdAt: Date.now(),
        });
        if (vote === 1) {
          upvoteDelta = 1;
        } else {
          downvoteDelta = 1;
        }
      }

      // Update thread vote counts
      const update: Record<string, number> = {};
      if (upvoteDelta !== 0) {
        update.upvotes = Math.max(0, (thread.upvotes ?? 0) + upvoteDelta);
      }
      if (downvoteDelta !== 0) {
        update.downvotes = Math.max(0, (thread.downvotes ?? 0) + downvoteDelta);
      }
      await this.threads.updateOne({ _id: threadId }, { $set: update });

      const updated = await this.threads.findOne({ _id: threadId });
      const result = {
        ok: true as const,
        upvotes: updated?.upvotes ?? 0,
        downvotes: updated?.downvotes ?? 0,
        userVote: finalUserVote,
      };
      console.log(`DiscussionPub.voteThread { threadId: '${threadId}', userId: '${userId}', vote: ${vote} }`);
      console.log(`  => { ok: true, upvotes: ${result.upvotes}, downvotes: ${result.downvotes}, userVote: ${result.userVote} }`);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.log(`DiscussionPub.voteThread { threadId: '${threadId}', userId: '${userId}', vote: ${vote} }`);
      console.log(`  => { error: '${error}' }`);
      return { error };
    }
  }

  /**
   * voteReply(replyId: Reply, userId: User, vote: 1 | -1) : (ok: true)
   *
   * **requires** the reply exists
   * **effects** records the user's vote on the reply, updating vote counts.
   * If the user already voted, updates their vote. If voting the same way again, removes the vote.
   */
  async voteReply(
    { replyId, userId, vote }: { replyId: Reply; userId: User; vote: 1 | -1 },
  ): Promise<{ ok: true; upvotes: number; downvotes: number; userVote: 1 | -1 | null } | { error: string }> {
    try {
      console.log(`\nDiscussionPub.voteReply { replyId: '${replyId}', userId: '${userId}', vote: ${vote} }`);
      const reply = await this.replies.findOne({ _id: replyId });
      if (!reply) throw new Error("Reply not found");

      const voteKey = `${userId}:reply:${replyId}`;
      const existingVote = await this.userVotes.findOne({
        userId,
        type: 'reply',
        targetId: replyId,
      });

      let upvoteDelta = 0;
      let downvoteDelta = 0;
      let finalUserVote: 1 | -1 | null = vote;

      if (existingVote) {
        // User already voted
        if (existingVote.vote === vote) {
          // Same vote - remove it
          await this.userVotes.deleteOne({ _id: voteKey });
          if (vote === 1) {
            upvoteDelta = -1;
          } else {
            downvoteDelta = -1;
          }
          finalUserVote = null;
        } else {
          // Different vote - change it
          await this.userVotes.updateOne(
            { _id: voteKey },
            { $set: { vote, createdAt: Date.now() } },
          );
          if (vote === 1) {
            upvoteDelta = 1;
            downvoteDelta = -1;
          } else {
            upvoteDelta = -1;
            downvoteDelta = 1;
          }
        }
      } else {
        // New vote
        await this.userVotes.insertOne({
          _id: voteKey,
          userId,
          type: 'reply',
          targetId: replyId,
          vote,
          createdAt: Date.now(),
        });
        if (vote === 1) {
          upvoteDelta = 1;
        } else {
          downvoteDelta = 1;
        }
      }

      // Update reply vote counts
      const update: Record<string, number> = {};
      if (upvoteDelta !== 0) {
        update.upvotes = Math.max(0, (reply.upvotes ?? 0) + upvoteDelta);
      }
      if (downvoteDelta !== 0) {
        update.downvotes = Math.max(0, (reply.downvotes ?? 0) + downvoteDelta);
      }
      await this.replies.updateOne({ _id: replyId }, { $set: update });

      const updated = await this.replies.findOne({ _id: replyId });
      const result = {
        ok: true as const,
        upvotes: updated?.upvotes ?? 0,
        downvotes: updated?.downvotes ?? 0,
        userVote: finalUserVote,
      };
      console.log(`DiscussionPub.voteReply { replyId: '${replyId}', userId: '${userId}', vote: ${vote} }`);
      console.log(`  => { ok: true, upvotes: ${result.upvotes}, downvotes: ${result.downvotes}, userVote: ${result.userVote} }`);
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      console.log(`DiscussionPub.voteReply { replyId: '${replyId}', userId: '${userId}', vote: ${vote} }`);
      console.log(`  => { error: '${error}' }`);
      return { error };
    }
  }

  /**
   * _getUserVote(userId: User, type: 'thread' | 'reply', targetId: Thread | Reply) : (vote: 1 | -1 | null)
   *
   * **requires** nothing
   * **effects** returns the user's vote on the target, or null if they haven't voted
   */
  async _getUserVote(
    { userId, type, targetId }: { userId: User; type: 'thread' | 'reply'; targetId: Thread | Reply },
  ): Promise<Array<{ vote: 1 | -1 | null }>> {
    try {
      const voteDoc = await this.userVotes.findOne({
        userId,
        type,
        targetId,
      });
      return [{ vote: voteDoc?.vote ?? null }];
    } catch {
      return [{ vote: null }];
    }
  }

  /**
   * _getThread(thread: Thread) : (thread: ThreadDoc)
   *
   * **requires** nothing
   * **effects** returns the thread document for the given thread. Returns an array with
   * one dictionary if the thread exists, or an empty array if it does not exist.
   */
  async _getThread(
    { thread }: { thread: Thread },
  ): Promise<Array<{ thread: ThreadDoc }>> {
    try {
      const doc = await this.threads.findOne({ _id: thread });
      return doc ? [{ thread: doc }] : [];
    } catch {
      return [];
    }
  }

  /**
   * _getReply(reply: Reply) : (reply: ReplyDoc)
   *
   * **requires** nothing
   * **effects** returns the reply document for the given reply. Returns an array with
   * one dictionary if the reply exists, or an empty array if it does not exist.
   */
  async _getReply(
    { reply }: { reply: Reply },
  ): Promise<Array<{ reply: ReplyDoc }>> {
    try {
      const doc = await this.replies.findOne({ _id: reply });
      return doc ? [{ reply: doc }] : [];
    } catch {
      return [];
    }
  }

  /**
   * _getPubIdByPaper(paperId: String) : (result: Pub)
   *
   * **requires** nothing
   * **effects** returns the Pub ID for the given paperId. Returns an array with one
   * dictionary if the pub exists, or an empty array if no pub exists.
   */
  async _getPubIdByPaper(
    { paperId }: { paperId: string },
  ): Promise<Array<{ result: Pub }>> {
    try {
      const doc = await this.pubs.findOne({ paperId });
      return doc ? [{ result: doc._id }] : [];
    } catch {
      return [];
    }
  }

  /**
   * _listPaperDiscussionStats(limit?: Number, sortBy?: String, order?: String)
   *   : (result: { paperId: String, pubId: Pub, threads: Number, replies: Number, totalMessages: Number, lastReplyAt?: Number, lastActivityAt: Number })
   *
   * **requires** nothing
   * **effects** aggregates discussion activity per paper across all pubs.
   *   - most discussed = sort by totalMessages (threads + replies) descending
   *   - recently discussed = sort by lastActivityAt (max of thread createdAt and reply createdAt) descending
   *   - order can be "desc" (default) or "asc"
   * Returns at most `limit` results (if provided), or all by default.
   */
  async _listPaperDiscussionStats(
    { limit, sortBy, order }: {
      limit?: number;
      sortBy?: string;
      order?: "asc" | "desc";
    },
  ): Promise<
    Array<{
      result: {
        paperId: string;
        pubId: Pub;
        threads: number;
        replies: number;
        totalMessages: number;
        lastReplyAt?: number;
        lastActivityAt: number;
      };
    }>
  > {
    try {
      // 1) Load all non-deleted threads and replies
      const threadFilter: Record<string, unknown> = {};
      threadFilter.$or = [{ deleted: false }, { deleted: { $exists: false } }];
      const replyFilter: Record<string, unknown> = {};
      replyFilter.$or = [{ deleted: false }, { deleted: { $exists: false } }];

      const [threads, replies] = await Promise.all([
        this.threads.find(threadFilter).toArray(),
        this.replies.find(replyFilter).toArray(),
      ]);

      if (threads.length === 0 && replies.length === 0) {
        return [];
      }

      // 2) Aggregate replies per thread
      const repliesByThread = new Map<
        Thread,
        { count: number; lastReplyAt: number }
      >();
      for (const r of replies) {
        const existing = repliesByThread.get(r.threadId) ?? {
          count: 0,
          lastReplyAt: 0,
        };
        existing.count += 1;
        if (r.createdAt > existing.lastReplyAt) {
          existing.lastReplyAt = r.createdAt;
        }
        repliesByThread.set(r.threadId, existing);
      }

      // 3) Aggregate per pub
      const statsByPub = new Map<
        Pub,
        {
          threads: number;
          replies: number;
          lastReplyAt: number;
          lastThreadAt: number;
        }
      >();

      for (const t of threads) {
        const replyInfo = repliesByThread.get(t._id) ?? {
          count: 0,
          lastReplyAt: 0,
        };
        const existing = statsByPub.get(t.pubId) ?? {
          threads: 0,
          replies: 0,
          lastReplyAt: 0,
          lastThreadAt: 0,
        };
        existing.threads += 1;
        existing.replies += replyInfo.count;
        if (replyInfo.lastReplyAt > existing.lastReplyAt) {
          existing.lastReplyAt = replyInfo.lastReplyAt;
        }
        if (t.createdAt > existing.lastThreadAt) {
          existing.lastThreadAt = t.createdAt;
        }
        statsByPub.set(t.pubId, existing);
      }

      if (statsByPub.size === 0) {
        return [];
      }

      // 4) Load paperIds for pubs
      const pubIds = Array.from(statsByPub.keys());
      const pubDocs = await this.pubs.find(
        { _id: { $in: pubIds } },
        { projection: { _id: 1, paperId: 1 } },
      ).toArray();
      const pubToPaperId = new Map<Pub, string>();
      for (const p of pubDocs) {
        pubToPaperId.set(p._id, p.paperId);
      }

      // 5) Build stats array
      const results: Array<{
        paperId: string;
        pubId: Pub;
        threads: number;
        replies: number;
        totalMessages: number;
        lastReplyAt?: number;
        lastActivityAt: number;
      }> = [];

      for (const [pubId, s] of statsByPub.entries()) {
        const paperId = pubToPaperId.get(pubId);
        if (!paperId) continue;
        const lastActivityAt = Math.max(s.lastThreadAt, s.lastReplyAt || 0);
        const totalMessages = s.threads + s.replies;
        results.push({
          paperId,
          pubId,
          threads: s.threads,
          replies: s.replies,
          totalMessages,
          lastReplyAt: s.lastReplyAt || undefined,
          lastActivityAt,
        });
      }

      if (results.length === 0) {
        return [];
      }

      // 6) Sort according to requested mode
      const sortMode = sortBy === "recentlyDiscussed"
        ? "recentlyDiscussed"
        : "mostDiscussed";
      const direction = order === "asc" ? 1 : -1;

      results.sort((a, b) => {
        if (sortMode === "recentlyDiscussed") {
          const diff = (a.lastActivityAt - b.lastActivityAt) * direction;
          if (diff !== 0) return diff;
          // Tie-breaker: total messages
          return (a.totalMessages - b.totalMessages) * -1;
        }
        // mostDiscussed
        const diff = (a.totalMessages - b.totalMessages) * direction;
        if (diff !== 0) return diff;
        // Tie-breaker: last activity (always newest first for ties)
        return (a.lastActivityAt - b.lastActivityAt) * -1;
      });

      const limited = typeof limit === "number" && limit > 0
        ? results.slice(0, limit)
        : results;

      return limited.map((r) => ({ result: r }));
    } catch {
      // Queries should not throw
      return [];
    }
  }

  /**
   * _listPapersDiscussedByUser(user: User)
   *   : (result: { paperId: String })
   *
   * **requires** nothing
   * **effects** returns all paperIds for which the given user has authored at least
   * one non-deleted thread or reply.
   */
  async _listPapersDiscussedByUser(
    { user }: { user: User },
  ): Promise<Array<{ result: { paperId: string } }>> {
    try {
      const threadFilter: Record<string, unknown> = {
        author: user,
      };
      threadFilter.$or = [{ deleted: false }, { deleted: { $exists: false } }];

      const replyFilter: Record<string, unknown> = {
        author: user,
      };
      replyFilter.$or = [{ deleted: false }, { deleted: { $exists: false } }];

      const [userThreads, userReplies] = await Promise.all([
        this.threads.find(threadFilter).toArray(),
        this.replies.find(replyFilter).toArray(),
      ]);

      if (userThreads.length === 0 && userReplies.length === 0) {
        return [];
      }

      // Collect all threadIds where the user has participated
      const threadIds = new Set<Thread>();
      for (const t of userThreads) {
        threadIds.add(t._id);
      }
      for (const r of userReplies) {
        threadIds.add(r.threadId);
      }

      const participatingThreads = await this.threads.find({
        _id: { $in: Array.from(threadIds) },
      }).toArray();

      if (participatingThreads.length === 0) {
        return [];
      }

      // Map threads to pubs, then pubs to paperIds
      const pubIds = Array.from(
        new Set(participatingThreads.map((t) => t.pubId)),
      );
      const pubs = await this.pubs.find(
        { _id: { $in: pubIds } },
        { projection: { _id: 1, paperId: 1 } },
      ).toArray();

      const paperIdSet = new Set<string>();
      for (const p of pubs) {
        paperIdSet.add(p.paperId);
      }

      return Array.from(paperIdSet).map((paperId) => ({ result: { paperId } }));
    } catch {
      return [];
    }
  }

  /**
   * _listThreads(pub: Pub, anchor?: Anchor, sortBy?: string) : (thread: Thread)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one non-deleted
   * thread for the given pub, optionally filtered by anchor. Results are ordered by
   * sortBy (default: createdAt). Each thread includes _id, author, title, body, anchorId, createdAt,
   * editedAt, upvotes, downvotes, and isAnonymous. Returns an empty array if no threads exist.
   * sortBy can be: 'createdAt', 'votes' (net votes = upvotes - downvotes), 'upvotes', 'downvotes'
   */
  async _listThreads(
    { pubId, anchorId, includeDeleted, sortBy, userId }: {
      pubId: Pub;
      anchorId?: Anchor;
      includeDeleted?: boolean;
      sortBy?: string;
      userId?: User;
    },
  ): Promise<
    Array<{
      thread: {
        _id: Thread;
        author: User;
        title: string;
        body: string;
        anchorId?: Anchor;
        createdAt: number;
        editedAt?: number;
        deleted?: boolean;
        upvotes: number;
        downvotes: number;
        isAnonymous?: boolean;
        userVote?: 1 | -1 | null;
      };
    }>
  > {
    try {
      const filter: Record<string, unknown> = {
        pubId,
      };
      if (!includeDeleted) {
        filter.$or = [{ deleted: false }, { deleted: { $exists: false } }];
      }
      if (anchorId !== undefined) filter.anchorId = anchorId;

      let items;

      // For upvotes sorting, use aggregation to compute net score
      if (sortBy === 'upvotes') {
        const pipeline: any[] = [
          { $match: filter },
          {
            $addFields: {
              netScore: {
                $subtract: [
                  { $ifNull: ['$upvotes', 0] },
                  { $ifNull: ['$downvotes', 0] }
                ]
              }
            }
          },
          { $sort: { netScore: -1, createdAt: -1 } }
        ];
        items = await this.threads.aggregate(pipeline).toArray();
      } else {
        // Determine sort order for simple cases
        let sort: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest first (Recent)
        if (sortBy === 'oldest') {
          sort = { createdAt: 1 }; // Oldest first
        } else if (sortBy === 'createdAt') {
          sort = { createdAt: -1 }; // Newest first (Recent)
        }

        const cur = this.threads.find(filter).sort(sort);
        items = await cur.toArray();
      }

      // If userId is provided, fetch user votes for all threads at once
      let userVotesMap: Map<string, 1 | -1> = new Map();
      if (userId) {
        const threadIds = items.map(t => t._id);
        const votes = await this.userVotes.find({
          userId,
          type: 'thread',
          targetId: { $in: threadIds }
        }).toArray();
        votes.forEach(v => {
          userVotesMap.set(v.targetId, v.vote);
        });
      }

      // Queries must return an array of dictionaries, one per thread
      return items.map((t) => ({
        thread: {
          _id: t._id,
          author: t.author,
          title: t.title ?? "", // Default for backward compatibility
          body: t.body,
          anchorId: t.anchorId,
          createdAt: t.createdAt,
          editedAt: t.editedAt,
          deleted: t.deleted ?? false,
          upvotes: t.upvotes ?? 0,
          downvotes: t.downvotes ?? 0,
          isAnonymous: t.isAnonymous ?? false,
          userVote: userId ? (userVotesMap.get(t._id) ?? null) : undefined,
        },
      }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _listReplies(thread: Thread, sortBy?: string) : (reply: Reply)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one non-deleted
   * reply for the given thread, ordered by sortBy (default: createdAt). Each reply includes _id, author,
   * body, anchorId, parentId, createdAt, editedAt, upvotes, downvotes, and isAnonymous. Returns an empty array if no
   * replies exist.
   * sortBy can be: 'createdAt', 'votes' (net votes = upvotes - downvotes), 'upvotes', 'downvotes'
   */
  async _listReplies(
    { threadId, includeDeleted, sortBy }: {
      threadId: Thread;
      includeDeleted?: boolean;
      sortBy?: string;
    },
  ): Promise<
    Array<{
      reply: {
        _id: Reply;
        author: User;
        body: string;
        anchorId?: Anchor;
        parentId?: Reply;
        createdAt: number;
        editedAt?: number;
        deleted?: boolean;
        upvotes: number;
        downvotes: number;
        isAnonymous?: boolean;
      };
    }>
  > {
    try {
      const filter: Record<string, unknown> = { threadId };
      if (!includeDeleted) {
        filter.$or = [{ deleted: false }, { deleted: { $exists: false } }];
      }
      
      // Determine sort order
      let sort: Record<string, 1 | -1> = { createdAt: 1 }; // default
      if (sortBy === 'votes') {
        // Sort by net votes (upvotes - downvotes), then by createdAt
        const items = await this.replies.find(filter).toArray();
        items.sort((a, b) => {
          const netA = (a.upvotes ?? 0) - (a.downvotes ?? 0);
          const netB = (b.upvotes ?? 0) - (b.downvotes ?? 0);
          if (netB !== netA) return netB - netA; // Higher net votes first
          return a.createdAt - b.createdAt; // Then by date
        });
        return items.map((r) => ({
          reply: {
            _id: r._id,
            author: r.author,
            body: r.body,
            anchorId: r.anchorId,
            parentId: r.parentId,
            createdAt: r.createdAt,
            editedAt: r.editedAt,
            deleted: r.deleted ?? false,
            upvotes: r.upvotes ?? 0,
            downvotes: r.downvotes ?? 0,
            isAnonymous: r.isAnonymous ?? false,
          },
        }));
      } else if (sortBy === 'upvotes') {
        sort = { upvotes: -1, createdAt: 1 };
      } else if (sortBy === 'downvotes') {
        sort = { downvotes: -1, createdAt: 1 };
      } else if (sortBy === 'createdAt') {
        sort = { createdAt: 1 };
      }
      
      const cur = this.replies.find(filter).sort(sort);
      const items = await cur.toArray();
      // Queries must return an array of dictionaries, one per reply
      return items.map((r) => ({
        reply: {
          _id: r._id,
          author: r.author,
          body: r.body,
          anchorId: r.anchorId,
          parentId: r.parentId,
          createdAt: r.createdAt,
          editedAt: r.editedAt,
          deleted: r.deleted ?? false,
          upvotes: r.upvotes ?? 0,
          downvotes: r.downvotes ?? 0,
          isAnonymous: r.isAnonymous ?? false,
        },
      }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _listRepliesTree(thread: Thread) : (reply: ReplyTree)
   *
   * **requires** nothing
   * **effects** returns an array of dictionaries, each containing one root reply node
   * for the given thread organized as a tree structure, where each reply has a children
   * array containing its child replies. Results are ordered by createdAt. Returns an
   * empty array if no replies exist.
   */
  async _listRepliesTree(
    { threadId, includeDeleted }: {
      threadId: Thread;
      includeDeleted?: boolean;
    },
  ): Promise<Array<{ reply: ReplyTreeNode }>> {
    try {
      const filter: Record<string, unknown> = { threadId };
      if (!includeDeleted) {
        filter.$or = [{ deleted: false }, { deleted: { $exists: false } }];
      }
      const cur = this.replies.find(filter).sort({ createdAt: 1 });
      const items = await cur.toArray();
      console.log(`[_listRepliesTree] Raw replies from DB for thread ${threadId}:`, 
        items.map(r => ({ _id: r._id, body: r.body?.slice(0, 20), anchorId: r.anchorId })));
      // Build id->node
      const nodeById: Record<string, ReplyTreeNode> = {};
      for (const r of items) {
        const id = r._id;
        nodeById[id] = {
          _id: id,
          author: r.author,
          body: r.body,
          anchorId: r.anchorId,
          createdAt: r.createdAt,
          editedAt: r.editedAt,
          parentId: r.parentId,
          children: [],
          deleted: r.deleted ?? false,
          upvotes: r.upvotes ?? 0,
          downvotes: r.downvotes ?? 0,
          isAnonymous: r.isAnonymous ?? false,
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
      console.log(`[_listRepliesTree] Returning tree roots:`, 
        roots.map(r => ({ _id: r._id, body: r.body?.slice(0, 20), anchorId: r.anchorId })));
      // Queries must return an array of dictionaries, one per root reply
      return roots.map((reply) => ({ reply }));
    } catch {
      // On error, return empty array (queries should not throw)
      return [];
    }
  }

  /**
   * _getAnonymousPseudonym(userId: User, pubId: Pub) : (pseudonym: String)
   *
   * **requires** nothing
   * **effects** returns a deterministic pseudonym for the given userId and pubId.
   * The same userId + pubId will always produce the same pseudonym.
   */
  async _getAnonymousPseudonym(
    { userId, pubId }: { userId: User; pubId: Pub },
  ): Promise<Array<{ pseudonym: string }>> {
    const pseudonym = generatePseudonym(userId, pubId);
    return [{ pseudonym }];
  }
}
