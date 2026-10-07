const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { generateReportPDF } = require('../utils/pdfGenerator');
const { sendReportReadyEmail } = require('../services/emailService');

/**
 * Get reports for the authenticated user
 */
async function getUserReports(req, res) {
  try {
    const userId = req.user.id;

    const queryText = `
      SELECT 
        r.*,
        b.booking_code, b.appointment_date,
        t.name AS test_name, t.test_code,
        COUNT(rp.id)::int AS parameter_count
      FROM reports r
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN tests t ON t.id = r.test_id
      LEFT JOIN report_parameters rp ON rp.report_id = r.id
      WHERE r.user_id = $1
      GROUP BY r.id, b.booking_code, b.appointment_date, t.name, t.test_code
      ORDER BY r.created_at DESC;
    `;

    const result = await pool.query(queryText, [userId]);
    return res.json({ success: true, count: result.rows.length, reports: result.rows });
  } catch (error) {
    console.error('Get user reports error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving reports.' });
  }
}

/**
 * Get Report Details by ID (Digital Viewer Data)
 */
async function getReportById(req, res) {
  try {
    const { id } = req.params;

    const isNum = !isNaN(id);
    const whereCond = isNum ? 'r.id = $1' : 'r.report_code = $1';
    const queryParam = isNum ? parseInt(id, 10) : id;

    const queryText = `
      SELECT 
        r.*,
        b.booking_code, b.appointment_date, b.patient_age, b.patient_gender,
        t.name AS test_name, t.test_code, t.sample_type,
        u.email AS user_email
      FROM reports r
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN tests t ON t.id = r.test_id
      LEFT JOIN users u ON u.id = r.user_id
      WHERE ${whereCond};
    `;

    const result = await pool.query(queryText, [queryParam]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = result.rows[0];

    // Authorization check: User must own the report OR be admin
    if (!req.isAdmin && req.user.id !== report.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own reports.' });
    }

    // Fetch parameters
    const paramRes = await pool.query(`
      SELECT id, parameter_name, result_value, unit, reference_range, is_abnormal, order_index
      FROM report_parameters
      WHERE report_id = $1
      ORDER BY order_index ASC, id ASC;
    `, [report.id]);

    report.parameters = paramRes.rows;

    return res.json({ success: true, report });
  } catch (error) {
    console.error('Get report by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving report details.' });
  }
}

/**
 * Securely stream and download report PDF
 */
async function downloadReportFile(req, res) {
  try {
    const { id } = req.params;
    let userId = req.user ? req.user.id : null;
    let isAdmin = req.isAdmin || false;

    // Check token from query parameter if header wasn't sent (e.g. direct window.open or <a> tag)
    if (!userId && req.query.token) {
      try {
        const decoded = jwt.verify(req.query.token, JWT_SECRET);
        if (decoded.role === 'admin' || decoded.role === 'superadmin') {
          isAdmin = true;
        } else {
          userId = decoded.id;
        }
      } catch (err) {
        return res.status(401).send('Unauthorized or expired download link.');
      }
    }

    const isNum = !isNaN(id);
    const reportRes = isNum
      ? await pool.query('SELECT * FROM reports WHERE id = $1', [parseInt(id, 10)])
      : await pool.query('SELECT * FROM reports WHERE report_code = $1', [id]);

    if (reportRes.rows.length === 0) {
      return res.status(404).send('Report not found.');
    }

    const report = reportRes.rows[0];

    if (!isAdmin && report.user_id !== userId) {
      return res.status(403).send('Forbidden: Access denied to download this report.');
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
    let filePath = path.join(uploadsDir, report.file_name);

    // If PDF doesn't exist on disk, regenerate dynamically!
    if (!fs.existsSync(filePath)) {
      const paramsRes = await pool.query('SELECT * FROM report_parameters WHERE report_id = $1 ORDER BY order_index ASC', [report.id]);
      const bkRes = await pool.query('SELECT * FROM bookings WHERE id = $1', [report.booking_id]);
      const bk = bkRes.rows[0] || {};
      const testRes = await pool.query('SELECT name FROM tests WHERE id = $1', [report.test_id]);
      const testName = testRes.rows[0]?.name || 'Diagnostic Blood Test';

      await generateReportPDF({
        reportCode: report.report_code,
        patientName: report.patient_name,
        age: bk.patient_age || 30,
        gender: bk.patient_gender || 'Other',
        bookingCode: bk.booking_code || 'N/A',
        reportDate: report.report_date,
        testName,
        parameters: paramsRes.rows,
        pathologistName: report.pathologist_name,
        pathologistQualification: report.pathologist_qualification,
        remarks: report.remarks,
        outputPath: filePath
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.report_code}.pdf"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download report error:', error);
    return res.status(500).send('Server error downloading report.');
  }
}

/**
 * Get all reports (Admin)
 */
async function getAllReports(req, res) {
  try {
    const { search, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let queryText = `
      SELECT 
        r.*,
        b.booking_code,
        t.name AS test_name, t.test_code,
        u.email AS user_email, u.mobile AS user_mobile,
        COUNT(rp.id)::int AS parameter_count
      FROM reports r
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN tests t ON t.id = r.test_id
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN report_parameters rp ON rp.report_id = r.id
      WHERE 1=1
    `;

    const values = [];
    let valIndex = 1;

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      queryText += ` AND (LOWER(r.report_code) LIKE $${valIndex} OR LOWER(r.patient_name) LIKE $${valIndex} OR LOWER(b.booking_code) LIKE $${valIndex})`;
      values.push(term);
      valIndex++;
    }

    queryText += ` GROUP BY r.id, b.booking_code, t.name, t.test_code, u.email, u.mobile ORDER BY r.created_at DESC LIMIT $${valIndex++} OFFSET $${valIndex++};`;
    values.push(parseInt(limit, 10), offset);

    const result = await pool.query(queryText, values);
    const countRes = await pool.query('SELECT COUNT(id)::int FROM reports;');

    return res.json({
      success: true,
      count: result.rows.length,
      total: countRes.rows[0].count,
      reports: result.rows
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving reports.' });
  }
}

/**
 * Upload / Generate Report (Admin)
 */
async function uploadReport(req, res) {
  const client = await pool.connect();
  try {
    const {
      booking_id,
      test_id,
      patient_name,
      report_date,
      pathologist_name,
      pathologist_qualification,
      remarks,
      parameters // JSON string or array
    } = req.body;

    if (!booking_id || !test_id) {
      return res.status(400).json({ success: false, message: 'Booking and Test selection are required.' });
    }

    // Verify booking
    const bkRes = await client.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bkRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const booking = bkRes.rows[0];

    // Fetch test details
    const testRes = await client.query('SELECT * FROM tests WHERE id = $1', [test_id]);
    const test = testRes.rows[0];
    const testName = test ? test.name : 'Laboratory Test';

    // Parse parameters
    let parsedParams = [];
    if (parameters) {
      try {
        parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
      } catch (e) {
        parsedParams = [];
      }
    }

    // Generate unique report code
    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const reportCode = `REP-${new Date().getFullYear()}-${uniqueNum}`;
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');

    let fileName = '';
    let filePath = '';

    if (req.file) {
      fileName = req.file.filename;
      filePath = `/uploads/reports/${fileName}`;
    } else {
      // Auto-generate PDF report using parameters
      fileName = `${reportCode}.pdf`;
      const outPath = path.join(uploadsDir, fileName);
      await generateReportPDF({
        reportCode,
        patientName: patient_name || booking.patient_name,
        age: booking.patient_age,
        gender: booking.patient_gender,
        bookingCode: booking.booking_code,
        reportDate: report_date || new Date().toISOString().split('T')[0],
        testName,
        parameters: parsedParams,
        pathologistName: pathologist_name || 'Dr. Arvind Mehra, MD (Pathology)',
        pathologistQualification: pathologist_qualification || 'Chief Pathologist & Laboratory Director',
        remarks: remarks || 'Normal clinical findings.',
        outputPath: outPath
      });
      filePath = `/uploads/reports/${fileName}`;
    }

    await client.query('BEGIN');

    const insertRep = await client.query(`
      INSERT INTO reports (
        report_code, booking_id, test_id, user_id, patient_name,
        report_date, report_status, file_path, file_name,
        pathologist_name, pathologist_qualification, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, 'Ready', $7, $8, $9, $10, $11)
      RETURNING *;
    `, [
      reportCode,
      booking.id,
      test_id,
      booking.user_id,
      patient_name || booking.patient_name,
      report_date || new Date().toISOString().split('T')[0],
      filePath,
      fileName,
      pathologist_name || 'Dr. Arvind Mehra, MD (Pathology)',
      pathologist_qualification || 'Chief Pathologist & Laboratory Director',
      remarks || 'Clinical correlation recommended.'
    ]);

    const createdReport = insertRep.rows[0];

    // Insert parameters into report_parameters
    if (Array.isArray(parsedParams) && parsedParams.length > 0) {
      let orderIndex = 1;
      for (const p of parsedParams) {
        await client.query(`
          INSERT INTO report_parameters (report_id, parameter_name, result_value, unit, reference_range, is_abnormal, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `, [
          createdReport.id,
          p.parameter_name || p.name,
          p.result_value || '-',
          p.unit || '',
          p.reference_range || '',
          Boolean(p.is_abnormal),
          orderIndex++
        ]);
      }
    }

    // Update booking status to 'Report Ready'
    await client.query(`
      UPDATE bookings
      SET booking_status = 'Report Ready', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `, [booking.id]);

    // Send in-app notification to patient
    if (booking.user_id) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, link)
        VALUES ($1, $2, $3, 'report', false, '/reports');
      `, [
        booking.user_id,
        `Your Report for ${testName} is Ready!`,
        `Report ID ${reportCode} has been verified and is ready to view and download.`
      ]);
    }

    await client.query('COMMIT');

    // Send email notification to user (if email available)
    if (booking.user_id) {
      const uRes = await pool.query('SELECT email FROM users WHERE id = $1', [booking.user_id]);
      if (uRes.rows.length > 0 && uRes.rows[0].email) {
        sendReportReadyEmail(
          uRes.rows[0].email,
          patient_name || booking.patient_name,
          testName,
          reportCode
        ).catch(err => console.error(err));
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Report uploaded and published successfully!',
      report: createdReport
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Upload report error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing report upload.' });
  } finally {
    client.release();
  }
}

/**
 * Manually trigger notification for report (Admin)
 */
async function notifyUserReport(req, res) {
  try {
    const { id } = req.params;
    const reportRes = await pool.query(`
      SELECT r.*, u.email, u.full_name, t.name AS test_name
      FROM reports r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN tests t ON t.id = r.test_id
      WHERE r.id = $1;
    `, [id]);

    if (reportRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = reportRes.rows[0];

    // In-app notification
    if (report.user_id) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, link)
        VALUES ($1, $2, $3, 'report', false, '/reports');
      `, [
        report.user_id,
        `Report Notice: ${report.test_name || 'Laboratory Test'}`,
        `Your verified test report (${report.report_code}) is ready.`
      ]);
    }

    // Email notification
    if (report.email) {
      await sendReportReadyEmail(
        report.email,
        report.patient_name || report.full_name,
        report.test_name || 'Diagnostic Blood Test',
        report.report_code
      );
    }

    return res.json({ success: true, message: 'Notification dispatched to patient successfully.' });
  } catch (error) {
    console.error('Notify user report error:', error);
    return res.status(500).json({ success: false, message: 'Server error notifying user.' });
  }
}

module.exports = {
  getUserReports,
  getReportById,
  downloadReportFile,
  getAllReports,
  uploadReport,
  notifyUserReport
};
