const fs = require("fs");
const path = require("path");

class DataStore {
  constructor(filePath, options = {}) {
    this.filePath = filePath ? path.resolve(filePath) : null;
    this.readOnly = options.readOnly || false;
    this.data = {};
    this.saveTimeout = null;

    if (this.filePath) {
      this.load();
    } else if (options.initialData) {
      this.data = JSON.parse(JSON.stringify(options.initialData));
    }
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(`Data file not found: ${this.filePath}`);
    }
    const raw = fs.readFileSync(this.filePath, "utf-8");
    try {
      this.data = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON syntax in ${this.filePath}: ${err.message}`);
    }

    // Ensure collections are arrays or wrap primitive objects
    for (const [key, value] of Object.entries(this.data)) {
      if (!Array.isArray(value)) {
        this.data[key] = Array.isArray(value) ? value : [value];
      }
    }
  }

  save() {
    if (this.readOnly || !this.filePath) return;

    // Debounced async atomic write
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      const tempPath = `${this.filePath}.tmp`;
      const json = JSON.stringify(this.data, null, 2);
      fs.writeFile(tempPath, json, "utf-8", (err) => {
        if (!err) {
          fs.rename(tempPath, this.filePath, () => {});
        }
      });
    }, 100);
  }

  getCollections() {
    return Object.keys(this.data);
  }

  get(collectionName) {
    const list = this.data[collectionName];
    return list ? [...list] : null;
  }

  getById(collectionName, id) {
    const list = this.data[collectionName];
    if (!list) return null;
    return list.find(item => String(item.id) === String(id)) || null;
  }

  insert(collectionName, item) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }

    const list = this.data[collectionName];
    let newId = item.id;
    if (newId === undefined || newId === null) {
      const maxId = list.reduce((max, current) => {
        const num = Number(current.id);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      newId = maxId + 1;
    }

    const newItem = { id: newId, ...item };
    list.push(newItem);
    this.save();
    return newItem;
  }

  update(collectionName, id, updatedFields) {
    const list = this.data[collectionName];
    if (!list) return null;

    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;

    const originalId = list[index].id;
    const replaced = { ...updatedFields, id: originalId };
    list[index] = replaced;
    this.save();
    return replaced;
  }

  patch(collectionName, id, partialFields) {
    const list = this.data[collectionName];
    if (!list) return null;

    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;

    const updated = { ...list[index], ...partialFields, id: list[index].id };
    list[index] = updated;
    this.save();
    return updated;
  }

  delete(collectionName, id) {
    const list = this.data[collectionName];
    if (!list) return false;

    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return false;

    list.splice(index, 1);
    this.save();
    return true;
  }
}

module.exports = DataStore;
