# Dhanashri Health Care — 100% Free Live Deployment Guide

This guide provides step-by-step instructions to deploy **Dhanashri Health Care** completely **FREE of cost** (Frontend, Backend, and PostgreSQL Database) with the domain name `dhanashri-healthcare`.

---

## 🌟 Free Hosting Architecture Overview

| Component | Platform | Free Tier Specifications | Live URL Example |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Free Hobby tier (Unlimited traffic, SSL, Global CDN) | `https://dhanashri-healthcare.vercel.app` |
| **Backend** | **Render.com** | Free Web Service (Node.js, 512 MB RAM, SSL) | `https://dhanashri-backend.onrender.com` |
| **Database** | **Neon.tech** | Free Serverless PostgreSQL (0.5 GB, SSL, automated backups) | `postgresql://...@ep-xyz.us-east-2.aws.neon.tech/neondb` |

---

## Step 1: Set Up Free PostgreSQL Database on Neon.tech (2 Minutes)

1. Go to **[https://neon.tech](https://neon.tech)** and sign up for a free account with GitHub or Google.
2. Click **"Create Project"**.
   - Project Name: `dhanashri-healthcare`
   - Postgres version: Default (16 / 15)
   - Region: Select the region closest to you (e.g. AWS Asia Pacific / US East)
3. Once created, you will see your **Connection string**. It looks like:
   ```
   postgresql://neondb_owner:npg_xxxxxx@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this Connection String**. You will use it in Step 2.

> **💡 Note:** Your backend code is pre-configured with **Auto-Bootstrap**! When the backend starts up for the first time with this `DATABASE_URL`, it will automatically create all tables, indexes, tests, packages, and the admin account (`admin@lab.com` / `Admin@123`). You do not need to run manual SQL queries!

---

## Step 2: Deploy Backend on Render.com (3 Minutes)

1. Push your repository to **GitHub** (if not already done).
2. Go to **[https://render.com](https://render.com)** and create a free account (sign in with GitHub).
3. Click **"New +"** in the top navigation and select **"Web Service"**.
4. Connect your GitHub repository containing the `Dhanashredd lap` code.
5. Fill in the following settings:
   - **Name**: `dhanashri-backend` (or your chosen name)
   - **Region**: Same or nearest region to your Neon DB
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
6. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = *(Paste the Neon Connection String copied from Step 1)*
   - `JWT_SECRET` = *(Any random string, e.g. `dhanashri_secure_jwt_secret_2026`)*
   - `FRONTEND_URL` = `https://dhanashri-healthcare.vercel.app`
7. Click **"Deploy Web Service"**.
8. Wait 1–2 minutes until the deployment completes. You will see:
   ```
   ==> Connected to PostgreSQL database at: ...
   ==> Fresh database detected! Initializing schema & seeding initial data...
   ==> Database schema tables created successfully.
   ==> Dhanashri Health Care Server is running on port 5000
   ```
9. Copy your Backend Live URL from Render (e.g., `https://dhanashri-backend.onrender.com`).

---

## Step 3: Deploy Frontend on Vercel with URL `dhanashri-healthcare` (2 Minutes)

1. Go to **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Project Name**: `dhanashri-healthcare` *(This gives you the URL `https://dhanashri-healthcare.vercel.app`)*
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click "Edit" and choose `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://dhanashri-backend.onrender.com/api` *(Make sure to add `/api` at the end of your Render backend URL)*
6. Click **"Deploy"**.
7. In ~30 seconds, your site will be live at:
   **`https://dhanashri-healthcare.vercel.app`**

---

## Step 4: Login & Verification

### 🏥 Live Public & Patient Portal:
- Visit: `https://dhanashri-healthcare.vercel.app`
- Test patient account:
  - **Email**: `patient@example.com`
  - **Password**: `Patient@123`
  - Or click **Register** to create any new patient account!

### 🔒 Live Admin & Pathologist Portal:
- Visit: `https://dhanashri-healthcare.vercel.app/admin/login`
- Master Admin credentials:
  - **Email**: `admin@lab.com`
  - **Password**: `Admin@123`
- From the Admin Dashboard, you can:
  - Add, edit, and delete blood tests & packages.
  - View real-time patient appointment bookings.
  - Auto-generate certified clinical lab reports with NABL header and download PDF.
  - Advance status from Pending → Sample Collected → Processing → Completed.

---

## 🛠️ Summary of Pre-Configured Live Files in Repository

- `client/vercel.json`: Handles SPA routing rewrites so refreshing `/admin/bookings` or `/tests` never gives a 404.
- `client/public/_redirects`: Netlify SPA fallback rule.
- `server/db/autoInit.js`: Automatically creates database tables and seed data upon first startup.
- `server/config/db.js`: Automatically handles SSL connections for Neon, Render, Supabase, and cloud databases.
- `render.yaml`: Blueprint definition for Render 1-click deploys.
