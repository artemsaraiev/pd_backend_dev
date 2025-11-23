[@concept-background](../../tools/concept-background.md)

[@implementation](implementation.md)

# add:

Can you add the following query with these parameters?

```
Sharing._getFilesSharedWithUser, { user }, { file }
```
# response:

# solution:

# file: src/concepts/Sharing/SharingConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";

// Collection prefix to namespace collections for this concept
const PREFIX = "Sharing" + ".";

// Generic types used by this concept
type User = ID;
type File = ID;

/**
 * The state model for this concept.
 * a set of `File`s with
 *   a `sharedWith` set of User
 */
interface FileDoc {
  _id: File;
  sharedWith: User[];
}

/**
 * @concept Sharing [User, File]
 * @purpose To allow file owners to grant access to other users.
 */
export default class SharingConcept {
  public readonly files: Collection<FileDoc>;

  constructor(private readonly db: Db) {
    this.files = this.db.collection<FileDoc>(PREFIX + "files");
  }

  /**
   * shareWithUser (file: File, user: User): ()
   *
   * **requires**: `user` is not already in the `sharedWith` set for `file`.
   *
   * **effects**: adds the `user` to the `sharedWith` set for `file`.
   * If the file has no entry, it will be created.
   */
  async shareWithUser({ file, user }: { file: File; user: User }): Promise<Empty | { error: string }> {
    // We use $addToSet which is idempotent.
    // To enforce the 'requires' clause, we check the result.
    // If modifiedCount is 0, the user was already in the set.
    // If upsertedId is non-null, a new file doc was created, which is a success.
    const result = await this.files.updateOne(
      { _id: file },
      { $addToSet: { sharedWith: user } },
      { upsert: true },
    );

    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      return { error: `User ${user} already has access to file ${file}.` };
    }

    return {};
  }

  /**
   * revokeAccess (file: File, user: User): ()
   *
   * **requires**: `user` is in the `sharedWith` set for `file`.
   *
   * **effects**: removes the `user` from the `sharedWith` set for `file`.
   */
  async revokeAccess({ file, user }: { file: File; user: User }): Promise<Empty | { error: string }> {
    // We use $pull to remove the user from the array.
    // To enforce the 'requires' clause, we check the result.
    // If modifiedCount is 0, the user was not in the set or the file didn't exist.
    const result = await this.files.updateOne(
      { _id: file },
      { $pull: { sharedWith: user } },
    );

    if (result.modifiedCount === 0) {
      return { error: `User ${user} does not have access to file ${file}, or file does not exist.` };
    }

    return {};
  }

  /**
   * _isSharedWith (file: File, user: User): (access: Boolean)
   *
   * **requires**: `file` and `user` exist.
   *
   * **effects**: returns `true` if the `user` is in the `sharedWith` set for the `file`, false otherwise.
   */
  async _isSharedWith({ file, user }: { file: File; user: User }): Promise<{ access: boolean }[]> {
    // A single query can check for the existence of the file and if the user is in the `sharedWith` array.
    const doc = await this.files.findOne({ _id: file, sharedWith: user });
    const access = doc !== null;
    return [{ access }];
  }

  /**
   * _getFilesSharedWithUser (user: User): (file: File)
   *
   * **requires**: user exists.
   *
   * **effects**: returns the set of all `file`s that have `user` in their `sharedWith` set.
   */
  async _getFilesSharedWithUser({ user }: { user: User }): Promise<{ file: File }[]> {
    const docs = await this.files.find({ sharedWith: user }).toArray();
    return docs.map((doc) => ({ file: doc._id }));
  }
}
```