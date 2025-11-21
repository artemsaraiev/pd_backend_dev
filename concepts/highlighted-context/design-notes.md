- Applied suggestions by TA, fixed errors (non modularity)
- Local-only design: does not validate paper existence; stores `paperId` as string.
- Edit and delete included to prevent dead ends; partial edit updates provided fields.
- Idempotence: N/A except standard Mongo behavior; no unique constraints.
- Collection: `anchors`.
- Errors: operate on missing id throws.

