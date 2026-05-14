const { query } = require('../config/database');

async function execute(connection, sql, params) {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows;
  }

  return query(sql, params);
}

function mapOrderSummary(row) {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    totalAmount: row.total_amount,
    lineCount: row.line_count || 0,
    itemCount: row.item_count || 0,
    user: {
      id: row.user_id,
      email: row.email,
      displayName: row.display_name
    }
  };
}

function mapOrderDetails(rows) {
  if (rows.length === 0) {
    return null;
  }

  const first = rows[0];

  return {
    id: first.order_id,
    status: first.status,
    createdAt: first.created_at,
    totalAmount: first.total_amount,
    user: {
      id: first.user_id,
      email: first.email,
      displayName: first.display_name
    },
    lines: rows
      .filter((row) => row.line_id !== null)
      .map((row) => ({
        id: row.line_id,
        quantity: row.quantity,
        unitPrice: row.line_unit_price,
        lineTotal: row.quantity * row.line_unit_price,
        product: {
          id: row.product_id,
          sku: row.sku,
          name: row.product_name,
          currentUnitPrice: row.current_unit_price,
          category: {
            id: row.category_id,
            name: row.category_name
          }
        }
      }))
  };
}

function buildOrderFilters(filters) {
  const where = [];
  const params = {};

  if (filters.status) {
    where.push('o.status = :status');
    params.status = filters.status;
  }

  if (filters.userId) {
    where.push('o.user_id = :userId');
    params.userId = filters.userId;
  }

  if (filters.fromDate) {
    where.push('o.created_at >= :fromDate');
    params.fromDate = filters.fromDate;
  }

  if (filters.toDate) {
    where.push('o.created_at <= :toDate');
    params.toDate = filters.toDate;
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

async function list(filters, pagination) {
  const { clause, params } = buildOrderFilters(filters);

  const rows = await query(
    `
      SELECT
        o.id,
        o.status,
        o.created_at,
        o.total_amount,
        u.id AS user_id,
        u.email,
        u.display_name,
        COUNT(ol.id) AS line_count,
        COALESCE(SUM(ol.quantity), 0) AS item_count
      FROM customer_orders o
      JOIN app_users u ON u.id = o.user_id
      LEFT JOIN order_lines ol ON ol.order_id = o.id
      ${clause}
      GROUP BY o.id, o.status, o.created_at, o.total_amount, u.id, u.email, u.display_name
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT :limit OFFSET :offset
    `,
    {
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map(mapOrderSummary);
}

async function getById(id, connection) {
  const rows = await execute(
    connection,
    `
      SELECT
        o.id AS order_id,
        o.status,
        o.created_at,
        o.total_amount,
        u.id AS user_id,
        u.email,
        u.display_name,
        ol.id AS line_id,
        ol.quantity,
        ol.unit_price AS line_unit_price,
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        p.unit_price AS current_unit_price,
        c.id AS category_id,
        c.name AS category_name
      FROM customer_orders o
      JOIN app_users u ON u.id = o.user_id
      LEFT JOIN order_lines ol ON ol.order_id = o.id
      LEFT JOIN products p ON p.id = ol.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.id = :id
      ORDER BY ol.id ASC
    `,
    { id }
  );

  return mapOrderDetails(rows);
}

async function createHeader(payload, connection) {
  const result = await execute(
    connection,
    `
      INSERT INTO customer_orders (user_id, status, created_at, total_amount)
      VALUES (:userId, :status, NOW(6), 0)
    `,
    {
      userId: payload.userId,
      status: payload.status || 'PENDING'
    }
  );

  return result.insertId;
}

async function createLine(payload, connection) {
  await execute(
    connection,
    `
      INSERT INTO order_lines (order_id, product_id, quantity, unit_price)
      VALUES (:orderId, :productId, :quantity, :unitPrice)
    `,
    payload
  );
}

async function updateTotal(orderId, totalAmount, connection) {
  await execute(
    connection,
    `
      UPDATE customer_orders
      SET total_amount = :totalAmount
      WHERE id = :orderId
    `,
    {
      orderId,
      totalAmount
    }
  );
}

async function updateStatus(id, status) {
  await query(
    `
      UPDATE customer_orders
      SET status = :status
      WHERE id = :id
    `,
    {
      id,
      status
    }
  );

  return getById(id);
}

async function remove(id) {
  const result = await query(
    `
      DELETE FROM customer_orders
      WHERE id = :id
    `,
    { id }
  );

  return result.affectedRows > 0;
}

module.exports = {
  list,
  getById,
  createHeader,
  createLine,
  updateTotal,
  updateStatus,
  remove
};
