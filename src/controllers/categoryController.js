const createError = require('http-errors');

const categoryRepository = require('../repositories/categoryRepository');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, toPagedResponse } = require('../utils/pagination');

const listCategories = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery || req.query;
  const pagination = getPagination(filters);
  const categories = await categoryRepository.list(filters, pagination);

  res.json(toPagedResponse(categories, pagination));
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await categoryRepository.getById(req.params.id);

  if (!category) {
    throw createError(404, 'Category not found');
  }

  res.json({ data: category });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryRepository.create(req.body);

  res.status(201).json({ data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryRepository.update(req.params.id, req.body);

  if (!category) {
    throw createError(404, 'Category not found');
  }

  res.json({ data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const removed = await categoryRepository.remove(req.params.id);

  if (!removed) {
    throw createError(404, 'Category not found');
  }

  res.status(204).send();
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
