const reportRepository = require('../repositories/reportRepository');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, toPagedResponse } = require('../utils/pagination');

const dashboard = asyncHandler(async (req, res) => {
  const data = await reportRepository.dashboard();

  res.json({ data });
});

const salesByCategory = asyncHandler(async (req, res) => {
  const data = await reportRepository.salesByCategory(req.validatedQuery || req.query);

  res.json({ data });
});

const topProducts = asyncHandler(async (req, res) => {
  const filters = req.validatedQuery || req.query;
  const pagination = getPagination(filters);
  const products = await reportRepository.topProducts(filters, pagination);

  res.json(toPagedResponse(products, pagination));
});

const customerLeaderboard = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.validatedQuery || req.query);
  const customers = await reportRepository.customerLeaderboard(pagination);

  res.json(toPagedResponse(customers, pagination));
});

module.exports = {
  dashboard,
  salesByCategory,
  topProducts,
  customerLeaderboard
};
