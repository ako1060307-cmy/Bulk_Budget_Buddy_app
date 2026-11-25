# Bulk Budget Buddy — Final Project Report (Milestones 1–5)

**Course:** Micro Project — Computer Science & Design (CSD)  
**Author:** Ayush Kumar Ojha  
**Class:** CSD First Year  
**Roll No.:** BTCD26O1039  
**Date:** November 2026  

---

## 1. Abstract

**Bulk Budget Buddy** is a commercial-grade personal finance and "Clean Bulk" nutrition budgeting web application built for Indian college students. It pairs a sleek dark-slate authentication gateway (Sign In & Create Account) with per-account isolated tracking starting cleanly at **Rs. 0** (`0` transactions, `0 kcal`, `0g` protein). Users set custom monthly budgets (default **Rs. 8,000/month**) and daily nutrition targets (**3,300 kcal**, **140g protein**), log meals via a Natural-Text Quick Parser or One-Click Indian Clean Bulk Presets, monitor multi-tier budget pacing alerts, forecast month-end burn rates, rank foods by **Rs. per 10g Protein**, and export formatted CSV/PDF reports.

---

## 2. Problem Statement & Objectives

College students pursuing a "Clean Bulk" must hit high calorie and protein targets on a tight monthly allowance without splitting workflows across disconnected finance and diet apps. Bulk Budget Buddy solves this by:
1. Providing a dedicated **Authentication Gateway** so every student has an isolated, clean `Rs. 0` profile.
2. Capturing expenses & meals in seconds via **Natural-Text Parsing** (`"Paneer 200g 90"`) and **Indian Clean Bulk Presets**.
3. Computing **Multi-Tier Budget Alerts** (75%+ Caution, 90%+ Critical, >100% Over-Budget) and Safe Daily Spend warnings.
4. Generating **Predictive Burn-Rate Forecasts** and **Cost-per-Macro Efficiency Rankings** (`Rs./10g P` and `Rs./500 kcal`).
5. Supporting **CSV/PDF Exports**, **Express REST API persistence**, static **`localStorage` fallback**, and **23 automated Vitest checks**.

---

## 3. System Architecture & Technology Stack

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite 6, Tailwind CSS 3.4 | Auth Gateway, dark-slate glass UI (`#090D16` / `#111827`), responsive sidebar + mobile nav |
| **Data Visualization** | Recharts 2.15, Custom SVG Rings | Category Donut, 7-Day Spend vs. Calories, Month-End Trajectory, Efficiency Bar Chart |
| **Icons & Export** | Lucide React, jsPDF 2.5 | Vector icons, UTF-8 CSV download, multi-section PDF report export |
| **Backend & Auth** | Node.js 22 LTS, Express, `crypto.scrypt` | Auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) & scoped CRUD routes |
| **Sync & Fallback** | Fetch API + `localStorage` | Express API sync locally; isolated `localStorage` accounts on static Vercel/Netlify |
| **Testing** | Vitest 5.1 | 23 unit, validation, empty-state, auth, and HTTP API integration tests |

---

## 4. Summary of Milestones (1–5)

- **Milestone 1 (Core UI & Dashboard):** Dark-slate glassmorphism, 4 KPI cards, multi-tier alert banners, Calorie/Protein SVG rings, and Recharts visualizations.
- **Milestone 2 (Smart Logger, Analytics & Exports):** Natural-text quick parser, 7 Indian Clean Bulk presets, search/filter ledger, predictive month-end forecasting, efficiency ranking table, and CSV/PDF export.
- **Milestone 3 (Backend API & Authentication System):** Removed all pre-seeded sample data; built `AuthGateway.jsx`, `POST /api/auth/register` & `POST /api/auth/login` with `scrypt` password hashing, Bearer token auth, per-account data isolation, sidebar user profile + Logout, and `localStorage` static fallback.
- **Milestone 4 (Testing & Security Validation):** Enforced strict auth/entry/XSS/division-by-zero validation in `src/utils/validation.js`; verified 23 passing tests via `npx vitest run`.
- **Milestone 5 (Deployment & Documentation):** Configured `vercel.json`, verified clean `npm run build`, and compiled complete academic reports and viva Q&A in `/docs` and `/docs/pdf`.

---

## 5. User Manual

1. **Authentication Screen (Sign In / Create Account):** New users register with Full Name, Email, Password, Monthly Budget (`Rs. 8,000`), Daily Calorie Target (`3,300 kcal`), and Daily Protein Target (`140g`), starting cleanly at `Rs. 0`. Existing users sign in to resume their isolated ledger.
2. **Dashboard Overview:** Tracks Monthly Budget, Total Spent, Remaining Balance, Safe Daily Spend, Multi-Tier Alerts, Daily Calorie/Protein rings, Category Donut, and 7-Day Spend vs. Calorie chart.
3. **Smart Expense & Meal Logger:** Type natural text (`"Paneer 200g 90"`, `"Auto 40"`) or tap a one-click Clean Bulk preset card; search, filter, or delete entries in the ledger.
4. **Predictive Analytics & Protein Efficiency:** Inspect Daily Burn Rate, Projected End-of-Month Spend, Expected Surplus/Deficit, forecast trajectory, and `Rs./10g Protein` rankings.
5. **Exports & Settings:** Export CSV or PDF reports, adjust goals, clear account entries back to `Rs. 0`, or click **Logout** in the sidebar profile card.

---

## 6. Source Code Documentation

- `src/components/AuthGateway.jsx` — Centered glass Sign In / Create Account entry screen.
- `src/components/Sidebar.jsx` — Collapsible sidebar with live month burn, storage sync badge, user profile, and Logout button.
- `src/App.jsx` — Session hydration, auth gating, memoized analytics, and 4-view router.
- `src/components/DashboardView.jsx`, `LoggerView.jsx`, `AnalyticsView.jsx`, `SettingsView.jsx` — Core 4 views with clean empty states.
- `src/data/presets.js` — Categories, 7 Clean Bulk presets, and default targets (zero sample transactions).
- `src/utils/parser.js`, `analytics.js`, `validation.js`, `exporters.js` — Quick parser, math/forecasting, XSS/auth/numeric validation, CSV/PDF exporters.
- `src/services/api.js` & `server/index.js` — Express auth/CRUD API and per-user isolated `localStorage` fallback.

---

## 7. Deployment Guide & Conclusion

Run locally with `npm run server` (port `5000`) and `npm run dev` (port `5173`), or deploy `dist/` statically using `vercel.json` where `localStorage` authentication and per-account isolation work out of the box. **Bulk Budget Buddy** delivers a complete, secure, and production-ready student finance and Clean Bulk nutrition platform.
