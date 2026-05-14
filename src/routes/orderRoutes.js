const express = require('express');

const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidators');
const {
  createOrderSchema,
  orderListQuerySchema,
  updateOrderStatusSchema
} = require('../validators/orderValidators');

const router = express.Router();

router.get('/', validate(orderListQuerySchema, 'query'), orderController.listOrders);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/:id', validate(idParamSchema, 'params'), orderController.getOrder);
router.patch('/:id/status', validate(idParamSchema, 'params'), validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.delete('/:id', validate(idParamSchema, 'params'), orderController.deleteOrder);

module.exports = router;
