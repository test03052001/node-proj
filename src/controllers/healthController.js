const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../config/database');

const health = asyncHandler(async (req, res) => {
  const rows = await query('SELECT 1 AS ok');

  res.json({
    status: 'ok',
    database: rows[0].ok === 1 ? 'reachable' : 'unknown'
  });
});

module.exports = {
  health
};
