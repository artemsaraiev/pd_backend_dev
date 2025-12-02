import { actions, Frames, Sync } from "@engine";
import { PaperIndex, Requesting } from "@concepts";

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

export const PaperIndexUpdateMetaRequest: Sync = (
  { request, paper, title },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/updateMeta",
    paper,
    title,
  }, { request }]),
  then: actions([PaperIndex.updateMeta, { paper, title }]),
});

export const PaperIndexUpdateMetaResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/updateMeta" }, { request }],
    [PaperIndex.updateMeta, {}, { ok: true }],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const PaperIndexUpdateMetaResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/updateMeta" }, { request }],
    [PaperIndex.updateMeta, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const PaperIndexGetRequest: Sync = (
  { request, paper, paperDoc, result },
) => ({
  when: actions([Requesting.request, { path: "/PaperIndex/get", paper }, {
    request,
  }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(PaperIndex._get, { paper }, {
      paper: paperDoc,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [result]: null });
    }
    // Query returns { paper: PaperDoc }, extract and rename to result
    return new Frames({ ...originalFrame, [result]: frames[0][paperDoc] });
  },
  then: actions([Requesting.respond, { request, result }]),
});

export const PaperIndexGetByPaperIdRequest: Sync = (
  { request, paperId, paperDoc, result },
) => ({
  when: actions([
    Requesting.request,
    { path: "/PaperIndex/getByPaperId", paperId },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(PaperIndex._getByPaperId, { paperId }, {
      paper: paperDoc,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [result]: null });
    }
    // Query returns { paper: PaperDoc }, extract and rename to result
    return new Frames({ ...originalFrame, [result]: frames[0][paperDoc] });
  },
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

// PaperIndex mutations
export const PaperIndexAddAuthorsRequest: Sync = (
  { request, paper, authors },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/addAuthors",
    paper,
    authors,
  }, { request }]),
  then: actions([PaperIndex.addAuthors, { paper, authors }]),
});

export const PaperIndexAddAuthorsResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/addAuthors" }, { request }],
    [PaperIndex.addAuthors, {}, { ok: true }],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const PaperIndexAddAuthorsResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/addAuthors" }, { request }],
    [PaperIndex.addAuthors, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const PaperIndexRemoveAuthorsRequest: Sync = (
  { request, paper, authors },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/removeAuthors",
    paper,
    authors,
  }, { request }]),
  then: actions([PaperIndex.removeAuthors, { paper, authors }]),
});

export const PaperIndexRemoveAuthorsResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/removeAuthors" }, { request }],
    [PaperIndex.removeAuthors, {}, { ok: true }],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const PaperIndexRemoveAuthorsResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/removeAuthors" }, { request }],
    [PaperIndex.removeAuthors, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const PaperIndexAddLinkRequest: Sync = (
  { request, paper, url },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/addLink",
    paper,
    url,
  }, { request }]),
  then: actions([PaperIndex.addLink, { paper, url }]),
});

export const PaperIndexAddLinkResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/addLink" }, { request }],
    [PaperIndex.addLink, {}, { ok: true }],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const PaperIndexAddLinkResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/addLink" }, { request }],
    [PaperIndex.addLink, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const PaperIndexRemoveLinkRequest: Sync = (
  { request, paper, url },
) => ({
  when: actions([Requesting.request, {
    path: "/PaperIndex/removeLink",
    paper,
    url,
  }, { request }]),
  then: actions([PaperIndex.removeLink, { paper, url }]),
});

export const PaperIndexRemoveLinkResponseSuccess: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/removeLink" }, { request }],
    [PaperIndex.removeLink, {}, { ok: true }],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const PaperIndexRemoveLinkResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/PaperIndex/removeLink" }, { request }],
    [PaperIndex.removeLink, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
