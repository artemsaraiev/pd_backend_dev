# User Testing

## Semyon Savkin

### Data prepopulation

To make the website look more realistic, we have explored some papers before user
testing, so that the main page is filled with recently discussed papers. We have also
created our own accounts to test the reply, group, and private thread features.

### Task list

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

### Brief report

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
