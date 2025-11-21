# API Specification: HighlightedContext Concept

**Purpose:** store regions of papers (lines, figures, sections) highlighted by users as well as the parent context in which the region is highlighted

**Note:** Endpoints that require authentication will include a `session` parameter in the request body. The session token is obtained via the login endpoint and should be included in all authenticated requests.

---

## API Endpoints

### POST /api/HighlightedContext/create

**Description:** Creates a new highlighted context for a paper region.

**Requirements:**
- parentContext, if provided, should be in a set of Contexts

**Effects:**
- inserts new Context into a set of Contexts with provided fields, current creation timestamp and missing editedAt timestamp and returns newContext

**Request Body:**
```json
{
  "session": "string",
  "paperId": "string",
  "location": "string",
  "kind": "Section" | "Figure" | "Lines",
  "parentContext": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `author` field is automatically set from the session. The `parentContext` parameter is optional.

**Success Response Body (Action):**
```json
{
  "newContext": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/HighlightedContext/_getFilteredContexts

**Description:** Retrieves contexts filtered by paper IDs and/or authors.

**Requirements:**
- nothing

**Effects:**
- returns a subset of Contexts where the paperID is in the provided paperIds array (if provided) and/or the author is in the provided authors array (if provided). If both are provided, returns contexts matching both criteria. Returns all contexts if neither parameter is provided. Results are ordered by createdAt.

**Request Body:**
```json
{
  "paperIds": ["string"],
  "authors": ["string"]
}
```

**Success Response Body (Query):**
```json
[
  {
    "filteredContexts": [
      {
        "_id": "string",
        "paperId": "string",
        "author": "string",
        "location": "string",
        "kind": "Section" | "Figure" | "Lines",
        "parentContext": "string",
        "createdAt": "number"
      }
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

