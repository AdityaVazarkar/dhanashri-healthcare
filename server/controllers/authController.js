const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Register User
 */
async function register(req, res) {
  try {
    const { fullName, email, mobile, dob, gender, password, confirmPassword } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const emailClean = email.trim().toLowerCase();
    const mobileClean = mobile.trim();

    // Check existing email or mobile
    const existingUser = await pool.query(
      'SELECT id, email, mobile FROM users WHERE email = $1 OR mobile = $2',
      [emailClean, mobileClean]
    );

    if (existingUser.rows.length > 0) {
      const match = existingUser.rows[0];
      if (match.email === emailClean) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      return res.status(400).json({ success: false, message: 'An account with this mobile number already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserRes = await pool.query(`
      INSERT INTO users (full_name, email, mobile, dob, gender, password_hash, status, role)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', 'user')
      RETURNING id, full_name, email, mobile, dob, gender, role, created_at;
    `, [fullName.trim(), emailClean, mobileClean, dob || null, gender || 'Other', passwordHash]);

    const user = newUserRes.rows[0];
    const token = generateToken({ id: user.id, email: user.email, role: 'user' });

    // Insert welcome notification
    await pool.query(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link)
      VALUES ($1, 'Welcome to Dhanashri Health Care!', 'Your account has been successfully created. Explore our diagnostic tests.', 'account', false, '/dashboard')
    `, [user.id]);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

/**
 * User Login (Email or Mobile)
 */
async function login(req, res) {
  try {
    const { identifier, email, mobile, password } = req.body;
    const loginId = (identifier || email || mobile || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/mobile and password.' });
    }

    const userRes = await pool.query(`
      SELECT id, full_name, email, mobile, dob, gender, password_hash, address, landmark, city, pincode, status, role
      FROM users 
      WHERE LOWER(email) = LOWER($1) OR mobile = $1;
    `, [loginId]);

    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const user = userRes.rows[0];

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Please contact customer support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Do not leak password hash
    delete user.password_hash;

    const token = generateToken({ id: user.id, email: user.email, role: user.role || 'user' });

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

/**
 * Admin Login
 */
async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide admin email and password.' });
    }

    const adminRes = await pool.query(`
      SELECT id, name, email, password_hash, role, status
      FROM admins
      WHERE LOWER(email) = LOWER($1);
    `, [email.trim()]);

    if (adminRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const admin = adminRes.rows[0];
    if (admin.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Admin account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials.' });
    }

    delete admin.password_hash;
    const token = generateToken({ id: admin.id, email: admin.email, role: admin.role || 'superadmin' });

    return res.json({
      success: true,
      message: 'Admin authenticated successfully!',
      token,
      admin
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
}

/**
 * Get Current Authenticated Profile
 */
async function getMe(req, res) {
  try {
    if (req.isAdmin) {
      const adminRes = await pool.query('SELECT id, name, email, role, status FROM admins WHERE id = $1', [req.user.id]);
      if (adminRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }
      return res.json({ success: true, user: adminRes.rows[0], isAdmin: true });
    }

    const userRes = await pool.query(`
      SELECT id, full_name, email, mobile, dob, gender, address, landmark, city, pincode, status, role, created_at
      FROM users WHERE id = $1;
    `, [req.user.id]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: userRes.rows[0], isAdmin: false });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
}

/**
 * Update User Profile
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, mobile, dob, gender, address, landmark, city, pincode } = req.body;

    // Check if new mobile is taken by someone else
    if (mobile) {
      const mobileCheck = await pool.query('SELECT id FROM users WHERE mobile = $1 AND id != $2', [mobile.trim(), userId]);
      if (mobileCheck.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Mobile number is already registered with another account.' });
      }
    }

    const updated = await pool.query(`
      UPDATE users
      SET 
        full_name = COALESCE($1, full_name),
        mobile = COALESCE($2, mobile),
        dob = COALESCE($3, dob),
        gender = COALESCE($4, gender),
        address = COALESCE($5, address),
        landmark = COALESCE($6, landmark),
        city = COALESCE($7, city),
        pincode = COALESCE($8, pincode),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, full_name, email, mobile, dob, gender, address, landmark, city, pincode, status, role;
    `, [
      fullName ? fullName.trim() : null,
      mobile ? mobile.trim() : null,
      dob || null,
      gender || null,
      address || null,
      landmark || null,
      city || null,
      pincode || null,
      userId
    ]);

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
}

/**
 * Change Password
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new passwords.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const targetTable = req.isAdmin ? 'admins' : 'users';
    const pwdRes = await pool.query(`SELECT password_hash FROM ${targetTable} WHERE id = $1`, [userId]);

    if (pwdRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, pwdRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE ${targetTable} SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newHash, userId]);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error changing password.' });
  }
}

/**
 * Forgot Password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your email.' });
    }

    const emailClean = email.trim().toLowerCase();
    const userRes = await pool.query('SELECT id, full_name, email FROM users WHERE LOWER(email) = $1', [emailClean]);

    if (userRes.rows.length === 0) {
      // Don't disclose account existence for security
      return res.json({ success: true, message: 'If an account exists with that email, a password reset link has been dispatched.' });
    }

    const user = userRes.rows[0];
    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, expiry, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - Dhanashri Health Care',
      html: `<p>Hello ${user.full_name},</p><p>You requested a password reset. Please click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p><p>Reset Token: <code>${resetToken}</code></p>`
    });

    return res.json({
      success: true,
      message: 'Password reset link sent to your email address.',
      demoToken: resetToken // Provided for effortless local dev verification
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing reset request.' });
  }
}

/**
 * Reset Password with token
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    const userRes = await pool.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP',
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const userId = userRes.rows[0].id;
    const newHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, userId]
    );

    return res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
