const { pool } = require('../config/db');

/**
 * Get all categories
 */
async function getCategories(req, res) {
  try {
    const isAdmin = req.isAdmin;
    const queryText = isAdmin 
      ? `
        SELECT c.*, COUNT(t.id)::int AS test_count 
        FROM categories c
        LEFT JOIN tests t ON t.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name ASC;
      `
      : `
        SELECT c.*, COUNT(t.id)::int AS test_count 
        FROM categories c
        LEFT JOIN tests t ON t.category_id = c.id AND t.status = 'active'
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.name ASC;
      `;

    const result = await pool.query(queryText);
    return res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving categories.' });
  }
}

/**
 * Create Category (Admin)
 */
async function createCategory(req, res) {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const check = await pool.query('SELECT id FROM categories WHERE slug = $1 OR LOWER(name) = LOWER($2)', [slug, name.trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists.' });
    }

    const result = await pool.query(`
      INSERT INTO categories (name, slug, description, icon, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING *;
    `, [name.trim(), slug, description || '', icon || 'flask']);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating category.' });
  }
}

/**
 * Update Category (Admin)
 */
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, description, icon, is_active } = req.body;

    const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    let slug = existing.rows[0].slug;
    if (name && name.trim() !== existing.rows[0].name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const result = await pool.query(`
      UPDATE categories
      SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        icon = COALESCE($4, icon),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `, [
      name ? name.trim() : null,
      slug,
      description !== undefined ? description : null,
      icon || null,
      is_active !== undefined ? is_active : null,
      id
    ]);

    return res.json({
      success: true,
      message: 'Category updated successfully!',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating category.' });
  }
}

/**
 * Delete Category (Admin)
 */
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    // Unlink tests
    await pool.query('UPDATE tests SET category_id = NULL WHERE category_id = $1', [id]);
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting category.' });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
