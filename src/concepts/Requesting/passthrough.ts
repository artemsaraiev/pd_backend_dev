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
  "/api/PaperIndex/_searchBiorxiv":
    "public search query - bioRxiv via Europe PMC",
  "/api/PaperIndex/_listRecentBiorxiv": "public query - recent bioRxiv papers",
  "/api/DiscussionPub/_listPaperDiscussionStats":
    "public query - aggregated discussion stats per paper for home feed",
  // Public read queries - if paper data is public
  // Note: _get and _getByPaperId are handled via syncs (paths without underscores)
  // _listRecent is handled via sync (path without underscore)
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
  // Queries handled via syncs (paths without underscores)
  "/api/PaperIndex/get",
  "/api/PaperIndex/getByPaperId",
  "/api/PaperIndex/listRecent",
  // Underscored query routes - handled via syncs
  "/api/PaperIndex/_get",
  "/api/PaperIndex/_getByPaperId",
  "/api/PaperIndex/_listRecent",

  // HighlightedContext - mutations need auth, queries handled via syncs
  "/api/HighlightedContext/create",
  "/api/HighlightedContext/_getFilteredContexts",

  // DiscussionPub - mutations need auth
  "/api/DiscussionPub/open",
  "/api/DiscussionPub/startThread",
  "/api/DiscussionPub/startPrivateThread",
  "/api/DiscussionPub/reply",
  "/api/DiscussionPub/replyTo",
  "/api/DiscussionPub/makeReply",
  "/api/DiscussionPub/editThread",
  "/api/DiscussionPub/deleteThread",
  "/api/DiscussionPub/editReply",
  "/api/DiscussionPub/deleteReply",
  "/api/DiscussionPub/voteThread",
  "/api/DiscussionPub/voteReply",
  "/api/DiscussionPub/initIndexes",
  // Queries handled via syncs (paths without underscores)
  "/api/DiscussionPub/_getPubIdByPaper",
  "/api/DiscussionPub/_listThreads",
  "/api/DiscussionPub/_listReplies",
  "/api/DiscussionPub/_listRepliesTree",
  "/api/DiscussionPub/_getThread",
  "/api/DiscussionPub/_getReply",

  // Internal initialization methods - not public endpoints
  "/api/AccessControl/initIndexes",
  "/api/AuthorRegistry/initIndexes",
  "/api/IdentityVerification/initIndexes",
  "/api/PdfHighlighter/initIndexes",

  // IdentityVerification - all mutations need auth
  "/api/IdentityVerification/addORCID",
  "/api/IdentityVerification/removeORCID",
  "/api/IdentityVerification/initiateORCIDVerification",
  "/api/IdentityVerification/completeORCIDVerification",
  "/api/IdentityVerification/addAffiliation",
  "/api/IdentityVerification/removeAffiliation",
  "/api/IdentityVerification/updateAffiliation",
  "/api/IdentityVerification/addBadge",
  "/api/IdentityVerification/revokeBadge",
  // User-specific queries need auth - handled via syncs (paths without underscores)
  "/api/IdentityVerification/getByUser",
  "/api/IdentityVerification/getORCIDFromState",
  // Underscored query routes - handled via syncs
  "/api/IdentityVerification/_getORCIDsByUser",
  "/api/IdentityVerification/_getAffiliationsByUser",
  "/api/IdentityVerification/_getBadgesByUser",
  "/api/IdentityVerification/_getORCIDFromState",

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

  // AuthorRegistry - all operations need auth
  "/api/AuthorRegistry/createAuthor",
  "/api/AuthorRegistry/addNameVariation",
  "/api/AuthorRegistry/removeNameVariation",
  "/api/AuthorRegistry/updateAuthorProfile",
  "/api/AuthorRegistry/claimAuthor",
  "/api/AuthorRegistry/unclaimAuthor",
  "/api/AuthorRegistry/mergeAuthors",
  // Queries handled via syncs (paths without underscores)
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
  "/api/AccessControl/inviteUser",
  "/api/AccessControl/removeInvitation",
  "/api/AccessControl/acceptInvitation",
  // Queries handled via syncs (paths without underscores)
  "/api/AccessControl/getGroup",
  "/api/AccessControl/getMembershipsByGroup",
  "/api/AccessControl/getMembershipsByUser",
  "/api/AccessControl/hasAccess",
  "/api/AccessControl/getGroupsForUser",
  "/api/AccessControl/listPendingInvitationsByUser",
  "/api/AccessControl/getInvitation",
  // Underscored query routes - handled via syncs
  "/api/AccessControl/_getGroup",
  "/api/AccessControl/_getMembershipsByGroup",
  "/api/AccessControl/_getMembershipsByUser",
  "/api/AccessControl/_hasAccess",
  "/api/AccessControl/_hasUniversalAccess",
  "/api/AccessControl/_getGroupsForUser",
  "/api/AccessControl/_listPendingInvitationsByUser",
  "/api/AccessControl/_getInvitation",
  "/api/AccessControl/_getResourceVisibility",

  // PdfHighlighter - mutations need auth
  "/api/PdfHighlighter/createHighlight",
  // Queries handled via syncs (paths without underscores)
  "/api/PdfHighlighter/get",
  "/api/PdfHighlighter/listByPaper",
  // Underscored query routes - handled via syncs
  "/api/PdfHighlighter/_get",
  "/api/PdfHighlighter/_listByPaper",
];
