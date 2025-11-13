- Applied suggestions by TA, fixed errors (non modularity)
- Removed cross-concept requires; all checks are local to `papers`.
- Added edits/deletes: `updateMeta`, `removeAuthors`, `removeLink` to avoid dead-ends.
- Documented idempotence for `ensure`, `addAuthors`, and `addLink` (set semantics).
- Collection name: `papers`. No unique secondary indexes needed.
- Errors: operations on missing `_id` throw; removals on existing docs are no-op if element absent.

