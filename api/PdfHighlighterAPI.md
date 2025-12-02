# API Specification: PdfHighlighter Concept

**Purpose:** Store precise geometric locations and text content of highlights within PDF documents

**Note:** Endpoints that require authentication will include a `session` parameter in the request body. The session token is obtained via the login endpoint and should be included in all authenticated requests.

---

## API Endpoints

### POST /api/PdfHighlighter/createHighlight

**Description:** Creates a new highlight annotation on a specific page of a paper.

**Requirements:**
- nothing

**Effects:**
- creates a new Highlight with the given paper, page, rects, and quote (if provided), and returns its ID

**Request Body:**
```json
{
  "session": "string",
  "paper": "string",
  "page": "number",
  "rects": [
    {
      "x": "number",
      "y": "number",
      "w": "number",
      "h": "number"
    }
  ],
  "quote": "string",
  "color": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `quote` parameter is optional.

**Success Response Body (Action):**
```json
{
  "highlightId": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PdfHighlighter/get

**Description:** Retrieves a highlight document by its ID.

**Requirements:**
- nothing

**Effects:**
- returns the highlight document for the given highlight ID in the `result` field, or null if it does not exist.

**Request Body:**
```json
{
  "highlight": "string"
}
```

**Success Response Body (Query):**
```json
{
  "result": {
    "_id": "string",
    "paper": "string",
    "page": "number",
    "rects": [
      {
        "x": "number",
        "y": "number",
        "w": "number",
        "h": "number"
      }
    ],
    "quote": "string",
    "color": "string"
  } | null
}
```

**Note:** The `result` field contains the highlight document if it exists, or `null` if the highlight does not exist. The `quote` and `color` fields are optional.

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/PdfHighlighter/listByPaper

**Description:** Lists all highlights for a specific paper.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing one highlight document for the given paper in the `highlight` field. Returns an empty array if no highlights are found for the paper. The sync collects all highlights and responds with a single `highlights` array.

**Request Body:**
```json
{
  "paper": "string"
}
```

**Success Response Body (HTTP Response via Sync):**
```json
{
  "highlights": [
    {
      "_id": "string",
      "paper": "string",
      "page": "number",
      "rects": [
        {
          "x": "number",
          "y": "number",
          "w": "number",
          "h": "number"
        }
      ],
      "quote": "string",
      "color": "string"
    }
  ]
}
```

**Note:** The query itself returns `Array<{ highlight: HighlightDoc }>` (one highlight per dictionary element), but the sync collects them and responds with a single object containing a `highlights` array. The `quote` and `color` fields are optional. Returns an empty array if no highlights are found.

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

