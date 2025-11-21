import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import PdfHighlighterConcept from "./PdfHighlighterConcept.ts";

const paper1 = "paper:1234" as ID;

Deno.test("Action: createHighlight creates text highlight (with quote)", async () => {
  const [db, client] = await testDb();
  const concept = new PdfHighlighterConcept(db);

  try {
    console.log("Testing createHighlight - text highlight");

    const rects = [
      { x: 0.1, y: 0.1, w: 0.5, h: 0.05 },
      { x: 0.1, y: 0.15, w: 0.3, h: 0.05 },
    ];
    const quote = "This is a quoted text.";

    const result = await concept.createHighlight({
      paper: paper1,
      page: 1,
      rects,
      quote,
    });

    assertNotEquals("error" in result, true, "Creation should succeed");
    const { highlightId } = result as { highlightId: ID };
    assertExists(highlightId, "Should return highlight ID");

    const getResult = await concept._get({ highlight: highlightId });
    const { highlight } = getResult[0];
    assertExists(highlight, "Highlight should exist");
    assertEquals(highlight?.paper, paper1, "Paper ID should match");
    assertEquals(highlight?.page, 1, "Page should match");
    assertEquals(highlight?.rects.length, 2, "Should have 2 rects");
    assertEquals(highlight?.quote, quote, "Quote should match");

    console.log("  ✓ Text highlight created correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Action: createHighlight creates figure highlight (without quote)", async () => {
  const [db, client] = await testDb();
  const concept = new PdfHighlighterConcept(db);

  try {
    console.log("Testing createHighlight - figure highlight");

    const rects = [{ x: 0.2, y: 0.4, w: 0.6, h: 0.3 }];

    const result = await concept.createHighlight({
      paper: paper1,
      page: 2,
      rects,
    });

    assertNotEquals("error" in result, true, "Creation should succeed");
    const { highlightId } = result as { highlightId: ID };
    assertExists(highlightId, "Should return highlight ID");

    const getResult = await concept._get({ highlight: highlightId });
    const { highlight } = getResult[0];
    assertExists(highlight, "Highlight should exist");
    assertEquals(highlight?.paper, paper1, "Paper ID should match");
    assertEquals(highlight?.page, 2, "Page should match");
    assertEquals(highlight?.quote, undefined, "Quote should be undefined");

    console.log("  ✓ Figure highlight created correctly");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _listByPaper returns all highlights for a paper", async () => {
  const [db, client] = await testDb();
  const concept = new PdfHighlighterConcept(db);

  try {
    console.log("Testing _listByPaper query");

    // Create highlights for paper1
    await concept.createHighlight({
      paper: paper1,
      page: 1,
      rects: [{ x: 0, y: 0, w: 0.1, h: 0.1 }],
      quote: "Highlight 1",
    });
    await concept.createHighlight({
      paper: paper1,
      page: 2,
      rects: [{ x: 0.5, y: 0.5, w: 0.2, h: 0.2 }],
    });

    // Create highlight for another paper
    await concept.createHighlight({
      paper: "other:paper" as ID,
      page: 1,
      rects: [{ x: 0, y: 0, w: 0.1, h: 0.1 }],
    });

    const result = await concept._listByPaper({ paper: paper1 });
    const { highlights } = result[0];

    assertEquals(highlights.length, 2, "Should return 2 highlights for paper1");
    assertEquals(highlights.every((h) => h.paper === paper1), true, "All highlights should belong to paper1");

    console.log("  ✓ Correctly lists highlights by paper");
  } finally {
    await client.close();
  }
});
