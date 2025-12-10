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

// PUBLIC THREAD: /DiscussionPub/startThread (no groupId)
// anchorId is required in the request (can be empty string for no anchor)
export const DiscussionStartThreadPublicRequest: Sync = (
  { request, session, pubId, body, anchorId, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    session,
    pubId,
    body,
    anchorId,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.startThread, {
    pubId,
    author: user,
    body,
    anchorId,
    isAnonymous,
  }]),
});

// Grant universal access for public threads
export const DiscussionStartThreadPublicGrantAccess: Sync = (
  { request, newThread },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startThread" }, { request }],
    [DiscussionPub.startThread, {}, { newThread, result: newThread }],
  ),
  then: actions([AccessControl.giveUniversalAccess, {
    resource: newThread,
  }]),
});

// PRIVATE THREAD: /DiscussionPub/startPrivateThread (requires groupId)
// anchorId is required in the request (can be empty string for no anchor)
export const DiscussionStartThreadPrivateRequest: Sync = (
  { request, session, pubId, body, anchorId, groupId, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startPrivateThread",
    session,
    pubId,
    body,
    anchorId,
    groupId,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.startThread, {
    pubId,
    author: user,
    body,
    anchorId,
    isAnonymous,
  }]),
});

// Grant private access for private threads
export const DiscussionStartThreadPrivateGrantAccess: Sync = (
  { request, groupId, newThread },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DiscussionPub/startPrivateThread", groupId },
      { request },
    ],
    [DiscussionPub.startThread, {}, { newThread, result: newThread }],
  ),
  then: actions([AccessControl.givePrivateAccess, {
    group: groupId,
    resource: newThread,
  }]),
});

// Response syncs for public thread
export const DiscussionStartThreadPublicResponseSuccess: Sync = (
  { request, result },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startThread" }, { request }],
    [DiscussionPub.startThread, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const DiscussionStartThreadPublicResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startThread" }, { request }],
    [DiscussionPub.startThread, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Response syncs for private thread
export const DiscussionStartThreadPrivateResponseSuccess: Sync = (
  { request, result },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startPrivateThread" }, {
      request,
    }],
    [DiscussionPub.startThread, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const DiscussionStartThreadPrivateResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/startPrivateThread" }, {
      request,
    }],
    [DiscussionPub.startThread, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Reply - anchorId is always passed (empty string if no anchor)
export const DiscussionReplyRequest: Sync = (
  { request, session, threadId, body, anchorId, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/reply",
    session,
    threadId,
    body,
    anchorId,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.reply, { threadId, author: user, body, anchorId, isAnonymous }]),
});

export const DiscussionReplyResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/reply" }, { request }],
    [DiscussionPub.reply, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// Support nested replies - anchorId is always passed (empty string if no anchor)
export const DiscussionReplyToRequest: Sync = (
  { request, session, threadId, parentId, body, anchorId, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/replyTo",
    session,
    threadId,
    parentId,
    body,
    anchorId,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.replyTo, {
    threadId,
    parentId,
    author: user,
    body,
    anchorId,
    isAnonymous,
  }]),
});

export const DiscussionReplyToResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/replyTo" }, { request }],
    [DiscussionPub.replyTo, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// Private reply (with groupId for group-scoped replies)
export const DiscussionReplyPrivateRequest: Sync = (
  { request, session, threadId, body, anchorId, groupId, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/replyPrivate",
    session,
    threadId,
    body,
    anchorId,
    groupId,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.reply, { threadId, author: user, body, anchorId, isAnonymous }]),
});

export const DiscussionReplyPrivateGrantAccess: Sync = (
  { request, groupId, newReply },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/replyPrivate", groupId }, { request }],
    [DiscussionPub.reply, {}, { newReply, result: newReply }],
  ),
  then: actions([AccessControl.givePrivateAccess, {
    group: groupId,
    resource: newReply,
  }]),
});

export const DiscussionReplyPrivateResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/replyPrivate" }, { request }],
    [DiscussionPub.reply, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// Private nested reply (with groupId for group-scoped replies)
export const DiscussionReplyToPrivateRequest: Sync = (
  { request, session, threadId, parentId, body, anchorId, groupId, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/replyToPrivate",
    session,
    threadId,
    parentId,
    body,
    anchorId,
    groupId,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.replyTo, {
    threadId,
    parentId,
    author: user,
    body,
    anchorId,
    isAnonymous,
  }]),
});

export const DiscussionReplyToPrivateGrantAccess: Sync = (
  { request, groupId, newReply },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/replyToPrivate", groupId }, { request }],
    [DiscussionPub.replyTo, {}, { newReply, result: newReply }],
  ),
  then: actions([AccessControl.givePrivateAccess, {
    group: groupId,
    resource: newReply,
  }]),
});

export const DiscussionReplyToPrivateResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/replyToPrivate" }, { request }],
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
// Returns threads user has access to, filtered by groupFilter:
// - "all": all accessible threads (public + private from user's groups)
// - "public": only public threads
// - specific groupId: only threads from that group
// If session is invalid, returns only public threads
export const DiscussionListThreadsWithAnchorAndSessionRequest: Sync = (
  {
    request,
    session,
    pubId,
    anchorId,
    includeDeleted,
    groupFilter,
    sortBy,
    thread,
    threads,
    user,
    hasAccess,
    hasUniversalAccess,
    visibility,
  },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listThreads",
    session,
    pubId,
    anchorId,
    includeDeleted,
    groupFilter,
    sortBy,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const groupFilterValue = originalFrame[groupFilter] as string | undefined;
    const sortByValue = originalFrame[sortBy] as string | undefined;

    // Try to resolve user from session first
    const userResolutionFrames = await frames.query(Sessioning._getUser, {
      session,
    }, { user });

    const hasValidUser = userResolutionFrames.length > 0 &&
      userResolutionFrames[0][user] !== undefined;

    const resolvedUser = hasValidUser ? userResolutionFrames[0][user] : undefined;

    // Get all threads for this pub/anchor, passing userId if available
    const threadFrames = await frames.query(DiscussionPub._listThreads, {
      pubId,
      anchorId,
      includeDeleted,
      sortBy: sortByValue,
      userId: resolvedUser,
    }, { thread });

    if (threadFrames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }

    // Propagate user to thread frames for access control checks
    const userFrames = hasValidUser
      ? threadFrames.map(frame => ({ ...frame, [user]: resolvedUser }))
      : threadFrames;

    if (!hasValidUser) {
      // Invalid session - fall back to public threads only
      const publicFrames: typeof threadFrames = new Frames();
      for (const frame of threadFrames) {
        const threadDoc = frame[thread] as { _id: string } | undefined;
        if (!threadDoc) continue;
        const accessFrames = await new Frames(frame).query(
          AccessControl._hasUniversalAccess,
          { resource: threadDoc._id },
          { hasUniversalAccess },
        );
        if (
          accessFrames.length > 0 &&
          accessFrames[0][hasUniversalAccess] === true
        ) {
          publicFrames.push(frame);
        }
      }
      if (publicFrames.length === 0) {
        return new Frames({ ...originalFrame, [threads]: [] });
      }
      return publicFrames.collectAs([thread], threads);
    }

    // Valid session - check access and apply groupFilter
    const accessibleFrames: typeof userFrames = new Frames();
    for (const frame of userFrames) {
      const threadDoc = frame[thread] as { _id: string } | undefined;
      if (!threadDoc) continue;
      const userValue = frame[user];

      // First check if user has access
      const accessFrames = await new Frames(frame).query(
        AccessControl._hasAccess,
        { user: userValue, resource: threadDoc._id },
        { hasAccess },
      );
      if (accessFrames.length === 0 || accessFrames[0][hasAccess] !== true) {
        continue;
      }

      // Fetch visibility for this thread so we can include groupId in response
      const visibilityFrames = await new Frames(frame).query(
        AccessControl._getResourceVisibility,
        { resource: threadDoc._id },
        { visibility },
      );
      const vis = visibilityFrames.length > 0 ? visibilityFrames[0][visibility] as {
        isPublic: boolean;
        groupId?: string;
      } | undefined : undefined;

      // Add groupId to thread document for response
      const enrichedThread = { ...threadDoc, groupId: vis?.groupId ?? null };
      const enrichedFrame = { ...frame, [thread]: enrichedThread };

      // Apply groupFilter
      if (!groupFilterValue || groupFilterValue === "all") {
        // No filter - include all accessible threads
        accessibleFrames.push(enrichedFrame);
      } else if (groupFilterValue === "public") {
        // Only public threads
        if (vis && vis.isPublic) {
          accessibleFrames.push(enrichedFrame);
        }
      } else {
        // Specific group - check if thread belongs to that group
        if (vis && !vis.isPublic && vis.groupId === groupFilterValue) {
          accessibleFrames.push(enrichedFrame);
        }
      }
    }

    if (accessibleFrames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return accessibleFrames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

// _listThreads without anchorId, with session (access control)
// Same filtering logic as above
export const DiscussionListThreadsWithSessionRequest: Sync = (
  {
    request,
    session,
    pubId,
    includeDeleted,
    groupFilter,
    sortBy,
    thread,
    threads,
    user,
    hasAccess,
    hasUniversalAccess,
    visibility,
  },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/listThreads",
    session,
    pubId,
    includeDeleted,
    groupFilter,
    sortBy,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const groupFilterValue = originalFrame[groupFilter] as string | undefined;
    const sortByValue = originalFrame[sortBy] as string | undefined;

    // Try to resolve user from session first
    const userResolutionFrames = await frames.query(Sessioning._getUser, {
      session,
    }, { user });

    const hasValidUser = userResolutionFrames.length > 0 &&
      userResolutionFrames[0][user] !== undefined;

    const resolvedUser = hasValidUser ? userResolutionFrames[0][user] : undefined;

    // Get all threads for this pub, passing userId if available
    const threadFrames = await frames.query(DiscussionPub._listThreads, {
      pubId,
      includeDeleted,
      sortBy: sortByValue,
      userId: resolvedUser,
    }, { thread });

    if (threadFrames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }

    // Propagate user to thread frames for access control checks
    const userFrames = hasValidUser
      ? threadFrames.map(frame => ({ ...frame, [user]: resolvedUser }))
      : threadFrames;

    if (!hasValidUser) {
      // Invalid session - fall back to public threads only
      const publicFrames: typeof threadFrames = new Frames();
      for (const frame of threadFrames) {
        const threadDoc = frame[thread] as { _id: string } | undefined;
        if (!threadDoc) continue;
        const accessFrames = await new Frames(frame).query(
          AccessControl._hasUniversalAccess,
          { resource: threadDoc._id },
          { hasUniversalAccess },
        );
        if (
          accessFrames.length > 0 &&
          accessFrames[0][hasUniversalAccess] === true
        ) {
          publicFrames.push(frame);
        }
      }
      if (publicFrames.length === 0) {
        return new Frames({ ...originalFrame, [threads]: [] });
      }
      return publicFrames.collectAs([thread], threads);
    }

    // Valid session - check access and apply groupFilter
    const accessibleFrames: typeof userFrames = new Frames();
    for (const frame of userFrames) {
      const threadDoc = frame[thread] as { _id: string } | undefined;
      if (!threadDoc) continue;
      const userValue = frame[user];

      // First check if user has access
      const accessFrames = await new Frames(frame).query(
        AccessControl._hasAccess,
        { user: userValue, resource: threadDoc._id },
        { hasAccess },
      );
      if (accessFrames.length === 0 || accessFrames[0][hasAccess] !== true) {
        continue;
      }

      // Fetch visibility for this thread so we can include groupId in response
      const visibilityFrames = await new Frames(frame).query(
        AccessControl._getResourceVisibility,
        { resource: threadDoc._id },
        { visibility },
      );
      const vis = visibilityFrames.length > 0 ? visibilityFrames[0][visibility] as {
        isPublic: boolean;
        groupId?: string;
      } | undefined : undefined;

      // Add groupId to thread document for response
      const enrichedThread = { ...threadDoc, groupId: vis?.groupId ?? null };
      const enrichedFrame = { ...frame, [thread]: enrichedThread };

      // Apply groupFilter
      if (!groupFilterValue || groupFilterValue === "all") {
        // No filter - include all accessible threads
        accessibleFrames.push(enrichedFrame);
      } else if (groupFilterValue === "public") {
        // Only public threads
        if (vis && vis.isPublic) {
          accessibleFrames.push(enrichedFrame);
        }
      } else {
        // Specific group - check if thread belongs to that group
        if (vis && !vis.isPublic && vis.groupId === groupFilterValue) {
          accessibleFrames.push(enrichedFrame);
        }
      }
    }

    if (accessibleFrames.length === 0) {
      return new Frames({ ...originalFrame, [threads]: [] });
    }
    return accessibleFrames.collectAs([thread], threads);
  },
  then: actions([Requesting.respond, { request, threads }]),
});

// NOTE: "without session" syncs have been removed.
// The "with session" syncs now handle invalid/empty sessions by returning only public threads.
// Frontend must always send session parameter (even empty string) for the syncs to match.

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

// Vote Thread
export const DiscussionVoteThreadRequest: Sync = (
  { request, session, threadId, userId, vote, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/voteThread",
    session,
    threadId,
    userId,
    vote,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.voteThread, { threadId, userId: user, vote }]),
});

export const DiscussionVoteThreadResponseSuccess: Sync = ({ request, ok, upvotes, downvotes, userVote }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/voteThread" }, { request }],
    [DiscussionPub.voteThread, {}, { ok, upvotes, downvotes, userVote }],
  ),
  then: actions([Requesting.respond, { request, ok, upvotes, downvotes, userVote }]),
});

export const DiscussionVoteThreadResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/voteThread" }, { request }],
    [DiscussionPub.voteThread, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Vote Reply
export const DiscussionVoteReplyRequest: Sync = (
  { request, session, replyId, userId, vote, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/voteReply",
    session,
    replyId,
    userId,
    vote,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.voteReply, { replyId, userId: user, vote }]),
});

export const DiscussionVoteReplyResponseSuccess: Sync = ({ request, ok, upvotes, downvotes, userVote }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/voteReply" }, { request }],
    [DiscussionPub.voteReply, {}, { ok, upvotes, downvotes, userVote }],
  ),
  then: actions([Requesting.respond, { request, ok, upvotes, downvotes, userVote }]),
});

export const DiscussionVoteReplyResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/voteReply" }, { request }],
    [DiscussionPub.voteReply, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// makeReply with all optional parameters
export const DiscussionMakeReplyWithAllRequest: Sync = (
  { request, session, threadId, anchorId, body, parentReply, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    anchorId,
    body,
    parentReply,
    isAnonymous,
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
    isAnonymous,
  }]),
});

// makeReply without anchorId and parentReply
export const DiscussionMakeReplyRequest: Sync = (
  { request, session, threadId, body, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    body,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, { threadId, author: user, body, isAnonymous }]),
});

// makeReply with anchorId only
export const DiscussionMakeReplyWithAnchorRequest: Sync = (
  { request, session, threadId, anchorId, body, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    anchorId,
    body,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author: user,
    anchorId,
    body,
    isAnonymous,
  }]),
});

// makeReply with parentReply only
export const DiscussionMakeReplyWithParentRequest: Sync = (
  { request, session, threadId, body, parentReply, isAnonymous, user },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    session,
    threadId,
    body,
    parentReply,
    isAnonymous,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author: user,
    body,
    parentReply,
    isAnonymous,
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

// Get anonymous pseudonym for a user on a specific pub
export const DiscussionGetAnonymousPseudonymRequest: Sync = (
  { request, userId, pubId, pseudonym },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/getAnonymousPseudonym",
    userId,
    pubId,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(DiscussionPub._getAnonymousPseudonym, { userId, pubId }, { pseudonym });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [pseudonym]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, pseudonym }]),
});
