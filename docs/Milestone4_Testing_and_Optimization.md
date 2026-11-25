# Milestone 4: Automated Testing, Security Validation & Optimization

**Project:** Bulk Budget Buddy — Automated Personal Expense & "Clean Bulk" Nutrition Budget Tracker  
**Author:** Ayush Kumar Ojha  
**Program:** CSD First Year  
**Roll No.:** BTCD26O1039  

---

## 1. Automated Test Suite Summary (Vitest)

A comprehensive test suite (`src/__tests__/`) powered by **Vitest v5.1.2** verifies empty initial state guarantees, authentication flows, natural-text parsing, security validation, and Express REST API isolation:

| Test Suite | File Path | Tests | Scope Covered |
| :--- | :--- | :---: | :--- |
| **Quick Parser Tests** | `src/__tests__/parser.test.js` | 6 | Weight/unit extraction (`200g`, `1L`), `Rs.` prefix handling, category classification, negative/zero price rejection, XSS blocking |
| **Validation & Auth Guardrails** | `src/__tests__/validation.test.js` | 6 | Entry, settings, registration & login validation; email format & password length checks; XSS blocking |
| **Empty State & Analytics** | `src/__tests__/analytics.test.js` | 6 | Clean `Rs. 0` initial state (`0` entries, `0` kcal, `0g` P), alert thresholds (`75%`, `90%`, `100%`), burn-rate forecast, `Rs./10g P` ranking, division-by-zero guards |
| **Auth & API Integration** | `src/__tests__/api.integration.test.js` | 5 | `401` on unauthenticated access, `POST /api/auth/register` (`Rs. 0` start), `409` duplicate email, cross-account isolation, `POST /api/entries` `400` validation, offline `localStorage` auth fallback |
| **Total** | **4 Suites** | **23** | **100% Passing** |

---

## 2. Security, Authentication & Edge-Case Validation

Shared guardrails in `src/utils/validation.js` protect both the React client and Express backend:

### 2.1 Authentication Security
- Passwords on `server/index.js` are salted with `16` cryptographically random bytes and hashed using `crypto.scryptSync(..., 64)`, compared via constant-time `crypto.timingSafeEqual`.
- All `/api/entries` and `/api/settings` routes enforce `requireAuth` Bearer token verification and scope reads/writes strictly to `req.auth.userId`.
- `validateRegisterInput()` and `validateLoginInput()` enforce valid email syntax, minimum 6-character passwords, sanitized display names, and positive numeric targets.

### 2.2 XSS & Numeric Input Protection
- `hasXSSPattern()` rejects `<script>`, `<iframe>`, `<svg>`, `<img>` tags, `on*=` event handlers, `javascript:` URIs, and `data:text/html`.
- `validateEntryInput()` blocks negative/zero prices, `NaN`, `Infinity`, and negative calories/protein.
- `src/utils/analytics.js` clamps denominators and skips zero-macro entries during `Rs./10g P` ranking so empty `Rs. 0` states never yield `NaN` or `Infinity`.

---

## 3. Performance, Empty States & Responsiveness

1. **Clean `Rs. 0` Empty States:** Every chart, nutrition ring, efficiency table, and transaction ledger renders clear guidance states when `entries.length === 0`, updating instantaneously on the first quick-log or preset click.
2. **Memoized Telemetry (`useMemo`):** Dashboard metrics and predictive analytics recompute only when `transactions` or `settings` change.
3. **Responsive Layout:** Collapsible desktop sidebar (`264px` / `78px`) with user profile card + Logout button, paired with mobile header drawer + 4-tab bottom navigation bar.
