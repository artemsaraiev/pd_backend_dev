import { actions, Sync } from "@engine";
import { AuthorRegistry, Requesting } from "@concepts";

// AuthorRegistry Actions
export const AuthorRegistryCreateAuthorRequest: Sync = ({ request, canonicalName, affiliations }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/createAuthor", canonicalName, affiliations }, { request }]),
  then: actions([AuthorRegistry.createAuthor, { canonicalName, affiliations }]),
});

export const AuthorRegistryCreateAuthorResponse: Sync = ({ request, newAuthor, error }) => ({
  when: actions(
    [Requesting.request, { path: "/AuthorRegistry/createAuthor" }, { request }],
    [AuthorRegistry.createAuthor, {}, { newAuthor, error }],
  ),
  then: actions([Requesting.respond, { request, newAuthor, error }]),
});

export const AuthorRegistryAddNameVariationRequest: Sync = ({ request, author, name }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/addNameVariation", author, name }, { request }]),
  then: actions([AuthorRegistry.addNameVariation, { author, name }], [Requesting.respond, { request, ok: true }]),
});

export const AuthorRegistryRemoveNameVariationRequest: Sync = ({ request, author, name }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/removeNameVariation", author, name }, { request }]),
  then: actions([AuthorRegistry.removeNameVariation, { author, name }], [Requesting.respond, { request, ok: true }]),
});

export const AuthorRegistryUpdateAuthorProfileRequest: Sync = ({ request, author, website, affiliations }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/updateAuthorProfile", author, website, affiliations }, { request }]),
  then: actions([AuthorRegistry.updateAuthorProfile, { author, website, affiliations }], [Requesting.respond, { request, ok: true }]),
});

export const AuthorRegistryClaimAuthorRequest: Sync = ({ request, user, author }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/claimAuthor", user, author }, { request }]),
  then: actions([AuthorRegistry.claimAuthor, { user, author }], [Requesting.respond, { request, ok: true }]),
});

export const AuthorRegistryUnclaimAuthorRequest: Sync = ({ request, user, author }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/unclaimAuthor", user, author }, { request }]),
  then: actions([AuthorRegistry.unclaimAuthor, { user, author }], [Requesting.respond, { request, ok: true }]),
});

export const AuthorRegistryMergeAuthorsRequest: Sync = ({ request, primary, secondary }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/mergeAuthors", primary, secondary }, { request }]),
  then: actions([AuthorRegistry.mergeAuthors, { primary, secondary }], [Requesting.respond, { request, ok: true }]),
});

// AuthorRegistry Queries
export const AuthorRegistryGetAuthorRequest: Sync = ({ request, author }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/_getAuthor", author }, { request }]),
  then: actions([AuthorRegistry._getAuthor, { author }]),
});

export const AuthorRegistryGetAuthorResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AuthorRegistry/_getAuthor" }, { request }],
    [AuthorRegistry._getAuthor, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AuthorRegistryGetAuthorByUserRequest: Sync = ({ request, user }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/_getAuthorByUser", user }, { request }]),
  then: actions([AuthorRegistry._getAuthorByUser, { user }]),
});

export const AuthorRegistryGetAuthorByUserResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AuthorRegistry/_getAuthorByUser" }, { request }],
    [AuthorRegistry._getAuthorByUser, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AuthorRegistryFindAuthorsByNameRequest: Sync = ({ request, nameQuery }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/_findAuthorsByName", nameQuery }, { request }]),
  then: actions([AuthorRegistry._findAuthorsByName, { nameQuery }]),
});

export const AuthorRegistryFindAuthorsByNameResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AuthorRegistry/_findAuthorsByName" }, { request }],
    [AuthorRegistry._findAuthorsByName, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

export const AuthorRegistryResolveAuthorRequest: Sync = ({ request, exactName }) => ({
  when: actions([Requesting.request, { path: "/AuthorRegistry/_resolveAuthor", exactName }, { request }]),
  then: actions([AuthorRegistry._resolveAuthor, { exactName }]),
});

export const AuthorRegistryResolveAuthorResponse: Sync = ({ request, result }) => ({
  when: actions(
    [Requesting.request, { path: "/AuthorRegistry/_resolveAuthor" }, { request }],
    [AuthorRegistry._resolveAuthor, {}, { result }],
  ),
  then: actions([Requesting.respond, { request, result }]),
});

