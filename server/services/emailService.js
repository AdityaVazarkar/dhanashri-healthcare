const nodemailer = require('nodemailer');

// Setup transporter with fallbacks
let transporter;

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'care@dhanashrihealthcare.com',
      pass: process.env.EMAIL_PASSWORD || 'demosecret',
    },
    tls: {
      rejectUnauthorized: false
    }
  });
} catch (err) {
  console.warn('Nodemailer configuration error, using mock sender:', err.message);
}

/**
 * Send email helper with automatic fallback
 */
async function sendEmail({ to, subject, html, text }) {
  console.log(`[Email Service] Sending "${subject}" to ${to}`);
  
  if (!transporter || process.env.EMAIL_HOST === 'smtp.ethereal.email') {
    // Development mode log for immediate verification
    console.log(`[Email Mock Sent] TO: ${to} | SUBJECT: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Dhanashri Health Care" <${process.env.EMAIL_USER || 'noreply@dhanashrihealthcare.com'}>`,
      to,
      subject,
      text: text || '',
      html: html || text,
    });
    console.log('[Email Sent Successfully]', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Send Error - continuing without failure]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Report Ready Email
 */
async function sendReportReadyEmail(patientEmail, patientName, testName, reportCode) {
  const subject = 'Your Laboratory Report is Ready - Dhanashri Health Care';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #16A34A; padding: 15px; border-radius: 6px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Dhanashri Health Care & Diagnostics</h1>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #17211B;">Hello <strong>${patientName}</strong>,</p>
        <p style="font-size: 15px; color: #334155;">Your diagnostic report for <strong>${testName}</strong> (Report ID: <strong>${reportCode}</strong>) is now verified by our chief pathologist and available for download.</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports" style="background-color: #16A34A; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">View & Download Report</a>
        </div>
        <p style="font-size: 14px; color: #64748B;">Please login to your secure patient portal to view the complete parameter analysis and reference ranges.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94A3B8; text-align: center;">
        Dhanashri Health Care • NABL Certified • 24/7 Helpline: +91 80 4920 1100
      </div>
    </div>
  `;
  return sendEmail({ to: patientEmail, subject, html });
}

/**
 * Send Booking Confirmation Email
 */
async function sendBookingConfirmationEmail(patientEmail, patientName, bookingCode, appointmentDate, timeSlot, totalAmount) {
  const subject = `Booking Confirmed: ${bookingCode} - Dhanashri Health Care`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="background-color: #16A34A; padding: 15px; border-radius: 6px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Dhanashri Health Care & Diagnostics</h1>
      </div>
      <div style="padding: 20px 0;">
        <p style="font-size: 16px; color: #17211B;">Hello <strong>${patientName}</strong>,</p>
        <p style="font-size: 15px; color: #334155;">Thank you for booking with us. Your appointment has been scheduled successfully.</p>
        <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 4px 0; color: #15803D;"><strong>Booking ID:</strong> ${bookingCode}</p>
          <p style="margin: 4px 0; color: #15803D;"><strong>Date:</strong> ${appointmentDate}</p>
          <p style="margin: 4px 0; color: #15803D;"><strong>Slot:</strong> ${timeSlot}</p>
          <p style="margin: 4px 0; color: #15803D;"><strong>Total Amount:</strong> ₹${totalAmount}</p>
        </div>
        <p style="font-size: 14px; color: #64748B;">Our certified phlebotomist will contact you prior to sample collection. Please ensure recommended fasting hours if applicable.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: patientEmail, subject, html });
}

module.exports = {
  sendEmail,
  sendReportReadyEmail,
  sendBookingConfirmationEmail
};
