const { pool } = require('../config/db');

/**
 * Get tests with search, category filter, price filter, sorting
 */
async function getTests(req, res) {
  try {
    const {
      q,
      category,
      min_price,
      max_price,
      popular,
      sort,
      status
    } = req.query;

    const isAdmin = req.isAdmin;

    let queryText = `
      SELECT 
        t.id, t.name, t.test_code, t.category_id, t.description,
        t.price, t.discount_price, t.sample_type, t.report_time,
        t.fasting_required, t.preparation_instructions, t.status,
        t.is_popular, t.created_at,
        c.name AS category_name, c.slug AS category_slug,
        COUNT(tp.id)::int AS parameter_count
      FROM tests t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN test_parameters tp ON tp.test_id = t.id
      WHERE 1=1
    `;

    const values = [];
    let valIndex = 1;

    // Filter by active status for non-admin
    if (!isAdmin) {
      queryText += ` AND t.status = 'active'`;
    } else if (status && status !== 'all') {
      queryText += ` AND t.status = $${valIndex++}`;
      values.push(status);
    }

    // Search query
    if (q && q.trim()) {
      const term = `%${q.trim().toLowerCase()}%`;
      queryText += ` AND (LOWER(t.name) LIKE $${valIndex} OR LOWER(t.test_code) LIKE $${valIndex} OR LOWER(t.description) LIKE $${valIndex})`;
      values.push(term);
      valIndex++;
    }

    // Category filter
    if (category) {
      if (!isNaN(category)) {
        queryText += ` AND t.category_id = $${valIndex++}`;
        values.push(parseInt(category, 10));
      } else {
        queryText += ` AND (c.slug = $${valIndex} OR LOWER(c.name) = LOWER($${valIndex}))`;
        values.push(category);
        valIndex++;
      }
    }

    // Price range
    if (min_price && !isNaN(min_price)) {
      queryText += ` AND COALESCE(t.discount_price, t.price) >= $${valIndex++}`;
      values.push(parseFloat(min_price));
    }
    if (max_price && !isNaN(max_price)) {
      queryText += ` AND COALESCE(t.discount_price, t.price) <= $${valIndex++}`;
      values.push(parseFloat(max_price));
    }

    // Popular flag
    if (popular === 'true' || popular === '1') {
      queryText += ` AND t.is_popular = true`;
    }

    queryText += ` GROUP BY t.id, c.name, c.slug`;

    // Sorting
    if (sort === 'price_asc') {
      queryText += ` ORDER BY COALESCE(t.discount_price, t.price) ASC`;
    } else if (sort === 'price_desc') {
      queryText += ` ORDER BY COALESCE(t.discount_price, t.price) DESC`;
    } else if (sort === 'name_asc') {
      queryText += ` ORDER BY t.name ASC`;
    } else if (sort === 'name_desc') {
      queryText += ` ORDER BY t.name DESC`;
    } else {
      queryText += ` ORDER BY t.is_popular DESC, t.id ASC`;
    }

    const result = await pool.query(queryText, values);
    return res.json({ success: true, count: result.rows.length, tests: result.rows });
  } catch (error) {
    console.error('Get tests error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving tests.' });
  }
}

/**
 * Get Test Details by ID
 */
async function getTestById(req, res) {
  try {
    const { id } = req.params;

    const testRes = await pool.query(`
      SELECT 
        t.*,
        c.name AS category_name, c.slug AS category_slug
      FROM tests t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.id = $1;
    `, [id]);

    if (testRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    const test = testRes.rows[0];

    // Fetch parameters
    const paramRes = await pool.query(`
      SELECT id, name, unit, reference_range, order_index
      FROM test_parameters
      WHERE test_id = $1
      ORDER BY order_index ASC, id ASC;
    `, [id]);
    test.parameters = paramRes.rows;

    // Fetch related tests in same category
    if (test.category_id) {
      const relatedRes = await pool.query(`
        SELECT id, name, test_code, price, discount_price, sample_type, report_time
        FROM tests
        WHERE category_id = $1 AND id != $2 AND status = 'active'
        LIMIT 4;
      `, [test.category_id, id]);
      test.related_tests = relatedRes.rows;
    } else {
      test.related_tests = [];
    }

    return res.json({ success: true, test });
  } catch (error) {
    console.error('Get test by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving test details.' });
  }
}

/**
 * Create Test (Admin)
 */
async function createTest(req, res) {
  const client = await pool.connect();
  try {
    const {
      name,
      test_code,
      category_id,
      description,
      price,
      discount_price,
      sample_type,
      report_time,
      fasting_required,
      preparation_instructions,
      status,
      is_popular,
      parameters
    } = req.body;

    if (!name || !test_code || !price) {
      return res.status(400).json({ success: false, message: 'Test name, test code, and price are required.' });
    }

    // Check code unique
    const checkCode = await client.query('SELECT id FROM tests WHERE LOWER(test_code) = LOWER($1)', [test_code.trim()]);
    if (checkCode.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A test with this test code already exists.' });
    }

    await client.query('BEGIN');

    const insertTest = await client.query(`
      INSERT INTO tests (
        name, test_code, category_id, description, price, discount_price,
        sample_type, report_time, fasting_required, preparation_instructions,
        status, is_popular
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      name.trim(),
      test_code.trim().toUpperCase(),
      category_id || null,
      description || '',
      parseFloat(price),
      discount_price ? parseFloat(discount_price) : null,
      sample_type || 'Blood',
      report_time || 'Same Day',
      Boolean(fasting_required),
      preparation_instructions || '',
      status || 'active',
      Boolean(is_popular)
    ]);

    const createdTest = insertTest.rows[0];

    // Insert parameters if provided
    if (Array.isArray(parameters) && parameters.length > 0) {
      let orderIndex = 1;
      for (const p of parameters) {
        if (p.name && p.name.trim()) {
          await client.query(`
            INSERT INTO test_parameters (test_id, name, unit, reference_range, order_index)
            VALUES ($1, $2, $3, $4, $5);
          `, [createdTest.id, p.name.trim(), p.unit || null, p.reference_range || null, orderIndex++]);
        }
      }
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Test created successfully!',
      test: createdTest
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create test error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating test.' });
  } finally {
    client.release();
  }
}

/**
 * Update Test (Admin)
 */
async function updateTest(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      test_code,
      category_id,
      description,
      price,
      discount_price,
      sample_type,
      report_time,
      fasting_required,
      preparation_instructions,
      status,
      is_popular,
      parameters
    } = req.body;

    const existing = await client.query('SELECT id FROM tests WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    // Check code uniqueness if changing
    if (test_code) {
      const codeCheck = await client.query('SELECT id FROM tests WHERE LOWER(test_code) = LOWER($1) AND id != $2', [test_code.trim(), id]);
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Test code is already used by another test.' });
      }
    }

    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE tests
      SET
        name = COALESCE($1, name),
        test_code = COALESCE($2, test_code),
        category_id = COALESCE($3, category_id),
        description = COALESCE($4, description),
        price = COALESCE($5, price),
        discount_price = $6,
        sample_type = COALESCE($7, sample_type),
        report_time = COALESCE($8, report_time),
        fasting_required = COALESCE($9, fasting_required),
        preparation_instructions = COALESCE($10, preparation_instructions),
        status = COALESCE($11, status),
        is_popular = COALESCE($12, is_popular),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *;
    `, [
      name ? name.trim() : null,
      test_code ? test_code.trim().toUpperCase() : null,
      category_id !== undefined ? category_id : null,
      description !== undefined ? description : null,
      price !== undefined ? parseFloat(price) : null,
      discount_price !== undefined ? (discount_price ? parseFloat(discount_price) : null) : null,
      sample_type || null,
      report_time || null,
      fasting_required !== undefined ? Boolean(fasting_required) : null,
      preparation_instructions !== undefined ? preparation_instructions : null,
      status || null,
      is_popular !== undefined ? Boolean(is_popular) : null,
      id
    ]);

    // If parameters array provided, replace parameters
    if (Array.isArray(parameters)) {
      await client.query('DELETE FROM test_parameters WHERE test_id = $1', [id]);
      let orderIndex = 1;
      for (const p of parameters) {
        if (p.name && p.name.trim()) {
          await client.query(`
            INSERT INTO test_parameters (test_id, name, unit, reference_range, order_index)
            VALUES ($1, $2, $3, $4, $5);
          `, [id, p.name.trim(), p.unit || null, p.reference_range || null, orderIndex++]);
        }
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Test updated successfully!',
      test: updateRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update test error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating test.' });
  } finally {
    client.release();
  }
}

/**
 * Delete Test (Admin)
 */
async function deleteTest(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }
    return res.json({ success: true, message: 'Test deleted successfully.' });
  } catch (error) {
    console.error('Delete test error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting test.' });
  }
}

/**
 * Toggle Test Status (Admin)
 */
async function toggleTestStatus(req, res) {
  try {
    const { id } = req.params;
    const test = await pool.query('SELECT status FROM tests WHERE id = $1', [id]);
    if (test.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    const currentStatus = test.rows[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    await pool.query('UPDATE tests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);
    return res.json({ success: true, message: `Test status set to ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Toggle test status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating test status.' });
  }
}

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  toggleTestStatus
};
