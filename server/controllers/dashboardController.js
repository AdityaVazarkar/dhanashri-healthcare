const { pool } = require('../config/db');

/**
 * Get User Dashboard data
 */
async function getUserDashboard(req, res) {
  try {
    const userId = req.user.id;

    // Fetch user details
    const userRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [userId]);
    const userName = userRes.rows[0]?.full_name || 'Patient';

    // Summary counts
    const totalBookingsRes = await pool.query('SELECT COUNT(id)::int FROM bookings WHERE user_id = $1', [userId]);
    const upcomingTestsRes = await pool.query(
      "SELECT COUNT(id)::int FROM bookings WHERE user_id = $1 AND booking_status IN ('Pending', 'Confirmed', 'Sample Collected', 'Processing')",
      [userId]
    );
    const completedTestsRes = await pool.query(
      "SELECT COUNT(id)::int FROM bookings WHERE user_id = $1 AND booking_status = 'Completed'",
      [userId]
    );
    const availableReportsRes = await pool.query('SELECT COUNT(id)::int FROM reports WHERE user_id = $1', [userId]);

    // Upcoming next appointment
    const nextAppointmentRes = await pool.query(`
      SELECT 
        b.id, b.booking_code, b.appointment_date, b.time_slot, b.collection_type, b.booking_status,
        b.total_amount, b.patient_name, b.patient_age, b.patient_gender, b.patient_mobile,
        b.address, b.landmark, b.city, b.pincode, b.notes,
        COALESCE(
          json_agg(
            json_build_object('id', bi.id, 'item_name', bi.item_name, 'price', bi.price)
          ) FILTER (WHERE bi.id IS NOT NULL), '[]'
        ) AS items
      FROM bookings b
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      WHERE b.user_id = $1 AND b.booking_status NOT IN ('Completed', 'Cancelled')
      GROUP BY b.id
      ORDER BY b.appointment_date ASC, b.id ASC
      LIMIT 1;
    `, [userId]);

    // Recent reports
    const recentReportsRes = await pool.query(`
      SELECT r.id, r.report_code, r.patient_name, r.report_date, r.report_status, r.file_name, t.name AS test_name
      FROM reports r
      LEFT JOIN tests t ON t.id = r.test_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT 4;
    `, [userId]);

    // Recommended packages
    const recommendedPackagesRes = await pool.query(`
      SELECT p.id, p.name, p.slug, p.description, p.original_price, p.discount_price, p.benefits,
        COUNT(pt.test_id)::int AS test_count
      FROM packages p
      LEFT JOIN package_tests pt ON pt.package_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.is_featured DESC, p.discount_price ASC
      LIMIT 3;
    `);

    return res.json({
      success: true,
      data: {
        userName,
        stats: {
          upcomingTests: upcomingTestsRes.rows[0].count,
          completedTests: completedTestsRes.rows[0].count,
          availableReports: availableReportsRes.rows[0].count,
          totalBookings: totalBookingsRes.rows[0].count,
        },
        upcomingAppointment: nextAppointmentRes.rows[0] || null,
        recentReports: recentReportsRes.rows,
        recommendedPackages: recommendedPackagesRes.rows
      }
    });
  } catch (error) {
    console.error('User dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving user dashboard.' });
  }
}

/**
 * Get Admin Dashboard analytics & metrics
 */
async function getAdminDashboard(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Top Cards Metrics
    const totalUsersRes = await pool.query('SELECT COUNT(id)::int FROM users;');
    const totalTestsRes = await pool.query("SELECT COUNT(id)::int FROM tests WHERE status = 'active';");
    const todayBookingsRes = await pool.query('SELECT COUNT(id)::int FROM bookings WHERE appointment_date = $1;', [today]);
    const pendingReportsRes = await pool.query(
      "SELECT COUNT(id)::int FROM bookings WHERE booking_status IN ('Processing', 'Sample Collected');"
    );
    const revenueRes = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0)::numeric AS total FROM bookings WHERE payment_status = 'Paid' OR booking_status IN ('Report Ready', 'Completed');"
    );
    const completedTestsRes = await pool.query(
      "SELECT COUNT(id)::int FROM bookings WHERE booking_status IN ('Report Ready', 'Completed');"
    );

    // Chart 1: Daily Bookings (Last 7 Days)
    const dailyBookingsRes = await pool.query(`
      SELECT 
        TO_CHAR(d.day, 'Dy, Mon DD') AS label,
        d.day::date AS date,
        COUNT(b.id)::int AS bookings_count,
        COALESCE(SUM(b.total_amount), 0)::numeric AS revenue
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
      LEFT JOIN bookings b ON b.created_at::date = d.day::date
      GROUP BY d.day
      ORDER BY d.day ASC;
    `);

    // Chart 2: Revenue Trend (Last 6 Months)
    const monthlyRevenueRes = await pool.query(`
      SELECT 
        TO_CHAR(m.month, 'Mon YYYY') AS month_label,
        COALESCE(SUM(b.total_amount), 0)::numeric AS revenue,
        COUNT(b.id)::int AS orders
      FROM generate_series(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'), DATE_TRUNC('month', CURRENT_DATE), '1 month'::interval) m(month)
      LEFT JOIN bookings b ON DATE_TRUNC('month', b.created_at) = m.month
      GROUP BY m.month
      ORDER BY m.month ASC;
    `);

    // Chart 3: Most Booked Tests
    const popularTestsRes = await pool.query(`
      SELECT 
        t.name AS test_name,
        COUNT(bi.id)::int AS booking_count
      FROM tests t
      JOIN booking_items bi ON bi.test_id = t.id
      GROUP BY t.id
      ORDER BY booking_count DESC
      LIMIT 6;
    `);

    // If popular tests is empty, fallback to popular test catalog
    let popularTestData = popularTestsRes.rows;
    if (popularTestData.length === 0) {
      const topT = await pool.query("SELECT name AS test_name, 5 AS booking_count FROM tests WHERE is_popular = true LIMIT 5;");
      popularTestData = topT.rows;
    }

    // Chart 4: Booking Status Distribution
    const statusDistributionRes = await pool.query(`
      SELECT 
        booking_status AS status,
        COUNT(id)::int AS count
      FROM bookings
      GROUP BY booking_status;
    `);

    // Recent 6 Bookings with items
    const recentBookingsRes = await pool.query(`
      SELECT 
        b.id, b.booking_code, b.patient_name, b.patient_age, b.patient_gender, b.patient_mobile,
        b.appointment_date, b.time_slot, b.collection_type, b.address, b.landmark, b.city, b.pincode,
        b.notes, b.total_amount, b.booking_status, b.payment_status,
        u.email AS user_email, u.full_name AS user_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', bi.id,
              'item_type', bi.item_type,
              'item_name', bi.item_name,
              'price', bi.price
            )
          ) FILTER (WHERE bi.id IS NOT NULL), '[]'
        ) AS items
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      GROUP BY b.id, u.email, u.full_name
      ORDER BY b.created_at DESC
      LIMIT 6;
    `);

    // Live Website Tests
    const liveTestsRes = await pool.query(`
      SELECT 
        t.id, t.name, t.test_code, t.price, t.discount_price, t.sample_type, 
        t.report_time, t.status, t.is_popular, t.fasting_required,
        c.name AS category_name
      FROM tests t
      LEFT JOIN categories c ON c.id = t.category_id
      ORDER BY t.is_popular DESC, t.id ASC;
    `);

    // Live Website Packages
    const livePackagesRes = await pool.query(`
      SELECT 
        p.id, p.name, p.slug, p.original_price, p.discount_price, 
        p.status, p.is_featured, p.benefits,
        COUNT(pt.test_id)::int AS test_count
      FROM packages p
      LEFT JOIN package_tests pt ON pt.package_id = p.id
      GROUP BY p.id
      ORDER BY p.is_featured DESC, p.id ASC;
    `);

    return res.json({
      success: true,
      stats: {
        totalUsers: totalUsersRes.rows[0].count,
        totalTests: totalTestsRes.rows[0].count,
        todayBookings: todayBookingsRes.rows[0].count,
        pendingReports: pendingReportsRes.rows[0].count,
        revenue: parseFloat(revenueRes.rows[0].total),
        completedTests: completedTestsRes.rows[0].count,
      },
      charts: {
        dailyBookings: dailyBookingsRes.rows,
        monthlyRevenue: monthlyRevenueRes.rows,
        popularTests: popularTestData,
        statusDistribution: statusDistributionRes.rows
      },
      recentBookings: recentBookingsRes.rows,
      liveTests: liveTestsRes.rows,
      livePackages: livePackagesRes.rows
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving admin metrics.' });
  }
}

module.exports = {
  getUserDashboard,
  getAdminDashboard
};
