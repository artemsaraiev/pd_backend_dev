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
export const PdfHighlighterCreateHighlightResponseSuccess: Sync = (
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

// On error, propagate the error back to the HTTP caller
export const PdfHighlighterCreateHighlightResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/createHighlight" }, {
      request,
    }],
    [PdfHighlighter.createHighlight, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// PdfHighlighter Queries
export const PdfHighlighterGetRequest: Sync = (
  { request, highlight, highlightDoc, result },
) => ({
  when: actions([Requesting.request, {
    path: "/PdfHighlighter/get",
    highlight,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(PdfHighlighter._get, { highlight }, {
      highlight: highlightDoc,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [result]: null });
    }
    // Query returns { highlight: HighlightDoc }, extract and rename to result
    return new Frames({ ...originalFrame, [result]: frames[0][highlightDoc] });
  },
  then: actions([Requesting.respond, { request, result }]),
});

export const PdfHighlighterListByPaperRequest: Sync = (
  { request, paper, highlight, highlights },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/PdfHighlighter/listByPaper",
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
