# Concept: AccessControl

+ **concept** AccessControl [User, Resource]
+ **purpose** control which users can access which resources by organizing members
into named groups, handling invitation workflows, and granting group/private/universal
permissions
+ **principle** users can create groups, invite prospective members by username,
manage memberships, and gain access to resources through their memberships. The
concept handles lifecycle events such as promoting/demoting admins, revoking
membership (including voluntary leaves), granting/removing private or universal
access, and recording invitation responses.
+ **state**
  + a set of Groups with
    + a name String
    + a description String
    + an admin User
  + a set of Memberships with
    + a group Group
    + a user User
    + a isAdmin Boolean
  + a set of Invitations with
    + a group Group
    + an inviter User
    + an invitee User
    + a message String?
    + a createdAt Date
  + a set of PrivateAccesses with
    + a group Group
    + a resource Resource
  + a set of UniversalAccesses with
    + a resource Resource
+ **actions**
  + createGroup(creator: User, name: String, description: String) : (newGroup: Group)
    + **requires** nothing
    + **effects** creates a new Group with the given name, description, and admin set
    to the creator, adds it to the set of Groups and returns it. Also creates a new
    Membership with the new group, the creator as the User, and isAdmin set to true,
    and adds it to the set of Memberships
  + updateGroup(group: Group, name?: String, description?: String) : ()
    + **requires** the group is in the set of Groups
    + **effects** updates the name and/or description of the group to the provided
    values.
    If a value is not provided, that field remains unchanged.
  + addUser(group: Group, user: User) : (newMembership: Membership)
    + **requires** the group is in the set of Groups, there is no Membership with the
    given group and user in the set of Memberships
    + **effects** creates a new Membership with the given group and user, and isAdmin
    set to false, and adds it to the set of Memberships
  + revokeMembership(membership: Membership) : ()
    + **requires** the membership is in the set of Memberships. Can't be the last
    membership for the group
    + **effects** removes the membership from the set of Memberships
  + promoteUser(membership: Membership) : ()
    + **requires** the membership is in the set of Memberships
    + **effects** sets the isAdmin field of the membership to true
  + demoteUser(membership: Membership) : ()
    + **requires** the membership is in the set of Memberships, can't be the last
    admin membership for the group
    + **effects** sets the isAdmin field of the membership to false
  + givePrivateAccess(group: Group, resource: Resource) : (newPrivateAccess:
  PrivateAccess)
    + **requires** the group is in the set of Groups, there is no Access with the
    given group and resource in the set of PrivateAccesses
    + **effects** creates a new PrivateAccess with the given group and resource, and
    adds it
    to the set of PrivateAccesses.
  + revokePrivateAccess(privateAccess: PrivateAccess) : ()
    + **requires** the privateAccess is in the set of PrivateAccesses
    + **effects** removes the privateAccess from the set of PrivateAccesses
  + giveUniversalAccess(resource: Resource) : (newUniversalAccess: UniversalAccess)
    + **requires** there is no UniversalAccess with the given resource in the set of
    UniversalAccesses
    + **effects** creates a new UniversalAccess with the given resource, and adds it
    to the set of UniversalAccesses
  + revokeUniversalAccess(universalAccess: UniversalAccess) : ()
    + **requires** the universalAccess is in the set of UniversalAccesses
    + **effects** removes the UniversalAccess from the set of UniversalAccesses
  + removeGroup(group: Group) : ()
    + **requires** the group is in the set of Groups
    + **effects** removes the group from the set of Groups. Also removes all
    Memberships, PrivateAccesses, and Invitations associated with the group.
  + inviteUser(group: Group, inviter: User, invitee: User, message?: String) :
    (newInvitation: Invitation)
    + **requires** inviter is an admin member of `group`; no pending invitation exists
    for the same invitee/group pair; invitee is not a current member of the group
    + **effects** creates a new invitation with the given group, inviter, invitee, and
    message if provided, adds it to the set of Invitations and returns the new invitation
  + removeInvitation(invitation: Invitation) : ()
    + **requires** the invitation is in the set of Invitations
    + **effects** removes the invitation from the set of Invitations
  + acceptInvitation(invitation: Invitation) : (newMembership: Membership)
    + **requires** the invitation is in the set of Invitations
    + **effects** creates a new membership with the group, invitee, and isAdmin
    set to false, adds it to the set of Memberships, removes the invitation from the
    set of Invitations, and returns the new membership
+ **queries**
  + _getGroup(group: Group) : (group: GroupDoc | null)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing the group document
    for the given group in the `group` field, or null if the group does not exist.
    Returns an array with one dictionary containing `{ group: GroupDoc | null }`.
  + _getMembershipsByGroup(group: Group) : (membership: MembershipDoc)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one membership
    for the given group in the `membership` field. Each membership includes _id,
    groupId, user, and isAdmin. Returns an empty array if no memberships exist.
  + _getMembershipsByUser(user: User) : (membership: MembershipDoc)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one membership
    for the given user in the `membership` field. Each membership includes _id,
    groupId, user, and isAdmin. Returns an empty array if no memberships exist.
  + _getGroupsForUser(user: User) : (group: Group)
    + **requires** nothing
    + **effects** returns an array with one entry per group the user belongs to,
    useful for frontend drop-downs.
  + _hasAccess(user: User, resource: Resource) : (hasAccess: Boolean)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing whether the user
    has access to the resource. Returns true if the resource has universal access, or
    if the user is a member of a group that has private access to the resource.
    Returns an array with one dictionary containing `{ hasAccess: boolean }`.
  + _listPendingInvitationsByUser(invitee: User) : (invitation: InvitationDoc)
    + **requires** nothing
    + **effects** returns an array of InvitationDoc dictionaries for the given user,
    representing pending invitations
  + _getInvitation(invitation: Invitation) : (invitation: InvitationDoc)
    + **requires** nothing
    + **effects** fetches a single invitation document if it exists, returns as a
    single-element array.  If no invitation exists, returns an empty array.
**Usage notes:**

+ In the private paper discussion feature, `Resource` will be instantiated with
Discussion thread identifiers. Synchronizations between DiscussionPub and
AccessControl create `PrivateAccesses` when a thread is restricted to a group, and
queries such as `_hasAccess` gate which threads are returned to each user.
