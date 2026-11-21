/**
 * Applies query parameter filtering, full-text search, sorting, and pagination
 * to an in-memory array of objects.
 */
function processQuery(items, queryParams) {
  let result = [...items];

  // 1. Full-text search (?q=term)
  if (queryParams.q) {
    const term = String(queryParams.q).toLowerCase();
    result = result.filter(item => {
      return Object.values(item).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }

  // 2. Field Filters & Operators (_gte, _lte, _ne, _like)
  for (const [key, rawValue] of Object.entries(queryParams)) {
    if (key.startsWith("_") || key === "q") continue;

    if (key.endsWith("_gte")) {
      const field = key.replace(/_gte$/, "");
      const numVal = Number(rawValue);
      result = result.filter(item => Number(item[field]) >= numVal);
    } else if (key.endsWith("_lte")) {
      const field = key.replace(/_lte$/, "");
      const numVal = Number(rawValue);
      result = result.filter(item => Number(item[field]) <= numVal);
    } else if (key.endsWith("_ne")) {
      const field = key.replace(/_ne$/, "");
      result = result.filter(item => String(item[field]) !== String(rawValue));
    } else if (key.endsWith("_like")) {
      const field = key.replace(/_like$/, "");
      const reg = new RegExp(String(rawValue), "i");
      result = result.filter(item => reg.test(String(item[field])));
    } else {
      // Direct equality
      result = result.filter(item => {
        const val = item[key];
        if (typeof val === "boolean") {
          return String(val) === String(rawValue);
        }
        if (typeof val === "number") {
          return val === Number(rawValue);
        }
        return String(val) === String(rawValue);
      });
    }
  }

  const totalCount = result.length;

  // 3. Sorting (?_sort=price&_order=desc)
  if (queryParams._sort) {
    const sortField = queryParams._sort;
    const isDesc = String(queryParams._order || "").toLowerCase() === "desc";

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      let comparison = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return isDesc ? -comparison : comparison;
    });
  }

  // 4. Pagination (?_page=1&_limit=10)
  if (queryParams._page || queryParams._limit) {
    const page = Math.max(1, parseInt(queryParams._page, 10) || 1);
    const limit = Math.max(1, parseInt(queryParams._limit, 10) || 10);
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
  }

  return {
    data: result,
    totalCount
  };
}

module.exports = {
  processQuery
};
