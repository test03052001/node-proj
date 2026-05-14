const { z } = require('zod');

const booleanQuery = z.preprocess((value) => {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (['true', '1', 'yes'].includes(String(value).toLowerCase())) {
    return true;
  }

  if (['false', '0', 'no'].includes(String(value).toLowerCase())) {
    return false;
  }

  return value;
}, z.boolean().optional());

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

const dateRangeQuerySchema = paginationQuerySchema.extend({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

module.exports = {
  booleanQuery,
  idParamSchema,
  paginationQuerySchema,
  dateRangeQuerySchema
};
