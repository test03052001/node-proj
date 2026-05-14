function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(result.error);
      return;
    }

    if (source === 'query') {
      req.validatedQuery = result.data;
      next();
      return;
    }

    req[source] = result.data;
    next();
  };
}

module.exports = validate;
