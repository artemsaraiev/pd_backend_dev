running 5 tests from ./concepts/anchored-context/test.ts
AnchoredContext OP: create -> edit -> delete ...
------- output -------
OP anchor: {
  _id: new ObjectId("68f1951dc004145262c5abe4"),
  paperId: "paper-1",
  kind: "Section",
  ref: "3.2",
  snippet: "Assumption text updated",
  createdAt: 1760662813227,
  editedAt: 1760662813272
}
----- output end -----
AnchoredContext OP: create -> edit -> delete ... ok (773ms)
AnchoredContext variants: create multiple kinds; partial edits ...
------- output -------
Variants anchors: {
  _id: new ObjectId("68f1951ec004145262c5abe5"),
  paperId: "p",
  kind: "Figure",
  ref: "Fig3",
  snippet: "caption",
  createdAt: 1760662814034,
  editedAt: 1760662814110
} {
  _id: new ObjectId("68f1951ec004145262c5abe6"),
  paperId: "p",
  kind: "Lines",
  ref: "12-20",
  snippet: "snippet",
  createdAt: 1760662814090
}
----- output end -----
AnchoredContext variants: create multiple kinds; partial edits ... ok (726ms)
AnchoredContext errors: edit/delete unknown id ... ok (622ms)
AnchoredContext variant: delete twice -> second delete errors (strict) ...
------- output -------
Variant3 before delete: {
  _id: new ObjectId("68f1951fc004145262c5abe7"),
  paperId: "paper-2",
  kind: "Section",
  ref: "2.1",
  snippet: "Init",
  createdAt: 1760662815348
}
Variant3 after first delete: null
----- output end -----
AnchoredContext variant: delete twice -> second delete errors (strict) ... ok (775ms)
AnchoredContext timestamps: createdAt and editedAt semantics ...
------- output -------
Timestamp before: {
  _id: new ObjectId("68f19520c004145262c5abe8"),
  paperId: "p-ts",
  kind: "Section",
  ref: "R",
  snippet: "S",
  createdAt: 1760662816124
}
Timestamp after: {
  _id: new ObjectId("68f19520c004145262c5abe8"),
  paperId: "p-ts",
  kind: "Section",
  ref: "R",
  snippet: "S",
  createdAt: 1760662816124,
  editedAt: 1760662816186
}
----- output end -----
AnchoredContext timestamps: createdAt and editedAt semantics ... ok (647ms)

ok | 5 passed | 0 failed (3s)

