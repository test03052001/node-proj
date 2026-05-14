const createError = require('http-errors');

const userRepository = require('../repositories/userRepository');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, toPagedResponse } = require('../utils/pagination');

const listUsers = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery || req.query;
  const pagination = getPagination(filters);
  const users = await userRepository.list(filters, pagination);

  res.json(toPagedResponse(users, pagination));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userRepository.getById(req.params.id);

  if (!user) {
    throw createError(404, 'User not found');
  }

  res.json({ data: user });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userRepository.create(req.body);

  res.status(201).json({ data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userRepository.update(req.params.id, req.body);

  if (!user) {
    throw createError(404, 'User not found');
  }

  res.json({ data: user });
});

const listUserOrders = asyncHandler(async (req, res) => {
  const user = await userRepository.getById(req.params.id);

  if (!user) {
    throw createError(404, 'User not found');
  }

  const pagination = getPagination(req.validatedQuery || req.query);
  const orders = await userRepository.getOrders(req.params.id, pagination);

  res.json(toPagedResponse(orders, pagination));
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  listUserOrders
};
