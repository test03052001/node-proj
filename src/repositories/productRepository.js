const { query, withTransaction } = require('../config/database');
const stockRepository = require('./stockRepository');
const { firstOrNull, normalizeBoolean } = require('../utils/rows');

async function execute(connection, sql, params) {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows;
  }

  return query(sql, params);
}

function mapProduct(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    unitPrice: row.unit_price,
    active: normalizeBoolean(row.active),
    category: {
      id: row.category_id,
      name: row.category_name
    },
    stock: {
      quantityOnHand: row.quantity_on_hand || 0,
      version: row.stock_version
    },
    sales: {
      quantitySold: row.quantity_sold || 0,
      orderCount: row.order_count || 0,
      revenue: row.revenue || 0
    }
  };
}

function buildProductFilters(filters) {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('(p.sku LIKE :search OR p.name LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  if (filters.categoryId) {
    where.push('p.category_id = :categoryId');
    params.categoryId = filters.categoryId;
  }

  if (filters.active !== undefined) {
    where.push('p.active = :active');
    params.active = filters.active ? 1 : 0;
  }

  if (filters.lowStock) {
    where.push('COALESCE(sl.quantity_on_hand, 0) <= :lowStockThreshold');
    params.lowStockThreshold = filters.lowStockThreshold || 10;
  }

  return {
    clause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

async function list(filters, pagination) {
  const { clause, params } = buildProductFilters(filters);

  const rows = await query(
    `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.unit_price,
        p.active,
        c.id AS category_id,
        c.name AS category_name,
        sl.quantity_on_hand,
        sl.version AS stock_version,
        COALESCE(SUM(ol.quantity), 0) AS quantity_sold,
        COUNT(DISTINCT ol.order_id) AS order_count,
        COALESCE(SUM(ol.quantity * ol.unit_price), 0) AS revenue
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      LEFT JOIN order_lines ol ON ol.product_id = p.id
      ${clause}
      GROUP BY
        p.id,
        p.sku,
        p.name,
        p.unit_price,
        p.active,
        c.id,
        c.name,
        sl.quantity_on_hand,
        sl.version
      ORDER BY p.name ASC, p.id ASC
      LIMIT :limit OFFSET :offset
    `,
    {
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map(mapProduct);
}

async function getById(id, connection) {
  const rows = await execute(
    connection,
    `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.unit_price,
        p.active,
        c.id AS category_id,
        c.name AS category_name,
        sl.quantity_on_hand,
        sl.version AS stock_version,
        COALESCE(SUM(ol.quantity), 0) AS quantity_sold,
        COUNT(DISTINCT ol.order_id) AS order_count,
        COALESCE(SUM(ol.quantity * ol.unit_price), 0) AS revenue
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      LEFT JOIN order_lines ol ON ol.product_id = p.id
      WHERE p.id = :id
      GROUP BY
        p.id,
        p.sku,
        p.name,
        p.unit_price,
        p.active,
        c.id,
        c.name,
        sl.quantity_on_hand,
        sl.version
    `,
    { id }
  );

  return mapProduct(firstOrNull(rows));
}

async function findByIds(ids, connection) {
  if (ids.length === 0) {
    return [];
  }

  const placeholders = ids.map((id, index) => `:id${index}`).join(', ');
  const params = Object.fromEntries(ids.map((id, index) => [`id${index}`, id]));
  const rows = await execute(
    connection,
    `
      SELECT id, sku, name, unit_price, active
      FROM products
      WHERE id IN (${placeholders})
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    unitPrice: row.unit_price,
    active: normalizeBoolean(row.active)
  }));
}

async function create(payload) {
  return withTransaction(async (connection) => {
    const [result] = await connection.execute(
      `
        INSERT INTO products (sku, name, unit_price, category_id, active)
        VALUES (:sku, :name, :unitPrice, :categoryId, :active)
      `,
      {
        sku: payload.sku,
        name: payload.name,
        unitPrice: payload.unitPrice,
        categoryId: payload.categoryId,
        active: payload.active === undefined ? 1 : Number(payload.active)
      }
    );

    await stockRepository.upsert(result.insertId, payload.stockQuantity || 0, connection);
    return getById(result.insertId, connection);
  });
}

async function update(id, payload) {
  return withTransaction(async (connection) => {
    const fields = [];
    const params = { id };

    if (payload.sku !== undefined) {
      fields.push('sku = :sku');
      params.sku = payload.sku;
    }

    if (payload.name !== undefined) {
      fields.push('name = :name');
      params.name = payload.name;
    }

    if (payload.unitPrice !== undefined) {
      fields.push('unit_price = :unitPrice');
      params.unitPrice = payload.unitPrice;
    }

    if (payload.categoryId !== undefined) {
      fields.push('category_id = :categoryId');
      params.categoryId = payload.categoryId;
    }

    if (payload.active !== undefined) {
      fields.push('active = :active');
      params.active = Number(payload.active);
    }

    if (fields.length > 0) {
      await connection.execute(
        `
          UPDATE products
          SET ${fields.join(', ')}
          WHERE id = :id
        `,
        params
      );
    }

    if (payload.stockQuantity !== undefined) {
      await stockRepository.upsert(id, payload.stockQuantity, connection);
    }

    return getById(id, connection);
  });
}

async function remove(id) {
  const result = await query(
    `
      DELETE FROM products
      WHERE id = :id
    `,
    { id }
  );

  return result.affectedRows > 0;
}

async function listOrders(id, pagination) {
  const rows = await query(
    `
      SELECT
        o.id AS order_id,
        o.status,
        o.created_at,
        o.total_amount,
        u.id AS user_id,
        u.email,
        u.display_name,
        ol.quantity,
        ol.unit_price
      FROM order_lines ol
      JOIN customer_orders o ON o.id = ol.order_id
      JOIN app_users u ON u.id = o.user_id
      WHERE ol.product_id = :id
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
    orderId: row.order_id,
    status: row.status,
    createdAt: row.created_at,
    totalAmount: row.total_amount,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    user: {
      id: row.user_id,
      email: row.email,
      displayName: row.display_name
    }
  }));
}

module.exports = {
  list,
  getById,
  findByIds,
  create,
  update,
  remove,
  listOrders
};
