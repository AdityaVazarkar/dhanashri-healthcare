const { pool } = require('../config/db');
const { sendBookingConfirmationEmail } = require('../services/emailService');

/**
 * Get available time slots
 */
async function getTimeSlots(req, res) {
  try {
    const result = await pool.query('SELECT * FROM time_slots WHERE is_active = true ORDER BY id ASC');
    return res.json({ success: true, timeSlots: result.rows });
  } catch (error) {
    console.error('Get time slots error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving time slots.' });
  }
}

/**
 * Create a new booking
 */
async function createBooking(req, res) {
  const client = await pool.connect();
  try {
    const userId = req.user ? req.user.id : null;
    const {
      patientName,
      patientAge,
      patientGender,
      patientMobile,
      address,
      landmark,
      city,
      pincode,
      collectionType,
      appointmentDate,
      timeSlot,
      items, // array of { type: 'test'|'package', id, name, price }
      paymentMethod,
      notes
    } = req.body;

    if (!patientName || !patientAge || !patientGender || !patientMobile || !appointmentDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Missing required patient or scheduling fields.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one test or package.' });
    }

    if (collectionType === 'Home Collection' && (!address || !city || !pincode)) {
      return res.status(400).json({ success: false, message: 'Address, city, and pincode are required for home sample collection.' });
    }

    // Calculate totals
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
    const discount = 0; // Can apply promo codes if added
    const totalAmount = Math.max(0, subtotal - discount);

    // Generate unique booking code
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `BK-${new Date().getFullYear()}-${uniqueNum}`;

    await client.query('BEGIN');

    const insertBooking = await client.query(`
      INSERT INTO bookings (
        booking_code, user_id, patient_name, patient_age, patient_gender, patient_mobile,
        address, landmark, city, pincode, collection_type, appointment_date, time_slot,
        subtotal, discount, total_amount, payment_method, payment_status, booking_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'Pending', $19)
      RETURNING *;
    `, [
      bookingCode,
      userId,
      patientName.trim(),
      parseInt(patientAge, 10),
      patientGender,
      patientMobile.trim(),
      address || null,
      landmark || null,
      city || null,
      pincode || null,
      collectionType || 'Home Collection',
      appointmentDate,
      timeSlot,
      subtotal,
      discount,
      totalAmount,
      paymentMethod || 'Cash on Collection',
      paymentMethod === 'Online Payment' ? 'Paid' : 'Pending',
      notes || null
    ]);

    const booking = insertBooking.rows[0];

    // Insert booking items
    for (const item of items) {
      await client.query(`
        INSERT INTO booking_items (booking_id, item_type, test_id, package_id, item_name, price)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        booking.id,
        item.type || 'test',
        item.type === 'test' ? item.id : null,
        item.type === 'package' ? item.id : null,
        item.name,
        parseFloat(item.price) || 0
      ]);
    }

    // Insert payment record
    await client.query(`
      INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id)
      VALUES ($1, $2, $3, $4, $5);
    `, [
      booking.id,
      totalAmount,
      paymentMethod || 'Cash on Collection',
      paymentMethod === 'Online Payment' ? 'Paid' : 'Pending',
      paymentMethod === 'Online Payment' ? `TXN-${Date.now()}` : null
    ]);

    // Insert in-app notification if user is logged in
    if (userId) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, link)
        VALUES ($1, 'Booking Placed Successfully', $2, 'booking', false, '/bookings');
      `, [
        userId,
        `Your booking (${bookingCode}) for ${items.length} item(s) has been confirmed for ${appointmentDate} at ${timeSlot}.`
      ]);
    }

    await client.query('COMMIT');

    // Send email notification (non-blocking)
    if (req.user && req.user.email) {
      sendBookingConfirmationEmail(req.user.email, patientName, bookingCode, appointmentDate, timeSlot, totalAmount).catch(e => console.error(e));
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully!',
      booking
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating booking.' });
  } finally {
    client.release();
  }
}

/**
 * Get bookings for the authenticated user
 */
async function getUserBookings(req, res) {
  try {
    const userId = req.user.id;

    const queryText = `
      SELECT 
        b.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', bi.id,
              'item_type', bi.item_type,
              'item_name', bi.item_name,
              'price', bi.price,
              'test_id', bi.test_id,
              'package_id', bi.package_id
            )
          ) FILTER (WHERE bi.id IS NOT NULL), '[]'
        ) AS items,
        COUNT(r.id)::int AS report_count
      FROM bookings b
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      LEFT JOIN reports r ON r.booking_id = b.id
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC;
    `;

    const result = await pool.query(queryText, [userId]);
    return res.json({ success: true, count: result.rows.length, bookings: result.rows });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving bookings.' });
  }
}

/**
 * Get single booking by ID (accessible by user owner or admin)
 */
async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const isNum = !isNaN(id);

    let whereClause = isNum ? 'b.id = $1' : 'b.booking_code = $1';
    const values = [id];

    if (!req.isAdmin) {
      whereClause += ' AND b.user_id = $2';
      values.push(req.user.id);
    }

    const queryText = `
      SELECT 
        b.*,
        u.email AS user_email, u.full_name AS user_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', bi.id,
              'item_type', bi.item_type,
              'item_name', bi.item_name,
              'price', bi.price,
              'test_id', bi.test_id,
              'package_id', bi.package_id
            )
          ) FILTER (WHERE bi.id IS NOT NULL), '[]'
        ) AS items
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      WHERE ${whereClause}
      GROUP BY b.id, u.email, u.full_name;
    `;

    const result = await pool.query(queryText, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = result.rows[0];

    // Fetch reports for this booking
    const reportsRes = await pool.query(`
      SELECT id, report_code, patient_name, report_date, report_status, file_name, pathologist_name
      FROM reports
      WHERE booking_id = $1
      ORDER BY id ASC;
    `, [booking.id]);
    booking.reports = reportsRes.rows;

    return res.json({ success: true, booking });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving booking.' });
  }
}

/**
 * Get all bookings (Admin)
 */
async function getAllBookings(req, res) {
  try {
    const { status, search, userId, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let queryText = `
      SELECT 
        b.*,
        u.full_name AS user_name, u.email AS user_email, u.mobile AS user_mobile,
        COALESCE(
          json_agg(
            json_build_object(
              'id', bi.id,
              'item_type', bi.item_type,
              'item_name', bi.item_name,
              'price', bi.price,
              'test_id', bi.test_id,
              'package_id', bi.package_id
            )
          ) FILTER (WHERE bi.id IS NOT NULL), '[]'
        ) AS items,
        COUNT(r.id)::int AS report_count
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN booking_items bi ON bi.booking_id = b.id
      LEFT JOIN reports r ON r.booking_id = b.id
      WHERE 1=1
    `;

    const values = [];
    let valIndex = 1;

    if (status && status !== 'all') {
      queryText += ` AND b.booking_status = $${valIndex++}`;
      values.push(status);
    }

    if (userId && userId !== 'all') {
      queryText += ` AND b.user_id = $${valIndex++}`;
      values.push(parseInt(userId, 10));
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      queryText += ` AND (
        LOWER(b.booking_code) LIKE $${valIndex} 
        OR LOWER(b.patient_name) LIKE $${valIndex} 
        OR b.patient_mobile LIKE $${valIndex}
        OR LOWER(COALESCE(u.full_name, '')) LIKE $${valIndex}
        OR LOWER(COALESCE(u.email, '')) LIKE $${valIndex}
        OR EXISTS (
          SELECT 1 FROM booking_items bi_sub 
          WHERE bi_sub.booking_id = b.id 
          AND LOWER(bi_sub.item_name) LIKE $${valIndex}
        )
      )`;
      values.push(term);
      valIndex++;
    }

    queryText += ` GROUP BY b.id, u.full_name, u.email, u.mobile ORDER BY b.created_at DESC LIMIT $${valIndex++} OFFSET $${valIndex++};`;
    values.push(parseInt(limit, 10), offset);

    const result = await pool.query(queryText, values);

    // Total count for pagination
    const countRes = await pool.query('SELECT COUNT(id)::int FROM bookings;');
    const totalCount = countRes.rows[0].count;

    return res.json({
      success: true,
      count: result.rows.length,
      total: totalCount,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving bookings.' });
  }
}

/**
 * Update Booking Status (Admin)
 */
async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const allowedStatuses = ['Pending', 'Confirmed', 'Sample Collected', 'Processing', 'Report Ready', 'Completed', 'Cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status value.' });
    }

    const currentBooking = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (currentBooking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = currentBooking.rows[0];

    const updated = await pool.query(`
      UPDATE bookings
      SET 
        booking_status = COALESCE($1, booking_status),
        payment_status = COALESCE($2, payment_status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `, [status || null, payment_status || null, id]);

    // Send in-app notification if status changed and user exists
    if (booking.user_id && status && status !== booking.booking_status) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, link)
        VALUES ($1, $2, $3, 'booking', false, '/bookings');
      `, [
        booking.user_id,
        `Booking ${booking.booking_code} Status Updated`,
        `Your test booking is now marked as "${status}".`
      ]);
    }

    return res.json({
      success: true,
      message: 'Booking status updated successfully!',
      booking: updated.rows[0]
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating booking status.' });
  }
}

/**
 * Update Booking Details (Patient or Admin)
 */
async function updateBooking(req, res) {
  try {
    const { id } = req.params;
    const isNum = !isNaN(id);
    const findQuery = isNum ? 'SELECT * FROM bookings WHERE id = $1' : 'SELECT * FROM bookings WHERE booking_code = $1';
    const currentBookingRes = await pool.query(findQuery, [id]);

    if (currentBookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = currentBookingRes.rows[0];

    // Authorization check
    if (!req.isAdmin && (!req.user || booking.user_id !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this booking.' });
    }

    // Normal users cannot edit already completed or cancelled bookings
    if (!req.isAdmin && ['Completed', 'Cancelled'].includes(booking.booking_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a booking that is already marked as ${booking.booking_status}.`
      });
    }

    const {
      patient_name,
      patient_age,
      patient_gender,
      patient_mobile,
      appointment_date,
      time_slot,
      collection_type,
      address,
      landmark,
      city,
      pincode,
      notes,
      booking_status,
      payment_status
    } = req.body;

    const allowedStatuses = ['Pending', 'Confirmed', 'Sample Collected', 'Processing', 'Report Ready', 'Completed', 'Cancelled'];
    const newBookingStatus = (req.isAdmin && booking_status && allowedStatuses.includes(booking_status))
      ? booking_status
      : booking.booking_status;

    const newPaymentStatus = (req.isAdmin && payment_status)
      ? payment_status
      : booking.payment_status;

    const updated = await pool.query(`
      UPDATE bookings
      SET
        patient_name = COALESCE($1, patient_name),
        patient_age = COALESCE($2, patient_age),
        patient_gender = COALESCE($3, patient_gender),
        patient_mobile = COALESCE($4, patient_mobile),
        appointment_date = COALESCE($5, appointment_date),
        time_slot = COALESCE($6, time_slot),
        collection_type = COALESCE($7, collection_type),
        address = COALESCE($8, address),
        landmark = COALESCE($9, landmark),
        city = COALESCE($10, city),
        pincode = COALESCE($11, pincode),
        notes = COALESCE($12, notes),
        booking_status = $13,
        payment_status = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *;
    `, [
      patient_name !== undefined ? patient_name.trim() : null,
      patient_age !== undefined && patient_age !== '' ? parseInt(patient_age, 10) : null,
      patient_gender !== undefined ? patient_gender : null,
      patient_mobile !== undefined ? patient_mobile.trim() : null,
      appointment_date !== undefined ? appointment_date : null,
      time_slot !== undefined ? time_slot : null,
      collection_type !== undefined ? collection_type : null,
      address !== undefined ? address : null,
      landmark !== undefined ? landmark : null,
      city !== undefined ? city : null,
      pincode !== undefined ? pincode : null,
      notes !== undefined ? notes : null,
      newBookingStatus,
      newPaymentStatus,
      booking.id
    ]);

    // Send notification if admin modified status or details
    if (booking.user_id && req.isAdmin) {
      const msg = newBookingStatus !== booking.booking_status
        ? `Your booking (${booking.booking_code}) status has been updated to "${newBookingStatus}".`
        : `Your booking (${booking.booking_code}) details have been updated by laboratory administration.`;
      
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, link)
        VALUES ($1, 'Booking Details Updated', $2, 'booking', false, '/bookings');
      `, [booking.user_id, msg]).catch(e => console.error('Notification error:', e));
    }

    return res.json({
      success: true,
      message: 'Booking updated successfully!',
      booking: updated.rows[0]
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating booking.' });
  }
}

/**
 * Delete Booking (Patient or Admin)
 */
async function deleteBooking(req, res) {
  try {
    const { id } = req.params;
    const isNum = !isNaN(id);
    const findQuery = isNum ? 'SELECT * FROM bookings WHERE id = $1' : 'SELECT * FROM bookings WHERE booking_code = $1';
    const currentBookingRes = await pool.query(findQuery, [id]);

    if (currentBookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = currentBookingRes.rows[0];

    // Authorization check
    if (!req.isAdmin && (!req.user || booking.user_id !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this booking.' });
    }

    // Normal users cannot delete already completed bookings (they should keep their medical history)
    if (!req.isAdmin && booking.booking_status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed bookings with issued reports cannot be deleted. Please contact support.'
      });
    }

    // Delete booking (CASCADE deletes booking_items, payments, reports)
    await pool.query('DELETE FROM bookings WHERE id = $1', [booking.id]);

    // Notify patient if deleted by admin
    if (req.isAdmin && booking.user_id) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, link)
        VALUES ($1, 'Booking Cancelled & Removed', $2, 'booking', false, '/bookings');
      `, [
        booking.user_id,
        `Your test booking (${booking.booking_code}) has been cancelled and removed by laboratory administration.`
      ]).catch(e => console.error('Notification error:', e));
    }

    return res.json({
      success: true,
      message: 'Booking deleted successfully.',
      deletedBookingId: booking.id,
      bookingCode: booking.booking_code
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting booking.' });
  }
}

module.exports = {
  getTimeSlots,
  createBooking,
  getUserBookings,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  updateBooking,
  deleteBooking
};
