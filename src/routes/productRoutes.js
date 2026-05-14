const express = require('express');

const productController = require('../controllers/productController');
const validate = require('../middleware/validate');
const { idParamSchema, paginationQuerySchema } = require('../validators/commonValidators');
const {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema
} = require('../validators/productValidators');

const router = express.Router();

router.get('/', validate(productListQuerySchema, 'query'), productController.listProducts);
router.post('/', validate(createProductSchema), productController.createProduct);
router.get('/:id/orders', validate(idParamSchema, 'params'), validate(paginationQuerySchema, 'query'), productController.listProductOrders);
router.get('/:id', validate(idParamSchema, 'params'), productController.getProduct);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', validate(idParamSchema, 'params'), productController.deleteProduct);

module.exports = router;
