import { actions, Sync } from "@engine";
import { IdentityVerification, Requesting, Sessioning } from "@concepts";

// IdentityVerification - ORCID Verification Flow
// These are unique to a4.sync.ts (not in app.sync.ts)

export const IdentityAddORCIDResponseSuccess: Sync = (
  { request, newORCID },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addORCID" }, {
      request,
    }],
    [IdentityVerification.addORCID, {}, { newORCID }],
  ),
  then: actions([Requesting.respond, { request, newORCID }]),
});

export const IdentityAddORCIDResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addORCID" }, {
      request,
    }],
    [IdentityVerification.addORCID, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityAddBadgeResponseSuccess: Sync = (
  { request, newBadge },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addBadge" }, {
      request,
    }],
    [IdentityVerification.addBadge, {}, { newBadge }],
  ),
  then: actions([Requesting.respond, { request, newBadge }]),
});

export const IdentityAddBadgeResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/IdentityVerification/addBadge" }, {
      request,
    }],
    [IdentityVerification.addBadge, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityInitiateORCIDVerificationRequest: Sync = (
  { request, session, orcid, redirectUri, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/initiateORCIDVerification",
    session,
    orcid,
    redirectUri,
  }, { request }]),
  where: async (frames) => {
    // Get user from session
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    IdentityVerification.initiateORCIDVerification,
    { orcid, redirectUri, user },
  ]),
});

export const IdentityInitiateORCIDVerificationResponseSuccess: Sync = (
  { request, authUrl, state },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/initiateORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.initiateORCIDVerification,
      {},
      { authUrl, state },
    ],
  ),
  then: actions([Requesting.respond, { request, authUrl, state }]),
});

export const IdentityInitiateORCIDVerificationResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/initiateORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.initiateORCIDVerification,
      {},
      { error },
    ],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityCompleteORCIDVerificationRequest: Sync = (
  { request, orcid, code, state, redirectUri },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/completeORCIDVerification",
    orcid,
    code,
    state,
    redirectUri,
  }, { request }]),
  then: actions([
    IdentityVerification.completeORCIDVerification,
    { orcid, code, state, redirectUri },
  ]),
});

export const IdentityCompleteORCIDVerificationResponseSuccess: Sync = (
  { request, ok },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/completeORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.completeORCIDVerification,
      {},
      { ok },
    ],
  ),
  then: actions([Requesting.respond, { request, ok }]),
});

export const IdentityCompleteORCIDVerificationResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/IdentityVerification/completeORCIDVerification" },
      {
        request,
      },
    ],
    [
      IdentityVerification.completeORCIDVerification,
      {},
      { error },
    ],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const IdentityGetORCIDFromStateRequest: Sync = (
  { request, state, orcid },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/_getORCIDFromState",
    state,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(
      IdentityVerification._getORCIDFromState,
      { state },
      { orcid },
    );
  },
  then: actions([Requesting.respond, { request, orcid }]),
});
