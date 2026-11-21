const { colors } = require("./logger");

function printBanner() {
  console.log(`${colors.cyan}${colors.bold}  _____          _   __  __            _        _    ____ ___ `);
  console.log(` |  ___|_ _  ___| |_|  \\/  | ___   ___| | __   / \\  |  _ \\_ _|`);
  console.log(` | |_ / _\` |/ __| __| |\\/| |/ _ \\ / __| |/ /  / _ \\ | |_) | | `);
  console.log(` |  _| (_| |\\__ \\ |_| |  | | (_) | (__|   <  / ___ \\|  __/| | `);
  console.log(` |_|  \\__,_||___/\\__|_|  |_|\\___/ \\___|_|\\_\\/_/   \\_\\_|  |___|${colors.reset}\n`);

  console.log(`  ${colors.bold}FastMockApi - Instant Zero-Dependency Mock Server${colors.reset}`);
  console.log(`  GitHub: https://github.com/hellonullen/fast-mock-api`);
  console.log(`  Author: hellonullen | License: MIT\n`);
}

function printServerInfo(port, collections, host = "localhost") {
  console.log(`  ${colors.green}● Server listening on:${colors.reset} http://${host}:${port}`);
  console.log(`  ${colors.gray}Resources available:${colors.reset}`);
  for (const c of collections) {
    console.log(`    - ${colors.cyan}http://${host}:${port}/${c}${colors.reset}`);
  }
  console.log(`\n  ${colors.gray}Press Ctrl+C to stop.${colors.reset}\n`);
}

module.exports = {
  printBanner,
  printServerInfo
};
