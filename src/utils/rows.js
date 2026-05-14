function firstOrNull(rows) {
  return rows.length > 0 ? rows[0] : null;
}

function normalizeBoolean(value) {
  return Boolean(value);
}

function buildInsertResult(result) {
  return {
    id: result.insertId,
    affectedRows: result.affectedRows
  };
}

module.exports = {
  firstOrNull,
  normalizeBoolean,
  buildInsertResult
};
