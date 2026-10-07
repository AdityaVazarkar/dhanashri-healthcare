const app = require('./app');
const { pool } = require('./config/db');

const { autoInitDatabase } = require('./db/autoInit');

const PORT = process.env.PORT || 5000;

// Test DB connection and auto-initialize tables if on a fresh database
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('Failed to connect to PostgreSQL database:', err.message);
  } else {
    console.log('Connected to PostgreSQL database at:', res.rows[0].now);
    await autoInitDatabase();
  }
});

const server = app.listen(PORT, () => {
  console.log(`Dhanashri Health Care Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });
});
