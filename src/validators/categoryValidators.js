const { z } = require('zod');
const { paginationQuerySchema } = require('./commonValidators');

const categoryListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional()
});

const categoryPayloadSchema = z.object({
  name: z.string().trim().min(2).max(255)
});

module.exports = {
  categoryListQuerySchema,
  categoryPayloadSchema
};
