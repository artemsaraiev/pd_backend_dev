import { actions, Frames, Sync } from "@engine";
import {
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

// IdentityVerification
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
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // Query all three types - user is bound from frames
    const [orcidFrames, affiliationFrames, badgeFrames] = await Promise.all([
      frames.query(IdentityVerification._getORCIDsByUser, { user }, { orcid }),
      frames.query(IdentityVerification._getAffiliationsByUser, { user }, {
        affiliation,
      }),
      frames.query(IdentityVerification._getBadgesByUser, { user }, { badge }),
    ]);

    // Collect each type into arrays
    const orcidsCollected = orcidFrames.length === 0
      ? new Frames({ [orcids]: [] })
      : orcidFrames.collectAs([orcid], orcids);
    const affiliationsCollected = affiliationFrames.length === 0
      ? new Frames({ [affiliations]: [] })
      : affiliationFrames.collectAs([affiliation], affiliations);
    const badgesCollected = badgeFrames.length === 0
      ? new Frames({ [badges]: [] })
      : badgeFrames.collectAs([badge], badges);

    // Extract arrays from collected frames
    const orcidsArray = (orcidsCollected[0]?.[orcids] as Array<unknown>) ?? [];
    const affiliationsArray =
      (affiliationsCollected[0]?.[affiliations] as Array<unknown>) ?? [];
    const badgesArray = (badgesCollected[0]?.[badges] as Array<unknown>) ?? [];

    // Combine all results into a single frame
    return new Frames({
      ...originalFrame,
      [orcids]: orcidsArray,
      [affiliations]: affiliationsArray,
      [badges]: badgesArray,
    });
  },
  then: actions([Requesting.respond, {
    request,
    orcids,
    affiliations,
    badges,
  }]),
});
