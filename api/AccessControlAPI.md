# API Specification: AccessControl Concept

**Purpose:** control who can access which resources by organizing users into groups and granting permissions

**Note:** Endpoints that require authentication will include a `session` parameter in the request body. The session token is obtained via the login endpoint and should be included in all authenticated requests.

---

## API Endpoints

### POST /api/AccessControl/createGroup

**Description:** Creates a new access control group.

**Requirements:**
- nothing

**Effects:**
- creates a new Group with the given name, description, and admin set to the creator, adds it to the set of Groups and returns it. Also creates a new Membership with the new group, the creator as the User, and isAdmin set to true, and adds it to the set of Memberships

**Request Body:**
```json
{
  "session": "string",
  "name": "string",
  "description": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `creator` field is automatically set from the session.

**Success Response Body (Action):**
```json
{
  "newGroup": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/updateGroup

**Description:** Updates a group's name and/or description.

**Requirements:**
- the group is in the set of Groups

**Effects:**
- updates the name and/or description of the group to the provided values. If a value is not provided, that field remains unchanged.

**Request Body:**
```json
{
  "session": "string",
  "group": "string",
  "name": "string",
  "description": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/addUser

**Description:** Adds a user to a group as a non-admin member.

**Requirements:**
- the group is in the set of Groups, there is no Membership with the given group and user in the set of Memberships

**Effects:**
- creates a new Membership with the given group and user, and isAdmin set to false, and adds it to the set of Memberships

**Request Body:**
```json
{
  "session": "string",
  "group": "string",
  "userToAdd": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "newMembership": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/revokeMembership

**Description:** Removes a user's membership from a group.

**Requirements:**
- the membership is in the set of Memberships. Can't be the last membership for the group

**Effects:**
- removes the membership from the set of Memberships

**Request Body:**
```json
{
  "session": "string",
  "membership": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/promoteUser

**Description:** Promotes a user to admin status within a group.

**Requirements:**
- the membership is in the set of Memberships

**Effects:**
- sets the isAdmin field of the membership to true

**Request Body:**
```json
{
  "session": "string",
  "membership": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/demoteUser

**Description:** Demotes a user from admin status within a group.

**Requirements:**
- the membership is in the set of Memberships, can't be the last admin membership for the group

**Effects:**
- sets the isAdmin field of the membership to false

**Request Body:**
```json
{
  "session": "string",
  "membership": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/givePrivateAccess

**Description:** Grants a group private access to a resource.

**Requirements:**
- the group is in the set of Groups, there is no Access with the given group and resource in the set of PrivateAccesses

**Effects:**
- creates a new PrivateAccess with the given group and resource, and adds it to the set of PrivateAccesses.

**Request Body:**
```json
{
  "session": "string",
  "group": "string",
  "resource": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "newPrivateAccess": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/revokePrivateAccess

**Description:** Revokes a group's private access to a resource.

**Requirements:**
- the privateAccess is in the set of PrivateAccesses

**Effects:**
- removes the privateAccess from the set of PrivateAccesses

**Request Body:**
```json
{
  "session": "string",
  "privateAccess": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/giveUniversalAccess

**Description:** Grants universal access to a resource for all users.

**Requirements:**
- there is no UniversalAccess with the given resource in the set of UniversalAccesses

**Effects:**
- creates a new UniversalAccess with the given resource, and adds it to the set of UniversalAccesses

**Request Body:**
```json
{
  "session": "string",
  "resource": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "newUniversalAccess": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/revokeUniversalAccess

**Description:** Revokes universal access to a resource.

**Requirements:**
- the universalAccess is in the set of UniversalAccesses

**Effects:**
- removes the UniversalAccess from the set of UniversalAccesses

**Request Body:**
```json
{
  "session": "string",
  "universalAccess": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/removeGroup

**Description:** Removes a group and all associated memberships and accesses.

**Requirements:**
- the group is in the set of Groups

**Effects:**
- removes the group from the set of Groups. Also removes all Memberships and Accesses associated with the group.

**Request Body:**
```json
{
  "session": "string",
  "group": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required.

**Success Response Body (Action):**
```json
{
  "ok": true
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/_getGroup

**Description:** Retrieves a group document by its ID.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing the group document for the given group in the `group` field, or null if the group does not exist. Returns an array with one dictionary containing `{ group: GroupDoc | null }`.

**Request Body:**
```json
{
  "group": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "group": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "admin": "string"
    }
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/_getMembershipsByGroup

**Description:** Retrieves all memberships for a group.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing all memberships for the given group in the `memberships` field. Each membership includes _id, groupId, user, and isAdmin. Returns an array with one dictionary containing `{ memberships: MembershipDoc[] }`.

**Request Body:**
```json
{
  "group": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "memberships": [
      {
        "_id": "string",
        "groupId": "string",
        "user": "string",
        "isAdmin": "boolean"
      }
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/_getMembershipsByUser

**Description:** Retrieves all group memberships for a user.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing all memberships for the given user in the `memberships` field. Each membership includes _id, groupId, user, and isAdmin. Returns an array with one dictionary containing `{ memberships: MembershipDoc[] }`.

**Request Body:**
```json
{
  "session": "string"
}
```

**Note:** This endpoint requires authentication. The `session` parameter is required. The `user` field is automatically set from the session.

**Success Response Body (Query):**
```json
[
  {
    "memberships": [
      {
        "_id": "string",
        "groupId": "string",
        "user": "string",
        "isAdmin": "boolean"
      }
    ]
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/AccessControl/_hasAccess

**Description:** Checks if a user has access to a resource.

**Requirements:**
- nothing

**Effects:**
- returns an array of dictionaries, each containing whether the user has access to the resource. Returns true if the resource has universal access, or if the user is a member of a group that has private access to the resource. Returns an array with one dictionary containing `{ hasAccess: boolean }`.

**Request Body:**
```json
{
  "user": "string",
  "resource": "string"
}
```

**Success Response Body (Query):**
```json
[
  {
    "hasAccess": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

