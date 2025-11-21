import { actions, Sync } from "@engine";
import { AccessControl, Requesting } from "@concepts";

// AccessControl Actions
export const AccessControlCreateGroupRequest: Sync = ({ request, creator, name, description }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/createGroup", creator, name, description }, { request }]),
  then: actions([AccessControl.createGroup, { creator, name, description }]),
});

export const AccessControlCreateGroupResponse: Sync = ({ request, newGroup, error }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/createGroup" }, { request }],
    [AccessControl.createGroup, {}, { newGroup, error }],
  ),
  then: actions([Requesting.respond, { request, newGroup, error }]),
});

export const AccessControlUpdateGroupRequest: Sync = ({ request, group, name, description }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/updateGroup", group, name, description }, { request }]),
  then: actions([AccessControl.updateGroup, { group, name, description }], [Requesting.respond, { request, ok: true }]),
});

export const AccessControlAddUserRequest: Sync = ({ request, group, user }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/addUser", group, user }, { request }]),
  then: actions([AccessControl.addUser, { group, user }]),
});

export const AccessControlAddUserResponse: Sync = ({ request, newMembership, error }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/addUser" }, { request }],
    [AccessControl.addUser, {}, { newMembership, error }],
  ),
  then: actions([Requesting.respond, { request, newMembership, error }]),
});

export const AccessControlRevokeMembershipRequest: Sync = ({ request, membership }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/revokeMembership", membership }, { request }]),
  then: actions([AccessControl.revokeMembership, { membership }], [Requesting.respond, { request, ok: true }]),
});

export const AccessControlPromoteUserRequest: Sync = ({ request, membership }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/promoteUser", membership }, { request }]),
  then: actions([AccessControl.promoteUser, { membership }], [Requesting.respond, { request, ok: true }]),
});

export const AccessControlDemoteUserRequest: Sync = ({ request, membership }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/demoteUser", membership }, { request }]),
  then: actions([AccessControl.demoteUser, { membership }], [Requesting.respond, { request, ok: true }]),
});

export const AccessControlGivePrivateAccessRequest: Sync = ({ request, group, resource }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/givePrivateAccess", group, resource }, { request }]),
  then: actions([AccessControl.givePrivateAccess, { group, resource }]),
});

export const AccessControlGivePrivateAccessResponse: Sync = ({ request, newPrivateAccess, error }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/givePrivateAccess" }, { request }],
    [AccessControl.givePrivateAccess, {}, { newPrivateAccess, error }],
  ),
  then: actions([Requesting.respond, { request, newPrivateAccess, error }]),
});

export const AccessControlRevokePrivateAccessRequest: Sync = ({ request, privateAccess }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/revokePrivateAccess", privateAccess }, { request }]),
  then: actions([AccessControl.revokePrivateAccess, { privateAccess }], [Requesting.respond, { request, ok: true }]),
});

export const AccessControlGiveUniversalAccessRequest: Sync = ({ request, resource }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/giveUniversalAccess", resource }, { request }]),
  then: actions([AccessControl.giveUniversalAccess, { resource }]),
});

export const AccessControlGiveUniversalAccessResponse: Sync = ({ request, newUniversalAccess, error }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/giveUniversalAccess" }, { request }],
    [AccessControl.giveUniversalAccess, {}, { newUniversalAccess, error }],
  ),
  then: actions([Requesting.respond, { request, newUniversalAccess, error }]),
});

export const AccessControlRevokeUniversalAccessRequest: Sync = ({ request, universalAccess }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/revokeUniversalAccess", universalAccess }, { request }]),
  then: actions([AccessControl.revokeUniversalAccess, { universalAccess }], [Requesting.respond, { request, ok: true }]),
});

export const AccessControlRemoveGroupRequest: Sync = ({ request, group }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/removeGroup", group }, { request }]),
  then: actions([AccessControl.removeGroup, { group }], [Requesting.respond, { request, ok: true }]),
});

// AccessControl Queries
export const AccessControlGetGroupRequest: Sync = ({ request, group }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/_getGroup", group }, { request }]),
  then: actions([AccessControl._getGroup, { group }]),
});

export const AccessControlGetGroupResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/_getGroup" }, { request }],
    [AccessControl._getGroup, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AccessControlGetMembershipsByGroupRequest: Sync = ({ request, group }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/_getMembershipsByGroup", group }, { request }]),
  then: actions([AccessControl._getMembershipsByGroup, { group }]),
});

export const AccessControlGetMembershipsByGroupResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/_getMembershipsByGroup" }, { request }],
    [AccessControl._getMembershipsByGroup, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AccessControlGetMembershipsByUserRequest: Sync = ({ request, user }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/_getMembershipsByUser", user }, { request }]),
  then: actions([AccessControl._getMembershipsByUser, { user }]),
});

export const AccessControlGetMembershipsByUserResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/_getMembershipsByUser" }, { request }],
    [AccessControl._getMembershipsByUser, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AccessControlHasAccessRequest: Sync = ({ request, user, resource }) => ({
  when: actions([Requesting.request, { path: "/AccessControl/_hasAccess", user, resource }, { request }]),
  then: actions([AccessControl._hasAccess, { user, resource }]),
});

export const AccessControlHasAccessResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/_hasAccess" }, { request }],
    [AccessControl._hasAccess, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

