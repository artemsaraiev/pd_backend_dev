import { actions, Frames, Sync } from "@engine";
import {
  AccessControl,
  DiscussionPub,
  Requesting,
  Sessioning,
} from "@concepts";

// DiscussionPub Actions
export const DiscussionOpenRequest: Sync = ({ request, paperId }) => ({
  when: actions([Requesting.request, { path: "/DiscussionPub/open", paperId }, {
    request,
  }]),
  then: actions([DiscussionPub.open, { paperId }]),
});

export const DiscussionOpenResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/open" }, { request }],
    [DiscussionPub.open, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const DiscussionStartThreadRequest: Sync = (
  { request, session, pubId, body, anchorId, groupId, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    session,
    pubId,
    body,
    anchorId,
    groupId,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.startThread, {
    pubId,
    author: user,
    body,
    anchorId,
  }]),
});

// After thread is created, grant access based on visibility
// If groupId is provided, grant private access to that group
// If no groupId (public thread), grant universal access
export const DiscussionStartThreadGrantPrivateAccess: Sync = (
  { request, session, pubId, body, anchorId, groupId, user, newThread },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/DiscussionPub/startThread",
      session,
      pubId,
      body,
      anchorId,
      groupId,
    }, { request }],
    [DiscussionPub.startThread, {}, { newThread, result: newThread }],
  ),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Only proceed if groupId was provided (private thread)
    if (!originalFrame[groupId]) {
      return new Frames(); // No groupId, will be handled by universal access sync
    }
    // Verify user is a member of the group
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    // Note: We assume groupId is valid - AccessControl will validate membership
    return frames;
  },
  then: actions([AccessControl.givePrivateAccess, {
    group: groupId,
    resource: newThread,
  }]),
});

// After thread is created, if no groupId, grant universal access (public thread)
export const DiscussionStartThreadGrantUniversalAccess: Sync = (
  { request, session, pubId, body, anchorId, groupId, newThread },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/DiscussionPub/startThread",
      session,
      pubId,
      body,
      anchorId,
    }, { request }],
    [DiscussionPub.startThread, {}, { newThread, result: newThread }],
  ),
  where: (frames) => {
    const originalFrame = frames[0];
    // Only proceed if groupId was NOT provided (public thread)
    if (originalFrame[groupId]) {
      return new Frames(); // Has groupId, will be handled by private access sync
    }
    return frames;
  },
  then: actions([AccessControl.giveUniversalAccess, {
    resource: newThread,
  }]),
});

export const DiscussionStartThreadResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startThread" }, { request }],
    [DiscussionPub.startThread, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// Reply - handles with or without session
export const DiscussionReplyRequest: Sync = (
  { request, session, threadId, body, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/reply",
    session,
    threadId,
    body,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.reply, { threadId, author: user, body }]),
});

export const DiscussionReplyResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/reply" }, { request }],
    [DiscussionPub.reply, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// Support nested replies
export const DiscussionReplyToRequest: Sync = (
  { request, session, threadId, parentId, body, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/replyTo",
    session,
    threadId,
    parentId,
    body,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.replyTo, {
    threadId,
    parentId,
    author: user,
    body,
  }]),
});

export const DiscussionReplyToResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/replyTo" }, { request }],
    [DiscussionPub.replyTo, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// DiscussionPub Queries
export const DiscussionGetPubIdByPaperRequest: Sync = (
  { request, paperId, result },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/getPubIdByPaper",
    paperId,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(DiscussionPub._getPubIdByPaper, { paperId }, {
      result,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [result]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, result }]),
});

// _listThreads with anchorId filter and access control
export const DiscussionListThreadsWithAnchorRequest: Sync = (
  {
    request,
    session,
    pubId,
    anchorId,
    includeDeleted,
    thread,
    threads,
    user,
    hasAccess,
  },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listThreads",
    session,
    pubId,
    anchorId,
    includeDeleted,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Get all threads for this pub/anchor
    frames = await frames.query(DiscussionPub._listThreads, {
      pubId,
      anchorId,
      includeDeleted,
    }, { thread });

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }

    // If session is provided, filter by access control
    if (originalFrame[session]) {
      // Resolve user from session
      frames = await frames.query(Sessioning._getUser, { session }, { user });
      if (frames.length === 0) {
        // Invalid session - return empty
        return new Frames({ ...originalFrame, [threads]: [] });
      }

      // For each thread, check if user has access
      // Query hasAccess for all threads (this will fan out frames)
      frames = await frames.query(AccessControl._hasAccess, {
        user,
        resource: thread,
      }, { hasAccess });

      // Filter to only threads where hasAccess is true
      frames = frames.filter(($) => $[hasAccess] === true);
    }
    // If no session, show all threads (backward compatibility - could filter to universal only)

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return frames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

// _listThreads without anchorId filter and access control
export const DiscussionListThreadsRequest: Sync = (
  { request, session, pubId, includeDeleted, thread, threads, user, hasAccess },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listThreads",
    session,
    pubId,
    includeDeleted,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Get all threads for this pub
    frames = await frames.query(DiscussionPub._listThreads, {
      pubId,
      includeDeleted,
    }, { thread });

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }

    // If session is provided, filter by access control
    if (originalFrame[session]) {
      // Resolve user from session
      frames = await frames.query(Sessioning._getUser, { session }, { user });
      if (frames.length === 0) {
        // Invalid session - return empty
        return new Frames({ ...originalFrame, [threads]: [] });
      }

      // For each thread, check if user has access
      frames = await frames.query(AccessControl._hasAccess, {
        user,
        resource: thread,
      }, { hasAccess });

      // Filter to only threads where hasAccess is true
      frames = frames.filter(($) => $[hasAccess] === true);
    }
    // If no session, show all threads (backward compatibility)

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return frames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

export const DiscussionListRepliesRequest: Sync = (
  { request, threadId, includeDeleted, reply, replies },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listReplies",
    threadId,
    includeDeleted,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(DiscussionPub._listReplies, {
      threadId,
      includeDeleted,
    }, { reply });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [replies]: [] });
    }
    return frames.collectAs([reply], replies);
  },
  then: actions([Requesting.respond, { request, replies }]),
});

// Tree-structured replies
export const DiscussionListRepliesTreeRequest: Sync = (
  { request, threadId, includeDeleted, reply, replies },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listRepliesTree",
    threadId,
    includeDeleted,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(DiscussionPub._listRepliesTree, {
      threadId,
      includeDeleted,
    }, { reply });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [replies]: [] });
    }
    return frames.collectAs([reply], replies);
  },
  then: actions([Requesting.respond, { request, replies }]),
});

// DiscussionPub mutations
export const DiscussionEditThreadRequest: Sync = (
  { request, session, threadId, newTitle, newBody, user, thread },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/editThread",
    session,
    threadId,
    newTitle,
    newBody,
  }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(DiscussionPub._getThread, {
      thread: threadId,
    }, { thread });
    return frames.filter(($) => {
      const threadDoc = $[thread] as { author: unknown } | undefined;
      return threadDoc !== undefined && threadDoc.author === $[user];
    });
  },
  then: actions([DiscussionPub.editThread, { threadId, newTitle, newBody }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const DiscussionDeleteThreadRequest: Sync = (
  { request, session, threadId, user, thread },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/deleteThread",
    session,
    threadId,
  }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(DiscussionPub._getThread, {
      thread: threadId,
    }, { thread });
    return frames.filter(($) => {
      const threadDoc = $[thread] as { author: unknown } | undefined;
      return threadDoc !== undefined && threadDoc.author === $[user];
    });
  },
  then: actions([DiscussionPub.deleteThread, { threadId }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const DiscussionEditReplyRequest: Sync = (
  { request, session, replyId, newBody, user, reply },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/editReply",
    session,
    replyId,
    newBody,
  }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(DiscussionPub._getReply, {
      reply: replyId,
    }, { reply });
    return frames.filter(($) => {
      const replyDoc = $[reply] as { author: unknown } | undefined;
      return replyDoc !== undefined && replyDoc.author === $[user];
    });
  },
  then: actions([DiscussionPub.editReply, { replyId, newBody }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const DiscussionDeleteReplyRequest: Sync = (
  { request, session, replyId, user, reply },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/deleteReply",
    session,
    replyId,
  }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(DiscussionPub._getReply, {
      reply: replyId,
    }, { reply });
    return frames.filter(($) => {
      const replyDoc = $[reply] as { author: unknown } | undefined;
      return replyDoc !== undefined && replyDoc.author === $[user];
    });
  },
  then: actions([DiscussionPub.deleteReply, { replyId }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

// makeReply with all optional parameters
export const DiscussionMakeReplyWithAllRequest: Sync = (
  { request, session, threadId, anchorId, body, parentReply, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    anchorId,
    body,
    parentReply,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author: user,
    anchorId,
    body,
    parentReply,
  }]),
});

// makeReply without anchorId and parentReply
export const DiscussionMakeReplyRequest: Sync = (
  { request, session, threadId, body, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    body,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, { threadId, author: user, body }]),
});

// makeReply with anchorId only
export const DiscussionMakeReplyWithAnchorRequest: Sync = (
  { request, session, threadId, anchorId, body, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    anchorId,
    body,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author: user,
    anchorId,
    body,
  }]),
});

// makeReply with parentReply only
export const DiscussionMakeReplyWithParentRequest: Sync = (
  { request, session, threadId, body, parentReply, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    body,
    parentReply,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author: user,
    body,
    parentReply,
  }]),
});

export const DiscussionMakeReplyResponse: Sync = (
  { request, newReply, result, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/makeReply" }, { request }],
    [DiscussionPub.makeReply, {}, { newReply, result, error }],
  ),
  then: actions([Requesting.respond, { request, newReply, result, error }]),
});
