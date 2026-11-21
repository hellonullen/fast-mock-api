const DataStore = require("./store");
const { createServer } = require("./server");

function createMockServer(dataPathOrObject, options = {}) {
  const store = typeof dataPathOrObject === "string"
    ? new DataStore(dataPathOrObject, options)
    : new DataStore(null, { initialData: dataPathOrObject, ...options });

  return createServer(store, options);
}

module.exports = {
  createMockServer,
  DataStore
};
