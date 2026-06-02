const dotenv = require('dotenv');

dotenv.config();

function numberFromEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (Number.isNaN(value)) {
    throw new Error(`${name} must be a valid number`);
  }

  return value;
}

function listFromEnv(name, defaultValue = []) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return defaultValue;
  }

  return rawValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: numberFromEnv('PORT', 3000),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: numberFromEnv('DB_PORT', 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'enterprise_platform',
    connectionLimit: numberFromEnv('DB_CONNECTION_LIMIT', 10)
  },
  security: {
    allowedOrigins: listFromEnv('ALLOWED_ORIGINS', ['http://localhost:3000'])
  }
};
