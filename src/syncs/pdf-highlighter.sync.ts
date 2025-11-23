import { actions, Frames, Sync } from "@engine";
import { PdfHighlighter, Requesting, Sessioning } from "@concepts";

// PdfHighlighter Actions
export const PdfHighlighterCreateHighlightRequest: Sync = (
  { request, session, paper, page, rects, quote, user },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/PdfHighlighter/createHighlight",
      session,
      paper,
      page,
      rects,
      quote,
    },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([PdfHighlighter.createHighlight, {
    paper,
    page,
    rects,
    quote,
  }]),
});

// Respond to the HTTP caller once the highlight has been created.
// We only pattern-match on `highlightId` here; errors are handled by
// the Requesting timeout / generic error path.
export const PdfHighlighterCreateHighlightResponse: Sync = (
  { request, highlightId },
) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/createHighlight" }, {
      request,
    }],
    [PdfHighlighter.createHighlight, {}, { highlightId }],
  ),
  then: actions([Requesting.respond, { request, highlightId }]),
});

// PdfHighlighter Queries
export const PdfHighlighterGetRequest: Sync = ({ request, highlight }) => ({
  when: actions([Requesting.request, {
    path: "/PdfHighlighter/_get",
    highlight,
  }, { request }]),
  then: actions([PdfHighlighter._get, { highlight }]),
});

export const PdfHighlighterGetResponse: Sync = ({ request, highlight }) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/_get" }, { request }],
    // Query returns Array<{ highlight: HighlightDoc | null }>
    // Match on highlight field (as specified in the concept spec)
    [PdfHighlighter._get, {}, { highlight }],
  ),
  then: actions([Requesting.respond, { request, highlight }]),
});

export const PdfHighlighterListByPaperRequest: Sync = ({ request, paper }) => ({
  when: actions([
    Requesting.request,
    {
      path: "/PdfHighlighter/_listByPaper",
      paper,
    },
    { request },
  ]),
  then: actions([PdfHighlighter._listByPaper, { paper }]),
});

export const PdfHighlighterListByPaperResponse: Sync = (
  { request, highlight, highlights },
) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/_listByPaper" }, { request }],
    // Query returns Array<{ highlight: HighlightDoc | null }> - one per highlight
    // Returns [{ highlight: null }] when no highlights found
    // Match on highlight field (as specified in the concept spec)
    [PdfHighlighter._listByPaper, {}, { highlight }],
  ),
  where: (frames) => {
    // Filter out null highlights and collect the rest
    const validFrames = frames.filter((frame) => {
      const hl = frame[highlight];
      return hl !== null && hl !== undefined;
    });

    // Preserve the original request frame
    const originalFrame = frames[0];

    if (validFrames.length === 0) {
      // No highlights found, return empty array
      return new Frames({ ...originalFrame, [highlights]: [] });
    }

    // Collect all highlight values into a single array
    return validFrames.collectAs([highlight], highlights);
  },
  // Respond with highlights array to match frontend expectations
  then: actions([Requesting.respond, { request, highlights }]),
});
