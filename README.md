# GermanyCostBD 🇧🇩 ✈️ 🇩🇪

**GermanyCostBD** is a personal, production-ready, mobile-first study-abroad cost planner and preparation tracker specifically crafted for students from **Bangladesh** aspiring to pursue higher education in **Germany**.

---

## 🌟 Key Features

1. **Animated Hero Overview**:
   - Total budget range in BDT with smooth count-up animation
   - Circular progress ring showing completed preparation tasks
   - Live effective exchange rate chip (`€1 = ৳X`) with time-since-update indicator
   - Real-time remaining budget calculation
2. **6-Stage Journey Stepper**:
   - Covers: **Preparation**, **University Application**, **Blocked Account**, **Visa**, **Housing & Ticket**, and **Arrival**
   - Click to filter or smoothly scroll to relevant step
   - Completion badges & celebratory confetti when finishing steps
3. **Data-Driven Cost Checklist** (`/data/costs.json`):
   - Items with min, max, default, notes, source link, last verified date, and classification (`fee`, `refundable`, `released-monthly`)
   - "Arranged" checkbox (with explanatory tooltip: confirms arrangement, distinct from paid)
   - Editable estimates and actual paid amount tracking
   - Reorder and custom item creation / deletion
4. **Interactive Budget Visualization (Recharts)**:
   - Donut chart displaying cost proportion per category (clicking slices filters the list)
   - Comparative stacked bar chart (Min vs Selected vs Actual vs Max)
5. **Live Exchange Rate Engine (`/api/rate`)**:
   - Fetches official EUR/BDT rates from Open ER API
   - Automatic caching and reliable fallback
   - Bank margin slider (0–5%) and manual rate override
6. **Live Fee Refresh & Admin Review**:
   - Vercel Cron route (`/api/cron/refresh-fees`)
   - Proposed fee updates written to `pending` queue
   - "Fee changed since last verified" notification banner
   - Protected `/admin` page to review, approve, or reject changes
7. **Scenario Comparison & City Multipliers**:
   - Presets: **Budget** (-15%), **Standard** (default), **Comfortable** (+25%)
   - German city selector with localized rent & living cost indexes (Berlin, Munich, Dresden, Leipzig, Small Town)
   - Side-by-side comparison of up to 3 saved scenarios
8. **Timeline & Deadlines**:
   - Winter / Summer intake selector with year picker
   - Automatically scheduled milestones (12, 10, 8, 4 months prior)
   - One-click `.ics` calendar export for Google / Apple Calendar
9. **Smart Insights**:
   - Dynamic spending advice based on savings needed, budget threshold alerts, and EUR trend tips
10. **Export & Sharing**:
    - Print-ready PDF report layout (Summary, Checklist, Itemized Table)
    - JSON Backup & Restore
    - Shareable read-only link (state encoded in URL hash)
    - Reset to defaults with confirmation dialog and 1-click Undo toast
11. **Bangla / English Localization (i18n)**:
    - Default Bangla with English toggle
    - Hind Siliguri typography with localized number formatting
    - Light & Dark mode support

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node.js 20+ recommended)
- npm or yarn

### Installation

1. Clone or navigate into the repository:
   ```bash
   cd GermanyCostBD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to set `ADMIN_PASSWORD` (default: `germany2026`) and `CRON_SECRET`.*

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Run unit tests:
   ```bash
   npm test
   ```

6. Build for production:
   ```bash
   npm run build
   ```

---

## 🛠️ How to Update Fees

Costs are managed via `data/costs.json` (and `src/data/costs.json`):

### Option 1: Admin Interface (Recommended)
1. Visit `/admin` in your browser.
2. Enter the administrator password (configured via `ADMIN_PASSWORD` in `.env.local`).
3. Review any changes scraped by the automated cron job (`/api/cron/refresh-fees`).
4. Click **Approve & Update** to apply changes to the seed data.

### Option 2: Manual Edit
1. Open `data/costs.json`.
2. Locate the target item by `id` (e.g. `"ielts"`, `"uni-assist-first"`, `"blocked-account"`).
3. Update `min`, `max`, `default`, `sourceUrl`, and `lastVerified` fields.
4. Save and deploy or restart dev server.

---

## 🌍 How to Add a New Country

GermanyCostBD is architected for straightforward multi-country adaptation:

1. **Create or extend the data schema**:
   - Duplicate `data/costs.json` to e.g. `data/costs-usa.json` or `data/costs-uk.json`.
   - Update `currency.base` (e.g., `USD`, `GBP`).
   - Define country-specific categories and cost items (e.g., SEVIS fee, CAS letter, tuition deposits).
2. **Adjust Exchange Rate Route**:
   - In `src/app/api/rate/route.ts`, adjust the target currency endpoint to query your base currency (e.g. `https://open.er-api.com/v6/latest/USD`).
3. **Add City Adjustments & Scenarios**:
   - Add target cities and living multipliers in the `cityAdjustments` object.
4. **Update Semester Intakes**:
   - In `src/lib/budget.ts`, adjust `generateDeadlines` with semester start months relevant to the target country (e.g., Fall/Spring intakes).

---

## 🔒 Privacy & Data Storage

All personal budget numbers, custom items, and checked milestones are stored strictly in the user's browser using `localStorage`. No user cost data is sent to or stored on any remote server.

---

## 📄 License

MIT License. Designed with ❤️ for Bangladeshi students heading to Germany.
