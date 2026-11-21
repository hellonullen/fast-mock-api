const test = require("node:test");
const assert = require("node:assert");
const { processQuery } = require("../src/query");

const sampleItems = [
  { id: 1, name: "Alice", role: "admin", age: 30 },
  { id: 2, name: "Bob", role: "user", age: 25 },
  { id: 3, name: "Charlie", role: "user", age: 35 },
  { id: 4, name: "Diana", role: "admin", age: 28 }
];

test("Query - Full text search matches case-insensitively", () => {
  const { data, totalCount } = processQuery(sampleItems, { q: "bob" });
  assert.strictEqual(totalCount, 1);
  assert.strictEqual(data[0].name, "Bob");
});

test("Query - Equality field filter works", () => {
  const { data, totalCount } = processQuery(sampleItems, { role: "admin" });
  assert.strictEqual(totalCount, 2);
  assert.ok(data.every(i => i.role === "admin"));
});

test("Query - Range operators (_gte, _lte) work on numbers", () => {
  const { data } = processQuery(sampleItems, { age_gte: 28, age_lte: 32 });
  assert.strictEqual(data.length, 2); // Alice (30) and Diana (28)
});

test("Query - Sorting by field ascending and descending", () => {
  const asc = processQuery(sampleItems, { _sort: "age", _order: "asc" }).data;
  assert.strictEqual(asc[0].name, "Bob"); // age 25

  const desc = processQuery(sampleItems, { _sort: "age", _order: "desc" }).data;
  assert.strictEqual(desc[0].name, "Charlie"); // age 35
});

test("Query - Pagination splits results properly", () => {
  const page1 = processQuery(sampleItems, { _page: 1, _limit: 2 });
  assert.strictEqual(page1.data.length, 2);
  assert.strictEqual(page1.totalCount, 4);
  assert.strictEqual(page1.data[0].id, 1);
  assert.strictEqual(page1.data[1].id, 2);

  const page2 = processQuery(sampleItems, { _page: 2, _limit: 2 });
  assert.strictEqual(page2.data.length, 2);
  assert.strictEqual(page2.data[0].id, 3);
  assert.strictEqual(page2.data[1].id, 4);
});
