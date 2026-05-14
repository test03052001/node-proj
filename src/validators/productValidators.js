const { z } = require('zod');
const { booleanQuery, paginationQuerySchema } = require('./commonValidators');

const productListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  active: booleanQuery,
  lowStock: booleanQuery,
  lowStockThreshold: z.coerce.number().int().nonnegative().optional()
});

const createProductSchema = z.object({
  sku: z.string().trim().min(2).max(255),
  name: z.string().trim().min(2).max(255),
  unitPrice: z.coerce.number().positive(),
  categoryId: z.coerce.number().int().positive(),
  active: z.boolean().optional(),
  stockQuantity: z.coerce.number().int().nonnegative().optional()
});

const updateProductSchema = createProductSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'At least one product field is required'
);

module.exports = {
  productListQuerySchema,
  createProductSchema,
  updateProductSchema
};
