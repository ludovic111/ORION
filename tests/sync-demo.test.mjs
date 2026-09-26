import test from "node:test";
import assert from "node:assert/strict";
import { demoWorkspace } from "../src/journal/demo.ts";
import {
  archive,
  packWorkspace,
  parseArchive,
  workspaceSchema,
} from "../shared/journal.ts";
import { digest, mergeJournal, sliceJournal } from "../shared/sync.ts";
import { versionVector } from "../shared/stamps.ts";

// The demonstration exercise is the richest session at hand: every module,
// a long history. It must survive every boundary unchanged.

test("the demonstration session survives the vault, archives and merges", async () => {
  const ws = workspaceSchema.parse(demoWorkspace());
  const [journal] = ws.journals;
  assert.deepEqual(
    workspaceSchema.parse(JSON.parse(JSON.stringify(packWorkspace(ws)))),
    ws,
  );
  assert.deepEqual(
    parseArchive(JSON.parse(JSON.stringify(archive(journal)))).journal,
    journal,
  );
  assert.equal(
    await digest(mergeJournal(journal, journal)),
    await digest(journal),
  );
  // Nothing to send to a post that has everything.
  assert.equal(sliceJournal(journal, versionVector(journal)), null);
  // Message numbers are the ones the demonstration always showed.
  const numbers = journal.ops.messages.map((m) => m.number);
  assert.equal(new Set(numbers).size, numbers.length);
  assert.ok(numbers.every((n) => Number.isInteger(n) && n > 0));
});
