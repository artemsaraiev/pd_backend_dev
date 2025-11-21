# API Specification: IdentityVerification Concept

**Purpose:** optional trust signals attached to a user

**Note:** Endpoints that require authentication will include a `session` parameter in the request body. The session token is obtained via the login endpoint and should be included in all authenticated requests.

---

## API Endpoints

### POST /api/IdentityVerification/addORCID

**Description:** Adds an ORCID identifier to a user's account.

**Requirements:**
- there is no ORCID for the given user in the set of ORCIDs

**Effects:**
- inserts new ORCID into the set of ORCIDs for the given user and returns the new ORCID

**Request Body:**
```json
{
  "session": "string",
  "orcid": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Action):**
```json
{
  "newORCID": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/IdentityVerification/removeORCID

**Description:** Removes an ORCID identifier from a user's account.

**Requirements:**
- the ORCID is in the set of ORCIDs

**Effects:**
- removes the ORCID from the set of ORCIDs

**Request Body:**
```json
{
  "session": "string",
  "orcid": "string"
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

### POST /api/IdentityVerification/addAffiliation

**Description:** Adds an institution affiliation to a user's account.

**Requirements:**
- there is no Affiliation with provided user User and affiliation String in the set of Affiliations

**Effects:**
- adds a new Affiliation into the set of Affiliations for the given user and returns the new Affiliation

**Request Body:**
```json
{
  "user": "string",
  "affiliation": "string"
}
```

**Success Response Body (Action):**
```json
{
  "newAffiliation": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/IdentityVerification/removeAffiliation

**Description:** Removes an affiliation from a user's account.

**Requirements:**
- the affiliation is in the set of Affiliations

**Effects:**
- removes the affiliation from the set of Affiliations

**Request Body:**
```json
{
  "session": "string",
  "affiliation": "string"
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

### POST /api/IdentityVerification/updateAffiliation

**Description:** Updates an existing affiliation's institution name.

**Requirements:**
- the affiliation is in the set of Affiliations, and there is no other Affiliation with the same user and newAffiliation String in the set of Affiliations

**Effects:**
- updates the affiliation String of the given Affiliation to the newAffiliation String

**Request Body:**
```json
{
  "session": "string",
  "affiliation": "string",
  "newAffiliation": "string"
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

### POST /api/IdentityVerification/addBadge

**Description:** Adds a badge to a user's account.

**Requirements:**
- there is no Badge with provided user User and badge String in the set of Badges

**Effects:**
- adds a new Badge into the set of Badges for the given user and returns the new Badge

**Request Body:**
```json
{
  "session": "string",
  "badge": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Action):**
```json
{
  "newBadge": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/IdentityVerification/revokeBadge

**Description:** Removes a badge from a user's account.

**Requirements:**
- the badge is in the set of Badges

**Effects:**
- the badge is removed from the set of Badges

**Request Body:**
```json
{
  "badge": "string"
}
```

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

### POST /api/IdentityVerification/_getByUser

**Description:** Retrieves all ORCIDs, affiliations, and badges for a user.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing all ORCIDs, Affiliations, and Badges for the given user. Each ORCID includes _id, user, and orcid. Each Affiliation includes _id, user, and affiliation. Each Badge includes _id, user, and badge. Returns an array with one dictionary containing `{ orcids: ORCIDDoc[], affiliations: AffiliationDoc[], badges: BadgeDoc[] }`.

**Request Body:**
```json
{
  "session": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Query):**
```json
[
  {
    "orcids": [
      {
        "_id": "string",
        "user": "string",
        "orcid": "string"
      }
    ],
    "affiliations": [
      {
        "_id": "string",
        "user": "string",
        "affiliation": "string"
      }
    ],
    "badges": [
      {
        "_id": "string",
        "user": "string",
        "badge": "string"
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

