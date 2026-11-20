# DBHS Activities Request & Google Calendar Approval System

A full-stack **React + Vite** web application hosted on GitHub Pages (`wvusd-tech/DBHS-request`) backed by a **Google Apps Script Web App JSON REST API** for Diamond Bar High School (**DBHS**), matching the architecture and design standards of our **WVUSD Field Trip 4.0** project (with all student/volunteer permission slips removed).

---

## 1. Identifiers & Configuration

| Asset | Identifier / Value |
|---|---|
| **GitHub Repository** | `wvusd-tech/DBHS-request` |
| **Vite Base Path** | `/DBHS-request/` (for GitHub Pages) |
| **Master Google Sheet ID** | `1bxzEoZ4GZLw9eIRi1MUpXF7rXWezMeh7Oga8slwj6DE` |
| **Target Google Calendar ID** | `c_classroom7fd4022b@group.calendar.google.com` |
| **Apps Script Project ID** | `1JUDWuUWo8DbNyvAjBoOyx9biMzKZDTPIZC3tYhPYhaA13mEVcTEwFt33` |
| **Primary Theme Accent** | `#6f31a0` (DBHS Deep Purple) |
| **Highlight Theme Accent** | `#ffd760` (DBHS Gold/Yellow) |
| **Official DBHS Wide Logo** | `https://res.cloudinary.com/djv9u4054/image/upload/v1783632852/0-DBARBRAHMASWide_q8uled-removebg-preview_x7ta88.png` |

---

## 2. Architecture & File Structure

```
DBHS-request/
├── .clasp.json                  # Clasp configuration for Script ID 1JUDWuUWo8DbNyvAjBoOyx9biMzKZDTPIZC3tYhPYhaA13mEVcTEwFt33
├── .claspignore                 # Clasp filter ignoring node_modules, src, dist, and package.json
├── appsscript.json              # Scopes: calendar, spreadsheets, drive, gmail.send, scriptapp, email
├── Code.js                      # Apps Script backend API (doGet, doPost, CalendarService, EmailService)
├── index.html                   # Vite HTML entry point
├── package.json                 # React 18, Vite, Lucide React, Tailwind CSS
├── vite.config.js               # Configured with base: '/DBHS-request/'
├── tailwind.config.js           # DBHS Purple (#6f31a0) and Gold (#ffd760) theme
└── src/
    ├── api.js                   # Universal JSON API client (text/plain POST, CORS-free, local fallback)
    ├── App.jsx                  # Main tabbed controller (Teacher, Approver, Ops Secretary)
    ├── main.jsx                 # React root renderer
    ├── index.css                # Tailwind base styles
    ├── constants/
    │   └── locations.js         # DBHS campus locations and policies
    └── components/
        ├── Navbar.jsx           # DBHS branding, logo, navigation tabs, user menu, GAS URL settings
        ├── LoginGate.jsx        # Google ID token sign-in + quick demo role switcher
        ├── NewActivityModal.jsx # Multi-step request wizard replacing Google Forms (all 43 questions)
        ├── TeacherDashboard.jsx # Submitter view, stats cards, and visual request tracker
        ├── ApproverDashboard.jsx# Location approver queue (Approve, Deny, Request Changes)
        ├── OpsDashboard.jsx     # Ops Secretary calendar editor, batch recurring sync & audit notes
        └── ActivityDrawer.jsx   # Detailed drawer: equipment, setup, revenue breakdown, timeline
```

---

## 3. Google Sheet Schema & Test Seed Data

Run **`initializeSheetAndDummyData()`** in the Apps Script editor to set up the spreadsheet:
1. **`Responses` Tab (Cols A–AY / 51 Columns Total):**
   - **Cols A–AR (1–44):** All 44 form questions from the DBHS Activities Request Form.
   - **Cols AS–AY (45–51):** System workflow columns (`Request ID`, `Overall Status`, `Current Approver`, `Approval Log`, `Calendar Event IDs`, `Calendar Sync Status`, `Last Updated`).
2. **`Approvers` Tab:**
   - Pre-populates all 10 DBHS campus locations: *Amphitheater, Bullpen, Corkrum Corral, Gym, Golden Horseshoe, Library, Stadium, Theater, Upper Quad, Other*.
   - Pre-fills `kwendland@wvusd.org` as Location Approver (Col B) and Calendar Dashboard Editor (Col C).
3. **Seeded Test Requests:**
   - **`DBHS-ACT-001`**: Robotics Club Showcase in the `Gym` (Multi-date, complex equipment setup, `Pending` approval).
   - **`DBHS-ACT-002`**: Drama Club Spring Musical in the `Theater` (Multi-date, revenue potential = Yes, `Approved` & `Synced` with dummy calendar event IDs to test editing right away).
   - **`DBHS-ACT-003`**: ASB Winter Holiday Lunch Rally in the `Amphitheater` (Single-day rally, `Pending` approval).

---

## 4. How to Deploy the Web App & Connect

1. **In Google Apps Script (`1JUDWuUWo8DbNyvAjBoOyx9biMzKZDTPIZC3tYhPYhaA13mEVcTEwFt33`):**
   - Click **Deploy > New Deployment**.
   - Select type: **Web app**.
   - Execute as: **Me (`kwendland@wvusd.org`)**.
   - Who has access: **Anyone within wvusd.org** (or **Anyone**).
   - Copy the deployed **Web app URL** (`https://script.google.com/macros/s/.../exec`).

2. **In the React Web App:**
   - Click the **Gear icon (⚙)** in the top right navbar.
   - Paste the Web App URL and click **Save & Connect**.
   - Or set `VITE_API_URL` in `.env`.

---

## 5. Development & Build Commands

```bash
# Run local development server
npm run dev

# Build production bundle for GitHub Pages (/DBHS-request/)
npm run build
```
