const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * Partner Login
 */
async function partnerLogin(req, res) {
  try {
    const { identifier, email, password } = req.body;
    const loginIdentifier = (identifier || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both mobile/email and password.'
      });
    }

    const partnerRes = await pool.query(`
      SELECT * FROM partners 
      WHERE LOWER(email) = LOWER($1) OR mobile = $1
    `, [loginIdentifier]);

    if (partnerRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No partner account found with these details.'
      });
    }

    const partner = partnerRes.rows[0];

    if (partner.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your partner account is currently inactive. Please contact Dhanashri Lab administration.'
      });
    }

    const isMatch = await bcrypt.compare(password, partner.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    const token = jwt.sign(
      {
        id: partner.id,
        role: 'partner',
        email: partner.email,
        name: partner.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safePartner = {
      id: partner.id,
      name: partner.name,
      email: partner.email,
      mobile: partner.mobile,
      city: partner.city,
      area: partner.area,
      commission_rate: parseFloat(partner.commission_rate) || 0,
      fixed_fee: parseFloat(partner.fixed_fee) || 0,
      status: partner.status,
      created_at: partner.created_at
    };

    return res.json({
      success: true,
      message: 'Login successful! Welcome to Dhanashri Partner Portal.',
      token,
      partner: safePartner
    });
  } catch (error) {
    console.error('Partner login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during partner login.' });
  }
}

/**
 * Get logged-in Partner Profile & Summary Stats
 */
async function getPartnerProfile(req, res) {
  try {
    const partnerId = req.partner.id;

    const partnerRes = await pool.query(`
      SELECT id, name, email, mobile, city, area, commission_rate, fixed_fee, status, created_at
      FROM partners
      WHERE id = $1
    `, [partnerId]);

    if (partnerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const partner = partnerRes.rows[0];
    const commissionRate = parseFloat(partner.commission_rate) || 0;
    const fixedFee = parseFloat(partner.fixed_fee) || 0;

    // Calculate collection statistics
    const statsRes = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_assigned,
        COUNT(CASE WHEN booking_status IN ('Sample Collected', 'Processing', 'Report Ready', 'Completed') THEN 1 END)::int AS samples_collected,
        COUNT(CASE WHEN booking_status IN ('Pending', 'Confirmed') THEN 1 END)::int AS pending_collections,
        COALESCE(SUM(CASE WHEN booking_status IN ('Sample Collected', 'Processing', 'Report Ready', 'Completed') THEN total_amount ELSE 0 END), 0)::numeric AS total_collection_volume
      FROM bookings
      WHERE partner_id = $1
    `, [partnerId]);

    const stats = statsRes.rows[0] || { total_assigned: 0, samples_collected: 0, pending_collections: 0, total_collection_volume: 0 };
    const collectionVolume = parseFloat(stats.total_collection_volume) || 0;
    const collectedCount = parseInt(stats.samples_collected, 10) || 0;

    // Calculate income generated for this partner
    const incomeGenerated = ((collectionVolume * commissionRate) / 100) + (collectedCount * fixedFee);

    return res.json({
      success: true,
      partner: {
        ...partner,
        commission_rate: commissionRate,
        fixed_fee: fixedFee
      },
      stats: {
        total_assigned: parseInt(stats.total_assigned, 10) || 0,
        samples_collected: collectedCount,
        pending_collections: parseInt(stats.pending_collections, 10) || 0,
        total_collection_volume: Math.round(collectionVolume * 100) / 100,
        total_income_earned: Math.round(incomeGenerated * 100) / 100
      }
    });
  } catch (error) {
    console.error('Get partner profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving partner profile.' });
  }
}

/**
 * Get assigned patient bookings for the logged-in partner
 */
async function getPartnerAssignedBookings(req, res) {
  try {
    const partnerId = req.partner.id;
    const { status, search } = req.query;

    let queryText = `
      SELECT 
        b.id, b.booking_code, b.patient_name, b.patient_age, b.patient_gender, b.patient_mobile,
        b.address, b.landmark, b.city, b.pincode, b.collection_type, b.appointment_date, b.time_slot,
        b.total_amount, b.payment_method, b.payment_status, b.booking_status,
        b.partner_assigned_at, b.sample_collected_at, b.partner_notes, b.notes,
        b.created_at,
        u.full_name AS user_name, u.mobile AS user_mobile, u.email AS user_email,
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
      WHERE b.partner_id = $1
    `;

    const values = [partnerId];
    let valIndex = 2;

    if (status && status !== 'all') {
      if (status === 'pending') {
        queryText += ` AND b.booking_status IN ('Pending', 'Confirmed')`;
      } else if (status === 'collected') {
        queryText += ` AND b.booking_status IN ('Sample Collected', 'Processing')`;
      } else if (status === 'completed') {
        queryText += ` AND b.booking_status IN ('Report Ready', 'Completed')`;
      } else {
        queryText += ` AND b.booking_status = $${valIndex++}`;
        values.push(status);
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      queryText += ` AND (
        LOWER(b.booking_code) LIKE $${valIndex} 
        OR LOWER(b.patient_name) LIKE $${valIndex} 
        OR b.patient_mobile LIKE $${valIndex}
        OR LOWER(COALESCE(b.address, '')) LIKE $${valIndex}
        OR LOWER(COALESCE(b.city, '')) LIKE $${valIndex}
      )`;
      values.push(term);
      valIndex++;
    }

    queryText += ` GROUP BY b.id, u.full_name, u.mobile, u.email ORDER BY b.appointment_date ASC, b.id ASC;`;

    const result = await pool.query(queryText, values);

    // Compute partner earnings
    const commissionRate = parseFloat(req.partner.commission_rate) || 0;
    const fixedFee = parseFloat(req.partner.fixed_fee) || 0;

    let totalVolume = 0;
    let collectedCount = 0;
    let pendingCount = 0;

    const formattedBookings = result.rows.map((b) => {
      const amount = parseFloat(b.total_amount) || 0;
      const isCollected = ['Sample Collected', 'Processing', 'Report Ready', 'Completed'].includes(b.booking_status);
      
      if (isCollected) {
        totalVolume += amount;
        collectedCount += 1;
      } else {
        pendingCount += 1;
      }

      const commission = isCollected ? Math.round(((amount * commissionRate) / 100 + fixedFee) * 100) / 100 : 0;

      return {
        ...b,
        commission_earned: commission
      };
    });

    const totalIncome = Math.round((((totalVolume * commissionRate) / 100) + (collectedCount * fixedFee)) * 100) / 100;

    return res.json({
      success: true,
      bookings: formattedBookings,
      summary: {
        total_assigned: formattedBookings.length,
        samples_collected: collectedCount,
        pending_collections: pendingCount,
        total_collection_volume: Math.round(totalVolume * 100) / 100,
        total_income_earned: totalIncome,
        commission_rate: commissionRate,
        fixed_fee: fixedFee
      }
    });
  } catch (error) {
    console.error('Get partner bookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving assigned bookings.' });
  }
}

/**
 * Partner updates sample collection status
 */
async function updatePartnerCollectionStatus(req, res) {
  try {
    const partnerId = req.partner.id;
    const { id } = req.params;
    const { status, notes, payment_received } = req.body;

    const bookingRes = await pool.query(`
      SELECT * FROM bookings WHERE id = $1 AND partner_id = $2
    `, [id, partnerId]);

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or not assigned to your partner account.' });
    }

    const currentBooking = bookingRes.rows[0];
    const newStatus = status || 'Sample Collected';
    const partnerNotes = notes !== undefined ? notes : currentBooking.partner_notes;
    const newPaymentStatus = payment_received ? 'Paid' : currentBooking.payment_status;

    const updateRes = await pool.query(`
      UPDATE bookings
      SET 
        booking_status = $1,
        sample_collected_at = CASE WHEN sample_collected_at IS NULL THEN CURRENT_TIMESTAMP ELSE sample_collected_at END,
        partner_notes = $2,
        payment_status = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *;
    `, [newStatus, partnerNotes, newPaymentStatus, id]);

    const updatedBooking = updateRes.rows[0];

    // Create notification for user if user exists
    if (updatedBooking.user_id) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, $2, $3, 'booking', $4)
      `, [
        updatedBooking.user_id,
        `Sample Collected for ${updatedBooking.booking_code}`,
        `Your sample for appointment (${updatedBooking.booking_code}) has been collected by partner ${req.partner.name}. Testing will begin shortly.`,
        `/bookings`
      ]);
    }

    return res.json({
      success: true,
      message: `Sample collection status updated to "${newStatus}" successfully!`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update partner collection status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating sample status.' });
  }
}

/**
 * ADMIN: Get all partners with individual income & collection stats + network grand totals
 */
async function getAllPartnersAdmin(req, res) {
  try {
    const { search, status } = req.query;

    let queryText = `
      SELECT 
        p.id, p.name, p.email, p.mobile, p.city, p.area,
        p.commission_rate, p.fixed_fee, p.status, p.created_at, p.updated_at,
        COUNT(b.id)::int AS total_assigned,
        COUNT(CASE WHEN b.booking_status IN ('Sample Collected', 'Processing', 'Report Ready', 'Completed') THEN 1 END)::int AS samples_collected,
        COUNT(CASE WHEN b.booking_status IN ('Pending', 'Confirmed') THEN 1 END)::int AS pending_collections,
        COALESCE(SUM(CASE WHEN b.booking_status IN ('Sample Collected', 'Processing', 'Report Ready', 'Completed') THEN b.total_amount ELSE 0 END), 0)::numeric AS total_collection_volume
      FROM partners p
      LEFT JOIN bookings b ON b.partner_id = p.id
      WHERE 1=1
    `;

    const values = [];
    let valIndex = 1;

    if (status && status !== 'all') {
      queryText += ` AND p.status = $${valIndex++}`;
      values.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      queryText += ` AND (
        LOWER(p.name) LIKE $${valIndex} 
        OR LOWER(p.email) LIKE $${valIndex} 
        OR p.mobile LIKE $${valIndex}
        OR LOWER(COALESCE(p.area, '')) LIKE $${valIndex}
        OR LOWER(COALESCE(p.city, '')) LIKE $${valIndex}
      )`;
      values.push(term);
      valIndex++;
    }

    queryText += ` GROUP BY p.id ORDER BY p.created_at DESC;`;

    const result = await pool.query(queryText, values);

    // Calculate individual partner earnings and overall summary
    let grandTotalAssigned = 0;
    let grandTotalCollected = 0;
    let grandTotalPending = 0;
    let grandTotalCollectionVolume = 0;
    let grandTotalPartnerIncome = 0;

    const partners = result.rows.map((p) => {
      const commissionRate = parseFloat(p.commission_rate) || 0;
      const fixedFee = parseFloat(p.fixed_fee) || 0;
      const collectedCount = parseInt(p.samples_collected, 10) || 0;
      const collectionVolume = parseFloat(p.total_collection_volume) || 0;

      // Income generated for this partner
      const partnerIncome = Math.round((((collectionVolume * commissionRate) / 100) + (collectedCount * fixedFee)) * 100) / 100;
      const labNetRevenue = Math.max(0, Math.round((collectionVolume - partnerIncome) * 100) / 100);

      grandTotalAssigned += parseInt(p.total_assigned, 10) || 0;
      grandTotalCollected += collectedCount;
      grandTotalPending += parseInt(p.pending_collections, 10) || 0;
      grandTotalCollectionVolume += collectionVolume;
      grandTotalPartnerIncome += partnerIncome;

      return {
        ...p,
        commission_rate: commissionRate,
        fixed_fee: fixedFee,
        total_assigned: parseInt(p.total_assigned, 10) || 0,
        samples_collected: collectedCount,
        pending_collections: parseInt(p.pending_collections, 10) || 0,
        total_collection_volume: Math.round(collectionVolume * 100) / 100,
        total_partner_income: partnerIncome,
        lab_net_revenue: labNetRevenue
      };
    });

    const grandTotalLabNet = Math.max(0, Math.round((grandTotalCollectionVolume - grandTotalPartnerIncome) * 100) / 100);

    return res.json({
      success: true,
      partners,
      summary: {
        total_partners: partners.length,
        active_partners: partners.filter((p) => p.status === 'active').length,
        grand_total_assigned: grandTotalAssigned,
        grand_total_collected: grandTotalCollected,
        grand_total_pending: grandTotalPending,
        grand_total_collection_volume: Math.round(grandTotalCollectionVolume * 100) / 100,
        grand_total_partner_income: Math.round(grandTotalPartnerIncome * 100) / 100,
        grand_total_lab_net: grandTotalLabNet
      }
    });
  } catch (error) {
    console.error('Admin get all partners error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving partners list.' });
  }
}

/**
 * ADMIN: Create a new partner
 */
async function createPartnerAdmin(req, res) {
  try {
    const { name, email, mobile, password, city, area, commission_rate, fixed_fee, status } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile, and password are required to create a partner.'
      });
    }

    // Check duplicate email or mobile
    const existing = await pool.query(
      'SELECT id FROM partners WHERE LOWER(email) = LOWER($1) OR mobile = $2',
      [email.trim(), mobile.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A partner with this email or mobile number already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const parsedCommission = parseFloat(commission_rate) || 15.0;
    const parsedFixed = parseFloat(fixed_fee) || 0.0;

    const insertRes = await pool.query(`
      INSERT INTO partners (
        name, email, mobile, password_hash, city, area,
        commission_rate, fixed_fee, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, email, mobile, city, area, commission_rate, fixed_fee, status, created_at;
    `, [
      name.trim(),
      email.trim().toLowerCase(),
      mobile.trim(),
      passwordHash,
      city ? city.trim() : 'Bengaluru',
      area ? area.trim() : null,
      parsedCommission,
      parsedFixed,
      status || 'active'
    ]);

    return res.status(201).json({
      success: true,
      message: 'Partner created successfully!',
      partner: insertRes.rows[0]
    });
  } catch (error) {
    console.error('Create partner error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating partner.' });
  }
}

/**
 * ADMIN: Update partner details
 */
async function updatePartnerAdmin(req, res) {
  try {
    const { id } = req.params;
    const { name, email, mobile, password, city, area, commission_rate, fixed_fee, status } = req.body;

    const existingRes = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    const current = existingRes.rows[0];

    // Check email conflict
    if (email && email.toLowerCase() !== current.email.toLowerCase()) {
      const emailCheck = await pool.query('SELECT id FROM partners WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), id]);
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Email already used by another partner.' });
      }
    }

    let passwordHash = current.password_hash;
    if (password && password.trim().length > 0) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updateRes = await pool.query(`
      UPDATE partners
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        mobile = COALESCE($3, mobile),
        password_hash = $4,
        city = COALESCE($5, city),
        area = COALESCE($6, area),
        commission_rate = COALESCE($7, commission_rate),
        fixed_fee = COALESCE($8, fixed_fee),
        status = COALESCE($9, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, name, email, mobile, city, area, commission_rate, fixed_fee, status, updated_at;
    `, [
      name ? name.trim() : null,
      email ? email.trim().toLowerCase() : null,
      mobile ? mobile.trim() : null,
      passwordHash,
      city !== undefined ? city : null,
      area !== undefined ? area : null,
      commission_rate !== undefined ? parseFloat(commission_rate) : null,
      fixed_fee !== undefined ? parseFloat(fixed_fee) : null,
      status || null,
      id
    ]);

    return res.json({
      success: true,
      message: 'Partner updated successfully!',
      partner: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Update partner error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating partner.' });
  }
}

/**
 * ADMIN: Delete partner
 */
async function deletePartnerAdmin(req, res) {
  try {
    const { id } = req.params;

    // Check partner
    const existing = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Partner not found.' });
    }

    // Set partner_id to null on assigned bookings to avoid foreign key issues
    await pool.query('UPDATE bookings SET partner_id = NULL WHERE partner_id = $1', [id]);

    await pool.query('DELETE FROM partners WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Partner deleted successfully. Assigned bookings have been unassigned.'
    });
  } catch (error) {
    console.error('Delete partner error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting partner.' });
  }
}

/**
 * ADMIN: Assign booking / patient to a partner
 */
async function assignBookingToPartner(req, res) {
  try {
    const { booking_id, partner_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    const bookingRes = await pool.query('SELECT * FROM bookings WHERE id = $1', [booking_id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    const booking = bookingRes.rows[0];

    let partner = null;
    if (partner_id) {
      const partnerRes = await pool.query('SELECT id, name, mobile, email, status FROM partners WHERE id = $1', [partner_id]);
      if (partnerRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Selected partner not found.' });
      }
      partner = partnerRes.rows[0];
      if (partner.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Cannot assign to an inactive partner.' });
      }
    }

    const assignedTime = partner ? new Date() : null;
    const targetPartnerId = partner ? partner.id : null;

    const updateRes = await pool.query(`
      UPDATE bookings
      SET 
        partner_id = $1,
        partner_assigned_at = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `, [targetPartnerId, assignedTime, booking_id]);

    // Send patient notification if partner assigned
    if (partner && booking.user_id) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, $2, $3, 'booking', $4)
      `, [
        booking.user_id,
        `Sample Collector Assigned: ${partner.name}`,
        `Your sample collector ${partner.name} (Mobile: ${partner.mobile}) has been assigned to visit you for booking ${booking.booking_code}.`,
        `/bookings`
      ]);
    }

    return res.json({
      success: true,
      message: partner 
        ? `Booking successfully assigned to partner ${partner.name}!` 
        : 'Partner unassigned successfully from booking.',
      booking: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Assign booking to partner error:', error);
    return res.status(500).json({ success: false, message: 'Server error assigning partner.' });
  }
}

/**
 * Quick list of active partners for select dropdowns
 */
async function getPartnersListQuick(req, res) {
  try {
    const result = await pool.query(`
      SELECT id, name, email, mobile, city, area, commission_rate, fixed_fee
      FROM partners
      WHERE status = 'active'
      ORDER BY name ASC
    `);

    return res.json({
      success: true,
      partners: result.rows
    });
  } catch (error) {
    console.error('Get quick partners list error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving partner options.' });
  }
}

module.exports = {
  partnerLogin,
  getPartnerProfile,
  getPartnerAssignedBookings,
  updatePartnerCollectionStatus,
  getAllPartnersAdmin,
  createPartnerAdmin,
  updatePartnerAdmin,
  deletePartnerAdmin,
  assignBookingToPartner,
  getPartnersListQuick
};
