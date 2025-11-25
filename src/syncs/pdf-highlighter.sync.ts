import { actions, Frames, Sync } from "@engine";
import { PdfHighlighter, Requesting, Sessioning } from "@concepts";

// PdfHighlighter Actions
export const PdfHighlighterCreateHighlightRequest: Sync = (
  { request, session, paper, page, rects, quote, color, user },
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
      color,
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
    color,
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

export const PdfHighlighterListByPaperRequest: Sync = (
  { request, paper, highlight, highlights },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/PdfHighlighter/_listByPaper",
      paper,
    },
    { request },
  ]),
  where: async (frames) => {
    // Preserve the original request frame
    const originalFrame = frames[0];

    // Query for all highlights for this paper
    // Query returns Array<{ highlight: HighlightDoc }> - one per highlight
    frames = await frames.query(PdfHighlighter._listByPaper, { paper }, {
      highlight,
    });

    // Handle empty case (no highlights found)
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [highlights]: [] });
    }

    // Collect all highlight values into a single array
    return frames.collectAs([highlight], highlights);
  },
  then: actions([Requesting.respond, { request, highlights }]),
});
