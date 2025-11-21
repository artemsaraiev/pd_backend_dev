import { actions, Sync } from "@engine";
import { PdfHighlighter, Requesting } from "@concepts";

// PdfHighlighter Actions
export const PdfHighlighterCreateHighlightRequest: Sync = ({ request, paper, page, rects, quote }) => ({
  when: actions([Requesting.request, { path: "/PdfHighlighter/createHighlight", paper, page, rects, quote }, { request }]),
  then: actions([PdfHighlighter.createHighlight, { paper, page, rects, quote }]),
});

export const PdfHighlighterCreateHighlightResponse: Sync = ({ request, highlightId, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/createHighlight" }, { request }],
    [PdfHighlighter.createHighlight, {}, { highlightId, error }],
  ),
  then: actions([Requesting.respond, { request, highlightId, error }]),
});

// PdfHighlighter Queries
export const PdfHighlighterGetRequest: Sync = ({ request, highlight }) => ({
  when: actions([Requesting.request, { path: "/PdfHighlighter/_get", highlight }, { request }]),
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
  when: actions([Requesting.request, { path: "/PdfHighlighter/_listByPaper", paper }, { request }]),
  then: actions([PdfHighlighter._listByPaper, { paper }]),
});

export const PdfHighlighterListByPaperResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/PdfHighlighter/_listByPaper" }, { request }],
    [PdfHighlighter._listByPaper, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

