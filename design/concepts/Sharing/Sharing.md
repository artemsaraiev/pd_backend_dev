# concept: Sharing [User, File]

*   **purpose**: To allow file owners to grant access to other users.
*   **principle**: A file's owner can share it with another user, who can then access it. If the owner revokes access, the other user can no longer access it.
*   **state**:
    *   a set of `File`s with
        *   a `sharedWith` set of User
*   **actions**:
    *   `shareWithUser (file: File, user: User): ()`
        *   **requires**: `user` is not already in the `sharedWith` set for `file`.
        *   **effects**: adds the `user` to the `sharedWith` set for `file`.
    *   `revokeAccess (file: File, user: User): ()`
        *   **requires**: `user` is in the `sharedWith` set for `file`.
        *   **effects**: removes the `user` from the `sharedWith` set for `file`.
*   **queries**:
    *   `_isSharedWith (file: File, user: User): (access: Boolean)` (Revised pure query)
        *   **requires**: `file` and `user` exist.
        *   **effects**: returns `true` if the `user` is in the `sharedWith` set for the `file`, false otherwise.