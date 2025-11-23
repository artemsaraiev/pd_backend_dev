import { actions, Sync } from "@engine";
import { Requesting, Sessioning, FileUploading, UserAuthentication, Sharing } from "@concepts";

//-- Share a File --//
export const ShareFileRequest: Sync = ({ request, session, file, shareWithUsername, requester, owner, targetUser }) => ({
  when: actions([Requesting.request, { path: "/share", session, file, shareWithUsername }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user: requester });
    frames = await frames.query(FileUploading._getOwner, { file }, { owner });
    // Authorize: Requester must be the owner.
    frames = frames.filter(($) => $[requester] === $[owner]);
    frames = await frames.query(UserAuthentication._getUserByUsername, { username: shareWithUsername }, { user: targetUser });
    return frames;
  },
  then: actions([Sharing.shareWithUser, { file, user: targetUser }]),
});

export const ShareFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/share" }, { request }],
    [Sharing.shareWithUser, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "shared" }]),
});

//-- Revoke Access to a File --//
export const RevokeAccessRequest: Sync = ({ request, session, file, revokeForUsername, requester, owner, targetUser }) => ({
  when: actions([Requesting.request, { path: "/revoke", session, file, revokeForUsername }, { request }]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user: requester });
    frames = await frames.query(FileUploading._getOwner, { file }, { owner });
    // Authorize: Requester must be the owner.
    frames = frames.filter(($) => $[requester] === $[owner]);
    frames = await frames.query(UserAuthentication._getUserByUsername, { username: revokeForUsername }, { targetUser });
    return frames;
  },
  then: actions([Sharing.revokeAccess, { file, user: targetUser }]),
});

export const RevokeAccessResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/revoke" }, { request }],
    [Sharing.revokeAccess, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "revoked" }]),
});