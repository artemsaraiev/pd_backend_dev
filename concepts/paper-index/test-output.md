running 6 tests from ./concepts/paper-index/test.ts
PaperIndex OP: ensure -> updateMeta -> addAuthors -> addLink ...
------- output -------
OP state: {
  _id: "54e85ef6-7006-467d-aa5a-82709aa05695",
  authors: [ "u1", "u2" ],
  links: [ "https://example.com/paper" ],
  title: "Updated Title"
}
----- output end -----
PaperIndex OP: ensure -> updateMeta -> addAuthors -> addLink ... ok (873ms)
PaperIndex variants: idempotent ensure; removeAuthors; removeLink ...
------- output -------
Variants1 state: {
  _id: "99c1c5da-b5a6-49b1-b4d3-aff47c677e14",
  authors: [ "a", "c" ],
  links: [],
  title: "T1"
}
----- output end -----
PaperIndex variants: idempotent ensure; removeAuthors; removeLink ... ok (761ms)
PaperIndex variants: dedupe authors and links ...
------- output -------
Variants2 state: {
  _id: "ef3c3669-a732-4c22-8133-817d0feac795",
  authors: [ "a", "b", "c" ],
  links: [ "u" ]
}
----- output end -----
PaperIndex variants: dedupe authors and links ... ok (838ms)
PaperIndex errors: updateMeta/removeLink on missing id ... ok (611ms)
PaperIndex errors: missing id for addAuthors/removeAuthors/addLink ... ok (661ms)
PaperIndex variants: no-op removals when absent ...
------- output -------
No-op state: {
  _id: "be1796b3-f26a-4ab0-b626-3aa18b55b296",
  authors: [ "a" ],
  links: []
}
----- output end -----
PaperIndex variants: no-op removals when absent ... ok (639ms)

ok | 6 passed | 0 failed (4s)

