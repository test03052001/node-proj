const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPagination(query) {
  const page = toPositiveInteger(query.page, 1);
  const limit = Math.min(toPositiveInteger(query.limit, DEFAULT_LIMIT), MAX_LIMIT);

  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
}

function toPagedResponse(rows, pagination) {
  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      count: rows.length
    }
  };
}

module.exports = {
  getPagination,
  toPagedResponse
};
