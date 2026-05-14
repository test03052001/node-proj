const createError = require('http-errors');

const productRepository = require('../repositories/productRepository');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, toPagedResponse } = require('../utils/pagination');

const listProducts = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery || req.query;
  const pagination = getPagination(filters);
  const products = await productRepository.list(filters, pagination);

  res.json(toPagedResponse(products, pagination));
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productRepository.getById(req.params.id);

  if (!product) {
    throw createError(404, 'Product not found');
  }

  res.json({ data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productRepository.create(req.body);

  res.status(201).json({ data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productRepository.update(req.params.id, req.body);

  if (!product) {
    throw createError(404, 'Product not found');
  }

  res.json({ data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const removed = await productRepository.remove(req.params.id);

  if (!removed) {
    throw createError(404, 'Product not found');
  }

  res.status(204).send();
});

const listProductOrders = asyncHandler(async (req, res) => {
  const product = await productRepository.getById(req.params.id);

  if (!product) {
    throw createError(404, 'Product not found');
  }

  const pagination = getPagination(req.validatedQuery || req.query);
  const orders = await productRepository.listOrders(req.params.id, pagination);

  res.json(toPagedResponse(orders, pagination));
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listProductOrders
};
