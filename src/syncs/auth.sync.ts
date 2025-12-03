import { actions, Sync } from "@engine";
import { Requesting, UserAuthentication, Sessioning } from "@concepts";

//-- User Registration --//
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([Requesting.request, { path: "/UserAuthentication/register", username, password }, { request }]),
  then: actions([UserAuthentication.register, { username, password }]),
});

export const RegisterResponseSuccess: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/register" }, { request }],
    [UserAuthentication.register, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/register" }, { request }],
    [UserAuthentication.register, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- User Login & Session Creation --//
export const LoginRequest: Sync = ({ request, username, password }) => ({
  when: actions([Requesting.request, { path: "/login", username, password }, { request }]),
  then: actions([UserAuthentication.login, { username, password }]),
});

export const LoginSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions([UserAuthentication.login, {}, { user }]),
  then: actions([Sessioning.create, { user }]),
});

export const LoginResponseSuccess: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [UserAuthentication.login, {}, { user }],
    [Sessioning.create, { user }, { session }],
  ),
  then: actions([Requesting.respond, { request, session, user }]),
});

export const LoginResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [UserAuthentication.login, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- User Logout --//
export const LogoutRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/logout", session }, { request }]),
  where: (frames) => frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Sessioning.delete, { session }]),
});

export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "logged_out" }]),
});

//-- Get Username by ID --//
export const GetUsernameByIdRequest: Sync = ({ request, session, activeUser, userToLookup, username }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/_getUsernameById", session, user: userToLookup },
    { request }
  ]),
  where: async (frames) => {
    // Ensure an active session before allowing this query
    frames = await frames.query(Sessioning._getUser, { session }, { user: activeUser });
    if (frames.length === 0) {
      return frames; // No active session, return empty frames
    }

    // Query the username for the requested user ID
    const userToLookupValue = frames.at(0)![userToLookup];
    frames = await frames.query(UserAuthentication._getUsername, { user: userToLookupValue }, { username });
    return frames;
  },
  then: actions([Requesting.respond, { request, username }]),
});


