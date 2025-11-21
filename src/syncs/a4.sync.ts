import { actions, Sync } from "@engine";
import {
  DiscussionPub,
  HighlightedContext,
  IdentityVerification,
  PaperIndex,
  Requesting,
} from "@concepts";

// PaperIndex
export const PaperIndexEnsureRequest: Sync = ({ request, paperId, title }) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/ensure",
    paperId,
    title,
  }, { request }]),
  then: actions([PaperIndex.ensure, { paperId, title }]),
});

export const PaperIndexEnsureResponse: Sync = ({ request, paper, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/ensure" }, { request }],
    [PaperIndex.ensure, {}, { paper, error }],
  ),
  then: actions([Requesting.respond, { request, paper, error }]),
});

export const PaperIndexUpdateMeta: Sync = ({ request, paper, title }) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/updateMeta",
    paper,
    title,
  }, { request }]),
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

export const PaperIndexListRecentRequest: Sync = ({ request, limit }) => ({
  when: actions([
    Requesting.request,
    { path: "/PaperIndex/listRecent", limit },
    { request },
  ]),
  then: actions([PaperIndex._listRecent, { limit }]),
});

export const PaperIndexListRecentResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/listRecent" }, { request }],
    [PaperIndex._listRecent, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// HighlightedContext
export const HighlightedCreateRequest: Sync = (
  { request, paperId, author, location, kind, parentContext },
) => ({
  when: actions([Requesting.request, {
    path: "/HighlightedContext/create",
    paperId,
    author,
    location,
    kind,
    parentContext,
  }, { request }]),
  then: actions([HighlightedContext.create, {
    paperId,
    author,
    location,
    kind,
    parentContext,
  }]),
});

export const HighlightedCreateResponse: Sync = (
  { request, newContext, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/HighlightedContext/create" }, { request }],
    [HighlightedContext.create, {}, { newContext, error }],
  ),
  then: actions([Requesting.respond, { request, newContext, error }]),
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

// startThread with anchorId
export const DiscussionStartThreadWithAnchorRequest: Sync = (
  { request, pubId, author, body, anchorId },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    pubId,
    author,
    body,
    anchorId,
  }, { request }]),
  then: actions([DiscussionPub.startThread, { pubId, author, body, anchorId }]),
});

// startThread without anchorId
export const DiscussionStartThreadRequest: Sync = (
  { request, pubId, author, body },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/startThread",
    pubId,
    author,
    body,
  }, { request }]),
  then: actions([DiscussionPub.startThread, { pubId, author, body }]),
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
  { request, threadId, author, body },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/reply",
    threadId,
    author,
    body,
  }, { request }]),
  then: actions([DiscussionPub.reply, { threadId, author, body }]),
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
  { request, threadId, parentId, author, body },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/replyTo",
    threadId,
    parentId,
    author,
    body,
  }, { request }]),
  then: actions([DiscussionPub.replyTo, { threadId, parentId, author, body }]),
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
  { request, pubId, anchorId },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_listThreads",
    pubId,
    anchorId,
  }, { request }]),
  then: actions([DiscussionPub._listThreads, { pubId, anchorId }]),
});

// _listThreads without anchorId filter
export const DiscussionListThreadsRequest: Sync = ({ request, pubId }) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_listThreads",
    pubId,
  }, { request }]),
  then: actions([DiscussionPub._listThreads, { pubId }]),
});

export const DiscussionListThreadsResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/_listThreads" }, { request }],
    [DiscussionPub._listThreads, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const DiscussionListRepliesRequest: Sync = ({ request, threadId }) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_listReplies",
    threadId,
  }, { request }]),
  then: actions([DiscussionPub._listReplies, { threadId }]),
});

export const DiscussionListRepliesResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/_listReplies" }, { request }],
    [DiscussionPub._listReplies, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// Tree-structured replies
export const DiscussionListRepliesTreeRequest: Sync = (
  { request, threadId },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/_listRepliesTree",
    threadId,
  }, { request }]),
  then: actions([DiscussionPub._listRepliesTree, { threadId }]),
});

export const DiscussionListRepliesTreeResponse: Sync = (
  { request, result },
) => ({
  when: actions(
    [Requesting.request, { path: "/DiscussionPub/_listRepliesTree" }, {
      request,
    }],
    [DiscussionPub._listRepliesTree, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

// IdentityVerification
export const IdentityAddORCIDRequest: Sync = ({ request, user, orcid }) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/addORCID",
    user,
    orcid,
  }, { request }]),
  then: actions([IdentityVerification.addORCID, { user, orcid }]),
});

export const IdentityAddORCIDResponse: Sync = (
  { request, newORCID, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addORCID" }, {
      request,
    }],
    [IdentityVerification.addORCID, {}, { newORCID, error }],
  ),
  then: actions([Requesting.respond, { request, newORCID, error }]),
});

export const IdentityAddBadgeRequest: Sync = ({ request, user, badge }) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/addBadge",
    user,
    badge,
  }, { request }]),
  then: actions([IdentityVerification.addBadge, { user, badge }]),
});

export const IdentityAddBadgeResponse: Sync = (
  { request, newBadge, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addBadge" }, {
      request,
    }],
    [IdentityVerification.addBadge, {}, { newBadge, error }],
  ),
  then: actions([Requesting.respond, { request, newBadge, error }]),
});

// PaperIndex mutations
export const PaperIndexAddAuthorsRequest: Sync = (
  { request, paper, authors },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/addAuthors",
    paper,
    authors,
  }, { request }]),
  then: actions([PaperIndex.addAuthors, { paper, authors }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const PaperIndexRemoveAuthorsRequest: Sync = (
  { request, paper, authors },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/removeAuthors",
    paper,
    authors,
  }, { request }]),
  then: actions([PaperIndex.removeAuthors, { paper, authors }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const PaperIndexAddLinkRequest: Sync = ({ request, paper, url }) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/addLink",
    paper,
    url,
  }, { request }]),
  then: actions([PaperIndex.addLink, { paper, url }], [Requesting.respond, {
    request,
    ok: true,
  }]),
});

export const PaperIndexRemoveLinkRequest: Sync = ({ request, paper, url }) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/removeLink",
    paper,
    url,
  }, { request }]),
  then: actions([PaperIndex.removeLink, { paper, url }], [Requesting.respond, {
    request,
    ok: true,
  }]),
});

// DiscussionPub mutations
export const DiscussionEditThreadRequest: Sync = (
  { request, threadId, newTitle, newBody },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/editThread",
    threadId,
    newTitle,
    newBody,
  }, { request }]),
  then: actions([DiscussionPub.editThread, { threadId, newTitle, newBody }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const DiscussionDeleteThreadRequest: Sync = ({ request, threadId }) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/deleteThread",
    threadId,
  }, { request }]),
  then: actions([DiscussionPub.deleteThread, { threadId }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const DiscussionEditReplyRequest: Sync = (
  { request, replyId, newBody },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/editReply",
    replyId,
    newBody,
  }, { request }]),
  then: actions([DiscussionPub.editReply, { replyId, newBody }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const DiscussionDeleteReplyRequest: Sync = ({ request, replyId }) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/deleteReply",
    replyId,
  }, { request }]),
  then: actions([DiscussionPub.deleteReply, { replyId }], [Requesting.respond, {
    request,
    ok: true,
  }]),
});

// makeReply with all optional parameters
export const DiscussionMakeReplyWithAllRequest: Sync = (
  { request, threadId, author, anchorId, body, parentReply },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    threadId,
    author,
    anchorId,
    body,
    parentReply,
  }, { request }]),
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author,
    anchorId,
    body,
    parentReply,
  }]),
});

// makeReply without anchorId and parentReply
export const DiscussionMakeReplyRequest: Sync = (
  { request, threadId, author, body },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    threadId,
    author,
    body,
  }, { request }]),
  then: actions([DiscussionPub.makeReply, { threadId, author, body }]),
});

// makeReply with anchorId only
export const DiscussionMakeReplyWithAnchorRequest: Sync = (
  { request, threadId, author, anchorId, body },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    threadId,
    author,
    anchorId,
    body,
  }, { request }]),
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author,
    anchorId,
    body,
  }]),
});

// makeReply with parentReply only
export const DiscussionMakeReplyWithParentRequest: Sync = (
  { request, threadId, author, body, parentReply },
) => ({
  when: actions([Requesting.request, {
    path: "/DiscussionPub/makeReply",
    threadId,
    author,
    body,
    parentReply,
  }, { request }]),
  then: actions([DiscussionPub.makeReply, {
    threadId,
    author,
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
export const IdentityRemoveORCIDRequest: Sync = ({ request, orcid }) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/removeORCID",
    orcid,
  }, { request }]),
  then: actions([IdentityVerification.removeORCID, { orcid }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const IdentityRemoveAffiliationRequest: Sync = (
  { request, affiliation },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/removeAffiliation",
    affiliation,
  }, { request }]),
  then: actions([IdentityVerification.removeAffiliation, { affiliation }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const IdentityUpdateAffiliationRequest: Sync = (
  { request, affiliation, newAffiliation },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/updateAffiliation",
    affiliation,
    newAffiliation,
  }, { request }]),
  then: actions([IdentityVerification.updateAffiliation, {
    affiliation,
    newAffiliation,
  }], [Requesting.respond, { request, ok: true }]),
});

export const IdentityGetByUserRequest: Sync = ({ request, user }) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/_getByUser",
    user,
  }, { request }]),
  then: actions([IdentityVerification._getByUser, { user }]),
});

export const IdentityGetByUserResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/_getByUser" }, {
      request,
    }],
    [IdentityVerification._getByUser, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});
