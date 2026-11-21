# fast-mock-api

A zero-dependency, lightning-fast Node.js CLI to spin up instant RESTful mock APIs with CRUD routes, filtering, pagination, and latency simulation.

[![Test Suite](https://github.com/hellonullen/fast-mock-api/actions/workflows/build-test.yml/badge.svg)](https://github.com/hellonullen/fast-mock-api/actions/workflows/build-test.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)](https://github.com/hellonullen/fast-mock-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Author Website](https://img.shields.io/badge/Author-kadircanuredi.com.tr-0ea5e9?style=flat-square&logo=google-chrome&logoColor=white)](https://kadircanuredi.com.tr)

---

## ⚡ Highlights

- **Zero External Dependencies:** Built entirely with Node.js built-in standard library (`http`, `fs`, `path`, `crypto`).
- **Instant Full CRUD:** Automatically exposes `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` for every array in your JSON file.
- **Rich Query Filtering:** Filter by exact match, full-text search (`?q=term`), ranges (`_gte`, `_lte`), and regex patterns (`_like`).
- **Pagination & Sorting:** Built-in `?_page=1&_limit=10` and `?_sort=price&_order=desc`.
- **Latency Simulation:** Simulate real-world network lag or random mobile jitter (`--delay 200` or `--delay 100-500`).
- **CORS Enabled:** Out-of-the-box support for browser clients and mobile apps.
- **Atomic File Persistence:** Safe asynchronous writing back to disk on mutations (with `--readonly` option available).

---

## 🚀 Quick Start

### 1. Installation
Clone or run directly with Node:
```bash
git clone https://github.com/hellonullen/fast-mock-api.git
cd fast-mock-api
npm link # (Optional: makes fast-mock-api global in terminal)
```

### 2. Generate a Starter Database
```bash
node ./bin/cli.js init my-db.json
```

### 3. Start Mock Server
```bash
node ./bin/cli.js serve my-db.json --port 4000 --delay 150
```

---

## 💻 CLI Commands & Options

```text
USAGE:
  fast-mock-api serve <db.json> [options]
  fast-mock-api init [output.json]
  fast-mock-api routes <db.json>

OPTIONS:
  -p, --port <number>      Server port (default: 3000).
  -h, --host <host>        Server host bind (default: "localhost").
  -d, --delay <ms|min-max> Artificial latency in ms (e.g., 200 or 100-500 jitter).
  --readonly               Disable write operations (POST, PUT, PATCH, DELETE).
  --quiet                  Suppress request console logs.
```

---

## 🔍 REST & Query API Reference

### CRUD Endpoints
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/:collection` | List items with search, filters, pagination, and sorting |
| `GET` | `/:collection/:id` | Retrieve single item by ID |
| `POST` | `/:collection` | Create new item (ID automatically assigned) |
| `PUT` | `/:collection/:id` | Replace existing item |
| `PATCH`| `/:collection/:id` | Partially update fields of an existing item |
| `DELETE`| `/:collection/:id`| Remove item by ID |

### Query Parameters
- **Full-Text Search:** `GET /users?q=alice`
- **Field Equality:** `GET /users?role=admin&active=true`
- **Numerical Comparison:** `GET /products?price_gte=50&price_lte=150`
- **Exclusion:** `GET /products?category_ne=clothing`
- **Sorting:** `GET /products?_sort=price&_order=desc`
- **Pagination:** `GET /products?_page=2&_limit=5` *(Response includes `X-Total-Count` header)*

---

## 🧪 Testing

The repository utilizes the native Node.js test runner (`node:test`) without requiring Jest or Mocha:

```bash
npm test
```

---

## 📚 Programmatic API

You can also mount FastMockApi inside your own Node.js automation scripts or integration tests:

```javascript
const { createMockServer } = require("fast-mock-api");

const db = {
  todos: [
    { id: 1, title: "Learn FastMockApi", done: true }
  ]
};

const server = createMockServer(db, { port: 5000, quiet: true });
server.listen(5000, () => {
  console.log("Mock server running on port 5000");
});
```

---

## 👨‍💻 Author & Engineering

Developed by **Kadircan Üredi** (NulleN) — Full-Stack Developer & Systems Engineer.
- 🌐 **Official Website:** [https://kadircanuredi.com.tr](https://kadircanuredi.com.tr)
- 🐙 **GitHub:** [@hellonullen](https://github.com/hellonullen)
- 📧 **Contact:** [contact@kadircanuredi.com.tr](mailto:contact@kadircanuredi.com.tr)

---

## 📄 License

Licensed under the [MIT License](LICENSE).
