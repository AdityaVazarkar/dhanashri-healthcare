const { pool } = require('../config/db');

/**
 * Get all users (Admin)
 */
async function getAllUsers(req, res) {
  try {
    const { search, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let queryText = `
      SELECT 
        u.id, u.full_name, u.email, u.mobile, u.dob, u.gender,
        u.city, u.pincode, u.status, u.role, u.created_at,
        COUNT(DISTINCT b.id)::int AS total_bookings,
        COUNT(DISTINCT r.id)::int AS total_reports
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      LEFT JOIN reports r ON r.user_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let valIndex = 1;

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      queryText += ` AND (LOWER(u.full_name) LIKE $${valIndex} OR LOWER(u.email) LIKE $${valIndex} OR u.mobile LIKE $${valIndex})`;
      values.push(term);
      valIndex++;
    }

    queryText += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${valIndex++} OFFSET $${valIndex++};`;
    values.push(parseInt(limit, 10), offset);

    const result = await pool.query(queryText, values);
    const countRes = await pool.query('SELECT COUNT(id)::int FROM users;');

    return res.json({
      success: true,
      count: result.rows.length,
      total: countRes.rows[0].count,
      users: result.rows
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
}

/**
 * Get single user details with booking history (Admin)
 */
async function getUserDetails(req, res) {
  try {
    const { id } = req.params;

    const userRes = await pool.query(`
      SELECT id, full_name, email, mobile, dob, gender, address, landmark, city, pincode, status, role, created_at
      FROM users WHERE id = $1;
    `, [id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = userRes.rows[0];

    // Fetch user bookings
    const bookingsRes = await pool.query(`
      SELECT b.*, COUNT(bi.id)::int AS item_count
      FROM bookings b
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC;
    `, [id]);
    user.bookings = bookingsRes.rows;

    // Fetch user reports
    const reportsRes = await pool.query(`
      SELECT r.*, t.name AS test_name
      FROM reports r
      LEFT JOIN tests t ON t.id = r.test_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC;
    `, [id]);
    user.reports = reportsRes.rows;

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving user details.' });
  }
}

/**
 * Toggle user status (Activate / Deactivate) (Admin)
 */
async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;

    const userRes = await pool.query('SELECT status FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const currentStatus = userRes.rows[0].status;
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';

    await pool.query('UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [nextStatus, id]);

    return res.json({
      success: true,
      message: `User account has been set to ${nextStatus}.`,
      status: nextStatus
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating user status.' });
  }
}

module.exports = {
  getAllUsers,
  getUserDetails,
  toggleUserStatus
};
