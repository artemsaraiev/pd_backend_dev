# Updated Development Plan (Beta)

## Progress from last week:

We have accomplished almost most of our Week 2 goals.
- Improved user verification by allowing users to add and verify their ORCID number
- Began implementing badges, which for now, users can submit their own with no restrictions.
- Threads display an anchor ID that corresponds to the specific highlight that they made on the paper (fallback option)
- Threads and the top navigation bar now display usernames instead of their user ID, thanks to a new sync in the backend
- Zooming in/out of the paper no longer causes the whole PDF rendering component to change size; the PDF always stays inside the component now


* We also added support to search for and make threads on bioRxiv (albeit you have to download and open the PDF before you can start annotating)

## Work in Progress:

* UI
  * Make badges and ORCID badges display on threads
  * Adding ability to sort/filter threads by date/most upvoted
* Functionality
  * Enforce access control on pubs (can restrict non-members, invite/join)
  * Include an option for users to anonymously post threads
  * Add upvoting on threads


### Milestones and responsibilities

| Milestone | Target | Features | Owners |
|---|---|---|---|
| This Week — Verification, closed groups, upvotes, polish | Dec 9 (Final Deadline) | Verification with edu emails; closed pubs (access control: invite/join, restrict non‑members); upvotes (threads/replies) + sort by score/recent; highlight permalink polish (scroll/zoom robustness); highlight sidebar and general UI polish; optional: paper tags/thread categories if time | Sasha (auth verification, access control, upvotes endpoints), Rahsun (permalink polish, sidebar, UI finishing), Artem (verification UI, group UI, sort/filter, final integration) |

### Success criteria
- Closed pub restricts non‑members; upvotes reorder threads/replies; badges and verified ORCID show for thread authors

### Key risks, mitigations, fallback
- Spam/low signal and access control → rate limits, first‑post throttle, moderator tools; fallback: invite‑only pubs for demo.
- UI challenges → info takes up too much space on a thread, fallback: display upvotes, and don't display ORCID, anchor ID
