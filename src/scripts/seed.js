const { pool, query } = require('../config/database');
const orderService = require('../services/orderService');
const stockRepository = require('../repositories/stockRepository');

async function first(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function getOrCreateCategory(name) {
  const existing = await first('SELECT id FROM categories WHERE name = :name', { name });

  if (existing) {
    return existing.id;
  }

  const result = await query('INSERT INTO categories (name) VALUES (:name)', { name });
  return result.insertId;
}

async function getOrCreateUser(email, displayName) {
  const existing = await first('SELECT id FROM app_users WHERE email = :email', { email });

  if (existing) {
    return existing.id;
  }

  const result = await query(
    `
      INSERT INTO app_users (email, display_name, created_at, active)
      VALUES (:email, :displayName, NOW(6), 1)
    `,
    {
      email,
      displayName
    }
  );

  return result.insertId;
}

async function getOrCreateProduct(payload) {
  const existing = await first('SELECT id FROM products WHERE sku = :sku LIMIT 1', { sku: payload.sku });

  if (existing) {
    await stockRepository.upsert(existing.id, payload.stockQuantity);
    return existing.id;
  }

  const result = await query(
    `
      INSERT INTO products (sku, name, unit_price, category_id, active)
      VALUES (:sku, :name, :unitPrice, :categoryId, 1)
    `,
    payload
  );

  await stockRepository.upsert(result.insertId, payload.stockQuantity);
  return result.insertId;
}

async function seed() {
  const electronicsId = await getOrCreateCategory('Electronics');
  const groceryId = await getOrCreateCategory('Grocery');
  const homeId = await getOrCreateCategory('Home');

  const userId = await getOrCreateUser('priya@example.com', 'Priya Sharma');
  const secondUserId = await getOrCreateUser('rahul@example.com', 'Rahul Verma');

  const keyboardId = await getOrCreateProduct({
    sku: 'ELEC-KEYBOARD-001',
    name: 'Mechanical Keyboard',
    unitPrice: 4999,
    categoryId: electronicsId,
    stockQuantity: 40
  });
  const coffeeId = await getOrCreateProduct({
    sku: 'GROC-COFFEE-001',
    name: 'Premium Coffee Beans',
    unitPrice: 899,
    categoryId: groceryId,
    stockQuantity: 80
  });
  const lampId = await getOrCreateProduct({
    sku: 'HOME-LAMP-001',
    name: 'Desk Lamp',
    unitPrice: 1499,
    categoryId: homeId,
    stockQuantity: 30
  });

  const orderCount = await first('SELECT COUNT(*) AS count FROM customer_orders', {});

  if (orderCount.count === 0) {
    await orderService.createOrder({
      userId,
      status: 'PAID',
      lines: [
        { productId: keyboardId, quantity: 1 },
        { productId: coffeeId, quantity: 2 }
      ]
    });
    await orderService.createOrder({
      userId: secondUserId,
      status: 'FULFILLED',
      lines: [
        { productId: lampId, quantity: 1 },
        { productId: coffeeId, quantity: 1 }
      ]
    });
  }

  console.log('Seed data ready');
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
