running 5 tests from ./concepts/identity-verification/test.ts
IdentityVerification OP: addORCID -> addAffiliation -> addBadge ...
------- output -------
OP verification: {
  _id: "u1",
  badges: [ "Author", "ORCID" ],
  orcid: "0000-0001-2345-6789",
  affiliation: "MIT"
}
----- output end -----
IdentityVerification OP: addORCID -> addAffiliation -> addBadge ... ok (833ms)
IdentityVerification variants: updateAffiliation, revokeBadge, addBadge duplicate no-op ...
------- output -------
Variants verification: { _id: "u2", badges: [], affiliation: "Harvard" }
----- output end -----
IdentityVerification variants: updateAffiliation, revokeBadge, addBadge duplicate no-op ... ok (788ms)
IdentityVerification errors policy: revokeBadge on missing doc is no-op ... ok (645ms)
IdentityVerification variant: clear affiliation unsets field ...
------- output -------
Variant2 verification: { _id: "u3", badges: [] }
----- output end -----
IdentityVerification variant: clear affiliation unsets field ... ok (643ms)
IdentityVerification variants: ORCID replacement and revoke non-existent badge no-op ...
------- output -------
Variant3 verification: { _id: "u4", badges: [ "Author" ], orcid: "0000-0002-2222-2222" }
----- output end -----
IdentityVerification variants: ORCID replacement and revoke non-existent badge no-op ... ok (823ms)

ok | 5 passed | 0 failed (3s)

