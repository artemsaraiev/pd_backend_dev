- Applied suggestions by TA, fixed errors (non modularity)
- Enforced modularity: no validation of external `AnchorId`s, only store the string.
- Added full edit/delete surface to avoid dead ends; cascade delete on thread.
- Idempotence: not required beyond uniqueness of pub per paperId; enforced via unique index.
- Collections: `pubs`, `threads`, `replies`. Indexes on `paperId`, `pubId`, `threadId`.
- Error policy: missing referenced ids throw; duplicate pub is an error.

