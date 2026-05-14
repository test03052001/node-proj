const express = require('express');

const reportController = require('../controllers/reportController');
const validate = require('../middleware/validate');
const { dateRangeQuerySchema, paginationQuerySchema } = require('../validators/commonValidators');

const router = express.Router();

router.get('/dashboard', reportController.dashboard);
router.get('/sales-by-category', validate(dateRangeQuerySchema, 'query'), reportController.salesByCategory);
router.get('/top-products', validate(dateRangeQuerySchema, 'query'), reportController.topProducts);
router.get('/customer-leaderboard', validate(paginationQuerySchema, 'query'), reportController.customerLeaderboard);

module.exports = router;
