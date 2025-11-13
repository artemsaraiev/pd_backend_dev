concept IdentityVerification [UserId]
purpose optional trust signals attached to a user; purely local storage
principle create-on-write; badges are set semantics; local-only

state
  Verifications: set of { _id: string (UserId), orcid?: string, affiliation?: string, badges: string[] }

actions
  addORCID(userId: string, orcid: string) -> void
    requires none
    effects upserts doc and sets orcid

  addAffiliation(userId: string, affiliation: string) -> void
    requires none
    effects upserts doc and sets affiliation

  updateAffiliation(userId: string, affiliation?: string) -> void
    requires doc exists or will be created
    effects sets affiliation to value or clears if undefined

  addBadge(userId: string, badge: string) -> void
    requires none
    effects upserts doc and adds badge if not present

  revokeBadge(userId: string, badge: string) -> void
    requires doc exists
    effects removes badge if present; defined as no-op if absent

notes
  - ids are strings; timestamps in ms since epoch (none used here)
  - no cross-concept references

