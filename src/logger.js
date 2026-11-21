const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m"
};

function formatMethod(method) {
  switch (method) {
    case "GET": return `${colors.blue}${colors.bold} GET   ${colors.reset}`;
    case "POST": return `${colors.green}${colors.bold} POST  ${colors.reset}`;
    case "PUT": return `${colors.yellow}${colors.bold} PUT   ${colors.reset}`;
    case "PATCH": return `${colors.cyan}${colors.bold} PATCH ${colors.reset}`;
    case "DELETE": return `${colors.red}${colors.bold} DELETE${colors.reset}`;
    case "OPTIONS": return `${colors.dim} OPTIONS${colors.reset}`;
    default: return ` ${method.padEnd(6)} `;
  }
}

function formatStatus(status) {
  if (status >= 500) return `${colors.red}${status}${colors.reset}`;
  if (status >= 400) return `${colors.yellow}${status}${colors.reset}`;
  if (status >= 300) return `${colors.cyan}${status}${colors.reset}`;
  return `${colors.green}${status}${colors.reset}`;
}

function logRequest(method, url, statusCode, durationMs) {
  const time = new Date().toISOString().substring(11, 19);
  const timeStr = `${colors.gray}[${time}]${colors.reset}`;
  const methodStr = formatMethod(method);
  const statusStr = formatStatus(statusCode);
  const durationStr = `${colors.gray}${durationMs.toFixed(1)}ms${colors.reset}`;

  console.log(`${timeStr} ${methodStr} ${url.padEnd(30)} ${statusStr} ${durationStr}`);
}

module.exports = {
  colors,
  logRequest
};
