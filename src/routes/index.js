const express = require('express');

const categoryRoutes = require('./categoryRoutes');
const healthController = require('../controllers/healthController');
const orderRoutes = require('./orderRoutes');
const productRoutes = require('./productRoutes');
const reportRoutes = require('./reportRoutes');
const userRoutes = require('./userRoutes');
const vulnerabilityRoutes = require('./vulnerabilityRoutes');

const router = express.Router();

router.get('/health', healthController.health);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/reports', reportRoutes);
router.use('/security-demo', vulnerabilityRoutes);

module.exports = router;
