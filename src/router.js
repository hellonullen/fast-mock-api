const { processQuery } = require("./query");

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) { // 5MB guard
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error(`Invalid JSON body: ${err.message}`));
      }
    });
    req.on("error", reject);
  });
}

async function handleRoute(req, res, store, options = {}) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const segments = pathname.split("/").filter(Boolean);
  const method = req.method.toUpperCase();

  // Convert searchParams to simple object
  const query = {};
  for (const [k, v] of parsedUrl.searchParams.entries()) {
    query[k] = v;
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Expose-Headers", "X-Total-Count, Link");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return 204;
  }

  // 1. Root overview: GET /
  if (segments.length === 0) {
    const collections = store.getCollections();
    const overview = {
      message: "FastMockApi Server is running",
      documentation: "https://github.com/hellonullen/fast-mock-api",
      resources: {}
    };

    const host = req.headers.host || `localhost:${options.port || 3000}`;
    const protocol = options.https ? "https" : "http";

    for (const name of collections) {
      overview.resources[name] = `${protocol}://${host}/${name}`;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(overview, null, 2));
    return 200;
  }

  const collectionName = segments[0];
  const id = segments[1];

  // Collection existence check
  if (!store.getCollections().includes(collectionName)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Resource '/${collectionName}' not found` }));
    return 404;
  }

  // 2. Collection Route: /:collection
  if (segments.length === 1) {
    if (method === "GET") {
      const items = store.get(collectionName) || [];
      const { data, totalCount } = processQuery(items, query);

      res.writeHead(200, {
        "Content-Type": "application/json",
        "X-Total-Count": String(totalCount)
      });
      res.end(JSON.stringify(data, null, 2));
      return 200;
    }

    if (method === "POST") {
      if (options.readOnly) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server is in read-only mode" }));
        return 403;
      }

      let payload;
      try {
        payload = await readJsonBody(req);
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
        return 400;
      }

      const created = store.insert(collectionName, payload);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(created, null, 2));
      return 201;
    }
  }

  // 3. Item Route: /:collection/:id
  if (segments.length === 2) {
    if (method === "GET") {
      const item = store.getById(collectionName, id);
      if (!item) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Item with id '${id}' not found in '/${collectionName}'` }));
        return 404;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(item, null, 2));
      return 200;
    }

    if (method === "PUT") {
      if (options.readOnly) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server is in read-only mode" }));
        return 403;
      }

      const payload = await readJsonBody(req);
      const updated = store.update(collectionName, id, payload);
      if (!updated) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Item with id '${id}' not found` }));
        return 404;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(updated, null, 2));
      return 200;
    }

    if (method === "PATCH") {
      if (options.readOnly) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server is in read-only mode" }));
        return 403;
      }

      const payload = await readJsonBody(req);
      const patched = store.patch(collectionName, id, payload);
      if (!patched) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Item with id '${id}' not found` }));
        return 404;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(patched, null, 2));
      return 200;
    }

    if (method === "DELETE") {
      if (options.readOnly) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server is in read-only mode" }));
        return 403;
      }

      const deleted = store.delete(collectionName, id);
      if (!deleted) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Item with id '${id}' not found` }));
        return 404;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: `Item '${id}' successfully deleted` }));
      return 200;
    }
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: `Method ${method} not allowed on /${pathname}` }));
  return 405;
}

module.exports = {
  handleRoute
};
