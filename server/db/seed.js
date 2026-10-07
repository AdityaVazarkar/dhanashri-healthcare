const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');
const { generateReportPDF } = require('../utils/pdfGenerator');

async function seed() {
  console.log('Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'reports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1. Seed Admin
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    await client.query(`
      INSERT INTO admins (name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;
    `, ['Dr. Mehra Lab Admin', 'admin@lab.com', adminPasswordHash, 'superadmin', 'active']);
    console.log('Admin seeded: admin@lab.com / Admin@123');

    // 2. Seed Demo User
    const userPasswordHash = await bcrypt.hash('Patient@123', 10);
    const userRes = await client.query(`
      INSERT INTO users (full_name, email, mobile, dob, gender, password_hash, address, landmark, city, pincode, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash
      RETURNING id, full_name, email;
    `, [
      'Aditya Sharma',
      'patient@example.com',
      '9876543210',
      '1992-05-15',
      'Male',
      userPasswordHash,
      'Flat 402, Green Orchid Apartments, Bannerghatta Road',
      'Near Apollo Clinic',
      'Bengaluru',
      '560076',
      'active'
    ]);
    const userId = userRes.rows[0].id;
    console.log(`Demo User seeded: patient@example.com / Patient@123 (ID: ${userId})`);

    // 3. Seed Time Slots
    const timeSlots = [
      '07:00 AM - 08:00 AM',
      '08:00 AM - 09:00 AM',
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '04:00 PM - 05:00 PM',
      '05:00 PM - 06:00 PM'
    ];
    for (const slot of timeSlots) {
      await client.query(`
        INSERT INTO time_slots (slot_time, label, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT DO NOTHING;
      `, [slot, slot]);
    }

    // 4. Seed Categories
    const categories = [
      { name: 'Hematology', slug: 'hematology', description: 'Comprehensive blood cell counts, coagulation and morphological analysis.', icon: 'droplet' },
      { name: 'Biochemistry', slug: 'biochemistry', description: 'Liver, kidney, lipid, electrolyte and vital metabolic profiling.', icon: 'flask-conical' },
      { name: 'Pathology & Clinical Microscopy', slug: 'pathology', description: 'Urine, stool, fluid analysis and cellular evaluation.', icon: 'microscope' },
      { name: 'Immunology & Serology', slug: 'immunology', description: 'Infectious markers, antibodies and inflammatory diagnostics.', icon: 'shield-check' },
      { name: 'Microbiology & Cultures', slug: 'microbiology', description: 'Bacterial and fungal culture identification and antibiotic sensitivity.', icon: 'dna' },
      { name: 'Hormones & Endocrinology', slug: 'hormones', description: 'Thyroid, fertility, steroid and endocrine hormone tests.', icon: 'activity' },
      { name: 'Vitamins & Minerals', slug: 'vitamins', description: 'Essential micronutrients including Vitamin D, B12 and Iron studies.', icon: 'sun' },
      { name: 'Diabetes Care', slug: 'diabetes', description: 'Blood glucose, HbA1c and insulin resistance monitoring.', icon: 'heart-pulse' },
      { name: 'Cardiology Markers', slug: 'cardiology', description: 'Cardiac enzymes, lipid breakdown and cardiovascular risk indicators.', icon: 'heart' }
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const res = await client.query(`
        INSERT INTO categories (name, slug, description, icon, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id, name;
      `, [cat.name, cat.slug, cat.description, cat.icon]);
      categoryMap[cat.name] = res.rows[0].id;
    }
    console.log(`Seeded ${categories.length} categories.`);

    // 5. Seed Tests & Parameters
    const testsData = [
      {
        name: 'CBC - Complete Blood Count with ESR',
        test_code: 'CBC001',
        category: 'Hematology',
        description: 'Complete hemogram assessing red blood cells, white blood cells, platelets, and hemoglobin levels with automated ESR.',
        price: 500,
        discount_price: 450,
        sample_type: 'EDTA Whole Blood (3 ml)',
        report_time: 'Same Day (Within 6 hours)',
        fasting_required: false,
        preparation_instructions: 'No special fasting is required. Stay adequately hydrated.',
        is_popular: true,
        parameters: [
          { name: 'Hemoglobin', unit: 'g/dL', reference_range: '13.0 - 17.0', is_abnormal: false, default_val: '14.6' },
          { name: 'Total WBC Count', unit: 'cells/cu.mm', reference_range: '4000 - 11000', is_abnormal: false, default_val: '6800' },
          { name: 'RBC Count', unit: 'million/cu.mm', reference_range: '4.5 - 5.5', is_abnormal: false, default_val: '4.9' },
          { name: 'Platelet Count', unit: 'lakhs/cu.mm', reference_range: '1.5 - 4.5', is_abnormal: false, default_val: '2.8' },
          { name: 'Packed Cell Volume (PCV)', unit: '%', reference_range: '40 - 50', is_abnormal: false, default_val: '43.2' },
          { name: 'MCV', unit: 'fL', reference_range: '80 - 100', is_abnormal: false, default_val: '88.1' },
          { name: 'MCH', unit: 'pg', reference_range: '27 - 32', is_abnormal: false, default_val: '29.8' },
          { name: 'MCHC', unit: 'g/dL', reference_range: '31 - 36', is_abnormal: false, default_val: '33.8' },
          { name: 'Neutrophils', unit: '%', reference_range: '40 - 70', is_abnormal: false, default_val: '58' },
          { name: 'Lymphocytes', unit: '%', reference_range: '20 - 40', is_abnormal: false, default_val: '32' },
          { name: 'Eosinophils', unit: '%', reference_range: '1 - 6', is_abnormal: false, default_val: '3' },
          { name: 'Monocytes', unit: '%', reference_range: '2 - 8', is_abnormal: false, default_val: '6' },
          { name: 'Basophils', unit: '%', reference_range: '0 - 1', is_abnormal: false, default_val: '1' },
          { name: 'ESR (Westergren)', unit: 'mm/1st hr', reference_range: '0 - 15', is_abnormal: false, default_val: '8' },
        ]
      },
      {
        name: 'Lipid Profile Comprehensive',
        test_code: 'LIP001',
        category: 'Biochemistry',
        description: 'Measures total cholesterol, good HDL, bad LDL, and triglycerides to determine cardiovascular health risks.',
        price: 850,
        discount_price: 699,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 8 hours)',
        fasting_required: true,
        preparation_instructions: 'Strict 10-12 hours overnight fasting is required. Only plain water is permitted.',
        is_popular: true,
        parameters: [
          { name: 'Total Cholesterol', unit: 'mg/dL', reference_range: '< 200', is_abnormal: false, default_val: '178' },
          { name: 'Triglycerides', unit: 'mg/dL', reference_range: '< 150', is_abnormal: true, default_val: '168' },
          { name: 'HDL Cholesterol (Good)', unit: 'mg/dL', reference_range: '> 40', is_abnormal: false, default_val: '46' },
          { name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', reference_range: '< 100', is_abnormal: false, default_val: '98' },
          { name: 'VLDL Cholesterol', unit: 'mg/dL', reference_range: '< 30', is_abnormal: true, default_val: '34' },
          { name: 'Total Chol / HDL Ratio', unit: 'Ratio', reference_range: '3.3 - 4.4', is_abnormal: false, default_val: '3.8' }
        ]
      },
      {
        name: 'Liver Function Test (LFT)',
        test_code: 'LFT001',
        category: 'Biochemistry',
        description: 'Comprehensive liver enzyme, bilirubin and protein panel diagnosing hepatic function and bile duct status.',
        price: 800,
        discount_price: 650,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 8 hours)',
        fasting_required: true,
        preparation_instructions: '8-10 hours fasting is recommended for optimal precision.',
        is_popular: true,
        parameters: [
          { name: 'Bilirubin - Total', unit: 'mg/dL', reference_range: '0.2 - 1.2', is_abnormal: false, default_val: '0.85' },
          { name: 'Bilirubin - Direct', unit: 'mg/dL', reference_range: '0.0 - 0.3', is_abnormal: false, default_val: '0.20' },
          { name: 'SGOT / AST', unit: 'U/L', reference_range: '10 - 40', is_abnormal: false, default_val: '24' },
          { name: 'SGPT / ALT', unit: 'U/L', reference_range: '10 - 45', is_abnormal: false, default_val: '31' },
          { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', reference_range: '40 - 130', is_abnormal: false, default_val: '86' },
          { name: 'Total Protein', unit: 'g/dL', reference_range: '6.4 - 8.3', is_abnormal: false, default_val: '7.2' },
          { name: 'Serum Albumin', unit: 'g/dL', reference_range: '3.5 - 5.0', is_abnormal: false, default_val: '4.4' },
          { name: 'A/G Ratio', unit: 'Ratio', reference_range: '1.2 - 2.2', is_abnormal: false, default_val: '1.6' }
        ]
      },
      {
        name: 'Kidney Function Test (KFT / RFT)',
        test_code: 'KFT001',
        category: 'Biochemistry',
        description: 'Evaluates renal filtration, serum creatinine, BUN, uric acid, and critical electrolytes.',
        price: 850,
        discount_price: 699,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 8 hours)',
        fasting_required: false,
        preparation_instructions: 'Fasting not strictly required. Avoid high-protein meal 12 hours prior.',
        is_popular: true,
        parameters: [
          { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', reference_range: '7 - 20', is_abnormal: false, default_val: '14.2' },
          { name: 'Serum Creatinine', unit: 'mg/dL', reference_range: '0.7 - 1.3', is_abnormal: false, default_val: '0.98' },
          { name: 'Serum Uric Acid', unit: 'mg/dL', reference_range: '3.5 - 7.2', is_abnormal: false, default_val: '5.4' },
          { name: 'Serum Calcium', unit: 'mg/dL', reference_range: '8.8 - 10.2', is_abnormal: false, default_val: '9.4' },
          { name: 'Estimated GFR (eGFR)', unit: 'mL/min/1.73m²', reference_range: '> 90', is_abnormal: false, default_val: '104' }
        ]
      },
      {
        name: 'Thyroid Profile Total (T3, T4, TSH)',
        test_code: 'THY001',
        category: 'Hormones & Endocrinology',
        description: 'Complete hormonal assay measuring total T3, total T4 and ultra-sensitive TSH to diagnose hyper/hypothyroidism.',
        price: 650,
        discount_price: 550,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 8 hours)',
        fasting_required: true,
        preparation_instructions: 'Overnight fasting preferred. Take thyroid medications after blood collection.',
        is_popular: true,
        parameters: [
          { name: 'Total Triiodothyronine (T3)', unit: 'ng/dL', reference_range: '70 - 200', is_abnormal: false, default_val: '125' },
          { name: 'Total Thyroxine (T4)', unit: 'µg/dL', reference_range: '4.8 - 12.0', is_abnormal: false, default_val: '7.8' },
          { name: 'TSH (Ultrasensitive)', unit: 'µIU/mL', reference_range: '0.4 - 4.5', is_abnormal: false, default_val: '2.14' }
        ]
      },
      {
        name: 'HbA1c - Glycated Hemoglobin',
        test_code: 'HBA001',
        category: 'Diabetes Care',
        description: 'Provides 3-month average blood glucose levels using HPLC gold-standard method.',
        price: 550,
        discount_price: 490,
        sample_type: 'EDTA Whole Blood (2 ml)',
        report_time: 'Same Day (Within 6 hours)',
        fasting_required: false,
        preparation_instructions: 'No fasting required. Test can be done any time of day.',
        is_popular: true,
        parameters: [
          { name: 'HbA1c Glycated Hemoglobin', unit: '%', reference_range: '< 5.7 (Normal)', is_abnormal: false, default_val: '5.4' },
          { name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', reference_range: '70 - 126', is_abnormal: false, default_val: '108' }
        ]
      },
      {
        name: 'Fasting Blood Sugar (FBS)',
        test_code: 'FBS001',
        category: 'Diabetes Care',
        description: 'Quantifies plasma glucose concentration following an overnight fast.',
        price: 150,
        discount_price: 120,
        sample_type: 'Fluoride Plasma (2 ml)',
        report_time: 'Same Day (Within 4 hours)',
        fasting_required: true,
        preparation_instructions: 'Strict 8 to 10 hours overnight fasting required.',
        is_popular: true,
        parameters: [
          { name: 'Fasting Blood Glucose', unit: 'mg/dL', reference_range: '70 - 99', is_abnormal: false, default_val: '88' }
        ]
      },
      {
        name: 'Post Prandial Blood Sugar (PPBS)',
        test_code: 'PPB001',
        category: 'Diabetes Care',
        description: 'Quantifies plasma glucose 2 hours after breakfast or meal consumption.',
        price: 150,
        discount_price: 120,
        sample_type: 'Fluoride Plasma (2 ml)',
        report_time: 'Same Day (Within 4 hours)',
        fasting_required: false,
        preparation_instructions: 'Sample must be collected exactly 2 hours after starting your meal.',
        is_popular: false,
        parameters: [
          { name: 'Post Prandial Blood Glucose', unit: 'mg/dL', reference_range: '< 140', is_abnormal: false, default_val: '118' }
        ]
      },
      {
        name: 'Vitamin D 25-Hydroxy Total',
        test_code: 'VIT001',
        category: 'Vitamins & Minerals',
        description: 'Immunoassay assessing active circulating 25-OH Vitamin D levels for bone and immune health.',
        price: 1200,
        discount_price: 899,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Next Day (Within 24 hours)',
        fasting_required: false,
        preparation_instructions: 'No fasting required.',
        is_popular: true,
        parameters: [
          { name: '25-OH Vitamin D Total', unit: 'ng/mL', reference_range: '30.0 - 100.0 (Sufficient)', is_abnormal: true, default_val: '22.4' }
        ]
      },
      {
        name: 'Vitamin B12 (Cyanocobalamin)',
        test_code: 'VIT002',
        category: 'Vitamins & Minerals',
        description: 'Measures nerve & red blood cell protective Vitamin B12 levels.',
        price: 1000,
        discount_price: 799,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 12 hours)',
        fasting_required: true,
        preparation_instructions: 'Overnight fasting recommended for highest accuracy.',
        is_popular: true,
        parameters: [
          { name: 'Vitamin B12 Level', unit: 'pg/mL', reference_range: '211 - 911', is_abnormal: false, default_val: '345' }
        ]
      },
      {
        name: 'Iron Deficiency Profile / Serum Ferritin',
        test_code: 'IRN001',
        category: 'Vitamins & Minerals',
        description: 'Evaluates total iron stores, ferritin, transferrin saturation and total iron binding capacity.',
        price: 950,
        discount_price: 750,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 8 hours)',
        fasting_required: true,
        preparation_instructions: '10 hours fasting required. Collect morning sample if possible.',
        is_popular: false,
        parameters: [
          { name: 'Serum Iron', unit: 'µg/dL', reference_range: '65 - 175', is_abnormal: false, default_val: '88' },
          { name: 'Total Iron Binding Capacity (TIBC)', unit: 'µg/dL', reference_range: '250 - 450', is_abnormal: false, default_val: '320' },
          { name: 'Serum Ferritin', unit: 'ng/mL', reference_range: '30 - 400', is_abnormal: false, default_val: '110' },
          { name: 'Transferrin Saturation', unit: '%', reference_range: '20 - 50', is_abnormal: false, default_val: '27.5' }
        ]
      },
      {
        name: 'hs-CRP (High Sensitivity C-Reactive Protein)',
        test_code: 'CRP001',
        category: 'Immunology & Serology',
        description: 'Sensitive cardiovascular risk marker and systemic inflammation indicator.',
        price: 650,
        discount_price: 520,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 6 hours)',
        fasting_required: false,
        preparation_instructions: 'No special preparation needed.',
        is_popular: true,
        parameters: [
          { name: 'hs-CRP Quantitative', unit: 'mg/L', reference_range: '< 1.0 (Low Cardio Risk)', is_abnormal: false, default_val: '0.8' }
        ]
      },
      {
        name: 'Urine Routine & Microscopic Examination',
        test_code: 'URN001',
        category: 'Pathology & Clinical Microscopy',
        description: 'Analyzes physical, chemical, and microscopic characteristics of urine for renal or urinary tract disorders.',
        price: 250,
        discount_price: 200,
        sample_type: 'First Morning Mid-Stream Urine (20 ml)',
        report_time: 'Same Day (Within 4 hours)',
        fasting_required: false,
        preparation_instructions: 'Clean-catch midstream urine sample in sterile container provided by lab.',
        is_popular: true,
        parameters: [
          { name: 'Urine Color', unit: '-', reference_range: 'Pale Yellow', is_abnormal: false, default_val: 'Pale Yellow' },
          { name: 'Appearance', unit: '-', reference_range: 'Clear', is_abnormal: false, default_val: 'Clear' },
          { name: 'Specific Gravity', unit: '-', reference_range: '1.005 - 1.030', is_abnormal: false, default_val: '1.018' },
          { name: 'pH', unit: '-', reference_range: '5.0 - 7.5', is_abnormal: false, default_val: '6.2' },
          { name: 'Urine Protein / Albumin', unit: '-', reference_range: 'Nil', is_abnormal: false, default_val: 'Nil' },
          { name: 'Urine Glucose', unit: '-', reference_range: 'Nil', is_abnormal: false, default_val: 'Nil' },
          { name: 'Pus Cells (WBCs)', unit: '/hpf', reference_range: '0 - 5', is_abnormal: false, default_val: '1 - 2' },
          { name: 'Red Blood Cells (RBCs)', unit: '/hpf', reference_range: 'Nil', is_abnormal: false, default_val: 'Nil' }
        ]
      },
      {
        name: 'Serum Electrolytes (Na+, K+, Cl-)',
        test_code: 'ELE001',
        category: 'Biochemistry',
        description: 'Quantifies essential serum electrolytes regulating hydration, pH, and cardiovascular rhythms.',
        price: 600,
        discount_price: 490,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 4 hours)',
        fasting_required: false,
        preparation_instructions: 'No fasting required.',
        is_popular: false,
        parameters: [
          { name: 'Serum Sodium (Na+)', unit: 'mmol/L', reference_range: '136 - 145', is_abnormal: false, default_val: '141' },
          { name: 'Serum Potassium (K+)', unit: 'mmol/L', reference_range: '3.5 - 5.1', is_abnormal: false, default_val: '4.2' },
          { name: 'Serum Chloride (Cl-)', unit: 'mmol/L', reference_range: '98 - 107', is_abnormal: false, default_val: '102' }
        ]
      },
      {
        name: 'Dengue NS1 Antigen & IgM/IgG Antibody',
        test_code: 'DEN001',
        category: 'Immunology & Serology',
        description: 'Rapid diagnostic screening test for acute Dengue viral infection and antibodies.',
        price: 1100,
        discount_price: 950,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 4 hours)',
        fasting_required: false,
        preparation_instructions: 'No fasting required. Recommended in early fever days.',
        is_popular: true,
        parameters: [
          { name: 'Dengue NS1 Antigen', unit: '-', reference_range: 'Negative', is_abnormal: false, default_val: 'Negative' },
          { name: 'Dengue IgM Antibody', unit: '-', reference_range: 'Negative', is_abnormal: false, default_val: 'Negative' },
          { name: 'Dengue IgG Antibody', unit: '-', reference_range: 'Negative', is_abnormal: false, default_val: 'Negative' }
        ]
      },
      {
        name: 'PSA Total (Prostate-Specific Antigen)',
        test_code: 'PSA001',
        category: 'Hormones & Endocrinology',
        description: 'Screening marker for prostate health, hyperplasia and oncology monitoring in men.',
        price: 900,
        discount_price: 750,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 8 hours)',
        fasting_required: false,
        preparation_instructions: 'Avoid cycling or intense exercise 48 hours before testing.',
        is_popular: false,
        parameters: [
          { name: 'Total PSA Level', unit: 'ng/mL', reference_range: '< 4.0', is_abnormal: false, default_val: '1.24' }
        ]
      },
      {
        name: 'ESR (Erythrocyte Sedimentation Rate)',
        test_code: 'ESR001',
        category: 'Hematology',
        description: 'Standard inflammatory rate test measuring RBC settling over one hour.',
        price: 150,
        discount_price: 120,
        sample_type: 'Sodium Citrate Blood (2 ml)',
        report_time: 'Same Day (Within 3 hours)',
        fasting_required: false,
        preparation_instructions: 'No fasting required.',
        is_popular: false,
        parameters: [
          { name: 'ESR (Westergren Method)', unit: 'mm/hr', reference_range: '0 - 15', is_abnormal: false, default_val: '7' }
        ]
      },
      {
        name: 'Calcium Serum Total',
        test_code: 'CAL001',
        category: 'Biochemistry',
        description: 'Monitors bone health, parathyroid glands and kidney metabolism.',
        price: 250,
        discount_price: 200,
        sample_type: 'Serum Blood (2 ml)',
        report_time: 'Same Day (Within 4 hours)',
        fasting_required: false,
        preparation_instructions: 'No special fasting needed.',
        is_popular: false,
        parameters: [
          { name: 'Total Calcium', unit: 'mg/dL', reference_range: '8.8 - 10.2', is_abnormal: false, default_val: '9.3' }
        ]
      }
    ];

    const testMap = {};
    for (const t of testsData) {
      const catId = categoryMap[t.category] || null;
      const res = await client.query(`
        INSERT INTO tests (name, test_code, category_id, description, price, discount_price, sample_type, report_time, fasting_required, preparation_instructions, status, is_popular)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $11)
        ON CONFLICT (test_code) DO UPDATE 
        SET price = EXCLUDED.price, discount_price = EXCLUDED.discount_price, description = EXCLUDED.description
        RETURNING id, name, test_code;
      `, [
        t.name,
        t.test_code,
        catId,
        t.description,
        t.price,
        t.discount_price,
        t.sample_type,
        t.report_time,
        t.fasting_required,
        t.preparation_instructions,
        t.is_popular
      ]);
      const createdTestId = res.rows[0].id;
      testMap[t.test_code] = createdTestId;

      // Seed parameters for this test
      let orderIndex = 1;
      for (const p of t.parameters) {
        await client.query(`
          INSERT INTO test_parameters (test_id, name, unit, reference_range, order_index)
          VALUES ($1, $2, $3, $4, $5);
        `, [createdTestId, p.name, p.unit, p.reference_range, orderIndex++]);
      }
    }
    console.log(`Seeded ${testsData.length} tests and their reference parameters.`);

    // 6. Seed Health Packages
    const packagesData = [
      {
        name: 'Basic Health Checkup',
        slug: 'basic-health-checkup',
        description: 'Essential preventive profile covering full hemogram, diabetes screen, lipid risk and vital organ health.',
        original_price: 2400,
        discount_price: 999,
        benefits: JSON.stringify(['Includes 32+ Vital Parameters', 'Free Home Blood Sample Collection', 'Certified Digital Report Same Day', 'Doctor Teleconsultation Consultation Voucher']),
        preparation_instructions: '10-12 hours overnight fasting mandatory. Water allowed.',
        is_featured: true,
        test_codes: ['CBC001', 'FBS001', 'LIP001', 'LFT001', 'KFT001']
      },
      {
        name: 'Complete Health Checkup',
        slug: 'complete-health-checkup',
        description: 'All-inclusive full body screening covering thyroid, vitamins, cardiac biomarkers, liver, kidneys and urine analysis.',
        original_price: 4800,
        discount_price: 1999,
        benefits: JSON.stringify(['Includes 65+ Comprehensive Parameters', 'Includes Vitamin D3 & Thyroid Screening', 'Doorstep Phlebotomist Visit', 'Detailed Organ-by-Organ Health Report']),
        preparation_instructions: '10-12 hours overnight fasting mandatory. Take thyroid pill after sample collection.',
        is_featured: true,
        test_codes: ['CBC001', 'LIP001', 'LFT001', 'KFT001', 'THY001', 'HBA001', 'VIT001', 'URN001']
      },
      {
        name: 'Diabetes Care & Metabolic Package',
        slug: 'diabetes-care-package',
        description: 'Focused diagnostic profile for diabetic and pre-diabetic patients monitoring glycemic control and organ risks.',
        original_price: 3100,
        discount_price: 1299,
        benefits: JSON.stringify(['Includes HbA1c 3-Month Glycemic Average', 'Kidney & Microalbuminuria Screening', 'Cardiovascular Lipid Index', 'Quarterly Tracking Guidance']),
        preparation_instructions: 'Overnight fasting required for FBS; sample for PPBS after standard breakfast.',
        is_featured: true,
        test_codes: ['HBA001', 'FBS001', 'PPB001', 'LIP001', 'KFT001', 'URN001']
      },
      {
        name: "Women's Health & Vitality Package",
        slug: 'womens-health-package',
        description: 'Tailored specifically for women addressing hormonal balance, anemia, bone density vitamins and thyroid function.',
        original_price: 4200,
        discount_price: 1799,
        benefits: JSON.stringify(['Hormonal & Thyroid Assessment', 'Iron Deficiency & Ferritin Battery', 'Bone Strength Vitamin D & Calcium', 'Complete Blood Analysis']),
        preparation_instructions: '10-12 hours overnight fasting recommended.',
        is_featured: true,
        test_codes: ['CBC001', 'THY001', 'VIT001', 'VIT002', 'IRN001', 'CAL001', 'URN001']
      },
      {
        name: "Men's Senior Health Package",
        slug: 'mens-health-package',
        description: 'Advanced checkup for men over 40 covering prostate PSA, heart profile, liver, kidney and metabolic fitness.',
        original_price: 4500,
        discount_price: 1799,
        benefits: JSON.stringify(['Includes Prostate Specific Antigen (PSA)', 'Cardiac Risk & Lipid Panel', 'Renal & Liver Function Battery', 'Diabetes & Glycemic Assessment']),
        preparation_instructions: '10-12 hours fasting. Avoid bicycle riding 48 hours prior.',
        is_featured: true,
        test_codes: ['CBC001', 'LIP001', 'LFT001', 'KFT001', 'HBA001', 'PSA001', 'VIT001']
      },
      {
        name: 'Comprehensive Heart & Cardiac Checkup',
        slug: 'heart-health-package',
        description: 'Targeted cardiovascular diagnostic evaluation measuring inflammation (hs-CRP), lipid ratios and metabolic risks.',
        original_price: 3800,
        discount_price: 1599,
        benefits: JSON.stringify(['hs-CRP High Sensitivity Inflammation Marker', 'Detailed Lipid Subfractions', 'Blood Sugar & Electrolytes', 'Atherosclerosis Risk Index']),
        preparation_instructions: '12 hours overnight fasting mandatory.',
        is_featured: false,
        test_codes: ['LIP001', 'CRP001', 'FBS001', 'KFT001', 'ELE001']
      }
    ];

    for (const pkg of packagesData) {
      const res = await client.query(`
        INSERT INTO packages (name, slug, description, original_price, discount_price, benefits, preparation_instructions, status, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
        ON CONFLICT (slug) DO UPDATE 
        SET original_price = EXCLUDED.original_price, discount_price = EXCLUDED.discount_price, description = EXCLUDED.description
        RETURNING id, name;
      `, [
        pkg.name,
        pkg.slug,
        pkg.description,
        pkg.original_price,
        pkg.discount_price,
        pkg.benefits,
        pkg.preparation_instructions,
        pkg.is_featured
      ]);
      const pkgId = res.rows[0].id;

      // Link package tests
      for (const tcode of pkg.test_codes) {
        const testId = testMap[tcode];
        if (testId) {
          await client.query(`
            INSERT INTO package_tests (package_id, test_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
          `, [pkgId, testId]);
        }
      }
    }
    console.log(`Seeded ${packagesData.length} Health Packages.`);

    // 7. Seed Sample Bookings
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Booking 1: Completed with Ready Report
    const bk1Res = await client.query(`
      INSERT INTO bookings (
        booking_code, user_id, patient_name, patient_age, patient_gender, patient_mobile,
        address, landmark, city, pincode, collection_type, appointment_date, time_slot,
        subtotal, discount, total_amount, payment_method, payment_status, booking_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (booking_code) DO NOTHING
      RETURNING id;
    `, [
      'BK-2026-1001',
      userId,
      'Aditya Sharma',
      34,
      'Male',
      '9876543210',
      'Flat 402, Green Orchid Apartments, Bannerghatta Road',
      'Near Apollo Clinic',
      'Bengaluru',
      '560076',
      'Home Collection',
      yesterday,
      '08:00 AM - 09:00 AM',
      1350,
      201,
      1149,
      'Cash on Collection',
      'Paid',
      'Report Ready',
      'Please call before arrival.'
    ]);

    let bk1Id = bk1Res.rows[0]?.id;
    if (!bk1Id) {
      const existingBk = await client.query(`SELECT id FROM bookings WHERE booking_code = 'BK-2026-1001'`);
      bk1Id = existingBk.rows[0]?.id;
    }

    if (bk1Id) {
      // Items for Booking 1
      await client.query(`
        INSERT INTO booking_items (booking_id, item_type, test_id, item_name, price)
        VALUES 
          ($1, 'test', $2, 'CBC - Complete Blood Count with ESR', 450),
          ($1, 'test', $3, 'Lipid Profile Comprehensive', 699)
        ON CONFLICT DO NOTHING;
      `, [bk1Id, testMap['CBC001'], testMap['LIP001']]);

      // Seed Real PDF Report for Booking 1
      const reportCode = 'REP-2026-001';
      const pdfFileName = `${reportCode}.pdf`;
      const pdfFilePath = path.join(uploadsDir, pdfFileName);

      const cbcTest = testsData.find(t => t.test_code === 'CBC001');
      await generateReportPDF({
        reportCode,
        patientName: 'Aditya Sharma',
        age: 34,
        gender: 'Male',
        bookingCode: 'BK-2026-1001',
        reportDate: yesterday,
        testName: 'Complete Blood Count (CBC) with ESR',
        parameters: cbcTest.parameters.map(p => ({
          parameter_name: p.name,
          result_value: p.default_val,
          unit: p.unit,
          reference_range: p.reference_range,
          is_abnormal: p.is_abnormal
        })),
        pathologistName: 'Dr. Arvind Mehra, MD (Pathology)',
        pathologistQualification: 'Chief Pathologist & Laboratory Director',
        remarks: 'Red and White blood cell indices are within normal physiological thresholds. Platelet count adequate. Normal hemogram.',
        outputPath: pdfFilePath
      });

      // Insert Report Record
      const repRes = await client.query(`
        INSERT INTO reports (
          report_code, booking_id, test_id, user_id, patient_name,
          report_date, report_status, file_path, file_name, pathologist_name,
          pathologist_qualification, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (report_code) DO NOTHING
        RETURNING id;
      `, [
        reportCode,
        bk1Id,
        testMap['CBC001'],
        userId,
        'Aditya Sharma',
        yesterday,
        'Ready',
        `/uploads/reports/${pdfFileName}`,
        pdfFileName,
        'Dr. Arvind Mehra, MD (Pathology)',
        'Chief Pathologist & Laboratory Director',
        'Normal physiological indices. Correlate clinically.'
      ]);

      const repId = repRes.rows[0]?.id;
      if (repId) {
        // Insert report parameters
        let pIdx = 1;
        for (const p of cbcTest.parameters) {
          await client.query(`
            INSERT INTO report_parameters (report_id, parameter_name, result_value, unit, reference_range, is_abnormal, order_index)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [repId, p.name, p.default_val, p.unit, p.reference_range, p.is_abnormal, pIdx++]);
        }
      }
      console.log('Sample Report generated and seeded with PDF!');
    }

    // Booking 2: Upcoming tomorrow (Confirmed)
    await client.query(`
      INSERT INTO bookings (
        booking_code, user_id, patient_name, patient_age, patient_gender, patient_mobile,
        address, landmark, city, pincode, collection_type, appointment_date, time_slot,
        subtotal, discount, total_amount, payment_method, payment_status, booking_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (booking_code) DO NOTHING;
    `, [
      'BK-2026-1002',
      userId,
      'Aditya Sharma',
      34,
      'Male',
      '9876543210',
      'Flat 402, Green Orchid Apartments, Bannerghatta Road',
      'Near Apollo Clinic',
      'Bengaluru',
      '560076',
      'Home Collection',
      tomorrow,
      '07:00 AM - 08:00 AM',
      2400,
      1401,
      999,
      'Pay at Lab',
      'Pending',
      'Confirmed',
      'Fasting sample for Basic Health Checkup.'
    ]);

    // Booking 3: Processing today
    await client.query(`
      INSERT INTO bookings (
        booking_code, user_id, patient_name, patient_age, patient_gender, patient_mobile,
        address, landmark, city, pincode, collection_type, appointment_date, time_slot,
        subtotal, discount, total_amount, payment_method, payment_status, booking_status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (booking_code) DO NOTHING;
    `, [
      'BK-2026-1003',
      userId,
      'Sunita Sharma',
      58,
      'Female',
      '9876543211',
      'Flat 402, Green Orchid Apartments, Bannerghatta Road',
      'Near Apollo Clinic',
      'Bengaluru',
      '560076',
      'Lab Visit',
      today,
      '10:00 AM - 11:00 AM',
      1200,
      301,
      899,
      'Online Payment',
      'Paid',
      'Processing',
      'Vitamin D evaluation for mother.'
    ]);

    // Seed Notifications
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link)
      VALUES 
        ($1, 'Welcome to Dhanashri Health Care!', 'Your account has been created. Book blood tests with free home sample collection.', 'account', true, '/dashboard'),
        ($1, 'Report Ready: Complete Blood Count', 'Your laboratory report for CBC (BK-2026-1001) is verified and ready for download.', 'report', false, '/reports'),
        ($1, 'Appointment Confirmed', 'Your home collection visit for tomorrow at 07:00 AM is confirmed.', 'booking', false, '/bookings');
    `, [userId]);

    await client.query('COMMIT');
    console.log('Database seeding successfully finished!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    if (require.main === module) process.exit(1);
    throw error;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
