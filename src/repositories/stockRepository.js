const { query } = require('../config/database');
const { firstOrNull } = require('../utils/rows');

async function execute(connection, sql, params) {
  if (connection) {
    const [rows] = await connection.execute(sql, params);
    return rows;
  }

  return query(sql, params);
}

function mapStock(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    productId: row.product_id,
    quantityOnHand: row.quantity_on_hand,
    version: row.version
  };
}

async function getByProductId(productId, connection) {
  const rows = await execute(
    connection,
    `
      SELECT id, product_id, quantity_on_hand, version
      FROM stock_levels
      WHERE product_id = :productId
    `,
    { productId }
  );

  return mapStock(firstOrNull(rows));
}

async function upsert(productId, quantityOnHand, connection) {
  await execute(
    connection,
    `
      INSERT INTO stock_levels (product_id, quantity_on_hand, version)
      VALUES (:productId, :quantityOnHand, 1)
      ON DUPLICATE KEY UPDATE
        quantity_on_hand = VALUES(quantity_on_hand),
        version = COALESCE(version, 0) + 1
    `,
    {
      productId,
      quantityOnHand
    }
  );

  return getByProductId(productId, connection);
}

async function decrease(productId, quantity, connection) {
  const result = await execute(
    connection,
    `
      UPDATE stock_levels
      SET
        quantity_on_hand = quantity_on_hand - :quantity,
        version = COALESCE(version, 0) + 1
      WHERE product_id = :productId
        AND quantity_on_hand >= :quantity
    `,
    {
      productId,
      quantity
    }
  );

  return result.affectedRows > 0;
}

async function increase(productId, quantity, connection) {
  await execute(
    connection,
    `
      UPDATE stock_levels
      SET
        quantity_on_hand = quantity_on_hand + :quantity,
        version = COALESCE(version, 0) + 1
      WHERE product_id = :productId
    `,
    {
      productId,
      quantity
    }
  );

  return getByProductId(productId, connection);
}

module.exports = {
  getByProductId,
  upsert,
  decrease,
  increase
};
