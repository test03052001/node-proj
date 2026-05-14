const { query } = require('../config/database');

async function salesByCategory(filters) {
  const params = {};
  const where = [];

  if (filters.fromDate) {
    where.push('o.created_at >= :fromDate');
    params.fromDate = filters.fromDate;
  }

  if (filters.toDate) {
    where.push('o.created_at <= :toDate');
    params.toDate = filters.toDate;
  }

  const rows = await query(
    `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(ol.quantity), 0) AS units_sold,
        COALESCE(SUM(ol.quantity * ol.unit_price), 0) AS revenue
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN order_lines ol ON ol.product_id = p.id
      LEFT JOIN customer_orders o ON o.id = ol.order_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC, c.name ASC
    `,
    params
  );

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    orderCount: row.order_count,
    unitsSold: row.units_sold,
    revenue: row.revenue
  }));
}

async function topProducts(filters, pagination) {
  const params = {};
  const where = [];

  if (filters.fromDate) {
    where.push('o.created_at >= :fromDate');
    params.fromDate = filters.fromDate;
  }

  if (filters.toDate) {
    where.push('o.created_at <= :toDate');
    params.toDate = filters.toDate;
  }

  const rows = await query(
    `
      SELECT
        p.id,
        p.sku,
        p.name,
        c.id AS category_id,
        c.name AS category_name,
        COALESCE(SUM(ol.quantity), 0) AS units_sold,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(ol.quantity * ol.unit_price), 0) AS revenue,
        COALESCE(sl.quantity_on_hand, 0) AS quantity_on_hand
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      LEFT JOIN order_lines ol ON ol.product_id = p.id
      LEFT JOIN customer_orders o ON o.id = ol.order_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY p.id, p.sku, p.name, c.id, c.name, sl.quantity_on_hand
      ORDER BY revenue DESC, units_sold DESC, p.name ASC
      LIMIT :limit OFFSET :offset
    `,
    {
      ...params,
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: {
      id: row.category_id,
      name: row.category_name
    },
    unitsSold: row.units_sold,
    orderCount: row.order_count,
    revenue: row.revenue,
    quantityOnHand: row.quantity_on_hand
  }));
}

async function customerLeaderboard(pagination) {
  const rows = await query(
    `
      SELECT
        u.id,
        u.email,
        u.display_name,
        COALESCE(order_summary.order_count, 0) AS order_count,
        COALESCE(line_summary.units_purchased, 0) AS units_purchased,
        COALESCE(order_summary.total_spend, 0) AS total_spend,
        order_summary.last_order_at
      FROM app_users u
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS order_count,
          COALESCE(SUM(total_amount), 0) AS total_spend,
          MAX(created_at) AS last_order_at
        FROM customer_orders
        GROUP BY user_id
      ) order_summary ON order_summary.user_id = u.id
      LEFT JOIN (
        SELECT
          o.user_id,
          COALESCE(SUM(ol.quantity), 0) AS units_purchased
        FROM customer_orders o
        JOIN order_lines ol ON ol.order_id = o.id
        GROUP BY o.user_id
      ) line_summary ON line_summary.user_id = u.id
      ORDER BY total_spend DESC, order_count DESC, u.display_name ASC
      LIMIT :limit OFFSET :offset
    `,
    {
      limit: pagination.limit,
      offset: pagination.offset
    }
  );

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    orderCount: row.order_count,
    unitsPurchased: row.units_purchased,
    totalSpend: row.total_spend,
    lastOrderAt: row.last_order_at
  }));
}

async function dashboard() {
  const rows = await query(
    `
      SELECT
        (SELECT COUNT(*) FROM app_users WHERE active = 1) AS active_users,
        (SELECT COUNT(*) FROM products WHERE active = 1) AS active_products,
        (SELECT COUNT(*) FROM customer_orders) AS total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM customer_orders) AS total_revenue,
        (SELECT COALESCE(SUM(quantity_on_hand), 0) FROM stock_levels) AS stock_on_hand
    `
  );

  return {
    activeUsers: rows[0].active_users,
    activeProducts: rows[0].active_products,
    totalOrders: rows[0].total_orders,
    totalRevenue: rows[0].total_revenue,
    stockOnHand: rows[0].stock_on_hand
  };
}

module.exports = {
  salesByCategory,
  topProducts,
  customerLeaderboard,
  dashboard
};
