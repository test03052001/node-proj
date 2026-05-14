const config = require('../config/env');

function zodIssuesToDetails(error) {
  if (!error.issues) {
    return undefined;
  }

  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));
}

function mysqlStatus(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    return {
      status: 409,
      message: 'Duplicate record'
    };
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return {
      status: 409,
      message: 'Record is still referenced by another table'
    };
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      status: 400,
      message: 'Referenced record does not exist'
    };
  }

  return null;
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const mysqlError = mysqlStatus(error);
  const status = mysqlError?.status || error.status || error.statusCode || (error.name === 'ZodError' ? 400 : 500);
  const payload = {
    error: {
      message: status >= 500 ? 'Internal server error' : mysqlError?.message || error.message,
      status,
      details: zodIssuesToDetails(error)
    }
  };

  if (config.env !== 'production' && status >= 500) {
    payload.error.stack = error.stack;
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
