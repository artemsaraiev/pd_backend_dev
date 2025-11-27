import { actions, Frames, Sync } from "@engine";
import { HighlightedContext, Requesting, Sessioning } from "@concepts";

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
  { request, paperIds, authors, filteredContext, filteredContexts },
) => ({
  when: actions([Requesting.request, {
    path: "/HighlightedContext/getFilteredContexts",
    paperIds,
    authors,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Query returns Array<{ filteredContext: ContextDoc }> - one frame per context
    frames = await frames.query(HighlightedContext._getFilteredContexts, {
      paperIds,
      authors,
    }, { filteredContext });
    // Handle empty case (no contexts found)
    if (frames.length === 0) {
      return new Frames({
        ...originalFrame,
        [filteredContexts]: [],
      });
    }

    // Collect all context values into a single array
    return frames.collectAs([filteredContext], filteredContexts);
  },
  then: actions([Requesting.respond, { request, filteredContexts }]),
});
