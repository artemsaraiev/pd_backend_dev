- Applied suggestions by TA, fixed errors (non modularity)
- Modularity: no external checks; `userId` is opaque.
- Create-on-write ensures no dead ends; supports clearing affiliation via update.
- Set semantics for badges via $addToSet/$pull; duplicate add is no-op.
- Collection: `verifications`.
- Error policy: `revokeBadge` on missing doc is defined as no-op and documented.

