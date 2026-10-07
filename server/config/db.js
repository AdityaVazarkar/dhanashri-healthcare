const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://aditya@localhost:5432/blood_lab_db';

const isRemoteDb = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost') && 
  !process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' || isRemoteDb ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  // Connected to PostgreSQL database
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
