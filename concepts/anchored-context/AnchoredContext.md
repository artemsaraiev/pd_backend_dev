# Concept: HighlightedContext

+ **concept** HighlightedContext [Highlight, User]
+ **purpose** store regions of papers (lines, figures, sections) highlighted by users
as well as the parent context in which the region is highlighted
+ **principle** the user highlight a region of 

+ **state**
  + a set of Contexts with
    + a paperID String
    + an author User
    + a location Highlight
    + a createdAt Date
    + a parent Context?
    + a kind Literal['Section'|'Figure'|'Lines']?
+ **actions**
  + create(paperID: String, author: User, location: Highlight, kind?:
  Literal['Section'|'Figure'|'Lines'], parentContext?: Context) : (newContext:
  Context)
    + **requires** parentContext, if provided, should be in a set of Contexts
    + **effects** inserts new Context into a set of Contexts with provided fields,
    current creation timestamp and missing editedAt timestamp and returns it returns
    editedContext
  + _getFilteredContexts(filter: (user: User, paper: String) => Boolean) :
  (filteredContexts:
    Context[])
    + **requires** nothing
    + **effects** returns a subset of Contexts with users and papers that match the
    filter (e.g. for all contexts specific to a group of users for a specific paper)
