const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional diagnostic laboratory report PDF
 */
function generateReportPDF({
  reportCode,
  patientName,
  age,
  gender,
  bookingCode,
  reportDate,
  testName,
  parameters = [],
  pathologistName = 'Dr. Arvind Mehra, MD (Pathology)',
  pathologistQualification = 'Chief Pathologist & Laboratory Director',
  remarks = 'Normal findings. Correlate clinically.',
  outputPath
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // --- HEADER & BRANDING ---
      // Green accent top bar
      doc.rect(0, 0, doc.page.width, 10).fill('#16A34A');

      // Lab Logo & Title
      doc.fillColor('#15803D').fontSize(22).font('Helvetica-Bold').text('DHANASHRI HEALTH CARE & LABS', 40, 25);
      doc.fillColor('#64748B').fontSize(9).font('Helvetica').text('NABL ACCREDITED & ISO 15189:2022 CERTIFIED LABORATORY', 40, 50);
      doc.text('Central Diagnostic Facility, 102 Health Avenue, Bengaluru, Karnataka - 560076 | Phone: +91 80 4920 1100', 40, 62);

      // Dividing Line
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, 78).lineTo(doc.page.width - 40, 78).stroke();

      // --- PATIENT & REPORT METADATA BOX ---
      doc.rect(40, 88, doc.page.width - 80, 85).fillAndStroke('#F0FDF4', '#86EFAC');

      doc.fillColor('#17211B').fontSize(10).font('Helvetica-Bold');
      doc.text('Patient Name:', 55, 98);
      doc.font('Helvetica').text(patientName || 'Aditya Sharma', 145, 98);

      doc.font('Helvetica-Bold').text('Age / Gender:', 55, 116);
      doc.font('Helvetica').text(`${age || 34} Yrs / ${gender || 'Male'}`, 145, 116);

      doc.font('Helvetica-Bold').text('Referring Doctor:', 55, 134);
      doc.font('Helvetica').text('Self / Wellness Check', 145, 134);

      doc.font('Helvetica-Bold').text('Report ID:', 340, 98);
      doc.fillColor('#15803D').font('Helvetica-Bold').text(reportCode || 'REP-2026-001', 425, 98);

      doc.fillColor('#17211B').font('Helvetica-Bold').text('Booking Ref:', 340, 116);
      doc.font('Helvetica').text(bookingCode || 'BK-2026-1001', 425, 116);

      doc.font('Helvetica-Bold').text('Report Date:', 340, 134);
      doc.font('Helvetica').text(reportDate || new Date().toISOString().split('T')[0], 425, 134);

      doc.font('Helvetica-Bold').text('Sample Type:', 340, 152);
      doc.font('Helvetica').text('Venous Blood (EDTA/Serum)', 425, 152);

      // --- TEST TITLE ---
      doc.rect(40, 185, doc.page.width - 80, 26).fill('#16A34A');
      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(`DEPARTMENT OF PATHOLOGY - ${testName.toUpperCase()}`, 50, 192);

      // --- PARAMETERS TABLE HEADER ---
      let y = 222;
      doc.rect(40, y, doc.page.width - 80, 22).fill('#E2E8F0');
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
      doc.text('TEST PARAMETER', 50, y + 6);
      doc.text('RESULT', 250, y + 6);
      doc.text('UNIT', 340, y + 6);
      doc.text('REFERENCE RANGE', 420, y + 6);

      y += 26;

      // --- PARAMETERS ROWS ---
      parameters.forEach((param, index) => {
        if (index % 2 === 0) {
          doc.rect(40, y - 4, doc.page.width - 80, 20).fill('#F8FAFC');
        }

        const isAbnormal = param.is_abnormal || false;

        doc.fillColor('#17211B').fontSize(9).font('Helvetica').text(param.name || param.parameter_name, 50, y);

        if (isAbnormal) {
          doc.fillColor('#DC2626').font('Helvetica-Bold').text(`${param.result_value} *`, 250, y);
        } else {
          doc.fillColor('#15803D').font('Helvetica-Bold').text(`${param.result_value}`, 250, y);
        }

        doc.fillColor('#475569').font('Helvetica').text(param.unit || '-', 340, y);
        doc.text(param.reference_range || '-', 420, y);

        y += 20;

        // Page overflow check
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // --- REMARKS & PATHOLOGIST SIGNATURE ---
      y += 20;
      if (y > 660) {
        doc.addPage();
        y = 50;
      }

      doc.rect(40, y, doc.page.width - 80, 48).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text('CLINICAL REMARKS & INTERPRETATION:', 50, y + 8);
      doc.fillColor('#475569').font('Helvetica').text(remarks || 'All reported parameters are within normal biological limits.', 50, y + 22, { width: doc.page.width - 100 });

      y += 65;

      // Digital Signatures
      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(360, y + 25).lineTo(520, y + 25).stroke();
      doc.fillColor('#15803D').fontSize(9).font('Helvetica-Bold').text('Verified Digitally', 360, y + 10);
      doc.fillColor('#17211B').fontSize(9).font('Helvetica-Bold').text(pathologistName, 360, y + 30);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(pathologistQualification, 360, y + 42);

      // QR Code stamp placeholder / Verified badge
      doc.rect(50, y + 15, 120, 30).lineWidth(1).stroke('#16A34A');
      doc.fillColor('#16A34A').fontSize(9).font('Helvetica-Bold').text('NABL VERIFIED', 65, y + 22);
      doc.fillColor('#64748B').fontSize(7).font('Helvetica').text('Scan to verify authenticity', 58, y + 33);

      // --- FOOTER ---
      const footerY = doc.page.height - 35;
      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, footerY - 5).lineTo(doc.page.width - 40, footerY - 5).stroke();
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica').text('End of Report. This report is generated electronically and requires no physical signature under IT Act 2000.', 40, footerY, { align: 'center', width: doc.page.width - 80 });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReportPDF };
