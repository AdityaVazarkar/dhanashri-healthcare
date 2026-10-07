# Dhanashri Health Care — Complete Blood Testing Laboratory Web Application

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![NABL Accredited](https://img.shields.io/badge/Quality-NABL%20Accredited-16A34A.svg)](https://nabl-india.org)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-15803D.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4%2B-38B2AC.svg)](https://tailwindcss.com/)

A modern, production-ready, medical-grade **Diagnostic & Blood Testing Laboratory Management Web Application** engineered with a green/white visual identity, dual-portal architecture (**User/Patient Portal** and **Admin/Pathologist Portal**), role-based JWT authentication, multi-step sample collection booking, automated PDF clinical report generation, and interactive operational analytics.

---

## 🚀 Free Live Deployment
For step-by-step instructions to deploy this web app 100% free of charge to **Vercel** (`dhanashri-healthcare.vercel.app`), **Render**, and **Neon PostgreSQL**, refer to **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**.

---

## 1. Project Overview

**Dhanashri Health Care** provides an end-to-end digital diagnostic experience for patients and clinical laboratory administrators:
- **Patients** can search 18+ comprehensive diagnostic tests, select preventive health packages, book doorstep phlebotomy with time-slot selection, view interactive status timelines, and securely view/download verified clinical laboratory reports with biological reference intervals.
- **Laboratory Administrators & Pathologists** have access to a dedicated dashboard equipped with real-time operational KPIs, Recharts data analytics, full catalog CRUD, package bundling, status advancement workflows, report generation/upload, and patient notification systems.

---

## 2. Key Features

### Patient & Public Portal
1. **Medical Landing Page**:
   - Hero section with direct actions (*"Book a Test"*, *"Explore Tests"*, *"Book Home Sample Collection"*).
   - Real-time search with instant category suggestions.
   - Popular tests catalog with pricing and sample requirements.
   - Preventive health package showcase with discount calculations.
   - Why Choose Us (NABL Accreditation, 100% Barcoding, 6-Hour express turnaround).
   - Testimonials, interactive FAQ accordion, and 24/7 helpline footer.
2. **Patient Authentication**:
   - Register with Full Name, Email, Mobile, DOB, Gender, and Password.
   - Login via Email or Mobile with bcrypt verification.
   - Forgot/Reset Password workflow with secure tokens.
   - Demo credentials one-click quick-fill.
3. **Interactive Test Catalog**:
   - Real-time search query matching test names, codes, and descriptions.
   - Filter pills by clinical category (Hematology, Biochemistry, Immunology, Diabetes, Vitamins, etc.).
   - Price range slider and popular-only filter.
   - Sorting by Price (Low/High) and Name (A-Z / Z-A).
4. **Test Details View**:
   - Sample matrix (Whole Blood, Serum, Fluoride Plasma).
   - Fasting requirement indicators.
   - Turnaround time (TAT) and patient preparation instructions.
   - Parameter analysis table showing standard units and reference ranges.
   - Related tests recommendations.
5. **Multi-Step Booking System**:
   - Step 1: Cart and Test selection review.
   - Step 2: Date picker and 1-hour time-window slot selection.
   - Step 3: Collection preference (*Home Sample Collection* vs. *Lab Visit*).
   - Step 4: Patient demographic and address details.
   - Step 5: Payment method selection (*Cash on Collection*, *Pay at Lab*, *Online Payment*).
   - Step 6: Confirmation screen with Booking Reference ID (`BK-YYYY-XXXX`).
6. **Patient Dashboard (`/dashboard`)**:
   - Personalized greeting (*"Good Morning, Aditya 👋"*).
   - KPI counters: Upcoming Tests, Completed Tests, Available Reports, Total Bookings.
   - Upcoming Appointment card with collection type and status.
   - Recent Reports card with instant PDF download.
   - Recommended full-body health packages.
7. **Appointment Tracking (`/bookings`)**:
   - Interactive 4-stage visual timeline:
     - `✓ Booking Confirmed` → `✓ Sample Collected` → `● Testing in Progress` → `○ Report Ready`
8. **Digital Report Viewer (`/reports/:id`)**:
   - Dhanashri Health Care NABL/ISO official letterhead.
   - Patient demographics, booking reference, and sample date.
   - Comprehensive parameters table with units and reference ranges.
   - **Abnormal value flagging** in red with clinical correlation notices.
   - Pathologist remarks and digital signature verification seal.
   - Browser print layout (`Ctrl+P` / `Cmd+P` optimized) and direct PDF download.

---

### Admin & Pathologist Panel (`/admin`)
1. **Administrative Portal Authentication**:
   - Dedicated admin route (`/admin/login`) with role guard (`superadmin`, `lab_manager`).
   - One-click demo credentials autofill.
2. **Analytics & KPI Dashboard**:
   - 6 Operational Cards: Total Patients, Active Tests, Today's Visits, In-Progress Samples, Lab Revenue, Completed Tests.
   - Recharts Visualizations:
     - **Booking Trends**: Daily appointment volume bar chart (past 7 days).
     - **Monthly Revenue**: Revenue trend line chart.
     - **Test Popularity**: Horizontal bar chart of top ordered tests.
     - **Workflow Distribution**: Donut chart of booking statuses.
   - Live table of recent appointments with direct status actions.
3. **Test Management (`/admin/tests`)**:
   - Add/Edit/Delete diagnostic tests.
   - Configure codes, prices, discounts, sample matrix, fasting requirements, and turnaround times.
   - Dynamically add/remove biomarker parameter rows with custom units and reference ranges.
   - Quick one-click Active/Inactive status toggle.
4. **Category Management (`/admin/categories`)**:
   - CRUD for diagnostic disciplines (Hematology, Biochemistry, Pathology, Immunology, Microbiology, Hormones, Vitamins, Diabetes, Cardiology).
5. **Package Management (`/admin/packages`)**:
   - Bundle multiple diagnostic tests into discounted packages.
   - Configure key benefits and patient preparation notes.
6. **Booking Operations (`/admin/bookings`)**:
   - Search by booking code, patient name, or mobile.
   - Filter by status (`Pending`, `Confirmed`, `Sample Collected`, `Processing`, `Report Ready`, `Completed`, `Cancelled`).
   - Advance workflow statuses with automatic patient notifications.
7. **Clinical Report Publishing (`/admin/reports`)**:
   - Link report to appointment booking and test profile.
   - Upload official laboratory PDF files or auto-generate PDF with digital signatures.
   - Enter pathologist remarks and verify abnormal flags.
   - Dispatch immediate in-app and email notification to the patient.
8. **Patient Account Directory (`/admin/users`)**:
   - Audit registered patients, lifetime booking counts, and contact details.
   - Activate / Deactivate patient account access.
9. **Activity Stream (`/admin/notifications`)**:
   - Real-time log of bookings, report releases, and patient registrations.

---

## 3. Technology Stack

### Frontend
- **Framework**: React.js (v18+) with Vite
- **Routing**: React Router DOM (v6+)
- **Styling**: Tailwind CSS with custom medical green branding
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios with interceptors
- **Typography**: Google Fonts (*Plus Jakarta Sans*, *Inter*)

### Backend
- **Runtime**: Node.js & Express.js
- **Architecture**: REST API with centralized error handling
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **File Uploads**: Multer with strict MIME/size validation
- **PDF Generation**: PDFKit (high-resolution clinical letterhead format)
- **Email Service**: Nodemailer (support for SMTP, Ethereal, and simulation fallbacks)
- **Security**: Helmet, CORS, and Express-Rate-Limit

### Database
- **Engine**: PostgreSQL
- **Driver**: `pg` (Connection Pooling)
- **Schema**: Fully normalized relational schema with foreign keys, cascading rules, and indexes

---

## 4. Folder Structure

```text
blood-lab-app/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminHeader.jsx
│   │   │   │   └── AdminSidebar.jsx
│   │   │   └── common/
│   │   │       ├── CartDrawer.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       ├── Footer.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── MobileBottomNav.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── StatusBadge.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx
│   │   │   └── PatientLayout.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminBookingManagementPage.jsx
│   │   │   │   ├── AdminCategoryManagementPage.jsx
│   │   │   │   ├── AdminDashboardPage.jsx
│   │   │   │   ├── AdminLoginPage.jsx
│   │   │   │   ├── AdminNotificationCenterPage.jsx
│   │   │   │   ├── AdminPackageManagementPage.jsx
│   │   │   │   ├── AdminReportManagementPage.jsx
│   │   │   │   ├── AdminTestManagementPage.jsx
│   │   │   │   └── AdminUserManagementPage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── BookingFlowPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PackagesPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ReportViewerPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── TestCatalogPage.jsx
│   │   │   ├── TestDetailsPage.jsx
│   │   │   ├── UserBookingsPage.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── UserProfilePage.jsx
│   │   │   └── UserReportsPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── categoryController.js
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   ├── packageController.js
│   │   ├── reportController.js
│   │   ├── testController.js
│   │   └── userController.js
│   ├── db/
│   │   ├── migrate.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── packageRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── testRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── emailService.js
│   ├── uploads/
│   │   └── reports/
│   ├── utils/
│   │   └── pdfGenerator.js
│   ├── .env
│   ├── .env.example
│   ├── app.js
│   ├── package.json
│   ├── server.js
│   └── test-e2e.js
│
└── README.md
```

---

## 5. PostgreSQL Database Setup

1. **Verify or Start PostgreSQL**:
   ```bash
   # macOS (Homebrew)
   brew services start postgresql@14
   ```

2. **Create the Project Database**:
   ```bash
   psql -U aditya -d postgres -c "CREATE DATABASE blood_lab_db;"
   ```
   *(Replace `aditya` with your PostgreSQL username if applicable).*

---

## 6. Environment Configuration

### Backend `.env` (`server/.env`)
```env
PORT=5001
DATABASE_URL=postgresql://aditya@localhost:5432/blood_lab_db
JWT_SECRET=super_secure_blood_lab_jwt_secret_key_2026_xyz
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=care@dhanashrihealthcare.com
EMAIL_PASSWORD=demosecret
FRONTEND_URL=http://localhost:5175
NODE_ENV=development
```

### Frontend Configuration
The frontend connects by default to `http://localhost:5001/api`. You can override this using `.env` in `client/`:
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 7. Database Migration & Seed Data

Navigate into the `server/` directory and run:

1. **Run Migration**:
   ```bash
   cd server
   npm run migrate
   ```
   *Creates all 16 relational tables and indexes.*

2. **Run Seeder**:
   ```bash
   npm run seed
   ```
   *Seeds the Administrator account, demo patient, 9 categories, 18+ tests with parameters, 6 health packages, time slots, initial bookings, and generates a sample clinical PDF report.*

---

## 8. Credentials for Testing

### Admin Portal Credentials
- **URL**: `http://localhost:5175/admin/login`
- **Email**: `admin@lab.com`
- **Password**: `Admin@123`
*(Includes a one-click demo credentials autofill button on the login form)*

### Patient Portal Credentials
- **URL**: `http://localhost:5175/login`
- **Email**: `patient@example.com`
- **Password**: `Patient@123`
*(Includes a one-click demo credentials autofill button on the login form)*

---

## 9. Installation & Running Locally

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Start the Servers

**Terminal 1 — Backend API**:
```bash
cd server
npm start
# Server listens on http://localhost:5001
```

**Terminal 2 — Frontend Application**:
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5175
```

Open `http://localhost:5175` in your browser.

---

## 10. Automated End-to-End Verification

A comprehensive automated integration test suite is included in `server/test-e2e.js`:

```bash
cd server
node test-e2e.js
```

**Verifies**:
- Health check API
- Patient authentication & JWT issuance
- Admin authentication
- Test & Category catalog filtering
- Health packages retrieval
- Booking creation with pricing calculations
- Patient Dashboard KPI aggregation
- Admin Dashboard operational KPI & chart aggregation
- Booking workflow status update
- Secure PDF report streaming (HTTP 200)

---

## 11. REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new patient account | Public |
| `POST` | `/api/auth/login` | Login with email/mobile | Public |
| `POST` | `/api/auth/admin-login` | Admin portal login | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |
| `PUT` | `/api/auth/profile` | Update demographics & address | Patient |
| `PUT` | `/api/auth/change-password` | Update account password | Private |
| `POST` | `/api/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/api/auth/reset-password` | Reset password using token | Public |

### Tests Catalog (`/api/tests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/tests` | Query tests with filters & sort | Public |
| `GET` | `/api/tests/:id` | Test details & biomarker parameters | Public |
| `POST` | `/api/tests` | Create new diagnostic test | Admin |
| `PUT` | `/api/tests/:id` | Update test & parameters | Admin |
| `DELETE` | `/api/tests/:id` | Delete diagnostic test | Admin |
| `PATCH` | `/api/tests/:id/toggle-status` | Toggle active/inactive | Admin |

### Health Packages (`/api/packages`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/packages` | List all health packages | Public |
| `GET` | `/api/packages/:id` | Package details & included tests | Public |
| `POST` | `/api/packages` | Create new package profile | Admin |
| `PUT` | `/api/packages/:id` | Update package & included tests | Admin |
| `DELETE` | `/api/packages/:id` | Delete package | Admin |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bookings/time-slots` | Available 1-hour appointment slots | Public |
| `POST` | `/api/bookings` | Book diagnostic tests/packages | Public / Patient |
| `GET` | `/api/bookings/my-bookings` | List authenticated user appointments | Patient |
| `GET` | `/api/bookings/admin` | List all bookings with pagination | Admin |
| `GET` | `/api/bookings/:id` | Booking details & timeline | Private |
| `PUT` | `/api/bookings/:id/status` | Update status & trigger notification | Admin |

### Clinical Reports (`/api/reports`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/reports/my-reports` | List patient verified reports | Patient |
| `GET` | `/api/reports/admin` | List all lab reports | Admin |
| `GET` | `/api/reports/:id` | Digital report parameter findings | Patient / Admin |
| `GET` | `/api/reports/:id/download` | Secure streaming PDF download | Patient / Admin |
| `POST` | `/api/reports/upload` | Upload PDF or auto-generate report | Admin |
| `POST` | `/api/reports/:id/notify` | Dispatch email/app notice to patient | Admin |

### Operational Dashboards (`/api/dashboard`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/dashboard/user` | Patient health dashboard data | Patient |
| `GET` | `/api/dashboard/admin` | Admin KPIs & Recharts metrics | Admin |

---

## 12. Production Deployment Guide

### 1. Production Build
```bash
# Build optimized frontend assets
cd client
npm run build
```
Creates production-ready minified static assets in `client/dist`.

### 2. Reverse Proxy & Process Management
- **PM2**:
  ```bash
  npm install -g pm2
  cd server
  pm2 start server.js --name "blood-lab-api"
  ```
- **Nginx**:
  Serve `client/dist` as static directory and reverse-proxy `/api` to `http://127.0.0.1:5001`.
- **SSL**:
  Issue Let's Encrypt certificates using `certbot` for HTTPS transport security.
- **Backups**:
  Schedule automated PostgreSQL dumps:
  ```bash
  pg_dump -U aditya blood_lab_db > backup_$(date +%Y%m%d).sql
  ```

---

## 13. Brand Design Guidelines

- **Primary Medical Green**: `#16A34A`
- **Secondary Dark Green**: `#15803D`
- **Light Green Accent**: `#DCFCE7`
- **Very Light Green Background**: `#F0FDF4`
- **Text (Dark Charcoal)**: `#17211B`
- **Background**: `#FFFFFF`
- **Accreditation**: NABL & ISO 15189:2022 compliant layout guidelines
