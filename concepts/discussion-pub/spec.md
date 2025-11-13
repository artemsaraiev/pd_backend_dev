concept DiscussionPub [PubId, ThreadId, ReplyId]
purpose per-paper forum with threads and replies; optional anchorId is opaque
principle uniqueness: one pub per paperId; all checks local; cascade delete replies

state
  Pubs: set of { _id: string (PubId), paperId: string (PaperId), createdAt: number }
  Threads: set of { _id: string (ThreadId), pubId: string, author: string, anchorId?: string, body: string, createdAt: number, editedAt?: number }
  Replies: set of { _id: string (ReplyId), threadId: string, author: string, body: string, createdAt: number, editedAt?: number }

actions
  open(paperId: string) -> string
    requires no pub exists with paperId
    effects create pub and return its id

  startThread(pubId: string, author: string, body: string, anchorId?: string) -> string
    requires pub exists
    effects create thread

  reply(threadId: string, author: string, body: string) -> string
    requires thread exists
    effects create reply

  editThread(threadId: string, newBody: string) -> void
    requires thread exists
    effects update body and editedAt

  deleteThread(threadId: string) -> void
    requires thread exists
    effects delete thread and all its replies

  editReply(replyId: string, newBody: string) -> void
    requires reply exists
    effects update body and editedAt

  deleteReply(replyId: string) -> void
    requires reply exists
    effects delete reply

notes
  - ids are strings; timestamps in ms since epoch
  - one unique index: Pubs.paperId
  - no cross-concept references

