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

export const AccessControlCreateGroupResponseSuccess: Sync = (
  { request, newGroup },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/createGroup" }, { request }],
    [AccessControl.createGroup, {}, { newGroup }],
  ),
  then: actions([Requesting.respond, { request, newGroup }]),
});

export const AccessControlCreateGroupResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/createGroup" }, { request }],
    [AccessControl.createGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.updateGroup, { group, name, description }]),
});

export const AccessControlUpdateGroupResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/updateGroup" }, { request }],
    [AccessControl.updateGroup, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlUpdateGroupResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/updateGroup" }, { request }],
    [AccessControl.updateGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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

export const AccessControlAddUserResponseSuccess: Sync = (
  { request, newMembership },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/addUser" }, { request }],
    [AccessControl.addUser, {}, { newMembership }],
  ),
  then: actions([Requesting.respond, { request, newMembership }]),
});

export const AccessControlAddUserResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/addUser" }, { request }],
    [AccessControl.addUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.revokeMembership, { membership }]),
});

export const AccessControlRevokeMembershipResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/revokeMembership" }, {
      request,
    }],
    [AccessControl.revokeMembership, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlRevokeMembershipResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/revokeMembership" }, {
      request,
    }],
    [AccessControl.revokeMembership, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.promoteUser, { membership }]),
});

export const AccessControlPromoteUserResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/promoteUser" }, { request }],
    [AccessControl.promoteUser, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlPromoteUserResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/promoteUser" }, { request }],
    [AccessControl.promoteUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.demoteUser, { membership }]),
});

export const AccessControlDemoteUserResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/demoteUser" }, { request }],
    [AccessControl.demoteUser, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlDemoteUserResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/demoteUser" }, { request }],
    [AccessControl.demoteUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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

export const AccessControlGivePrivateAccessResponseSuccess: Sync = (
  { request, newPrivateAccess },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/givePrivateAccess" }, {
      request,
    }],
    [AccessControl.givePrivateAccess, {}, { newPrivateAccess }],
  ),
  then: actions([Requesting.respond, { request, newPrivateAccess }]),
});

export const AccessControlGivePrivateAccessResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/givePrivateAccess" }, {
      request,
    }],
    [AccessControl.givePrivateAccess, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.revokePrivateAccess, { privateAccess }]),
});

export const AccessControlRevokePrivateAccessResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/revokePrivateAccess" }, {
      request,
    }],
    [AccessControl.revokePrivateAccess, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlRevokePrivateAccessResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/revokePrivateAccess" }, {
      request,
    }],
    [AccessControl.revokePrivateAccess, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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

export const AccessControlGiveUniversalAccessResponseSuccess: Sync = (
  { request, newUniversalAccess },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/giveUniversalAccess" }, {
      request,
    }],
    [AccessControl.giveUniversalAccess, {}, { newUniversalAccess }],
  ),
  then: actions([Requesting.respond, { request, newUniversalAccess }]),
});

export const AccessControlGiveUniversalAccessResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/giveUniversalAccess" }, {
      request,
    }],
    [AccessControl.giveUniversalAccess, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.revokeUniversalAccess, { universalAccess }]),
});

export const AccessControlRevokeUniversalAccessResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/revokeUniversalAccess" }, {
      request,
    }],
    [AccessControl.revokeUniversalAccess, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlRevokeUniversalAccessResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/revokeUniversalAccess" }, {
      request,
    }],
    [AccessControl.revokeUniversalAccess, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
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
  then: actions([AccessControl.removeGroup, { group }]),
});

export const AccessControlRemoveGroupResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/removeGroup" }, { request }],
    [AccessControl.removeGroup, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlRemoveGroupResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/removeGroup" }, { request }],
    [AccessControl.removeGroup, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// AccessControl Queries
export const AccessControlGetGroupRequest: Sync = (
  { request, groupId, group },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/getGroup",
    group: groupId,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(AccessControl._getGroup, { group: groupId }, {
      group,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [group]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, group }]),
});

export const AccessControlGetMembershipsByGroupRequest: Sync = (
  { request, group, membership, memberships },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/getMembershipsByGroup",
    group,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      AccessControl._getMembershipsByGroup,
      { group },
      { membership },
    );
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
    path: "/AccessControl/getMembershipsByUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    frames = await frames.query(AccessControl._getMembershipsByUser, { user }, {
      membership,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [memberships]: [] });
    }
    return frames.collectAs([membership], memberships);
  },
  then: actions([Requesting.respond, { request, memberships }]),
});

export const AccessControlHasAccessRequest: Sync = (
  { request, user, resource, hasAccess },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/hasAccess",
    user,
    resource,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(AccessControl._hasAccess, { user, resource }, {
      hasAccess,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [hasAccess]: false });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, hasAccess }]),
});

// Invitation Actions
export const AccessControlInviteUserRequest: Sync = (
  { request, session, group, invitee, message, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/inviteUser",
    session,
    group,
    invitee,
    message,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.inviteUser, {
    group,
    inviter: user,
    invitee,
    message,
  }]),
});

export const AccessControlInviteUserResponseSuccess: Sync = (
  { request, newInvitation },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/inviteUser" }, { request }],
    [AccessControl.inviteUser, {}, { newInvitation }],
  ),
  then: actions([Requesting.respond, { request, newInvitation }]),
});

export const AccessControlInviteUserResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/inviteUser" }, { request }],
    [AccessControl.inviteUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AccessControlRemoveInvitationRequest: Sync = (
  { request, session, invitation, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/removeInvitation",
    session,
    invitation,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AccessControl.removeInvitation, { invitation }]),
});

export const AccessControlRemoveInvitationResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/removeInvitation" }, {
      request,
    }],
    [AccessControl.removeInvitation, {}, { ok }],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const AccessControlRemoveInvitationResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/removeInvitation" }, {
      request,
    }],
    [AccessControl.removeInvitation, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const AccessControlAcceptInvitationRequest: Sync = (
  { request, session, invitation, user, invDoc },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/acceptInvitation",
    session,
    invitation,
  }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    // Verify that the user accepting is the invitee
    frames = await frames.query(AccessControl._getInvitation, { invitation }, {
      invitation: invDoc,
    });
    return frames.filter(($) => {
      const doc = $[invDoc] as { invitee: typeof user } | undefined;
      return doc && $[user] === doc.invitee;
    });
  },
  then: actions([AccessControl.acceptInvitation, { invitation }]),
});

export const AccessControlAcceptInvitationResponseSuccess: Sync = (
  { request, newMembership },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/acceptInvitation" }, {
      request,
    }],
    [AccessControl.acceptInvitation, {}, { newMembership }],
  ),
  then: actions([Requesting.respond, { request, newMembership }]),
});

export const AccessControlAcceptInvitationResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AccessControl/acceptInvitation" }, {
      request,
    }],
    [AccessControl.acceptInvitation, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Invitation Queries
export const AccessControlListPendingInvitationsByUserRequest: Sync = (
  { request, session, user, invitation, invitations },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/listPendingInvitationsByUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [invitations]: [] });
    }
    frames = await frames.query(
      AccessControl._listPendingInvitationsByUser,
      { invitee: user },
      { invitation },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [invitations]: [] });
    }
    return frames.collectAs([invitation], invitations);
  },
  then: actions([Requesting.respond, { request, invitations }]),
});

export const AccessControlGetInvitationRequest: Sync = (
  { request, invitation, invitationDoc, invitations },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/getInvitation",
    invitation,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(AccessControl._getInvitation, { invitation }, {
      invitation: invitationDoc,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [invitations]: [] });
    }
    return frames.collectAs([invitationDoc], invitations);
  },
  then: actions([Requesting.respond, { request, invitations }]),
});

export const AccessControlGetGroupsForUserRequest: Sync = (
  { request, session, user, group, groups },
) => ({
  when: actions([Requesting.request, {
    path: "/AccessControl/getGroupsForUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [groups]: [] });
    }
    frames = await frames.query(AccessControl._getGroupsForUser, { user }, {
      group,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [groups]: [] });
    }
    return frames.collectAs([group], groups);
  },
  then: actions([Requesting.respond, { request, groups }]),
});
