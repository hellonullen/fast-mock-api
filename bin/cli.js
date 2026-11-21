#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { printBanner, printServerInfo } = require("../src/banner");
const { createMockServer, DataStore } = require("../src/index");
const { colors } = require("../src/logger");

const args = process.argv.slice(2);

function printHelp() {
  printBanner();
  console.log(`USAGE:
  fast-mock-api serve <db.json> [options]
  fast-mock-api init [output.json]
  fast-mock-api routes <db.json>
  fast-mock-api -h, --help

COMMANDS:
  serve     Spin up instant RESTful API server for given JSON database file.
  init      Generate a starter sample JSON database with users, products, and posts.
  routes    List all available RESTful endpoints for a database file.

OPTIONS (serve):
  -p, --port <number>     Server port (default: 3000, or process.env.PORT).
  -h, --host <host>       Server host bind (default: "localhost").
  -d, --delay <ms|min-max> Artificial latency in ms (e.g. 200 or 100-500 jitter).
  --readonly              Disable POST, PUT, PATCH, DELETE mutations.
  --quiet                 Suppress request logging in console.

EXAMPLES:
  # Start API server on port 4000 with 150ms delay simulation
  fast-mock-api serve ./db.json -p 4000 -d 150

  # Start with network jitter between 100ms and 500ms
  fast-mock-api serve ./db.json -d 100-500

  # Generate starter database
  fast-mock-api init my-db.json
`);
}

function handleInit(outputArg) {
  printBanner();
  const targetFile = outputArg || "db.json";
  const targetPath = path.resolve(targetFile);

  if (fs.existsSync(targetPath)) {
    console.log(`${colors.red}[ERROR] File already exists:${colors.reset} ${targetPath}`);
    process.exit(1);
  }

  const sampleData = {
    users: [
      { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "admin" },
      { id: 2, name: "Bob Smith", email: "bob@example.com", role: "user" }
    ],
    posts: [
      { id: 1, userId: 1, title: "Hello World", content: "First post on FastMockApi" },
      { id: 2, userId: 2, title: "Testing Mock APIs", content: "Lightning fast prototyping" }
    ],
    comments: [
      { id: 1, postId: 1, text: "Great starting point!" }
    ]
  };

  fs.writeFileSync(targetPath, JSON.stringify(sampleData, null, 2), "utf-8");
  console.log(`${colors.green}[SUCCESS] Created sample database at:${colors.reset} ${targetPath}`);
  console.log(`\nStart your mock API now:\n  ${colors.cyan}fast-mock-api serve ${targetFile}${colors.reset}\n`);
}

function handleRoutes(fileArg) {
  if (!fileArg) {
    console.log(`${colors.red}[ERROR] Missing JSON file path.${colors.reset}`);
    process.exit(1);
  }

  const store = new DataStore(fileArg);
  const collections = store.getCollections();

  printBanner();
  console.log(`Discovered ${collections.length} REST resources in '${fileArg}':\n`);

  for (const c of collections) {
    console.log(`  ${colors.cyan}/${c}${colors.reset}`);
    console.log(`    GET    /${c}              (List all items, query, search, paginate)`);
    console.log(`    GET    /${c}/:id          (Get single item by ID)`);
    console.log(`    POST   /${c}              (Create new item with auto-assigned ID)`);
    console.log(`    PUT    /${c}/:id          (Replace item)`);
    console.log(`    PATCH  /${c}/:id          (Partial update item)`);
    console.log(`    DELETE /${c}/:id          (Delete item)`);
    console.log();
  }
}

function handleServe(serveArgs) {
  if (serveArgs.length === 0) {
    console.log(`${colors.red}[ERROR] Missing JSON file path to serve.${colors.reset}\n`);
    printHelp();
    process.exit(1);
  }

  const filePath = serveArgs[0];
  let port = parseInt(process.env.PORT, 10) || 3000;
  let host = "localhost";
  let delay = null;
  let readOnly = false;
  let quiet = false;

  for (let i = 1; i < serveArgs.length; i++) {
    const arg = serveArgs[i];
    if ((arg === "-p" || arg === "--port") && i + 1 < serveArgs.length) {
      port = parseInt(serveArgs[++i], 10);
    } else if ((arg === "-h" || arg === "--host") && i + 1 < serveArgs.length) {
      host = serveArgs[++i];
    } else if ((arg === "-d" || arg === "--delay") && i + 1 < serveArgs.length) {
      delay = serveArgs[++i];
    } else if (arg === "--readonly") {
      readOnly = true;
    } else if (arg === "--quiet") {
      quiet = true;
    }
  }

  printBanner();

  let store;
  try {
    store = new DataStore(filePath, { readOnly });
  } catch (err) {
    console.log(`${colors.red}[FATAL ERROR] ${err.message}${colors.reset}`);
    process.exit(1);
  }

  const collections = store.getCollections();
  if (collections.length === 0) {
    console.log(`${colors.yellow}[WARNING] No array collections found in JSON file.${colors.reset}`);
  }

  const server = createMockServer(store, { port, host, delay, readOnly, quiet });

  server.listen(port, host, () => {
    printServerInfo(port, collections, host);
    if (delay) console.log(`  ${colors.yellow}⚡ Simulated Latency:${colors.reset} ${delay}ms`);
    if (readOnly) console.log(`  ${colors.yellow}🔒 Read-Only Mode:${colors.reset} mutations disabled`);
  });

  server.on("error", (err) => {
    console.log(`${colors.red}[SERVER ERROR] ${err.message}${colors.reset}`);
    process.exit(1);
  });
}

// Route command
if (args.length === 0 || args[0] === "-h" || args[0] === "--help" || args[0] === "help") {
  printHelp();
  process.exit(0);
}

const command = args[0].toLowerCase();
if (command === "init") {
  handleInit(args[1]);
} else if (command === "routes") {
  handleRoutes(args[1]);
} else if (command === "serve") {
  handleServe(args.slice(1));
} else {
  // If user directly passed a filename (e.g. `fast-mock-api db.json`)
  if (fs.existsSync(args[0])) {
    handleServe(args);
  } else {
    console.log(`${colors.red}[ERROR] Unknown command: ${args[0]}${colors.reset}\n`);
    printHelp();
    process.exit(1);
  }
}
