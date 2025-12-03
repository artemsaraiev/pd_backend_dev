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

// startThread - basic (no anchorId, no groupId) -> public thread
export const DiscussionStartThreadBasicRequest: Sync = (
  { request, session, pubId, body, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    session,
    pubId,
    body,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.startThread, {
    pubId,
    author: user,
    body,
  }]),
});

// startThread - with anchorId only -> public thread
export const DiscussionStartThreadWithAnchorRequest: Sync = (
  { request, session, pubId, body, anchorId, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    session,
    pubId,
    body,
    anchorId,
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

// startThread - with groupId only -> private thread
export const DiscussionStartThreadWithGroupRequest: Sync = (
  { request, session, pubId, body, groupId, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    session,
    pubId,
    body,
    groupId,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.startThread, {
    pubId,
    author: user,
    body,
  }]),
});

// startThread - with both anchorId and groupId -> private thread
export const DiscussionStartThreadWithAnchorAndGroupRequest: Sync = (
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

// After public thread is created (no groupId), grant universal access - basic
export const DiscussionStartThreadGrantUniversalAccessBasic: Sync = (
  { request, session, pubId, body, newThread },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/DiscussionPub/startThread",
      session,
      pubId,
      body,
    }, { request }],
    [DiscussionPub.startThread, {}, { newThread, result: newThread }],
  ),
  then: actions([AccessControl.giveUniversalAccess, {
    resource: newThread,
  }]),
});

// After public thread is created (with anchorId, no groupId), grant universal access
export const DiscussionStartThreadGrantUniversalAccessWithAnchor: Sync = (
  { request, session, pubId, body, anchorId, newThread },
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
  then: actions([AccessControl.giveUniversalAccess, {
    resource: newThread,
  }]),
});

// After private thread is created (with groupId only), grant private access
export const DiscussionStartThreadGrantPrivateAccessBasic: Sync = (
  { request, session, pubId, body, groupId, newThread },
) => ({
  when: actions(
    [Requesting.request, {
      path: "/DiscussionPub/startThread",
      session,
      pubId,
      body,
      groupId,
    }, { request }],
    [DiscussionPub.startThread, {}, { newThread, result: newThread }],
  ),
  then: actions([AccessControl.givePrivateAccess, {
    group: groupId,
    resource: newThread,
  }]),
});

// After private thread is created (with both anchorId and groupId), grant private access
export const DiscussionStartThreadGrantPrivateAccessWithAnchor: Sync = (
  { request, session, pubId, body, anchorId, groupId, newThread },
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
  then: actions([AccessControl.givePrivateAccess, {
    group: groupId,
    resource: newThread,
  }]),
});

export const DiscussionStartThreadResponseSuccess: Sync = (
  { request, result },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startThread" }, { request }],
    [DiscussionPub.startThread, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const DiscussionStartThreadResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startThread" }, { request }],
    [DiscussionPub.startThread, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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

// _listThreads with anchorId filter, with session (access control)
export const DiscussionListThreadsWithAnchorAndSessionRequest: Sync = (
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

    // Resolve user from session
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      // Invalid session - return empty
      return new Frames({ ...originalFrame, [threads]: [] });
    }

    // For each thread, check if user has access
    // thread is a ThreadDoc object, extract _id for the resource check
    const accessibleFrames: typeof frames = new Frames();
    for (const frame of frames) {
      const threadDoc = frame[thread] as { _id: string } | undefined;
      if (!threadDoc) continue;
      const accessFrames = await new Frames(frame).query(
        AccessControl._hasAccess,
        {
          user,
          resource: threadDoc._id,
        },
        { hasAccess },
      );
      if (accessFrames.length > 0 && accessFrames[0][hasAccess] === true) {
        accessibleFrames.push(frame);
      }
    }
    frames = accessibleFrames;

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return frames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

// _listThreads with anchorId filter, without session (no access control)
export const DiscussionListThreadsWithAnchorRequest: Sync = (
  { request, pubId, anchorId, includeDeleted, thread, threads },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listThreads",
    pubId,
    anchorId,
    includeDeleted,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(DiscussionPub._listThreads, {
      pubId,
      anchorId,
      includeDeleted,
    }, { thread });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return frames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

// _listThreads without anchorId, with session (access control)
export const DiscussionListThreadsWithSessionRequest: Sync = (
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

    // Resolve user from session
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      // Invalid session - return empty
      return new Frames({ ...originalFrame, [threads]: [] });
    }

    // For each thread, check if user has access
    const accessibleFrames: typeof frames = new Frames();
    for (const frame of frames) {
      const threadDoc = frame[thread] as { _id: string } | undefined;
      if (!threadDoc) continue;
      const accessFrames = await new Frames(frame).query(
        AccessControl._hasAccess,
        {
          user,
          resource: threadDoc._id,
        },
        { hasAccess },
      );
      if (accessFrames.length > 0 && accessFrames[0][hasAccess] === true) {
        accessibleFrames.push(frame);
      }
    }
    frames = accessibleFrames;

    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return frames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

// _listThreads without anchorId filter, without session (no access control)
export const DiscussionListThreadsRequest: Sync = (
  { request, pubId, includeDeleted, thread, threads },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listThreads",
    pubId,
    includeDeleted,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(DiscussionPub._listThreads, {
      pubId,
      includeDeleted,
    }, { thread });
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
