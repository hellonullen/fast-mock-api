const http = require("http");
const { handleRoute } = require("./router");
const { logRequest } = require("./logger");

function parseDelay(delayOption) {
  if (!delayOption) return 0;
  if (typeof delayOption === "number") return delayOption;

  const str = String(delayOption);
  if (str.includes("-")) {
    const [min, max] = str.split("-").map(s => parseInt(s.trim(), 10));
    if (!isNaN(min) && !isNaN(max) && max >= min) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  }

  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

function createServer(store, options = {}) {
  const server = http.createServer(async (req, res) => {
    const start = process.hrtime();

    // Artificial Latency Simulation (delay / jitter)
    const delayMs = parseDelay(options.delay);
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    try {
      const statusCode = await handleRoute(req, res, store, options);
      const diff = process.hrtime(start);
      const durationMs = (diff[0] * 1e3) + (diff[1] * 1e-6);

      if (!options.quiet) {
        logRequest(req.method, req.url, statusCode, durationMs);
      }
    } catch (err) {
      const diff = process.hrtime(start);
      const durationMs = (diff[0] * 1e3) + (diff[1] * 1e-6);

      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }

      if (!options.quiet) {
        logRequest(req.method, req.url, 500, durationMs);
      }
    }
  });

  return server;
}

module.exports = {
  createServer
};
