-- Blood Testing Laboratory Relational Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    dob DATE,
    gender VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    landmark VARCHAR(150),
    city VARCHAR(100),
    pincode VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    role VARCHAR(20) DEFAULT 'user',
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'superadmin', -- superadmin, lab_manager, pathologist
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'flask',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    test_code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2),
    sample_type VARCHAR(100) DEFAULT 'Blood',
    report_time VARCHAR(100) DEFAULT 'Same Day (Within 12 hours)',
    fasting_required BOOLEAN DEFAULT FALSE,
    preparation_instructions TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Test parameters (e.g. for CBC: Hemoglobin, WBC count, Platelets, etc.)
CREATE TABLE IF NOT EXISTS test_parameters (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health Packages
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT,
    original_price NUMERIC(10, 2) NOT NULL,
    discount_price NUMERIC(10, 2) NOT NULL,
    benefits JSONB DEFAULT '[]'::jsonb,
    preparation_instructions TEXT,
    status VARCHAR(20) DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Package - Tests Many-to-Many
CREATE TABLE IF NOT EXISTS package_tests (
    package_id INTEGER REFERENCES packages(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, test_id)
);

-- Saved Patients for each User
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    mobile VARCHAR(20),
    relationship VARCHAR(50) DEFAULT 'Self', -- Self, Father, Mother, Spouse, Child, Other
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved Addresses
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150),
    mobile VARCHAR(20),
    address_line TEXT NOT NULL,
    landmark VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Time Slots
CREATE TABLE IF NOT EXISTS time_slots (
    id SERIAL PRIMARY KEY,
    slot_time VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Partners / Sample Collection Agents
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(100) DEFAULT 'Bengaluru',
    area VARCHAR(150),
    commission_rate NUMERIC(5, 2) DEFAULT 15.00, -- percentage (e.g. 15.00%)
    fixed_fee NUMERIC(10, 2) DEFAULT 0.00, -- flat fee per collection in INR
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    partner_id INTEGER REFERENCES partners(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    patient_age INTEGER NOT NULL,
    patient_gender VARCHAR(20) NOT NULL,
    patient_mobile VARCHAR(20) NOT NULL,
    address TEXT,
    landmark VARCHAR(150),
    city VARCHAR(100),
    pincode VARCHAR(20),
    collection_type VARCHAR(50) NOT NULL DEFAULT 'Home Collection', -- 'Home Collection' or 'Lab Visit'
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'Cash on Collection', -- 'Cash on Collection', 'Pay at Lab', 'Online Payment'
    payment_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Refunded'
    booking_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Sample Collected', 'Processing', 'Report Ready', 'Completed', 'Cancelled'
    partner_assigned_at TIMESTAMP WITH TIME ZONE,
    sample_collected_at TIMESTAMP WITH TIME ZONE,
    partner_notes TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking Items (Tests or Packages booked)
CREATE TABLE IF NOT EXISTS booking_items (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL, -- 'test' or 'package'
    test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL,
    package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    transaction_id VARCHAR(100),
    payment_gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medical Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_code VARCHAR(50) UNIQUE NOT NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    report_date DATE DEFAULT CURRENT_DATE,
    report_status VARCHAR(50) DEFAULT 'Ready', -- 'Draft', 'Ready', 'Delivered'
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    pathologist_name VARCHAR(150) DEFAULT 'Dr. Arvind Mehra, MD (Pathology)',
    pathologist_qualification VARCHAR(200) DEFAULT 'Chief Pathologist & Laboratory Director',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Parameters (for viewing digital report directly in viewer)
CREATE TABLE IF NOT EXISTS report_parameters (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    parameter_name VARCHAR(150) NOT NULL,
    result_value VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    is_abnormal BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'booking', 'report', 'account', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_tests_category ON tests(category_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_partner ON bookings(partner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_reports_booking ON reports(booking_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
