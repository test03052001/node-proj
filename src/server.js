const app = require('./app');
const config = require('./config/env');
const { pool } = require('./config/database');

const server = app.listen(config.port, () => {
  console.log(`Enterprise platform API listening on port ${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
