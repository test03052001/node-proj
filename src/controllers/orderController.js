const createError = require('http-errors');

const orderRepository = require('../repositories/orderRepository');
const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, toPagedResponse } = require('../utils/pagination');

const listOrders = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery || req.query;
  const pagination = getPagination(filters);
  const orders = await orderRepository.list(filters, pagination);

  res.json(toPagedResponse(orders, pagination));
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderRepository.getById(req.params.id);

  if (!order) {
    throw createError(404, 'Order not found');
  }

  res.json({ data: order });
});

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body);

  res.status(201).json({ data: order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderRepository.updateStatus(req.params.id, req.body.status);

  if (!order) {
    throw createError(404, 'Order not found');
  }

  res.json({ data: order });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const removed = await orderRepository.remove(req.params.id);

  if (!removed) {
    throw createError(404, 'Order not found');
  }

  res.status(204).send();
});

module.exports = {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
