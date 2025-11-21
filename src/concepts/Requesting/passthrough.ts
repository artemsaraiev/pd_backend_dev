/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // LikertSurvey demo routes - public queries only
  "/api/LikertSurvey/_getSurveyQuestions": "public query",
  "/api/LikertSurvey/_getSurveyResponses": "public query",

  // Public queries
  "/api/PaperIndex/_searchArxiv": "public search query",

  // Public read queries - if paper data is public
  "/api/PaperIndex/_get": "public query - paper data is public",
  "/api/PaperIndex/_listRecent": "public query - paper list is public",

  // Public read queries - if discussions are public
  "/api/DiscussionPub/_getPubIdByPaper":
    "public query - discussions are public",
  "/api/DiscussionPub/_listThreads": "public query - discussions are public",
  "/api/DiscussionPub/_listReplies": "public query - discussions are public",
  "/api/DiscussionPub/_listRepliesTree":
    "public query - discussions are public",

  // Public read queries - if contexts are public
  "/api/HighlightedContext/_getFilteredContexts":
    "public query - contexts are public",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // Drive these via Requesting + syncs (see backend/src/syncs/a4.sync.ts)

  // PaperIndex - mutations need auth
  "/api/PaperIndex/ensure",
  "/api/PaperIndex/updateMeta",
  "/api/PaperIndex/addAuthors",
  "/api/PaperIndex/removeAuthors",
  "/api/PaperIndex/addLink",
  "/api/PaperIndex/removeLink",
  // Legacy route names (handled via syncs)
  "/api/PaperIndex/get",
  "/api/PaperIndex/listRecent",

  // HighlightedContext - mutations need auth, queries handled via syncs
  "/api/HighlightedContext/create",
  "/api/HighlightedContext/edit",
  "/api/HighlightedContext/delete",
  // Legacy route name
  "/api/HighlightedContext/listByPaper",

  // DiscussionPub - mutations need auth
  "/api/DiscussionPub/open",
  "/api/DiscussionPub/startThread",
  "/api/DiscussionPub/reply",
  "/api/DiscussionPub/replyTo",
  "/api/DiscussionPub/makeReply",
  "/api/DiscussionPub/editThread",
  "/api/DiscussionPub/deleteThread",
  "/api/DiscussionPub/editReply",
  "/api/DiscussionPub/deleteReply",
  "/api/DiscussionPub/initIndexes",

  // IdentityVerification - all mutations need auth
  "/api/IdentityVerification/addORCID",
  "/api/IdentityVerification/removeORCID",
  "/api/IdentityVerification/addAffiliation",
  "/api/IdentityVerification/removeAffiliation",
  "/api/IdentityVerification/updateAffiliation",
  "/api/IdentityVerification/addBadge",
  "/api/IdentityVerification/revokeBadge",
  // User-specific queries need auth
  "/api/IdentityVerification/get",
  "/api/IdentityVerification/_getByUser",
  "/api/IdentityVerification/ensureDoc",

  // LikertSurvey - mutations need auth/tracking
  "/api/LikertSurvey/createSurvey",
  "/api/LikertSurvey/addQuestion",
  "/api/LikertSurvey/submitResponse",
  "/api/LikertSurvey/updateResponse",
  // User-specific query needs auth
  "/api/LikertSurvey/_getRespondentAnswers",

  // Auth flows - handled via syncs
  "/api/UserAuthentication/register",
  "/api/UserAuthentication/login",
  "/api/login",
  "/api/logout",
  // Internal auth queries should not be public
  "/api/UserAuthentication/_getUserByUsername",
  "/api/UserAuthentication/_getUsername",

  // Sessioning - internal concept, use via syncs only
  "/api/Sessioning/create",
  "/api/Sessioning/delete",
  "/api/Sessioning/_getUser",

  // Block old Session concept (use UserAuthentication + Sessioning instead)
  "/api/Session/login",
  "/api/Session/logout",
  "/api/Session/whoami",

  // AuthorRegistry - all operations need auth
  "/api/AuthorRegistry/createAuthor",
  "/api/AuthorRegistry/addNameVariation",
  "/api/AuthorRegistry/removeNameVariation",
  "/api/AuthorRegistry/updateAuthorProfile",
  "/api/AuthorRegistry/claimAuthor",
  "/api/AuthorRegistry/unclaimAuthor",
  "/api/AuthorRegistry/mergeAuthors",
  "/api/AuthorRegistry/_getAuthor",
  "/api/AuthorRegistry/_getAuthorByUser",
  "/api/AuthorRegistry/_findAuthorsByName",
  "/api/AuthorRegistry/_resolveAuthor",

  // AccessControl - security-critical, all operations need auth
  "/api/AccessControl/createGroup",
  "/api/AccessControl/updateGroup",
  "/api/AccessControl/addUser",
  "/api/AccessControl/revokeMembership",
  "/api/AccessControl/promoteUser",
  "/api/AccessControl/demoteUser",
  "/api/AccessControl/givePrivateAccess",
  "/api/AccessControl/revokePrivateAccess",
  "/api/AccessControl/giveUniversalAccess",
  "/api/AccessControl/revokeUniversalAccess",
  "/api/AccessControl/removeGroup",
  "/api/AccessControl/_getGroup",
  "/api/AccessControl/_getMembershipsByGroup",
  "/api/AccessControl/_getMembershipsByUser",
  "/api/AccessControl/_hasAccess",

  // PdfHighlighter - mutations need auth
  "/api/PdfHighlighter/createHighlight",
  "/api/PdfHighlighter/_get",
  "/api/PdfHighlighter/_listByPaper",
];
