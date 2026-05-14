const { z } = require('zod');
const { dateRangeQuerySchema } = require('./commonValidators');

const orderStatusSchema = z.enum(['PENDING', 'PAID', 'FULFILLED', 'CANCELLED']);

const orderListQuerySchema = dateRangeQuerySchema.extend({
  status: orderStatusSchema.optional(),
  userId: z.coerce.number().int().positive().optional()
});

const createOrderSchema = z.object({
  userId: z.coerce.number().int().positive(),
  status: orderStatusSchema.optional(),
  lines: z.array(
    z.object({
      productId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive()
    })
  ).min(1)
});

const updateOrderStatusSchema = z.object({
  status: orderStatusSchema
});

module.exports = {
  orderListQuerySchema,
  createOrderSchema,
  updateOrderStatusSchema
};
