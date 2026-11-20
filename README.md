# DBHS Activities Request Form & Automated Approval Workflow

A modern Google Apps Script web application and automated approval workflow for Diamond Bar High School (**DBHS**), sharing architectural patterns, UI styling, and design standards with the WVUSD portal ecosystem.

---

## 1. Identifiers & Configuration

| Asset | Identifier / Value |
|---|---|
| **Master Google Sheet ID** | `1bxzEoZ4GZLw9eIRi1MUpXF7rXWezMeh7Oga8slwj6DE` |
| **Target Google Calendar ID** | `c_classroom7fd4022b@group.calendar.google.com` |
| **Apps Script Project ID** | `1JUDWuUWo8DbNyvAjBoOyx9biMzKZDTPIZC3tYhPYhaA13mEVcTEwFt33` |
| **Primary Theme Accent** | `#6f31a0` (DBHS Deep Purple) |
| **Highlight Theme Accent** | `#ffd760` (DBHS Gold/Yellow) |
| **Official DBHS Wide Logo** | `https://res.cloudinary.com/djv9u4054/image/upload/v1783632852/0-DBARBRAHMASWide_q8uled-removebg-preview_x7ta88.png` |
| **District Logo** | `https://res.cloudinary.com/djv9u4054/image/upload/v1709594191/WVUSD_Logo_Primary_FullColor_h59g1m.png` |

---

## 2. Architecture & File Structure

```
dbhs-activities/
├── .clasp.json          # Clasp configuration mapped to Script ID 1JUDWuUWo8DbNyvAjBoOyx9biMzKZDTPIZC3tYhPYhaA13mEVcTEwFt33
├── appsscript.json      # Manifest with calendar, spreadsheets, gmail.send, scriptapp, and email scopes
├── Code.js              # Server-side business logic, triggers, routing, and calendar sync
├── Index.html           # Main web application view, navbar, stat cards, and modals
├── Stylesheet.html      # DBHS purple & gold styling, responsive tables, and visual status tracker
├── JavaScript.html      # Client-side controller, live search/filtering, and modal workflows
└── README.md            # Comprehensive documentation and setup instructions
```

---

## 3. Google Sheet Schema (`Responses` Tab)

The Google Form populates Columns A through AR:

* **Col A (1):** Timestamp
* **Cols B–E (2–5):** Submitter Email (Q1), Requesting Group (Q2), Advisor Name (Q3), Advisor Email (Q4)
* **Cols F–J (6–10):** Event Date (Q5), Event Title (Q6), Is this event reoccurring? (Q7), Reoccurring dates (Q8), Event Description (Q9)
* **Cols K–N (11–14):** Location (Q10), Arrival Time (Q11), Event Start Time (Q12), Event End Time (Q13)
* **Col O (15):** Set Up Required? (Q14 - branches to Q16 if Yes, Q15 if No)
* **Col P (16):** Revenue Potential Form needed? (Q15 - branches to Q32 if Yes, submits if No)
* **Cols Q–AE (17–31) [Set-Up Section]:** Total duration of facility use including set up and clean up (Q16), Number of Chairs (Q17), Number of Tables (Q18), Podium (Q19), Stage (Q20), Risers (Q21), Coffee Pot (Q22), Portable PA System (Q23), Projector (Q24), Screen (Q25), Microphones (Q26), Stage usage (Q27), Main Curtain (Q28), Additional Information (Q29), Diagram Upload URL (Q30)
* **Col AF (32):** Revenue Potential Form Required? (Set-Up) (Q31 - branches to Q32 if Yes, submits if No)
* **Cols AG–AR (33–44) [Revenue Potential Section]:** Account # (Q32), Date beginning sales (Q33), Date ending sales (Q34), Estimated Total Units Purchased (Q35), Estimated Cost Each (Q36), Estimated Total Net Cost (Q37), Estimated Projected Sales (Units) (Q38), Estimated Projected Sales (Amount each) (Q39), Estimated Projected Sales (Total) (Q40), Projected Gross Income (Q41), Estimated Expenses (Q42), Potential Net Profit (Q43)

### Schema Initialization & Form Creation

The backend includes two initialization functions in `Code.js`:

1. **`initializeSystemColumns()`**:
   - Automatically detects/creates the response tab (`Responses` or `Form Responses 1`).
   - Expands the sheet to at least 51 columns (preventing invalid dimension errors).
   - Writes all **44 Form Question headers** (Col A–AR) matching the DBHS Activities Request Form PDF.
   - Writes and formats the **7 Workflow System Columns** (Col AS–AY) with DBHS purple (`#6f31a0`) and gold (`#ffd760`).
   - Automatically creates and pre-populates the `Approvers` tab with all 10 DBHS campus locations.

2. **`createDBHSGoogleForm()`**:
   - Programmatically builds the entire 43-question Google Form with all sections, branching logic, rules/regulations description, and time/date inputs.
   - Links the form's response destination directly to the Master Google Spreadsheet.

* **Col AS (45):** `Request ID` (e.g. `DBHS-ACT-001`)
* **Col AT (46):** `Overall Status` (`Pending`, `Approved`, `Denied`, `Changes Requested`)
* **Col AU (47):** `Current Approver` (Comma-separated emails of location approvers)
* **Col AV (48):** `Approval Log` (Audit trail of timestamps, approvers, actions, and comments)
* **Col AW (49):** `Calendar Event IDs` (Comma-separated list of created Google Calendar event IDs)
* **Col AX (50):** `Calendar Sync Status` (`Synced`, `Not Synced`, or Error)
* **Col AY (51):** `Last Updated` (Timestamp of the most recent workflow change)

---

## 4. Routing & `Approvers` Tab Setup

In the Master Google Sheet, configure the `Approvers` tab with the following 3 columns:

| Col A: Location | Col B: Approver Emails | Col C: Calendar Dashboard Editors |
|---|---|---|
| Amphitheater | `approver1@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Bullpen | `approver2@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Corkrum Corral | `approver3@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Gym | `athletics@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Golden Horseshoe | `approver4@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Library | `librarian@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Stadium | `athletics@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Theater | `theatertech@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Upper Quad | `activities@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |
| Other | `admin@wvusd.org` | `secretary1@wvusd.org, secretary2@wvusd.org` |

* Fallback logic: Any request with an unlisted location automatically routes to the approvers defined for `Other`.

---

## 5. Workflow Execution & Features

### A. Automatic Form Submission Processing (`onFormSubmit`)
1. Generates `Request ID` (e.g. `DBHS-ACT-001`, sequential zero-padded).
2. Sets `Overall Status` to `Pending`.
3. Resolves the Location Approver(s) from `Approvers` Col A/B and populates `Current Approver`.
4. Initializes the `Approval Log` with submission timestamp and applicant email.
5. Sends a responsive, branded HTML email to the Location Approver(s):
   - Shows populated fields only (hides Set-Up fields if Q14 = No; hides Revenue Potential fields if Q15/Q31 = No).
   - Clickable button/link to any uploaded diagram (Q30).
   - Direct button to open the request in the Approval Portal.
6. Sends a confirmation email to Submitter (Col B) and Advisor (Col E) with a real-time status tracker link (`?id=DBHS-ACT-###`).

### B. Approval Action & Calendar Synchronization
1. Approver opens request in portal and chooses **Approve**, **Deny**, or **Request Changes** with optional/mandatory comments.
2. Upon **Approve**:
   - Updates `Overall Status` to `Approved` and `Current Approver` to `Complete`.
   - Appends approver email, timestamp, and comments to `Approval Log`.
   - Parses the primary `Event Date` (Q5).
   - If `Is this event reoccurring?` is `Yes`, parses comma-separated dates from Q8, trims whitespace, validates each date, deduplicates against Q5, and sorts them chronologically.
   - For every valid date, creates an event on calendar `c_classroom7fd4022b@group.calendar.google.com` with:
     - Title = `Event Title` (Q6)
     - Location = `Location` (Q10)
     - Timed span = `Event Start Time` (Q12) to `Event End Time` (Q13)
     - Rich Description = Request ID, Group, Advisor, Arrival Time, Total Duration (if Set-Up = Yes), and Set-Up/AV/Theater needs.
   - Stores all Google Calendar Event IDs as a comma-separated string in **Col AW (`Calendar Event IDs`)**.
   - Sets **Col AX** to `Synced` and updates **Col AY** (`Last Updated`).
   - Emails Advisor, Submitter, and Ops Secretaries (`Calendar Dashboard Editors`).

### C. Secretary Dashboard & Calendar Editor Portal (Ops Secretary Pattern)
* Authorized secretaries listed in `Approvers` Col C (`Calendar Dashboard Editors`) get access to a dedicated **Calendar & Schedule Management** tab and editor modal.
* Secretaries can modify an approved event's **Title, Location, Primary Date, Additional Comma-Separated Dates, Start Time, End Time, or Description**.
* On save:
   - Server re-verifies the user's email against Col C before taking action.
   - Updates existing calendar events using their linked IDs in `Col AW`.
   - Deletes removed dates using `event.deleteEvent()`.
   - Creates calendar events for newly added dates.
   - Updates `Col AW` with the updated ID list, updates sheet row values, and logs the secretary's email and timestamp in `Approval Log`.

---

## 6. Deployment Instructions

1. **Push Files to Google Apps Script**:
   ```bash
   cd /home/kwendland/wvusd-certificated-evaluations/dbhs-activities
   clasp push
   ```
2. **Initialize System Columns**:
   - In the Apps Script editor, run `initializeSystemColumns()` once to configure Col AS-AY in the Master Google Sheet.
3. **Register Installable Trigger**:
   - Run `setupInstallableFormSubmitTrigger()` from the Apps Script editor to bind `onFormSubmit` to form submissions.
4. **Deploy as Web App**:
   - Click **Deploy > New Deployment**.
   - Select type: **Web app**.
   - Description: `DBHS Activities Request Portal v1.0`.
   - **Execute as:** `User accessing the web app` or `Me (notifications account)`.
   - **Who has access:** `Anyone within Walnut Valley Unified School District`.
