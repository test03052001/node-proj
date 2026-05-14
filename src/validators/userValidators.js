const { z } = require('zod');
const { booleanQuery, paginationQuerySchema } = require('./commonValidators');

const userListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).optional(),
  active: booleanQuery
});

const createUserSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(2).max(255),
  active: z.boolean().optional()
});

const updateUserSchema = createUserSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'At least one user field is required'
);

module.exports = {
  userListQuerySchema,
  createUserSchema,
  updateUserSchema
};
