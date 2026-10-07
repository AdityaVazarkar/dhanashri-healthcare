const { pool } = require('../config/db');

/**
 * Get all health packages
 */
async function getPackages(req, res) {
  try {
    const isAdmin = req.isAdmin;
    const { status, featured } = req.query;

    let queryText = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name,
              'test_code', t.test_code,
              'sample_type', t.sample_type,
              'report_time', t.report_time,
              'fasting_required', t.fasting_required,
              'price', t.price
            )
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS included_tests
      FROM packages p
      LEFT JOIN package_tests pt ON pt.package_id = p.id
      LEFT JOIN tests t ON t.id = pt.test_id
      WHERE 1=1
    `;

    const values = [];
    let valIndex = 1;

    if (!isAdmin) {
      queryText += ` AND p.status = 'active'`;
    } else if (status && status !== 'all') {
      queryText += ` AND p.status = $${valIndex++}`;
      values.push(status);
    }

    if (featured === 'true') {
      queryText += ` AND p.is_featured = true`;
    }

    queryText += ` GROUP BY p.id ORDER BY p.is_featured DESC, p.discount_price ASC;`;

    const result = await pool.query(queryText, values);
    return res.json({ success: true, count: result.rows.length, packages: result.rows });
  } catch (error) {
    console.error('Get packages error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving packages.' });
  }
}

/**
 * Get Package by ID
 */
async function getPackageById(req, res) {
  try {
    const { id } = req.params;

    const queryText = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name,
              'test_code', t.test_code,
              'description', t.description,
              'sample_type', t.sample_type,
              'report_time', t.report_time,
              'fasting_required', t.fasting_required,
              'price', t.price
            )
          ) FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS included_tests
      FROM packages p
      LEFT JOIN package_tests pt ON pt.package_id = p.id
      LEFT JOIN tests t ON t.id = pt.test_id
      WHERE p.id = $1
      GROUP BY p.id;
    `;

    const result = await pool.query(queryText, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    return res.json({ success: true, package: result.rows[0] });
  } catch (error) {
    console.error('Get package by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving package.' });
  }
}

/**
 * Create Package (Admin)
 */
async function createPackage(req, res) {
  const client = await pool.connect();
  try {
    const {
      name,
      description,
      original_price,
      discount_price,
      benefits,
      preparation_instructions,
      status,
      is_featured,
      test_ids
    } = req.body;

    if (!name || !original_price || !discount_price) {
      return res.status(400).json({ success: false, message: 'Package name, original price, and discount price are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    await client.query('BEGIN');

    const insertPkg = await client.query(`
      INSERT INTO packages (
        name, slug, description, original_price, discount_price,
        benefits, preparation_instructions, status, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      name.trim(),
      slug,
      description || '',
      parseFloat(original_price),
      parseFloat(discount_price),
      JSON.stringify(benefits || []),
      preparation_instructions || '',
      status || 'active',
      Boolean(is_featured)
    ]);

    const createdPkg = insertPkg.rows[0];

    if (Array.isArray(test_ids) && test_ids.length > 0) {
      for (const tId of test_ids) {
        await client.query(`
          INSERT INTO package_tests (package_id, test_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `, [createdPkg.id, tId]);
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Package created successfully!',
      package: createdPkg
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create package error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating package.' });
  } finally {
    client.release();
  }
}

/**
 * Update Package (Admin)
 */
async function updatePackage(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      description,
      original_price,
      discount_price,
      benefits,
      preparation_instructions,
      status,
      is_featured,
      test_ids
    } = req.body;

    const existing = await client.query('SELECT id, name, slug FROM packages WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    let slug = existing.rows[0].slug;
    if (name && name.trim() !== existing.rows[0].name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE packages
      SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        original_price = COALESCE($4, original_price),
        discount_price = COALESCE($5, discount_price),
        benefits = COALESCE($6, benefits),
        preparation_instructions = COALESCE($7, preparation_instructions),
        status = COALESCE($8, status),
        is_featured = COALESCE($9, is_featured),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *;
    `, [
      name ? name.trim() : null,
      slug,
      description !== undefined ? description : null,
      original_price !== undefined ? parseFloat(original_price) : null,
      discount_price !== undefined ? parseFloat(discount_price) : null,
      benefits ? JSON.stringify(benefits) : null,
      preparation_instructions !== undefined ? preparation_instructions : null,
      status || null,
      is_featured !== undefined ? Boolean(is_featured) : null,
      id
    ]);

    if (Array.isArray(test_ids)) {
      await client.query('DELETE FROM package_tests WHERE package_id = $1', [id]);
      for (const tId of test_ids) {
        await client.query(`
          INSERT INTO package_tests (package_id, test_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `, [id, tId]);
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Package updated successfully!',
      package: updateRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update package error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating package.' });
  } finally {
    client.release();
  }
}

/**
 * Delete Package (Admin)
 */
async function deletePackage(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }
    return res.json({ success: true, message: 'Package deleted successfully.' });
  } catch (error) {
    console.error('Delete package error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting package.' });
  }
}

/**
 * Toggle Package Status (Admin)
 */
async function togglePackageStatus(req, res) {
  try {
    const { id } = req.params;
    const pkg = await pool.query('SELECT status FROM packages WHERE id = $1', [id]);
    if (pkg.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found.' });
    }

    const nextStatus = pkg.rows[0].status === 'active' ? 'inactive' : 'active';
    await pool.query('UPDATE packages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nextStatus, id]);
    return res.json({ success: true, message: `Package status set to ${nextStatus}`, status: nextStatus });
  } catch (error) {
    console.error('Toggle package status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
}

module.exports = {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus
};
