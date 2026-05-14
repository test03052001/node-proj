const createError = require('http-errors');

const { withTransaction } = require('../config/database');
const orderRepository = require('../repositories/orderRepository');
const productRepository = require('../repositories/productRepository');
const stockRepository = require('../repositories/stockRepository');
const userRepository = require('../repositories/userRepository');

function indexProducts(products) {
  return new Map(products.map((product) => [product.id, product]));
}

async function createOrder(payload) {
  return withTransaction(async (connection) => {
    const user = await userRepository.getById(payload.userId, connection);

    if (!user || !user.active) {
      throw createError(404, 'Active user not found for this order');
    }

    const productIds = [...new Set(payload.lines.map((line) => line.productId))];
    const products = await productRepository.findByIds(productIds, connection);
    const productsById = indexProducts(products);

    const orderId = await orderRepository.createHeader(payload, connection);
    let totalAmount = 0;

    for (const line of payload.lines) {
      const product = productsById.get(line.productId);

      if (!product || !product.active) {
        throw createError(400, `Product ${line.productId} is not active or does not exist`);
      }

      const stockUpdated = await stockRepository.decrease(line.productId, line.quantity, connection);

      if (!stockUpdated) {
        throw createError(409, `Insufficient stock for product ${line.productId}`);
      }

      const lineTotal = product.unitPrice * line.quantity;
      totalAmount += lineTotal;

      await orderRepository.createLine(
        {
          orderId,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: product.unitPrice
        },
        connection
      );
    }

    await orderRepository.updateTotal(orderId, totalAmount, connection);
    return orderRepository.getById(orderId, connection);
  });
}

module.exports = {
  createOrder
};
