running 6 tests from ./concepts/discussion-pub/test.ts
DiscussionPub OP: open -> startThread -> reply -> editThread -> editReply ...
------- output -------
OP thread: {
  _id: new ObjectId("68f19517130b6b9291df4004"),
  pubId: "68f19517130b6b9291df4003",
  author: "u1",
  anchorId: "anchor-123",
  body: "Hello edited",
  createdAt: 1760662807276,
  editedAt: 1760662807349
}
OP reply: {
  _id: new ObjectId("68f19517130b6b9291df4005"),
  threadId: "68f19517130b6b9291df4004",
  author: "u2",
  body: "Hi edited",
  createdAt: 1760662807329,
  editedAt: 1760662807379
}
----- output end -----
DiscussionPub OP: open -> startThread -> reply -> editThread -> editReply ... ok (1s)
DiscussionPub variants: deleteReply then reply again; deleteThread cascades ...
------- output -------
Variants1 replies after cascade: []
----- output end -----
DiscussionPub variants: deleteReply then reply again; deleteThread cascades ... ok (1s)
DiscussionPub variants: startThread without anchor; multiple threads ...
------- output -------
Variants2 threads: 68f19519130b6b9291df400b 68f19519130b6b9291df400c
----- output end -----
DiscussionPub variants: startThread without anchor; multiple threads ... ok (976ms)
DiscussionPub errors: duplicate pub; reply missing thread; edit/delete missing ids ... ok (929ms)
DiscussionPub errors: startThread with invalid pubId ... ok (723ms)
DiscussionPub variants: deleteReply twice errors; edit sets editedAt ...
------- output -------
Thread before/after: {
  _id: new ObjectId("68f1951c130b6b9291df4010"),
  pubId: "68f1951c130b6b9291df400f",
  author: "u1",
  anchorId: null,
  body: "B",
  createdAt: 1760662812055
} {
  _id: new ObjectId("68f1951c130b6b9291df4010"),
  pubId: "68f1951c130b6b9291df400f",
  author: "u1",
  anchorId: null,
  body: "B2",
  createdAt: 1760662812055,
  editedAt: 1760662812131
}
----- output end -----
DiscussionPub variants: deleteReply twice errors; edit sets editedAt ... ok (1s)

ok | 6 passed | 0 failed (5s)

