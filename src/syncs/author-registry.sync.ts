import { actions, Frames, Sync } from "@engine";
import { AuthorRegistry, Requesting, Sessioning } from "@concepts";

// AuthorRegistry Actions
export const AuthorRegistryCreateAuthorRequest: Sync = (
  { request, session, canonicalName, affiliations, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/createAuthor",
    session,
    canonicalName,
    affiliations,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.createAuthor, { canonicalName, affiliations }]),
});

export const AuthorRegistryCreateAuthorResponse: Sync = (
  { request, newAuthor, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/AuthorRegistry/createAuthor" }, { request }],
    [AuthorRegistry.createAuthor, {}, { newAuthor, error }],
  ),
  then: actions([Requesting.respond, { request, newAuthor, error }]),
});

export const AuthorRegistryAddNameVariationRequest: Sync = (
  { request, session, author, name, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/addNameVariation",
    session,
    author,
    name,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.addNameVariation, { author, name }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AuthorRegistryRemoveNameVariationRequest: Sync = (
  { request, session, author, name, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/removeNameVariation",
    session,
    author,
    name,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.removeNameVariation, { author, name }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AuthorRegistryUpdateAuthorProfileRequest: Sync = (
  { request, session, author, website, affiliations, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/updateAuthorProfile",
    session,
    author,
    website,
    affiliations,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.updateAuthorProfile, {
    author,
    website,
    affiliations,
  }], [Requesting.respond, { request, ok: true }]),
});

export const AuthorRegistryClaimAuthorRequest: Sync = (
  { request, session, author, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/claimAuthor",
    session,
    author,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.claimAuthor, { user, author }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AuthorRegistryUnclaimAuthorRequest: Sync = (
  { request, session, author, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/unclaimAuthor",
    session,
    author,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.unclaimAuthor, { user, author }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

export const AuthorRegistryMergeAuthorsRequest: Sync = (
  { request, session, primary, secondary, user },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/mergeAuthors",
    session,
    primary,
    secondary,
  }, { request }]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([AuthorRegistry.mergeAuthors, { primary, secondary }], [
    Requesting.respond,
    { request, ok: true },
  ]),
});

// AuthorRegistry Queries
export const AuthorRegistryGetAuthorRequest: Sync = (
  { request, authorId, author },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/getAuthor",
    author: authorId,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      AuthorRegistry._getAuthor,
      { author: authorId },
      {
        author,
      },
    );
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [author]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, author }]),
});

export const AuthorRegistryGetAuthorByUserRequest: Sync = (
  { request, session, user, author },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/getAuthorByUser",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [author]: null });
    }
    frames = await frames.query(AuthorRegistry._getAuthorByUser, { user }, {
      author,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [author]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, author }]),
});

export const AuthorRegistryFindAuthorsByNameRequest: Sync = (
  { request, nameQuery, author, matchType, matches },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/findAuthorsByName",
    nameQuery,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(AuthorRegistry._findAuthorsByName, {
      nameQuery,
    }, { author, matchType });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [matches]: [] });
    }
    return frames.collectAs([author, matchType], matches);
  },
  then: actions([Requesting.respond, { request, matches }]),
});

export const AuthorRegistryResolveAuthorRequest: Sync = (
  { request, exactName, author },
) => ({
  when: actions([Requesting.request, {
    path: "/AuthorRegistry/resolveAuthor",
    exactName,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(AuthorRegistry._resolveAuthor, { exactName }, {
      author,
    });
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [author]: null });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, author }]),
});
