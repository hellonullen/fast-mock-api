const test = require("node:test");
const assert = require("node:assert");
const http = require("http");
const { createMockServer } = require("../src/index");

function request(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const options = {
      hostname: "localhost",
      port: address.port,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBody: data
        });
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

test("Server - Complete REST CRUD Workflow", async (t) => {
  const initialData = {
    users: [
      { id: 1, name: "Alice", email: "alice@test.com" },
      { id: 2, name: "Bob", email: "bob@test.com" }
    ]
  };

  const server = createMockServer(initialData, { quiet: true });
  await new Promise(resolve => server.listen(0, resolve));

  t.after(() => server.close());

  // 1. GET Root Overview
  const rootRes = await request(server, "GET", "/");
  assert.strictEqual(rootRes.statusCode, 200);
  assert.ok(rootRes.body.resources.users);

  // 2. GET Collection
  const getRes = await request(server, "GET", "/users");
  assert.strictEqual(getRes.statusCode, 200);
  assert.strictEqual(getRes.body.length, 2);
  assert.strictEqual(getRes.headers["x-total-count"], "2");

  // 3. GET Single by ID
  const singleRes = await request(server, "GET", "/users/1");
  assert.strictEqual(singleRes.statusCode, 200);
  assert.strictEqual(singleRes.body.name, "Alice");

  // 4. POST Create
  const createRes = await request(server, "POST", "/users", { name: "Charlie", email: "charlie@test.com" });
  assert.strictEqual(createRes.statusCode, 201);
  assert.strictEqual(createRes.body.id, 3);
  assert.strictEqual(createRes.body.name, "Charlie");

  // 5. PATCH Update
  const patchRes = await request(server, "PATCH", "/users/3", { name: "Charles" });
  assert.strictEqual(patchRes.statusCode, 200);
  assert.strictEqual(patchRes.body.name, "Charles");
  assert.strictEqual(patchRes.body.email, "charlie@test.com");

  // 6. DELETE Item
  const deleteRes = await request(server, "DELETE", "/users/3");
  assert.strictEqual(deleteRes.statusCode, 200);

  // Verify deletion
  const verifyRes = await request(server, "GET", "/users/3");
  assert.strictEqual(verifyRes.statusCode, 404);
});

test("Server - ReadOnly mode blocks mutations", async (t) => {
  const server = createMockServer({ items: [{ id: 1, title: "Test" }] }, { quiet: true, readOnly: true });
  await new Promise(resolve => server.listen(0, resolve));

  t.after(() => server.close());

  const postRes = await request(server, "POST", "/items", { title: "New Item" });
  assert.strictEqual(postRes.statusCode, 403);
});
