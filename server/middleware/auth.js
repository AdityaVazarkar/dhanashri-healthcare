const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_blood_lab_jwt_secret_key_2026_xyz';

/**
 * Authenticate standard patient/user
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // If admin is using standard endpoint, allow or check user
    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      req.user = decoded;
      req.isAdmin = true;
      return next();
    }

    const userRes = await pool.query('SELECT id, full_name, email, mobile, role, status FROM users WHERE id = $1', [decoded.id]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = userRes.rows[0];
    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
    }

    req.user = user;
    req.isAdmin = false;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

/**
 * Authenticate admin only
 */
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Admin authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'superadmin' && decoded.role !== 'lab_manager') {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
    }

    const adminRes = await pool.query('SELECT id, name, email, role, status FROM admins WHERE id = $1', [decoded.id]);
    if (adminRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Admin record not found.' });
    }

    const admin = adminRes.rows[0];
    if (admin.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Admin account is deactivated.' });
    }

    req.admin = admin;
    req.user = admin; // For compatible handlers
    req.isAdmin = true;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Admin session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid admin token.' });
  }
}

/**
 * Authenticate sample collection partner
 */
async function authenticatePartner(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Partner authentication required. Please login.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Access denied. Sample partner credentials required.' });
    }

    const partnerRes = await pool.query(
      'SELECT id, name, email, mobile, city, area, commission_rate, fixed_fee, status FROM partners WHERE id = $1',
      [decoded.id]
    );

    if (partnerRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Partner profile not found.' });
    }

    const partner = partnerRes.rows[0];
    if (partner.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Partner account is deactivated. Please contact lab admin.' });
    }

    req.partner = partner;
    req.user = partner;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Partner session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid partner token.' });
  }
}

/**
 * Optional authentication (allows guest or logged-in user)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin' || decoded.role === 'superadmin') {
        req.user = decoded;
        req.isAdmin = true;
      } else {
        const userRes = await pool.query('SELECT id, full_name, email, mobile, role, status FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rows.length > 0) {
          req.user = userRes.rows[0];
        }
      }
    }
  } catch (err) {
    // Ignore invalid token in optional auth
  }
  next();
}

module.exports = {
  authenticateUser,
  authenticateAdmin,
  authenticatePartner,
  optionalAuth,
  JWT_SECRET
};
