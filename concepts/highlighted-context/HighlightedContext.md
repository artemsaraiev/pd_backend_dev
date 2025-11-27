# Concept: HighlightedContext

+ **concept** HighlightedContext [Highlight, User]
+ **purpose** store regions of papers (lines, figures, sections) highlighted by users
as well as the parent context in which the region is highlighted
+ **principle** the user provides a location of the paper and kind of the region so
that
this context can later be referenced by discussion/other users

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
    current creation timestamp and missing editedAt timestamp and returns newContext
+ **queries**
  + _getFilteredContexts(paperIds?: String[], authors?: User[]) :
  (filteredContext: Context)
    + **requires** nothing
    + **effects** returns an array of dictionaries, each containing one context for the given paperIds (if provided) and/or authors (if provided). If both are provided, returns contexts matching both criteria. Returns all contexts if neither parameter is provided. Results are ordered by createdAt. Each context includes _id, paperId, author, location, kind, parentContext, and createdAt. Returns an empty array if no contexts match the criteria. 
