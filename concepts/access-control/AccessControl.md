# Concept: AccessControl

+ **concept** AccessControl [User, Resource]
+ **purpose** manage access to certain resources to different groups of users
+ **principle** users can create groups, add and remove other users to groups, and
get access to resources based on the groups they are in. Also provides a way to grant
universal access to a resource to all users.
+ **state**
  + a set of Groups with
    + a name String
    + a description String
    + an admin User
  + a set of Memberships with
    + a group Group
    + a user User
    + a isAdmin Boolean
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
  + givePrivateAccess(group: Group, resource: Resource) : (newPrivateAccess: PrivateAccess)
    + **requires** the group is in the set of Groups, there is no Access with the
    given group and resource in the set of PrivateAccesses
    + **effects** creates a new PrivateAccess with the given group and resource, and adds it
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
    Memberships and Accesses associated with the group.
