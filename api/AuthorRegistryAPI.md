# API Specification: AuthorRegistry Concept

**Purpose:** maintain unique identities for authors of papers, managing their name variations and linking them to system users

**Note:** Endpoints that require authentication will include a `session` parameter in the request body. The session token is obtained via the login endpoint and should be included in all authenticated requests.

---

## API Endpoints

### POST /api/AuthorRegistry/createAuthor

**Description:** Creates a new author entity with a canonical name and affiliations.

**Requirements:**
- nothing

**Effects:**
- creates a new Author with the given canonicalName and affiliations, and returns it. Also creates a NameVariation with the canonicalName pointing to this new author.

**Request Body:**
```json
{
  "session": "string",
  "canonicalName": "string",
  "affiliations": ["string"]
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "newAuthor": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/addNameVariation

**Description:** Adds a name variation to an author.

**Requirements:**
- author exists, and name is not already in NameVariations

**Effects:**
- creates a new NameVariation linking the given name string to the author

**Request Body:**
```json
{
  "session": "string",
  "author": "string",
  "name": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/removeNameVariation

**Description:** Removes a name variation from an author.

**Requirements:**
- author exists, name is in NameVariations for this author, and name is not the author's canonicalName

**Effects:**
- removes the NameVariation

**Request Body:**
```json
{
  "session": "string",
  "author": "string",
  "name": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/updateAuthorProfile

**Description:** Updates an author's profile information (website and/or affiliations).

**Requirements:**
- author exists

**Effects:**
- updates the provided fields (website, affiliations). If a field is not provided, it remains unchanged.

**Request Body:**
```json
{
  "session": "string",
  "author": "string",
  "website": "string",
  "affiliations": ["string"]
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/claimAuthor

**Description:** Links a system user to an author entity, claiming the author's works.

**Requirements:**
- user exists, author exists, and there is no existing UserLink for this user

**Effects:**
- creates a UserLink between the user and the author

**Request Body:**
```json
{
  "session": "string",
  "author": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/unclaimAuthor

**Description:** Removes the link between a user and an author.

**Requirements:**
- a UserLink exists between user and author

**Effects:**
- removes the UserLink

**Request Body:**
```json
{
  "session": "string",
  "author": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/mergeAuthors

**Description:** Merges two author entities, moving all name variations and user links from secondary to primary.

**Requirements:**
- both authors exist and are not the same

**Effects:**
- moves all NameVariations from secondary to primary. Moves all UserLinks from secondary to primary (if a link for that user doesn't already exist on primary). Deletes the secondary Author.

**Request Body:**
```json
{
  "session": "string",
  "primary": "string",
  "secondary": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/getAuthor

**Description:** Retrieves an author document by its ID.

**Requirements:**
- nothing

**Effects:**
- returns the author document. Returns an array with one dictionary if the author exists, or an empty array if the author does not exist.

**Request Body:**
```json
{
  "author": "string"
}
```

**Success Response Body (Query):**
```json
{
  "author": {
    "_id": "string",
    "canonicalName": "string",
    "affiliations": ["string"],
    "externalIds": ["string"],
    "website": "string"
  } | null
}
```

**Note:** If the author does not exist, the response will be `{ "author": null }`.

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/getAuthorByUser

**Description:** Retrieves the author linked to a specific user.

**Requirements:**
- nothing

**Effects:**
- returns the author linked to this user. Returns an array with one dictionary if an author is linked, or an empty array if none.

**Request Body:**
```json
{
  "session": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Query):**
```json
{
  "author": {
    "_id": "string",
    "canonicalName": "string",
    "affiliations": ["string"],
    "externalIds": ["string"],
    "website": "string"
  } | null
}
```

**Note:** If no author is linked to the user, the response will be `{ "author": null }`.

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/findAuthorsByName

**Description:** Searches for authors by name (canonical name or name variations).

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing one author and its match type where the canonicalName or any NameVariation matches the query string (partial or exact). Returns an empty array if no matches are found.

**Request Body:**
```json
{
  "nameQuery": "string"
}
```

**Success Response Body (Query):**
```json
{
  "matches": [
    {
      "author": {
        "_id": "string",
        "canonicalName": "string",
        "affiliations": ["string"],
        "externalIds": ["string"],
        "website": "string"
      },
      "matchType": "Canonical" | "Variation"
    }
  ]
}
```

**Note:** The sync collects all match frames into a single `matches` array for the response. Each item in the array is wrapped in an object with keys matching the collected variable names (`author` and `matchType`).

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AuthorRegistry/resolveAuthor

**Description:** Resolves an exact name string to an author entity.

**Requirements:**
- nothing

**Effects:**
- returns the author that owns this specific name string variation. Returns an array with one dictionary if found, or an empty array if not found.

**Request Body:**
```json
{
  "exactName": "string"
}
```

**Success Response Body (Query):**
```json
{
  "author": {
    "_id": "string",
    "canonicalName": "string",
    "affiliations": ["string"],
    "externalIds": ["string"],
    "website": "string"
  } | null
}
```

**Note:** If no author is found for the exact name, the response will be `{ "author": null }`.

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

