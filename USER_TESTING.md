# User Testing

## Data prepopulation

To make the website look more realistic, we have explored some papers before user
testing, so that the main page is filled with recently discussed papers. We have also
created our own accounts to test the reply, group, and private thread features.

## Task list

Our task list is basically an enumeration of the features that we have implemented.

| Task Title           | Instruction                                           | Rationale                                                                 |
|----------------------|------------------------------------------------------|--------------------------------------------------------------------------|
| Create account       | Register for a new account using an mit.edu email and password| Fundamental onboarding step for new users                               |
| Explore papers       | Browse the recently discussed papers and acces them          | Ensures content discovery and engagement with platform's core material  |
| Search for a Paper   | Search for a paper by title or DOI          | Ensures that the search functionality works correctly and that the user can find the papers they are looking for |
| Create a public thread | Select a region of the paper and start a thread      | Tests public communication and highlighting functionality |
| Make a reply    | After a reply is created (by observer), make a reply to it           | Evaluates collaborative and community features.                          |
| Create a group | Create a group with provided name and description | Tests the group creation functionality |
| Add a user to a group | Invite another user (observer) to the group | Tests the group membership functionality |
| Create a private thread | Start a private discussion with another user | Tests private communication functionality and user privacy handling |
| Check thread privacy | Log out and try to access the private thread | Tests the thread privacy functionality |

## Report for User 1

### Observations

Overall, the user testing was successful, but elucidated both backend and frontend
issues, which made the overall experience less than ideal. First of all, the
registration and log in screens are virtually indistinguishable, so the user was
confused during the registration and log in process. Secondly, the main screen with
recentrly discussed papers is a bit visually disbalanced; the user suggested making
the right margin bigger, making the sizes of the buttons in the paper cells uniform,
and putting them in the bottom of the cell for visual consistency. ArXiV search
feature produced pathetic results, since even small deviations from the paper title
produces unsatisfactory results. On the paper page, it took two minutes for the user
to find the isntruction for selecting a region of the paper to start a thread, and
they just made a highlight instead on a first try. The highlight creation animation
was a bit too slow, don't know why. Nested replies shifted the reply text to the left
significantly, making it difficult to read. Also, the user expressed their concerns
about the scenario when the paper becomes very popular and has too many highlights, is
there a way to conceal the highlights? Also, the user could not figure out how does
the change of the highlight intensity on thread choice work. Group creation,
management, and private posting functionality testing went smoothly, but the user
could not understand the reason for the existence of group concept, so it has to be
explained to them. The user also seemed frustrated by long response times to their
actions, as the created thread took a couple of seconds to appear on the page.

### Suggestions for improvement

From these observations, we infer following issues and suggestions for improvement:

+ Registration and log in screens are hard to discern between, maybe it makes sense to
make the colors of the registration/sign in buttons different
+ The main screen visuals is imbalanced, it requires just a bit of visual adjustments
to make it more appealing
+ ArXiV search feature produces inconsistent and undesirable results, potentially we
can use another search API for better results
+ Highlight creation process is very unintuitive on the first try, maybe we can add a
separate button for activating the highlight creation mode, so that the user can either
use keystrokes or clicks to create a highlight

## Report for User 2

### Observations

We got on a zoom call with our user, an mit student interested in research
discussions.  We looked at their interaction with a platform. We did not want to give
the user a concrete list of tasks to do so they could give honest unbiased feedback.
Our goal was for the user to explore all pubdiscuss features on their own and report
how intuitive and useful they are as well as any other things they found confusing or
missing.

1. Editing mode was not intuitive enough. the user expected microsoft word type of
editing where u click on ‘B’ and the text format changes to bold, but in our
implementation it is select -> change style.
2. The user did not really understand the motive behind a group creation, like what
new options it opens. perhaps we could add an explanation of what a group gives u. ‘i
dont understand what the purpose of it is since i can only add people and that is it.’
3. The arxiv/bioxiv option was not intuitive at all. the user did not figure out that
they could switch the search on demand and said it would be better to give all the
results and then the ability to filter by the source.
4. The bioxiv ‘upload pdf’ is very annoying and not user friendly. we should prefetch
pdfs for users.
5. Group posting does not do anything; it seems it is publicly visible for everyone.
it is also hard to distinguish between public vs group messages (for now there are no
indications of whether a reply attributes to public or group).
6. The user did not find all the features like cmd+mouse hover for overlapping
highlights selection, reply<->box clickability, and other features. we might want to
add a ‘help’ button explaining these common use cases/patterns.
7. Highlights of other people are not seen unless you reload a page. we should fix
this by async fetching for new results. The user asked for a possibility to download a
paper pdf w highlights and discussions.
8. "My papers" did not make sense at first to a user. they asked for the ability to
add papers to favorites or just create custom folders, and also mark papers that this
user has commented on. the user expected 9. ‘my papers’ to represent the papers they
authored. and there is no indication if this paper was already added to a library.
9. The user asked for the thread panel to be resizable since it felt too narrow w
nested comments.