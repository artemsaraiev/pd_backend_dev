# Concept: DiscussionPub[User, Anchor]

+ **purpose** per-paper forum with threads and replies, anchored to some context
+ **principle** pub is created for a paper to be discussed; threads are created by the
users of the paper in relation to some context, replies are created by the users in
relation to a thread
+ **state**
  + a set of Pubs with
    + a paperId String
    + a createdAt Date
  + a set of Threads with
    + an author User
    + a pub Pub
    + an anchor Anchor
    + a title String
    + a body String
    + a deleted Boolean
    + a createdAt Date
    + an editedAt Date?
  + a set of Replies with
    + a thread Thread
    + an author User
    + an anchor Anchor
    + a body String
    + a deleted Boolean
    + a createdAt Date
    + a parent Reply?
    + an editedAt Date?
+ **actions**
  + open(paperId: String) : (newPub: Pub)
    + **requires** there is no pub with the given paperId in the set of Pubs +
    + **effects** inserts a new pub with the given paperId and current timestamp into
    the set of Pubs and returns it
  + startThread(pub: Pub, author: User, anchor: Anchor, title: String, body: String) :
  (newThread: Thread)
    + **requires** the pub is in the set of Pubs
    + **effects** inserts a new thread with the given pub, author, anchor, title, body,
    current timestamp, deleted flag set to false and editedAt set to null and returns it
  + editThread(thread: Thread, newTitle: String, newBody: String) : ()
    + **requires** the thread is in the set of Threads
    + **effects** updates the title and body of the thread with the new values and
    sets the editedAt to current timestamp
  + deleteThread(thread: Thread) : ()
    + **requires** the thread is in the set of Threads
    + **effects** sets the deleted flag of the thread to true and sets the editedAt to
    current timestamp
  + makeReply(thread: Thread, author: User, anchor: Anchor, body: String, parentReply?: Reply) : (newReply: Reply)
    + **requires** the thread is in the set of Threads; the parentReply, if provided,
    should be in the set of Replies and the thread of the parentReply should be the
    same as the thread.
    + **effects** inserts a new reply with the given thread, author, anchor, body,
    current timestamp, deleted flag set to false, and editedAt set to null into the
    set of Replies and returns it. If a parentReply is provided, it is set as the
    parent of the new reply.
  + editReply(reply: Reply, newBody: String) : ()
    + **requires** the reply is in the set of Replies
    + **effects** updates the body of the reply with the new value and sets the
    editedAt to the current timestamp
  + deleteReply(reply: Reply) : ()
    + **requires** the reply is in the set of Replies
    + **effects** sets the deleted flag of the reply to true and sets the editedAt to
    current timestamp
+ **queries**
  + _getPubIdByPaper(paperId: String) : (result: Pub | null)
    + **requires** nothing
    + **effects** returns the Pub ID for the given paperId, or null if no pub exists
  + _listThreads(pub: Pub, anchor?: Anchor) : (threads: Thread[])
    + **requires** nothing
    + **effects** returns all non-deleted threads for the given pub, optionally filtered
    by anchor. Results are ordered by createdAt. Each thread includes _id, author, title,
    body, anchorId, createdAt, and editedAt.
  + _listReplies(thread: Thread) : (replies: Reply[])
    + **requires** nothing
    + **effects** returns all non-deleted replies for the given thread, ordered by
    createdAt. Each reply includes _id, author, body, anchorId, parentId, createdAt,
    and editedAt.
  + _listRepliesTree(thread: Thread) : (replies: ReplyTree[])
    + **requires** nothing
    + **effects** returns all non-deleted replies for the given thread organized as a
    tree structure, where each reply has a children array containing its child replies.
    Results are ordered by createdAt.
