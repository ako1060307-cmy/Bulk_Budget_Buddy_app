# Viva Preparation Q&A — Bulk Budget Buddy

**Project:** Bulk Budget Buddy — Automated Personal Expense & "Clean Bulk" Nutrition Budget Tracker  
**Student:** Ayush Kumar Ojha | CSD First Year | Roll No. BTCD26O1039  

---

### Q1. What problem does Bulk Budget Buddy solve that existing expense trackers or diet apps do not?
**Answer:** Traditional expense trackers only track money, while fitness apps only track calories and macros. Bulk Budget Buddy bridges both domains for Indian college students by linking every rupee spent directly to nutritional yield—computing real-time **Rs. per 10g Protein** and **Rs. per 500 kcal**, safe daily spend limits, and month-end burn-rate projections in one unified dashboard.

### Q2. How does the Authentication System ensure every new user starts cleanly at Rs. 0 with isolated data?
**Answer:** Every account created via `POST /api/auth/register` (or `registerAccount()` in static `localStorage` mode) initializes with `entries: []` (Rs. 0 spent, 0 kcal, 0g protein) and the user's own budget/macro settings. On the Express backend, all `/api/entries` and `/api/settings` routes require a valid `Bearer` session token and filter strictly by `req.auth.userId`. On static deployments, `localStorage` stores user records keyed by normalized email under `bbb_local_users_v2`, ensuring zero data leakage when switching accounts.

### Q3. How are user passwords secured on the Express backend?
**Answer:** `server/index.js` generates a unique 16-byte random salt per user (`crypto.randomBytes(16)`) and derives a 64-byte key using Node's native `crypto.scryptSync`. During login, passwords are verified using constant-time `crypto.timingSafeEqual` to prevent timing attacks, and plaintext passwords are never stored or returned in API responses.

### Q4. How does the Natural-Text Quick Parser distinguish between food quantities (like `200g` or `1L`) and the price in rupees?
**Answer:** In `src/utils/parser.js`, `parseQuickInput()` first checks for explicit currency markers (`Rs.`, `INR`, or currency symbols). If none are present, it tokenizes the input and searches right-to-left for a standalone numeric token without unit suffixes (`g`, `kg`, `ml`, `L`) while skipping leading item counts (like `4` in `4 Boiled Eggs`), keeping `200g` in the item label and extracting `90` as the price.

### Q5. How does the application handle empty initial states (`0` transactions) without UI glitches or `NaN` errors?
**Answer:** `computeDashboardMetrics()` and `computePredictiveAnalytics()` clamp denominators (`monthlyBudget`, `calorieGoal`, `proteinGoal`, `activeSpanDays`, `daysLeftInclusive`) to at least `1` and skip zero-macro rows during efficiency division. Every chart and table (`Category Donut`, `Efficiency Bar Chart`, `Efficiency Ranking Table`, `Transaction Ledger`) renders a dedicated empty-state message until entries are logged.

### Q6. Explain the Safe Daily Spend calculation and how the Daily Pace Warning triggers.
**Answer:** `SafeDailySpend` divides remaining monthly balance by days left in the month including today (`daysLeftInclusive`). `computeDashboardMetrics()` also compares today's spending against the start-of-day daily limit (`safeDailyLimitForToday`); if today's expenditure exceeds it, `exceedsSafeDaily` turns `true` and renders the Daily Pace Warning banner.

### Q7. How are the Multi-Tier Budget Alert Banners triggered?
**Answer:** Based on `budgetUsedPct = (totalSpent / monthlyBudget) * 100`:
- `< 75%`: **Healthy** (Emerald on-track status)
- `75% to < 90%`: **Caution** (Amber warning banner)
- `90% to <= 100%`: **Critical** (Orange alert banner)
- `> 100%`: **Over-Budget** (Rose deficit alert displaying exact overspend)

### Q8. Which Indian Clean Bulk foods rank highest in protein cost-efficiency in your model?
**Answer:** Efficiency is computed as `(avgPrice / avgProtein) * 10` for **Rs. per 10g Protein** and `(avgPrice / avgCalories) * 500` for **Rs. per 500 kcal**. Among the presets, **Sattu (100g) + Sugar** (`Rs. 22` for `20g P` = **Rs. 11.0 / 10g P**) and **4 Boiled Eggs** (`Rs. 32` for `25g P` = **Rs. 12.8 / 10g P**) lead in protein efficiency, followed by **Toned Milk (1L)** (**Rs. 18.7 / 10g P**) and **Paneer (200g)** (**Rs. 25.0 / 10g P**).

### Q9. How does the Predictive End-of-Month Forecast work?
**Answer:** `computePredictiveAnalytics()` computes daily burn rate as `totalSpent / activeSpanDays`. Projected month-end spend is `totalSpent + burnRate * daysRemainingAfterToday`, and subtracting that from `monthlyBudget` yields the **Expected Surplus or Deficit**, plotted against the horizontal budget cap reference line.

### Q10. How does the frontend work both with the Express backend locally and on static hosting like Vercel?
**Answer:** `src/services/api.js` attempts `/api/auth/*`, `/api/entries`, and `/api/settings` calls with an `1800ms` abort timeout. Locally, Vite proxies `/api` to Express (`localhost:5000`). On static hosting (Vercel via `vercel.json`), when no backend responds, the service seamlessly operates in `localStorage` mode with full account registration, login, and per-user data isolation.

### Q11. Why did you export `createApp()` from `server/index.js` instead of calling `app.listen()` unconditionally?
**Answer:** Exporting `createApp({ dbPath })` allows Vitest integration tests (`src/__tests__/api.integration.test.js`) to launch isolated Express servers on ephemeral ports (`port 0`) backed by temporary JSON files, while only binding port `5000` when executed directly via `node server/index.js`.

### Q12. What security and edge-case validations are enforced across the stack?
**Answer:** `src/utils/validation.js` enforces strict checks shared by both React forms and Express routes: validating email regex and password length (`>= 6`), blocking negative/zero/non-finite amounts and negative macros, and rejecting XSS vectors (`<script>`, `<img>`/`<svg>` tags, `on*=` attributes, `javascript:` URIs).

### Q13. Why did you use `jsPDF` vector rendering instead of `html2canvas` screenshot export for PDF reports?
**Answer:** Direct vector rendering with `jsPDF` produces crisp selectable text, automatic A4 multi-page ledger pagination, small file sizes, and consistent light-print formatting independent of the dark-mode UI CSS.

### Q14. What automated tests verify the project?
**Answer:** Four Vitest suites (`parser.test.js`, `validation.test.js`, `analytics.test.js`, `api.integration.test.js`) execute 23 automated tests covering natural-text parsing, empty `Rs. 0` initial state, auth registration/login validation, XSS/negative-price rejection, cross-account Express API isolation, and offline `localStorage` auth fallback.

### Q15. What future enhancements could extend Bulk Budget Buddy?
**Answer:** Future versions could add UPI SMS/receipt OCR parsing, PostgreSQL/Supabase cloud database storage with JWT refresh tokens, multi-month comparative analytics, and full macro tracking for carbohydrates and healthy fats.
