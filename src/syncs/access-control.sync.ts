import { actions, Frames, Sync } from "@engine";
import { AccessControl, Requesting, Sessioning } from "@concepts";

// AccessControl Actions
export const AccessControlCreateGroupRequest: Sync = (
  { request, session, name, description, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/createGroup",
    session,
    name,
    description,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.createGroup, {
    creator: user,
    name,
    description,
  }]),
});

export const AccessControlCreateGroupResponse: Sync = (
  { request, newGroup, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/createGroup" }, { request }],
    [AccessControl.createGroup, {}, { newGroup, error }],
  ),
  then: actions([Requesting.respond, { request, newGroup, error }]),
});

export const AccessControlUpdateGroupRequest: Sync = (
  { request, session, group, name, description, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/updateGroup",
    session,
    group,
    name,
    description,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.updateGroup, { group, name, description }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AccessControlAddUserRequest: Sync = (
  { request, session, group, userToAdd, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/addUser",
    session,
    group,
    userToAdd,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.addUser, { group, user: userToAdd }]),
});

export const AccessControlAddUserResponse: Sync = (
  { request, newMembership, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/addUser" }, { request }],
    [AccessControl.addUser, {}, { newMembership, error }],
  ),
  then: actions([Requesting.respond, { request, newMembership, error }]),
});

export const AccessControlRevokeMembershipRequest: Sync = (
  { request, session, membership, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/revokeMembership",
    session,
    membership,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.revokeMembership, { membership }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AccessControlPromoteUserRequest: Sync = (
  { request, session, membership, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/promoteUser",
    session,
    membership,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.promoteUser, { membership }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AccessControlDemoteUserRequest: Sync = (
  { request, session, membership, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/demoteUser",
    session,
    membership,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.demoteUser, { membership }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AccessControlGivePrivateAccessRequest: Sync = (
  { request, session, group, resource, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/givePrivateAccess",
    session,
    group,
    resource,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.givePrivateAccess, { group, resource }]),
});

export const AccessControlGivePrivateAccessResponse: Sync = (
  { request, newPrivateAccess, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/givePrivateAccess" }, {
      request,
    }],
    [AccessControl.givePrivateAccess, {}, { newPrivateAccess, error }],
  ),
  then: actions([Requesting.respond, { request, newPrivateAccess, error }]),
});

export const AccessControlRevokePrivateAccessRequest: Sync = (
  { request, session, privateAccess, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/revokePrivateAccess",
    session,
    privateAccess,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.revokePrivateAccess, { privateAccess }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AccessControlGiveUniversalAccessRequest: Sync = (
  { request, session, resource, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/giveUniversalAccess",
    session,
    resource,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.giveUniversalAccess, { resource }]),
});

export const AccessControlGiveUniversalAccessResponse: Sync = (
  { request, newUniversalAccess, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/giveUniversalAccess" }, {
      request,
    }],
    [AccessControl.giveUniversalAccess, {}, { newUniversalAccess, error }],
  ),
  then: actions([Requesting.respond, { request, newUniversalAccess, error }]),
});

export const AccessControlRevokeUniversalAccessRequest: Sync = (
  { request, session, universalAccess, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/revokeUniversalAccess",
    session,
    universalAccess,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.revokeUniversalAccess, { universalAccess }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AccessControlRemoveGroupRequest: Sync = (
  { request, session, group, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/removeGroup",
    session,
    group,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.removeGroup, { group }], [Requesting.respond, {
    request,
    ok: true,
  }]),
});

// AccessControl Queries
export const AccessControlGetGroupRequest: Sync = ({ request, group }) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/_getGroup",
    group,
  }, { request }]),
  then: actions([AccessControl._getGroup, { group }]),
});

export const AccessControlGetGroupResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/_getGroup" }, { request }],
    [AccessControl._getGroup, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AccessControlGetMembershipsByGroupRequest: Sync = (
  { request, group, membership, memberships },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/_getMembershipsByGroup",
    group,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(AccessControl._getMembershipsByGroup, { group }, { membership });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [memberships]: [] });
    }
    return frames.collectAs([membership], memberships);
  },
  then: actions([Requesting.respond, { request, memberships }]),
});

export const AccessControlGetMembershipsByUserRequest: Sync = (
  { request, session, user, membership, memberships },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/_getMembershipsByUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(AccessControl._getMembershipsByUser, { user }, { membership });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [memberships]: [] });
    }
    return frames.collectAs([membership], memberships);
  },
  then: actions([Requesting.respond, { request, memberships }]),
});

export const AccessControlHasAccessRequest: Sync = (
  { request, user, resource },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/_hasAccess",
    user,
    resource,
  }, { request }]),
  then: actions([AccessControl._hasAccess, { user, resource }]),
});

export const AccessControlHasAccessResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/_hasAccess" }, { request }],
    [AccessControl._hasAccess, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});
