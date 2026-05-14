const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const config = require('../config/env');

async function migrate() {
  const schemaPath = path.resolve(__dirname, '../../mysql-schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    multipleStatements: true
  });

  try {
    await connection.query(schema);
    console.log(`Migrated database ${config.database.name}`);
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
