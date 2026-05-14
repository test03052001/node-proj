const { query } = require('../config/database');
const { firstOrNull, normalizeBoolean } = require('../utils/rows');

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    active: normalizeBoolean(row.active),
    totalOrders: row.total_orders,
    lifetimeValue: row.lifetime_value,
    lastOrderAt: row.last_order_at
  };
}

function buildUserFilters(filters) {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('(u.email LIKE :search OR u.display_name LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  if (filters.active !== undefined) {
    where.push('u.active = :active');
    params.active = filters.active ? 1 : 0;
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

async function list(filters, pagination) {
  const { clause, params } = buildUserFilters(filters);

  const rows = await query(
    `
      SELECT
        u.id,
        u.email,
        u.display_name,
        u.created_at,
        u.active,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS lifetime_value,
        MAX(o.created_at) AS last_order_at
      FROM app_users u
      LEFT JOIN customer_orders o ON o.user_id = u.id
      ${clause}
      GROUP BY u.id, u.email, u.display_name, u.created_at, u.active
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT :limit OFFSET :offset
    `,
    {
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map(mapUser);
}

async function getById(id, connection) {
  const executor = connection || { execute: async (sql, params) => [await query(sql, params)] };
  const [rows] = await executor.execute(
    `
      SELECT id, email, display_name, created_at, active
      FROM app_users
      WHERE id = :id
    `,
    { id }
  );

  return mapUser(firstOrNull(rows));
}

async function create(payload) {
  const result = await query(
    `
      INSERT INTO app_users (email, display_name, created_at, active)
      VALUES (:email, :displayName, NOW(6), :active)
    `,
    {
      email: payload.email,
      displayName: payload.displayName,
      active: payload.active === undefined ? 1 : Number(payload.active)
    }
  );

  return getById(result.insertId);
}

async function update(id, payload) {
  const fields = [];
  const params = { id };

  if (payload.email !== undefined) {
    fields.push('email = :email');
    params.email = payload.email;
  }

  if (payload.displayName !== undefined) {
    fields.push('display_name = :displayName');
    params.displayName = payload.displayName;
  }

  if (payload.active !== undefined) {
    fields.push('active = :active');
    params.active = Number(payload.active);
  }

  if (fields.length > 0) {
    await query(
      `
        UPDATE app_users
        SET ${fields.join(', ')}
        WHERE id = :id
      `,
      params
    );
  }

  return getById(id);
}

async function getOrders(id, pagination) {
  const rows = await query(
    `
      SELECT
        o.id AS order_id,
        o.status,
        o.created_at,
        o.total_amount,
        COUNT(ol.id) AS line_count,
        COALESCE(SUM(ol.quantity), 0) AS item_count
      FROM customer_orders o
      LEFT JOIN order_lines ol ON ol.order_id = o.id
      WHERE o.user_id = :id
      GROUP BY o.id, o.status, o.created_at, o.total_amount
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT :limit OFFSET :offset
    `,
    {
      id,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map((row) => ({
    id: row.order_id,
    status: row.status,
    createdAt: row.created_at,
    totalAmount: row.total_amount,
    lineCount: row.line_count,
    itemCount: row.item_count
  }));
}

module.exports = {
  list,
  getById,
  create,
  update,
  getOrders
};
