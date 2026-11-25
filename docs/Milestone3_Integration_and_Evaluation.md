# Milestone 3: Backend API Integration, Authentication & Evaluation

**Project:** Bulk Budget Buddy — Automated Personal Expense & "Clean Bulk" Nutrition Budget Tracker  
**Author:** Ayush Kumar Ojha  
**Program:** CSD First Year  
**Roll No.:** BTCD26O1039  

---

## 1. Backend API & Authentication Architecture

To transition **Bulk Budget Buddy** into a multi-user full-stack application with clean per-account isolation, a modular Express.js REST API (`server/index.js`) was integrated alongside an adaptive frontend synchronization layer (`src/services/api.js`) and an authenticated entry screen (`src/components/AuthGateway.jsx`).

### 1.1 Express REST API Endpoints (`server/index.js`)
The backend exposes an exportable `createApp({ dbPath })` factory backed by atomic JSON persistence (`server/data/db.json`) with **zero pre-seeded sample data** — every newly registered user starts cleanly at **Rs. 0 spent** and **0 transactions**:

| Method | Endpoint | Purpose | Auth & Validation Behavior |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service liveness check | Public; returns `{ ok: true, service, timestamp }` |
| `POST` | `/api/auth/register` | Create a new user account | Validates name, email, password (>=6 chars), budget, kcal & protein; hashes password via `scrypt` + 16-byte salt; rejects duplicates (`409`); initializes `entries: []` |
| `POST` | `/api/auth/login` | Authenticate existing user | Verifies email & `scrypt` hash using `timingSafeEqual`; issues session token (`200`) or rejects (`401`) |
| `POST` | `/api/auth/logout` | Invalidate active token | Removes session token from store |
| `GET` | `/api/auth/me` | Hydrate current session | Requires `Bearer` token; returns user profile, entries & settings |
| `GET` | `/api/entries` | Fetch user's logged entries | Requires `Bearer` token; returns only authenticated user's entries (`401` if unauthenticated) |
| `POST` | `/api/entries` | Log a new expense or meal | Requires `Bearer` token; enforces `validateEntryInput()`, blocking negative/zero prices & XSS (`400`) |
| `DELETE` | `/api/entries/:id` | Delete user's entry by ID | Requires `Bearer` token; strictly scoped to owning user (`404` for cross-account IDs) |
| `POST` | `/api/entries/reset` | Clear user entries to Rs. 0 | Resets authenticated user's entries to `[]` and restores default goals |
| `GET` | `/api/settings` | Fetch user goals | Requires `Bearer` token |
| `PUT` | `/api/settings` | Update budget & macro goals | Requires `Bearer` token; validates via `validateSettingsInput()` |

### 1.2 Dual-Mode Auth & Static `localStorage` Fallback (`src/services/api.js`)
1. **Local Full-Stack Mode:** Frontend requests to `/api/*` proxy through Vite (`vite.config.js`) to Express on port `5000` with `Authorization: Bearer <token>`.
2. **Static Cloud Mode (Vercel/Netlify):** When no backend responds within `1800ms`, `registerAccount()`, `loginAccount()`, `hydrateUserSession()`, and CRUD actions transparently fall back to per-user isolated records in `localStorage` (`bbb_session_v2` and `bbb_local_users_v2`), ensuring zero data leakage across registered accounts even without a server.

---

## 2. Predictive Analytics & Efficiency Formulas

All financial and nutritional telemetry in `src/utils/analytics.js` is derived deterministically from the authenticated user's monthly ledger (starting cleanly at `0` on fresh registration):

1. **Safe Daily Spend Limit:**
   $$\text{SafeDailySpend} = \frac{\max(\text{MonthlyBudget} - \text{TotalSpent},\ 0)}{\text{DaysRemainingInclusive}}$$
2. **Multi-Tier Budget Alert Thresholds:** Healthy (`<75%`), Caution (`75%+`), Critical (`90%+`), Over-Budget (`>100%`), plus real-time **Daily Pace Warning** when today's spend exceeds `SafeDailyLimitForToday`.
3. **Daily Burn Rate & Month-End Forecast:**
   $$\text{BurnRate} = \frac{\text{TotalSpent}_{\text{month}}}{\max(\text{ActiveTrackedDays},\ 1)}$$
   $$\text{ProjectedMonthEnd} = \text{TotalSpent}_{\text{month}} + (\text{BurnRate} \times \text{DaysRemainingAfterToday})$$
4. **Clean Bulk Efficiency Metrics:**
   $$\text{Cost per 10g Protein} = \left(\frac{\text{AverageItemPrice}}{\text{AverageProteinGrams}}\right) \times 10 \qquad \text{Cost per 500 kcal} = \left(\frac{\text{AverageItemPrice}}{\text{AverageCalories}}\right) \times 500$$

---

## 3. Alpha Test Verification Log

| Test ID | Feature / Module | Input / Action | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AT-01** | Clean Registration | Register via Create Account (`Rs. 8,000`, `3,300 kcal`, `140g`) | Logs in with `Rs. 0` spent, `0` transactions, empty chart states | **PASS** |
| **AT-02** | Auth Isolation | User A logs Paneer `Rs. 90`; User B registers | User B starts at `Rs. 0` and cannot view or delete User A's entry | **PASS** |
| **AT-03** | Logout & Re-Login | Click Sidebar Logout -> Sign In as User A | Returns to AuthGateway; re-login restores User A's exact data | **PASS** |
| **AT-04** | Quick Parser | `"Paneer 200g 90"` and `"Auto 40"` | Extracts item, `Rs.` price, category & Clean Bulk macros | **PASS** |
| **AT-05** | Static Fallback | Disconnect Express backend | `registerAccount` / `loginAccount` / CRUD persist cleanly via `localStorage` | **PASS** |
| **AT-06** | CSV & PDF Export | Trigger Export CSV / Export PDF Report | Downloads UTF-8 `.csv` and formatted `jsPDF` `.pdf` report | **PASS** |
