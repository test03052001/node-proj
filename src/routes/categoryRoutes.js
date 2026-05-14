const express = require('express');

const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { idParamSchema } = require('../validators/commonValidators');
const {
  categoryListQuerySchema,
  categoryPayloadSchema
} = require('../validators/categoryValidators');

const router = express.Router();

router.get('/', validate(categoryListQuerySchema, 'query'), categoryController.listCategories);
router.post('/', validate(categoryPayloadSchema), categoryController.createCategory);
router.get('/:id', validate(idParamSchema, 'params'), categoryController.getCategory);
router.put('/:id', validate(idParamSchema, 'params'), validate(categoryPayloadSchema), categoryController.updateCategory);
router.delete('/:id', validate(idParamSchema, 'params'), categoryController.deleteCategory);

module.exports = router;
