# API Specification: DiscussionPub Concept

**Purpose:** per-paper forum with threads and replies, anchored to some context

**Note:** Endpoints that require authentication will include a `session` parameter in the request body. The session token is obtained via the login endpoint and should be included in all authenticated requests.

---

## API Endpoints

### POST /api/DiscussionPub/open

**Description:** Creates a new discussion pub for a paper.

**Requirements:**
- there is no pub with the given paperId in the set of Pubs

**Effects:**
- inserts a new pub with the given paperId and current timestamp into the set of Pubs and returns it

**Request Body:**
```json
{
  "paperId": "string"
}
```

**Success Response Body (Action):**
```json
{
  "newPub": "string",
  "result": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/DiscussionPub/startThread

**Description:** Creates a new discussion thread in a pub.

**Requirements:**
- the pub is in the set of Pubs

**Effects:**
- inserts a new thread with the given pub, author, anchor, title, body, current timestamp, deleted flag set to false and editedAt set to null and returns it

**Request Body:**
```json
{
  "session": "string",
  "pubId": "string",
  "body": "string",
  "anchorId": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `author` field is automatically set from the session. The `anchorId` parameter is optional.

**Success Response Body (Action):**
```json
{
  "newThread": "string",
  "result": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/DiscussionPub/makeReply

**Description:** Creates a new reply to a thread, optionally as a reply to another reply.

**Requirements:**
- the thread is in the set of Threads; the parentReply, if provided, should be in the set of Replies and the thread of the parentReply should be the same as the thread.

**Effects:**
- inserts a new reply with the given thread, author, anchor, body, current timestamp, deleted flag set to false, and editedAt set to null into the set of Replies and returns it. If a parentReply is provided, it is set as the parent of the new reply.

**Request Body:**
```json
{
  "session": "string",
  "threadId": "string",
  "body": "string",
  "anchorId": "string",
  "parentReply": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `author` field is automatically set from the session. The `anchorId` and `parentReply` parameters are optional.

**Success Response Body (Action):**
```json
{
  "newReply": "string",
  "result": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/DiscussionPub/editThread

**Description:** Updates the title and body of a thread.

**Requirements:**
- the thread is in the set of Threads

**Effects:**
- updates the title and body of the thread with the new values and sets the editedAt to current timestamp

**Request Body:**
```json
{
  "session": "string",
  "threadId": "string",
  "newTitle": "string",
  "newBody": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. Only the thread author can edit their thread.

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

### POST /api/DiscussionPub/deleteThread

**Description:** Soft-deletes a thread and all its replies.

**Requirements:**
- the thread is in the set of Threads

**Effects:**
- sets the deleted flag of the thread to true and sets the editedAt to current timestamp

**Request Body:**
```json
{
  "session": "string",
  "threadId": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. Only the thread author can delete their thread.

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

### POST /api/DiscussionPub/editReply

**Description:** Updates the body of a reply.

**Requirements:**
- the reply is in the set of Replies

**Effects:**
- updates the body of the reply with the new value and sets the editedAt to the current timestamp

**Request Body:**
```json
{
  "session": "string",
  "replyId": "string",
  "newBody": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. Only the reply author can edit their reply.

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

### POST /api/DiscussionPub/deleteReply

**Description:** Soft-deletes a reply.

**Requirements:**
- the reply is in the set of Replies

**Effects:**
- sets the deleted flag of the reply to true and sets the editedAt to current timestamp

**Request Body:**
```json
{
  "session": "string",
  "replyId": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. Only the reply author can delete their reply.

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

### POST /api/DiscussionPub/_getPubIdByPaper

**Description:** Retrieves the pub ID for a given paper ID.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing the Pub ID for the given paperId in the `result` field, or null if no pub exists. Returns an array with one dictionary containing `{ result: Pub | null }`.

**Request Body:**
```json
{
  "paperId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "result": "string"
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

### POST /api/DiscussionPub/_listThreads

**Description:** Lists all non-deleted threads for a pub, optionally filtered by anchor.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing all non-deleted threads for the given pub in the `threads` field, optionally filtered by anchor. Results are ordered by createdAt. Each thread includes _id, author, title, body, anchorId, createdAt, and editedAt. Returns an array with one dictionary containing `{ threads: Thread[] }`.

**Request Body:**
```json
{
  "pubId": "string",
  "anchorId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "threads": [
      {
        "_id": "string",
        "author": "string",
        "title": "string",
        "body": "string",
        "anchorId": "string",
        "createdAt": "number",
        "editedAt": "number"
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

### POST /api/DiscussionPub/_listReplies

**Description:** Lists all non-deleted replies for a thread.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing all non-deleted replies for the given thread in the `replies` field, ordered by createdAt. Each reply includes _id, author, body, anchorId, parentId, createdAt, and editedAt. Returns an array with one dictionary containing `{ replies: Reply[] }`.

**Request Body:**
```json
{
  "threadId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "replies": [
      {
        "_id": "string",
        "author": "string",
        "body": "string",
        "anchorId": "string",
        "parentId": "string",
        "createdAt": "number",
        "editedAt": "number"
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

### POST /api/DiscussionPub/_listRepliesTree

**Description:** Lists all non-deleted replies for a thread organized as a tree structure.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing all non-deleted replies for the given thread organized as a tree structure in the `replies` field, where each reply has a children array containing its child replies. Results are ordered by createdAt. Returns an array with one dictionary containing `{ replies: ReplyTree[] }`.

**Request Body:**
```json
{
  "threadId": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "replies": [
      {
        "_id": "string",
        "author": "string",
        "body": "string",
        "anchorId": "string",
        "createdAt": "number",
        "editedAt": "number",
        "parentId": "string",
        "children": []
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

### POST /api/DiscussionPub/_getThread

**Description:** Retrieves a thread document by its ID.

**Requirements:**
- nothing

**Effects:**
- returns the thread document for the given thread, or null if it does not exist. Returns an array with one dictionary containing `{ thread: ThreadDoc | null }`.

**Request Body:**
```json
{
  "thread": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "thread": {
      "_id": "string",
      "pubId": "string",
      "author": "string",
      "anchorId": "string",
      "title": "string",
      "body": "string",
      "deleted": "boolean",
      "createdAt": "number",
      "editedAt": "number"
    }
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

### POST /api/DiscussionPub/_getReply

**Description:** Retrieves a reply document by its ID.

**Requirements:**
- nothing

**Effects:**
- returns the reply document for the given reply, or null if it does not exist. Returns an array with one dictionary containing `{ reply: ReplyDoc | null }`.

**Request Body:**
```json
{
  "reply": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "reply": {
      "_id": "string",
      "threadId": "string",
      "parentId": "string",
      "author": "string",
      "anchorId": "string",
      "body": "string",
      "deleted": "boolean",
      "createdAt": "number",
      "editedAt": "number"
    }
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

