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

    // Ensure partners table and booking partner columns exist (Idempotent Migration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        city VARCHAR(100) DEFAULT 'Bengaluru',
        area VARCHAR(150),
        commission_rate NUMERIC(5, 2) DEFAULT 15.00,
        fixed_fee NUMERIC(10, 2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS partner_assigned_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sample_collected_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS partner_notes TEXT;
      CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id);
    `);

    // Ensure default demo partner exists
    const partnerCheck = await pool.query("SELECT id FROM partners WHERE email = 'partner@dhanashrilabs.com'");
    if (partnerCheck.rows.length === 0) {
      const hashedPartnerPass = await bcrypt.hash('partner123', 10);
      await pool.query(`
        INSERT INTO partners (name, email, mobile, password_hash, city, area, commission_rate, fixed_fee, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active');
      `, [
        'Ramesh Kumar (Phlebotomist)',
        'partner@dhanashrilabs.com',
        '+91 98765 43210',
        hashedPartnerPass,
        'Bengaluru',
        'Indiranagar & Koramangala',
        15.00,
        50.00
      ]);
      console.log('✅ Default demo partner initialized (partner@dhanashrilabs.com / partner123)');
    }

    // Ensure admin accounts: admin@lab.com and admin@dhanashrilabs.com exist with Admin@123
    const adminPassHash = await bcrypt.hash('Admin@123', 10);
    await pool.query(`
      INSERT INTO admins (name, email, password_hash, role, status)
      VALUES ('Dhanashri Lab Admin', 'admin@dhanashrilabs.com', $1, 'superadmin', 'active')
      ON CONFLICT (email) DO UPDATE
      SET password_hash = $1, status = 'active';
    `, [adminPassHash]);

    await pool.query(`
      INSERT INTO admins (name, email, password_hash, role, status)
      VALUES ('Dr. Mehra Lab Admin', 'admin@lab.com', $1, 'superadmin', 'active')
      ON CONFLICT (email) DO UPDATE
      SET password_hash = $1, status = 'active';
    `, [adminPassHash]);
    console.log('✅ Admin accounts verified (admin@lab.com & admin@dhanashrilabs.com)');
  } catch (err) {
    console.error('⚠️ Database auto-initialization check notice:', err.message);
  }
}

module.exports = { autoInitDatabase };
