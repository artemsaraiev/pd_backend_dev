import { actions, Frames, Sync } from "@engine";
import { PaperIndex, Requesting, Sessioning } from "@concepts";

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

// IdentityVerification syncs have been moved to identity-verification.sync.ts

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

// IdentityVerification syncs have been moved to identity-verification.sync.ts
