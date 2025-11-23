# Concept: AuthorRegistry

+ **concept** AuthorRegistry [User]
+ **purpose** maintain unique identities for authors of papers, managing their name
variations and linking them to system users
+ **principle** authors are entities that can have multiple name variations (as they
appear in papers). A system user can be linked to an author entity, claiming those
works as their own.
+ **state**
  + a set of Authors with
    + a canonicalName String
    + an affiliations String[]
    + an externalIds String[]
    + a website String?
  + a set of NameVariations with
    + a name String
    + an author Author
  + a set of UserLinks with
    + a user User
    + an author Author
+ **actions**
  + createAuthor(canonicalName: String, affiliations: String[]) : (newAuthor: Author)
    + **requires** nothing
    + **effects** creates a new Author with the given canonicalName and affiliations,
    and returns it. Also creates a NameVariation with the canonicalName pointing to
    this new author.
  + addNameVariation(author: Author, name: String) : ()
    + **requires** author exists, and name is not already in NameVariations
    + **effects** creates a new NameVariation linking the given name string to the
    author
  + removeNameVariation(author: Author, name: String) : ()
    + **requires** author exists, name is in NameVariations for this author, and name
    is not the author's canonicalName
    + **effects** removes the NameVariation
  + updateAuthorProfile(author: Author, website?: String, affiliations?: String[]) :
  ()
    + **requires** author exists
    + **effects** updates the provided fields (website, affiliations). If a field is
    not provided, it remains unchanged.
  + claimAuthor(user: User, author: Author) : ()
    + **requires** user exists, author exists, and there is no existing UserLink for
    this user
    + **effects** creates a UserLink between the user and the author
  + unclaimAuthor(user: User, author: Author) : ()
    + **requires** a UserLink exists between user and author
    + **effects** removes the UserLink
  + mergeAuthors(primary: Author, secondary: Author) : ()
    + **requires** both authors exist and are not the same
    + **effects** moves all NameVariations from secondary to primary. Moves all
    UserLinks from secondary to primary (if a link for that user doesn't already exist
    on primary). Deletes the secondary Author.
+ **queries**
  + _getAuthor(author: Author) : (author: AuthorDoc | null)
    + **requires** nothing
    + **effects** returns the author document or null
  + _getAuthorByUser(user: User) : (author: AuthorDoc | null)
    + **requires** nothing
    + **effects** returns the author linked to this user, or null if none
  + _findAuthorsByName(nameQuery: String) : (author: AuthorDoc, matchType: String)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one author and its
    match type where the canonicalName or any NameVariation matches the query string
    (partial or exact). Returns an empty array if no matches are found.
  + _resolveAuthor(exactName: String) : (author: AuthorDoc | null)
    + **requires** nothing
    + **effects** returns the author that owns this specific name string variation, if
    any.
