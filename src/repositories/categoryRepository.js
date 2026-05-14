const { query } = require('../config/database');
const { firstOrNull } = require('../utils/rows');

function mapCategory(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    productCount: row.product_count,
    activeProductCount: row.active_product_count,
    stockOnHand: row.stock_on_hand
  };
}

async function list(filters, pagination) {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('c.name LIKE :search');
    params.search = `%${filters.search}%`;
  }

  const rows = await query(
    `
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT p.id) AS product_count,
        COUNT(DISTINCT CASE WHEN p.active = 1 THEN p.id END) AS active_product_count,
        COALESCE(SUM(sl.quantity_on_hand), 0) AS stock_on_hand
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
      LIMIT :limit OFFSET :offset
    `,
    {
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map(mapCategory);
}

async function getById(id) {
  const rows = await query(
    `
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT p.id) AS product_count,
        COUNT(DISTINCT CASE WHEN p.active = 1 THEN p.id END) AS active_product_count,
        COALESCE(SUM(sl.quantity_on_hand), 0) AS stock_on_hand
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE c.id = :id
      GROUP BY c.id, c.name
    `,
    { id }
  );

  return mapCategory(firstOrNull(rows));
}

async function create(payload) {
  const result = await query(
    `
      INSERT INTO categories (name)
      VALUES (:name)
    `,
    { name: payload.name }
  );

  return getById(result.insertId);
}

async function update(id, payload) {
  await query(
    `
      UPDATE categories
      SET name = :name
      WHERE id = :id
    `,
    {
      id,
      name: payload.name
    }
  );

  return getById(id);
}

async function remove(id) {
  const result = await query(
    `
      DELETE FROM categories
      WHERE id = :id
    `,
    { id }
  );

  return result.affectedRows > 0;
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
