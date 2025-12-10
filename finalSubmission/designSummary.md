# Design Summary

Here, we outline all of the changes we have made since our original proposal in the functional design.

## Application Motivation
We originally envisioned **PubDiscuss** as an application where readers of academic papers can discuss with authors of the papers in a closed "pub" with a canonical, anchored discussion space.

We were able to implement pubs for each paper on arXiv like in our functional design proposal (alongside adding bioRxiv functionality), but currently, only users with MIT emails can register (instead of all institutions), and there is no system in place to verify the author of a paper's identity.

These simplifications make PubDiscuss more of an MIT-centric platform, where moderation is controlled not by a separate access control system but through a community-driven system thanks to the upvoting and downvoting feature.

TODO:
- Clarify access control
  - Status of author, mod verification


## Changes to Proposed Features we implemented
- Inline Anchors & Highlighted Threads
  - Multiple colors for highlighting
- Verified Identity Badges (ORCID/affiliation)
  - ORCID implemented but only users with MIT emails can currently register
  - Badges are self-created; no moderation system for them
- Upvoting
  - Also included downvoting
- Wide range of reply context
  - Includes Markdown text, images, and inline and block LaTeX math support (through `\(x\)` and `∑` buttons)

## Proposed Features we did not implement
- AI-augmented search
- Cross-paper linking

## New Features
- Anonymous threads (from ethical study)
- PDF proxy and storage
  - arXiv and bioRxiv PDFs are requested through API paths
    - The user is asked to download bioRxiv papers directly and upload them to start highlighting; uploaded PDFs stored on client-side
  - IndexedDB storage for bioRxiv respects copyright by keeping PDFs client-side.
- Groups
  - As a part of the `AccessControl` concept, users can create groups and moderate them as admins, inviting users to join groups.
    - Groups can be used to limit visability of resources (threads and highlights) to a specific set of users
    - Groups could be used to hold private discussions through members in threads
- Saved Papers
  - Instead of displaying the user's activity on the right sidebar as shown in the UI sketches, we gave users the ability to save papers to their personal library, which appears as a link on the leftsidebar so that they can easily jump back to them.


## Concept Changes
- Made use of provided `Requesting` and `Sessioning` concepts
- Implemented a modified `UserAuthentication` concept
  - Validates if a user registers with an MIT email (ends with @mit.edu)
  - Hashes passwords of registered accounts
- `DiscussionPub` additions
  - With `parentId`, replies can now be nested
  - Upvoting/Downvoting counts for each thread (Track votes with `userVotes`)
  - Anonymous Posting (`isAnonymous` flag)
  - Can delete your own threads
    - Though the thread still remains and is visible to its groups, the text turns into [deleted] and no one can reply to it, similar to Reddit
  - Control visibility through groups
- `PaperIndex` additions
  - Support for bioRxiv papers
- `AccessControl` additions
  - Added an `invitations` collection for structured invitation workflow, replacing ad-hoc email invites.
  - User invitation system includes messages
  - Invitation acceptance/cancellation flows
  - Admin hierarchy (group creators are admins)
  - Visibility filtering integrated into discussion threads
- `HighlightedContext` changes
  - Integrated with separate `PdfHighlighter` concept for geometry storage
- `IdentityVerification` changes
  - Verification through MIT email addresses only, instead of institutional emails
    - Prioritized ORCID OAuth integration over edu email verification to establish stronger identity proof through a trusted third-party service.
  - Badges are self-created; no moderation system for them
