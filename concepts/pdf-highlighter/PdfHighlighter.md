# Concept: PdfHighlighter [Paper]

+ **concept** PdfHighlighter [Paper]
+ **purpose** Store precise geometric locations and text content of highlights within
PDF documents
+ **principle** highlights are defined by a set of normalized rectangles on a specific
page of a paper, optionally capturing the text contained within those rectangles
+ **state**
  + a set of Highlights with
    + a paper Paper
    + a page Number
    + a rects Array<{x: Number, y: Number, w: Number, h: Number}>
    + a quote String?
+ **actions**
  + createHighlight(paper: Paper, page: Number, rects: Array<{x: Number, y: Number, w:
  Number, h: Number}>, quote?: String) : (highlightId: Highlight)
    + **requires** nothing
    + **effects** creates a new Highlight with the given paper, page, rects, and quote
    (if provided), and returns its ID
+ **queries**
  + _get(highlight: Highlight) : (highlight: HighlightDoc | null)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing the highlight
    document for the given highlight ID in the `highlight` field, or null if it does
    not exist.
  + _listByPaper(paper: Paper) : (highlights: HighlightDoc[])
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing all highlights for
    the given paper in the `highlights` field.
