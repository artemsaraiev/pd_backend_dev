import { actions, Frames, Sync } from "@engine";
import { IdentityVerification, Requesting, Sessioning } from "@concepts";

// IdentityVerification - ORCID Verification Flow
export const IdentityAddORCIDRequest: Sync = (
  { request, session, orcid, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/addORCID",
    session,
    orcid,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.addORCID, { user, orcid }]),
});

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

export const IdentityAddBadgeRequest: Sync = (
  { request, session, badge, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/addBadge",
    session,
    badge,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.addBadge, { user, badge }]),
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

export const IdentityRemoveORCIDRequest: Sync = (
  { request, session, orcid, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/removeORCID",
    session,
    orcid,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.removeORCID, { orcid }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const IdentityRemoveAffiliationRequest: Sync = (
  { request, session, affiliation, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/removeAffiliation",
    session,
    affiliation,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.removeAffiliation, { affiliation }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const IdentityUpdateAffiliationRequest: Sync = (
  { request, session, affiliation, newAffiliation, user },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/updateAffiliation",
    session,
    affiliation,
    newAffiliation,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([IdentityVerification.updateAffiliation, {
    affiliation,
    newAffiliation,
  }], [Requesting.respond, { request, ok: true }]),
});

export const IdentityGetByUserRequest: Sync = (
  {
    request,
    session,
    user,
    orcid,
    affiliation,
    badge,
    orcids,
    affiliations,
    badges,
  },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/getByUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // Query all three types - user is bound from frames
    const [orcidFrames, affiliationFrames, badgeFrames] = await Promise.all([
      frames.query(IdentityVerification._getORCIDsByUser, { user }, { orcid }),
      frames.query(IdentityVerification._getAffiliationsByUser, { user }, {
        affiliation,
      }),
      frames.query(IdentityVerification._getBadgesByUser, { user }, { badge }),
    ]);

    // Collect each type into arrays
    const orcidsCollected = orcidFrames.length === 0
      ? new Frames({ [orcids]: [] })
      : orcidFrames.collectAs([orcid], orcids);
    const affiliationsCollected = affiliationFrames.length === 0
      ? new Frames({ [affiliations]: [] })
      : affiliationFrames.collectAs([affiliation], affiliations);
    const badgesCollected = badgeFrames.length === 0
      ? new Frames({ [badges]: [] })
      : badgeFrames.collectAs([badge], badges);

    // Extract arrays from collected frames
    const orcidsArray = (orcidsCollected[0]?.[orcids] as Array<unknown>) ?? [];
    const affiliationsArray =
      (affiliationsCollected[0]?.[affiliations] as Array<unknown>) ?? [];
    const badgesArray = (badgesCollected[0]?.[badges] as Array<unknown>) ?? [];

    // Combine all results into a single frame
    return new Frames({
      ...originalFrame,
      [orcids]: orcidsArray,
      [affiliations]: affiliationsArray,
      [badges]: badgesArray,
    });
  },
  then: actions([Requesting.respond, {
    request,
    orcids,
    affiliations,
    badges,
  }]),
});

export const IdentityGetORCIDFromStateRequest: Sync = (
  { request, state, orcid },
) => ({
  when: actions([Requesting.request, {
    path: "/IdentityVerification/getORCIDFromState",
    state,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      IdentityVerification._getORCIDFromState,
      { state },
      { orcid },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [orcid]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, orcid }]),
});
