import { actions, Frames, Sync } from "@engine";
import {
  DiscussionPub,
  HighlightedContext,
  IdentityVerification,
  PaperIndex,
  Requesting,
  Sessioning,
} from "@concepts";

// PaperIndex
// ensure is available without session - frontend sends { id, title? }
export const PaperIndexEnsureRequest: Sync = (
  { request, id, title },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/ensure",
    id,
    // Note: title is optional; do not require it in the `when` pattern,
    // or the sync will never match when callers omit it.
  }, { request }]),
  // Map frontend's 'id' to concept's 'paperId'
  // title can be undefined, which is fine for the concept action
  then: actions([PaperIndex.ensure, { paperId: id, title }]),
});

// On success, respond with result (frontend expects { result: string })
export const PaperIndexEnsureResponseSuccess: Sync = ({ request, paper }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/ensure" }, { request }],
    // Match only when PaperIndex.ensure produced a `paper`
    [PaperIndex.ensure, {}, { paper }],
  ),
  then: actions([Requesting.respond, { request, result: paper }]),
});

// On error, propagate the error back to the HTTP caller
export const PaperIndexEnsureResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/ensure" }, { request }],
    // Match only when PaperIndex.ensure produced an `error`
    [PaperIndex.ensure, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const PaperIndexUpdateMeta: Sync = (
  { request, session, paper, title, user },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/updateMeta",
    session,
    paper,
    title,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([PaperIndex.updateMeta, { paper, title }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const PaperIndexGetRequest: Sync = ({ request, paper }) => ({
  when: actions([Requesting.request, { path: "/PaperIndex/get", paper }, {
    request,
  }]),
  then: actions([PaperIndex._get, { paper }]),
});

export const PaperIndexGetResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/get" }, { request }],
    [PaperIndex._get, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const PaperIndexGetByPaperIdRequest: Sync = ({ request, paperId }) => ({
  when: actions([
    Requesting.request,
    { path: "/PaperIndex/_getByPaperId", paperId },
    { request },
  ]),
  then: actions([PaperIndex._getByPaperId, { paperId }]),
});

export const PaperIndexGetByPaperIdResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/_getByPaperId" }, { request }],
    [PaperIndex._getByPaperId, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const PaperIndexListRecentRequest: Sync = (
  { request, limit, paper, papers },
) => ({
  when: actions([
    Requesting.request,
    { path: "/PaperIndex/listRecent", limit },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(PaperIndex._listRecent, { limit }, { paper });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [papers]: [] });
    }
    return frames.collectAs([paper], papers);
  },
  then: actions([Requesting.respond, { request, papers }]),
});

// HighlightedContext
export const HighlightedCreateRequest: Sync = (
  { request, session, paperId, location, kind, parentContext, user },
) => ({
  when: actions([Requesting.request, {
    path: "/HighlightedContext/create",
    session,
    paperId,
    location,
    kind,
    // Note: parentContext is optional; do not require it in the
    // `when` pattern, or the sync will never match when callers
    // omit it.
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([HighlightedContext.create, {
    paperId,
    author: user,
    location,
    kind,
    parentContext,
  }]),
});

// On success, respond with the new context id
export const HighlightedCreateResponseSuccess: Sync = (
  { request, newContext },
) => ({
  when: actions(
    [Requesting.request, { path: "/HighlightedContext/create" }, { request }],
    // Match only when HighlightedContext.create produced a `newContext`
    [HighlightedContext.create, {}, { newContext }],
  ),
  then: actions([Requesting.respond, { request, newContext }]),
});

// On error, propagate the error back to the HTTP caller
export const HighlightedCreateResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/HighlightedContext/create" }, { request }],
    // Match only when HighlightedContext.create produced an `error`
    [HighlightedContext.create, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const HighlightedGetFilteredContextsRequest: Sync = (
  { request, paperIds, authors },
) => ({
  when: actions([Requesting.request, {
    path: "/HighlightedContext/_getFilteredContexts",
    paperIds,
    authors,
  }, { request }]),
  then: actions([HighlightedContext._getFilteredContexts, {
    paperIds,
    authors,
  }]),
});

export const HighlightedGetFilteredContextsResponse: Sync = (
  { request, result },
) => ({
  when: actions(
    [Requesting.request, { path: "/HighlightedContext/_getFilteredContexts" }, {
      request,
    }],
    [HighlightedContext._getFilteredContexts, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// DiscussionPub
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
  { request, session, pubId, body, anchorId, user },
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
    anchorId,
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

export const DiscussionGetPubIdByPaperRequest: Sync = (
  { request, paperId },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_getPubIdByPaper",
    paperId,
  }, { request }]),
  then: actions([DiscussionPub._getPubIdByPaper, { paperId }]),
});

export const DiscussionGetPubIdByPaperResponse: Sync = (
  { request, result },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/_getPubIdByPaper" }, {
      request,
    }],
    [DiscussionPub._getPubIdByPaper, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// _listThreads with anchorId filter
export const DiscussionListThreadsWithAnchorRequest: Sync = (
  { request, pubId, anchorId, includeDeleted, thread, threads },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_listThreads",
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

// _listThreads without anchorId filter
export const DiscussionListThreadsRequest: Sync = (
  { request, pubId, includeDeleted, thread, threads },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_listThreads",
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
    path: "/DiscussionPub/_listReplies",
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
    path: "/DiscussionPub/_listRepliesTree",
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

// IdentityVerification
export const IdentityAddORCIDRequest: Sync = (
  { request, session, orcid, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/addORCID",
    session,
    orcid,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.addORCID, { user, orcid }]),
});

export const IdentityAddORCIDResponseSuccess: Sync = (
  { request, newORCID },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addORCID" }, {
      request,
    }],
    [IdentityVerification.addORCID, {}, { newORCID }],
  ),
  then: actions([Requesting.respond, { request, newORCID }]),
});

export const IdentityAddORCIDResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addORCID" }, {
      request,
    }],
    [IdentityVerification.addORCID, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityAddBadgeRequest: Sync = (
  { request, session, badge, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/addBadge",
    session,
    badge,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.addBadge, { user, badge }]),
});

export const IdentityAddBadgeResponseSuccess: Sync = (
  { request, newBadge },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addBadge" }, {
      request,
    }],
    [IdentityVerification.addBadge, {}, { newBadge }],
  ),
  then: actions([Requesting.respond, { request, newBadge }]),
});

export const IdentityAddBadgeResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addBadge" }, {
      request,
    }],
    [IdentityVerification.addBadge, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// PaperIndex mutations
export const PaperIndexAddAuthorsRequest: Sync = (
  { request, session, paper, authors, user },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/addAuthors",
    session,
    paper,
    authors,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([PaperIndex.addAuthors, { paper, authors }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const PaperIndexRemoveAuthorsRequest: Sync = (
  { request, session, paper, authors, user },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/removeAuthors",
    session,
    paper,
    authors,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([PaperIndex.removeAuthors, { paper, authors }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const PaperIndexAddLinkRequest: Sync = (
  { request, session, paper, url, user },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/addLink",
    session,
    paper,
    url,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([PaperIndex.addLink, { paper, url }], [Requesting.respond, {
    request,
    ok: true,
  }]),
});

export const PaperIndexRemoveLinkRequest: Sync = (
  { request, session, paper, url, user },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/removeLink",
    session,
    paper,
    url,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([PaperIndex.removeLink, { paper, url }], [Requesting.respond, {
    request,
    ok: true,
  }]),
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
    frames = await frames.query((DiscussionPub as any)._getThread, {
      thread: threadId,
    }, { thread });
    return frames.filter(($) => {
      const threadDoc = $[thread] as { author: unknown } | null;
      return threadDoc !== null && threadDoc.author === $[user];
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
    frames = await frames.query((DiscussionPub as any)._getThread, {
      thread: threadId,
    }, { thread });
    return frames.filter(($) => {
      const threadDoc = $[thread] as { author: unknown } | null;
      return threadDoc !== null && threadDoc.author === $[user];
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
    frames = await frames.query((DiscussionPub as any)._getReply, {
      reply: replyId,
    }, { reply });
    return frames.filter(($) => {
      const replyDoc = $[reply] as { author: unknown } | null;
      return replyDoc !== null && replyDoc.author === $[user];
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
    frames = await frames.query((DiscussionPub as any)._getReply, {
      reply: replyId,
    }, { reply });
    return frames.filter(($) => {
      const replyDoc = $[reply] as { author: unknown } | null;
      return replyDoc !== null && replyDoc.author === $[user];
    });
  },
  then: actions([DiscussionPub.deleteReply, { replyId }], [Requesting.respond, {
    request,
    ok: true,
  }]),
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

// IdentityVerification mutations
export const IdentityRemoveORCIDRequest: Sync = (
  { request, session, orcid, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/removeORCID",
    session,
    orcid,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.removeORCID, { orcid }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const IdentityInitiateORCIDVerificationRequest: Sync = (
  { request, session, orcid, redirectUri, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/initiateORCIDVerification",
    session,
    orcid,
    redirectUri,
  }, { request }]),
  where: async (frames) => {
    // Get user from session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    IdentityVerification.initiateORCIDVerification,
    { orcid, redirectUri, user },
  ]),
});

export const IdentityInitiateORCIDVerificationResponseSuccess: Sync = (
  { request, authUrl, state },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/initiateORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.initiateORCIDVerification,
      {},
      { authUrl, state },
    ],
  ),
  then: actions([Requesting.respond, { request, authUrl, state }]),
});

export const IdentityInitiateORCIDVerificationResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/initiateORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.initiateORCIDVerification,
      {},
      { error },
    ],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityCompleteORCIDVerificationRequest: Sync = (
  { request, orcid, code, state, redirectUri },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/completeORCIDVerification",
    orcid,
    code,
    state,
    redirectUri,
  }, { request }]),
  then: actions([
    IdentityVerification.completeORCIDVerification,
    { orcid, code, state, redirectUri },
  ]),
});

export const IdentityCompleteORCIDVerificationResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/completeORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.completeORCIDVerification,
      {},
      { ok },
    ],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const IdentityCompleteORCIDVerificationResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/completeORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.completeORCIDVerification,
      {},
      { error },
    ],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityGetORCIDFromStateRequest: Sync = (
  { request, state, orcid },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/_getORCIDFromState",
    state,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(
      IdentityVerification._getORCIDFromState,
      { state },
      { orcid },
    );
  },
  then: actions([Requesting.respond, { request, orcid }]),
});

export const IdentityRemoveAffiliationRequest: Sync = (
  { request, session, affiliation, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/removeAffiliation",
    session,
    affiliation,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.removeAffiliation, { affiliation }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const IdentityUpdateAffiliationRequest: Sync = (
  { request, session, affiliation, newAffiliation, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/updateAffiliation",
    session,
    affiliation,
    newAffiliation,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.updateAffiliation, {
    affiliation,
    newAffiliation,
  }], [Requesting.respond, { request, ok: true }]),
});

export const IdentityGetByUserRequest: Sync = (
  {
    request,
    session,
    user,
    orcid,
    affiliation,
    badge,
    orcids,
    affiliations,
    badges,
  },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/_getByUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];

    // Get user from session
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // Handle case where user is not found
    if (frames.length === 0) {
      return new Frames({
        ...originalFrame,
        [orcids]: [],
        [affiliations]: [],
        [badges]: [],
      });
    }

    // Query ORCIDs - this will create one frame per ORCID
    const orcidFrames = await frames.query(
      IdentityVerification._getORCIDsByUser,
      { user },
      { orcid },
    );

    // Query affiliations - this will create one frame per affiliation
    const affiliationFrames = await frames.query(
      IdentityVerification._getAffiliationsByUser,
      { user },
      { affiliation },
    );

    // Query badges - this will create one frame per badge
    const badgeFrames = await frames.query(
      IdentityVerification._getBadgesByUser,
      { user },
      { badge },
    );

    // Collect ORCIDs into an array
    const orcidsCollected = orcidFrames.length === 0
      ? []
      : (orcidFrames.collectAs([orcid], orcids)[0]?.[orcids] as Array<
        unknown
      > ?? []);

    // Collect affiliations into an array
    const affiliationsCollected = affiliationFrames.length === 0
      ? []
      : (affiliationFrames.collectAs([affiliation], affiliations)[0]
        ?.[affiliations] as Array<unknown> ?? []);

    // Collect badges into an array
    const badgesCollected = badgeFrames.length === 0
      ? []
      : (badgeFrames.collectAs([badge], badges)[0]?.[badges] as Array<
        unknown
      > ?? []);

    // Return a single frame with all three arrays
    return new Frames({
      ...originalFrame,
      [orcids]: orcidsCollected,
      [affiliations]: affiliationsCollected,
      [badges]: badgesCollected,
    });
  },
  then: actions([Requesting.respond, {
    request,
    orcids,
    affiliations,
    badges,
  }]),
});
