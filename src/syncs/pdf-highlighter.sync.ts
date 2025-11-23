import { actions, Sync } from "@engine";
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

export const PdfHighlighterGetResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/_get" }, { request }],
    [PdfHighlighter._get, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
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
  { request, highlights },
) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/_listByPaper" }, { request }],
    // Query returns Array<{ highlights: HighlightDoc[], result: HighlightDoc[] }>
    // Match on highlights field (what the query actually returns in the first element)
    [PdfHighlighter._listByPaper, {}, { highlights }],
  ),
  // Respond with highlights to match frontend expectations
  then: actions([Requesting.respond, { request, highlights }]),
});
