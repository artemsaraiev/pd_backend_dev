// @ts-nocheck
/// <reference lib="dom" />
declare const Deno: any;
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { newTestDb, cleanupTestDb } from "../_test/db.ts";
import { IdentityVerificationService } from "./impl.ts";
import type { VerificationDoc } from "./impl.ts";  // ← import the type

const sorted = <T>(xs: T[] | undefined) => [...(xs ?? [])].sort();

Deno.test("IdentityVerification OP: addORCID -> addAffiliation -> addBadge", async () => {
  const [db, client] = await newTestDb("identity-op");
  try {
    const svc = new IdentityVerificationService(db);
    await svc.addORCID("u1", "0000-0001-2345-6789");
    await svc.addAffiliation("u1", "MIT");
    await svc.addBadge("u1", "Author");
    await svc.addBadge("u1", "ORCID");

    const verifs = db.collection<VerificationDoc>("verifications");   // ← typed
    const doc = await verifs.findOne({ _id: "u1" });                  // ← string id OK
    console.log("OP verification:", doc);

    assertEquals(doc?.orcid, "0000-0001-2345-6789");
    assertEquals(doc?.affiliation, "MIT");
    assertEquals(sorted(doc?.badges), ["Author", "ORCID"]);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("IdentityVerification variants: updateAffiliation, revokeBadge, addBadge duplicate no-op", async () => {
  const [db, client] = await newTestDb("identity-variants");
  try {
    const svc = new IdentityVerificationService(db);
    await svc.addBadge("u2", "Mod");
    await svc.addBadge("u2", "Mod");
    await svc.updateAffiliation("u2", "Harvard");
    await svc.revokeBadge("u2", "Mod");

    const verifs = db.collection<VerificationDoc>("verifications");
    const doc = await verifs.findOne({ _id: "u2" });
    console.log("Variants verification:", doc);

    assertEquals(doc?.affiliation, "Harvard");
    assertEquals(doc?.badges ?? [], []);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("IdentityVerification errors policy: revokeBadge on missing doc is no-op", async () => {
  const [db, client] = await newTestDb("identity-errors");
  try {
    const svc = new IdentityVerificationService(db);
    await svc.revokeBadge("nouser", "Any");

    const verifs = db.collection<VerificationDoc>("verifications");
    const doc = await verifs.findOne({ _id: "nouser" });
    assertEquals(doc, null);
  } finally {
    await cleanupTestDb(db, client);
  }
});

Deno.test("IdentityVerification variant: clear affiliation unsets field", async () => {
  const [db, client] = await newTestDb("identity-v2");
  try {
    const svc = new IdentityVerificationService(db);
    await svc.addAffiliation("u3", "Stanford");
    await svc.updateAffiliation("u3", undefined);

    const verifs = db.collection<VerificationDoc>("verifications");
    const doc = await verifs.findOne({ _id: "u3" });
    console.log("Variant2 verification:", doc);
    assertEquals("affiliation" in (doc ?? {}), false);
  } finally {
    await cleanupTestDb(db, client);
  }
});


Deno.test("IdentityVerification variants: ORCID replacement and revoke non-existent badge no-op", async () => {
  const [db, client] = await newTestDb("identity-v3");
  try {
    const svc = new IdentityVerificationService(db);
    await svc.addORCID("u4", "0000-0001-1111-1111");
    await svc.addORCID("u4", "0000-0002-2222-2222");
    await svc.addBadge("u4", "Author");
    await svc.revokeBadge("u4", "NonExistent");

    const verifs = db.collection<VerificationDoc>("verifications");
    const doc = await verifs.findOne({ _id: "u4" });
    console.log("Variant3 verification:", doc);
    assertEquals(doc?.orcid, "0000-0002-2222-2222");
    assertEquals(doc?.badges, ["Author"]);
  } finally {
    await cleanupTestDb(db, client);
  }
});
