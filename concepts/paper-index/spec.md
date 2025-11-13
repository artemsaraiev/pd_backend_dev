concept PaperIndex [PaperId]
purpose registry of papers by id (DOI or arXiv) with minimal metadata
principle idempotent ensure; updates require local existence; no cross-concept access

state
  Papers: set of { _id: string (PaperId), title?: string, authors: string[] (UserId), links: string[] (URL) }

actions
  ensure(id: string, title?: string) -> string
    requires none (idempotent)
    effects if paper exists return id; else create {_id:id, title?, authors:[], links:[]}

  updateMeta(id: string, title?: string) -> void
    requires paper with _id exists
    effects sets provided fields (title) only

  addAuthors(id: string, authors: string[]) -> void
    requires paper with _id exists
    effects adds unique authors (set semantics)

  removeAuthors(id: string, authors: string[]) -> void
    requires paper with _id exists
    effects removes listed authors if present (no-op otherwise)

  addLink(id: string, url: string) -> void
    requires paper with _id exists
    effects adds url if not present

  removeLink(id: string, url: string) -> void
    requires paper with _id exists
    effects removes url if present

notes
  - ids are strings; timestamps in ms since epoch
  - no cross-concept references

