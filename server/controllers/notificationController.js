const { pool } = require('../config/db');

/**
 * Get notifications for authenticated user
 */
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 30;
    `, [userId]);

    const unreadCountRes = await pool.query(`
      SELECT COUNT(id)::int FROM notifications
      WHERE user_id = $1 AND is_read = false;
    `, [userId]);

    return res.json({
      success: true,
      notifications: result.rows,
      unreadCount: unreadCountRes.rows[0].count
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ success: false, message: 'Server error marking notification as read.' });
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ success: false, message: 'Server error marking all as read.' });
  }
}

/**
 * Get Admin Notification Center items (recent bookings, reports, users)
 */
async function getAdminNotifications(req, res) {
  try {
    // Collect recent activities: newly created bookings in last 24h, new user signups, recent reports
    const recentBookings = await pool.query(`
      SELECT 'booking' AS type, id, booking_code AS title, patient_name AS subtitle, created_at, total_amount
      FROM bookings ORDER BY created_at DESC LIMIT 5;
    `);

    const recentUsers = await pool.query(`
      SELECT 'user' AS type, id, full_name AS title, email AS subtitle, created_at
      FROM users ORDER BY created_at DESC LIMIT 5;
    `);

    const recentReports = await pool.query(`
      SELECT 'report' AS type, id, report_code AS title, patient_name AS subtitle, created_at
      FROM reports ORDER BY created_at DESC LIMIT 5;
    `);

    const items = [
      ...recentBookings.rows.map(b => ({
        id: `bk-${b.id}`,
        title: `New Booking: ${b.title}`,
        description: `Patient: ${b.subtitle} (₹${b.total_amount})`,
        type: 'booking',
        created_at: b.created_at,
        link: '/admin/bookings'
      })),
      ...recentUsers.rows.map(u => ({
        id: `usr-${u.id}`,
        title: `New Patient Registered: ${u.title}`,
        description: u.subtitle,
        type: 'user',
        created_at: u.created_at,
        link: '/admin/users'
      })),
      ...recentReports.rows.map(r => ({
        id: `rep-${r.id}`,
        title: `Report Ready: ${r.title}`,
        description: `Patient: ${r.subtitle}`,
        type: 'report',
        created_at: r.created_at,
        link: '/admin/reports'
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ success: true, notifications: items.slice(0, 15) });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin notifications.' });
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getAdminNotifications
};
