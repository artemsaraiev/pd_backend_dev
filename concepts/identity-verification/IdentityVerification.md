# Concept: IdentityVerification[User]

+ **purpose** optional trust signals attached to a user
+ **principle** user can add ORCID, institution affiliation, and badges to their
account, and these can be used to verify the user's identity
+ **state**
  + a set of ORCIDs with
    + a user User
    + an orcid String
    + a verified Flag
    + an optional verifiedAt Date
    + an optional accessToken String
  + a set of Affiliations with
    + a user User
    + an affiliation String
  + a set of Badges with
    + a user User
    + a badge String
+ **actions**
  + addORCID(user: User, orcid: String) : (newORCID: ORCID)
    + **requires** there is no ORCID for the given user in the set of ORCIDs
    + **effects** inserts new ORCID into the set of ORCIDs for the given user with verified=false and
    returns the new ORCID
  + removeORCID(orcid: ORCID) : ()
    + **requires** the ORCID is in the set of ORCIDs
    + **effects** removes the ORCID from the set of ORCIDs
  + initiateORCIDVerification(orcid: ORCID, redirectUri: String) : (authUrl: String, state: String)
    + **requires** the ORCID exists in the set of ORCIDs
    + **effects** generates an OAuth authorization URL with a state parameter, stores the state temporarily, and returns the authorization URL and state
  + completeORCIDVerification(orcid: ORCID, code: String, state: String) : ()
    + **requires** the ORCID exists, the state is valid and matches the stored state, and the authorization code is valid
    + **effects** exchanges the authorization code for an access token, fetches the ORCID profile to verify ownership, updates the ORCID record with verified=true and verifiedAt=now, and removes the stored state. Returns an error if verification fails.
  + addAffiliation(user: User, affiliation: String) : (newAffiliation: Affiliation)
    + **requires** there is no Affiliation with provided user User and affiliation
    String in the set of Affiliations
    + **effects** adds a new Affiliation into the set of Affiliations for the given
    user and returns the new Affiliation
  + removeAffiliation(affiliation: Affiliation) : ()
    + **requires** the affiliation is in the set of Affiliations
    + **effects** removes the affiliation from the set of Affiliations
  + updateAffiliation(affiliation: Affiliation, newAffiliation: String) : ()
    + **requires** the affiliation is in the set of Affiliations, and there is no
    other
    Affiliation with the same user and newAffiliation String in the set of
    Affiliations
    + **effects** updates the affiliation String of the given Affiliation to the
    newAffiliation
    String
  + addBadge(user: User, badge: String) : (newBadge: Badge)
    + **requires** there is no Badge with provided user User and badge String in the
    set of Badges
    + **effects** adds a new Badge into the set of Badges for the given user and
    returns the new Badge
  + revokeBadge(badge: Badge) : ()
    + **requires** the badge is in the set of Badges
    + **effects** the badge is removed from the set of Badges
+ **queries**
  + _getORCIDsByUser(user: User) : (orcid: ORCIDDoc)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one ORCID document
    for the given user. Each ORCID includes _id, user, orcid, verified, verifiedAt (if set), and accessToken (if set). Returns an empty
    array if no ORCIDs exist.
  + _getAffiliationsByUser(user: User) : (affiliation: AffiliationDoc)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one Affiliation document
    for the given user. Each Affiliation includes _id, user, and affiliation. Returns
    an empty array if no affiliations exist.
  + _getBadgesByUser(user: User) : (badge: BadgeDoc)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one Badge document
    for the given user. Each Badge includes _id, user, and badge. Returns an empty
    array if no badges exist.
