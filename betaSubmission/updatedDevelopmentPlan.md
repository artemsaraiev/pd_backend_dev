# Updated Development Plan (Beta)

## Progress from last week:

We have accomplished almost all of our Week 1 goals.
- We refined the backend concept implementations,
- Implemented highlighting on paper text and rectangular regions
- Made a user's highlights persist; they re-render when they reopen a paper
- Implemented hierarchial organization of replies in a threae
- Gave users the ability to delete their thread and subsequently freeze it from getting replies
- Pasting an arXiv ID into search creates a pub for the paper if it doesn't exist already and opens it, rendering the PDF file.

## Work in Progress:

* Improving the general UI
  * Make components larger, more readable
  * Make discussion thread larger
  * Have threads display username instead of their user._id in the database
  * Fix zooming feature so that it doesn't change the size of the PDF window
* ORCID verification
  * Currently only users who input an email that ends with @mit.edu can log in, even if it isn't real


### Milestones and responsibilities

| Milestone | Target | Features | Owners |
|---|---|---|---|
| This Week — Verification, closed groups, upvotes, polish | Dec 2 (Beta Deadline) | Verification with edu emails; closed pubs (access control: invite/join, restrict non‑members); upvotes (threads/replies) + sort by score/recent; highlight permalink polish (scroll/zoom robustness); highlight sidebar and general UI polish; optional: paper tags/thread categories if time | Sasha (auth verification, access control, upvotes endpoints), Rahsun (permalink polish, sidebar, UI finishing), Artem (verification UI, group UI, sort/filter, final integration) |

### Success criteria
- Closed pub restricts non‑members; verified (edu) indicator shows; upvotes reorder threads/replies; highlight permalink reliably jumps to context; sidebar and UI polished (sort/filter if tags included).

### Key risks, mitigations, fallback
- Auth/edu verification complexity → start with domain‑based email verification; ORCID optional later. Fallback: self‑asserted badges for demo accounts.
- Spam/low signal → rate limits, first‑post throttle, moderator tools; fallback: invite‑only pubs for demo.
- UI challenges → move threads of papers to a different location from the right sidebar (bottom, popup), force PDFs to display at a single zoom level
- Highlight permalinks → Each thread is marked with a separate identifier instead of the highlight ID

### Implementation notes
- Highlights: persist both text quote and normalized page rects for robust rendering and deep linking.
- Permalinks: route parameters include paper/version/highlight ID; viewer scrolls/zooms to rect.
- Tagging: paper‑level tags and a small set of thread categories (e.g., Clarification, Erratum, Question).
