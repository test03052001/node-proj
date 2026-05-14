const express = require('express');

const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const { idParamSchema, paginationQuerySchema } = require('../validators/commonValidators');
const {
  createUserSchema,
  updateUserSchema,
  userListQuerySchema
} = require('../validators/userValidators');

const router = express.Router();

router.get('/', validate(userListQuerySchema, 'query'), userController.listUsers);
router.post('/', validate(createUserSchema), userController.createUser);
router.get('/:id/orders', validate(idParamSchema, 'params'), validate(paginationQuerySchema, 'query'), userController.listUserOrders);
router.get('/:id', validate(idParamSchema, 'params'), userController.getUser);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), userController.updateUser);

module.exports = router;
