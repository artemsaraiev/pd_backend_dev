concept AnchoredContext [AnchorId]
purpose store anchors into a paper by logical refs and human snippets
principle local only; timestamps for create/edit; ids are strings

state
  Anchors: set of { _id: string (AnchorId), paperId: string, kind: 'Section'|'Figure'|'Lines', ref: string, snippet: string, createdAt: number, editedAt?: number }

actions
  create(paperId: string, kind: 'Section'|'Figure'|'Lines', ref: string, snippet: string) -> string
    requires none
    effects insert and return id

  edit(anchorId: string, ref?: string, snippet?: string) -> void
    requires anchor exists
    effects updates provided fields and editedAt

  delete(anchorId: string) -> void
    requires anchor exists
    effects removes anchor

notes
  - ids are strings; timestamps in ms since epoch
  - no cross-concept references

