const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function autoInitDatabase() {
  try {
    // Check if the core tables already exist
    const checkRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admins'
      );
    `);

    const tablesExist = checkRes.rows[0]?.exists;

    if (!tablesExist) {
      console.log('🔄 Fresh database detected! Initializing schema & seeding initial data...');
      
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      await pool.query(schemaSql);
      console.log('✅ Database schema tables created successfully.');

      // Run initial seeding
      const seedScriptPath = path.join(__dirname, 'seed.js');
      if (fs.existsSync(seedScriptPath)) {
        // Run seed directly via sub-process or module
        const seedModule = require('./seed');
        if (typeof seedModule === 'function') {
          await seedModule();
        }
      }
      console.log('✅ Database auto-initialization complete!');
    } else {
      console.log('✅ Database connection and schema verified.');
    }
  } catch (err) {
    console.error('⚠️ Database auto-initialization check notice:', err.message);
  }
}

module.exports = { autoInitDatabase };
