/**
 * DBHS Activities Request Form - Google Apps Script Backend
 * ---------------------------------------------------------------------------------
 * Handles form submissions, approval workflows, role-based authorization,
 * and automated bidirectional Google Calendar synchronization.
 *
 * Diamond Bar High School (WVUSD)
 * School Colors: #6f31a0 (Deep Purple), #ffd760 (Gold/Yellow)
 * ---------------------------------------------------------------------------------
 */

// =================================================================================
// 1. SYSTEM CONFIGURATION & IDENTIFIERS
// =================================================================================
const CONFIG = {
  // Master Google Sheet & Calendar IDs
  MASTER_SHEET_ID: '1bxzEoZ4GZLw9eIRi1MUpXF7rXWezMeh7Oga8slwj6DE',
  CALENDAR_ID: 'c_classroom7fd4022b@group.calendar.google.com',
  SCRIPT_ID: '1JUDWuUWo8DbNyvAjBoOyx9biMzKZDTPIZC3tYhPYhaA13mEVcTEwFt33',

  // Sheet Tab Names
  RESPONSES_SHEET: 'Responses',
  APPROVERS_SHEET: 'Approvers',

  // Branding Assets
  DBHS_LOGO_URL: 'https://res.cloudinary.com/djv9u4054/image/upload/v1783632852/0-DBARBRAHMASWide_q8uled-removebg-preview_x7ta88.png',
  WVUSD_LOGO_URL: 'https://res.cloudinary.com/djv9u4054/image/upload/v1709594191/WVUSD_Logo_Primary_FullColor_h59g1m.png',

  // School Colors
  COLORS: {
    PRIMARY: '#6f31a0',     // DBHS Deep Purple
    SECONDARY: '#ffd760',   // DBHS Gold / Yellow
    DARK: '#4a1e6d',        // Darker Purple
    LIGHT: '#f9f6fc',       // Tinted Background
    BORDER: '#e5d9f2',
    SUCCESS: '#198754',
    WARNING: '#e6a100',
    DANGER: '#dc3545'
  },

  // Workflow Constants
  ID_PREFIX: 'DBHS-ACT-',
  TIMEZONE: 'America/Los_Angeles',
  APP_TITLE: 'DBHS Activities Request Portal',

  // Status Enum
  STATUS: {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    DENIED: 'Denied',
    CHANGES_REQUESTED: 'Changes Requested'
  },

  // System Testing Mode
  IS_TESTING: false,
  TEST_EMAIL: 'kwendland@wvusd.org'
};

/**
 * Column Index Mapping (0-based for arrays, 1-based for getRange)
 * Sheet Form Columns: A (0) to AR (43)
 * Sheet Workflow Columns: AS (44) to AY (50)
 */
const COL = {
  // Form Questions A-AR
  TIMESTAMP: 0,                   // Col A (Q0)
  SUBMITTER_EMAIL: 1,             // Col B (Q1)
  REQUESTING_GROUP: 2,            // Col C (Q2)
  ADVISOR_NAME: 3,                // Col D (Q3)
  ADVISOR_EMAIL: 4,               // Col E (Q4)
  EVENT_DATE: 5,                  // Col F (Q5)
  EVENT_TITLE: 6,                 // Col G (Q6)
  IS_REOCCURRING: 7,              // Col H (Q7)
  REOCCURRING_DATES: 8,           // Col I (Q8)
  EVENT_DESCRIPTION: 9,           // Col J (Q9)
  LOCATION: 10,                   // Col K (Q10)
  ARRIVAL_TIME: 11,               // Col L (Q11)
  START_TIME: 12,                 // Col M (Q12)
  END_TIME: 13,                   // Col N (Q13)
  SETUP_REQUIRED: 14,             // Col O (Q14)
  REVENUE_FORM_NEEDED: 15,        // Col P (Q15)

  // Set-up Section Q-AE
  FACILITY_DURATION: 16,          // Col Q (Q16)
  NUM_CHAIRS: 17,                 // Col R (Q17)
  NUM_TABLES: 18,                 // Col S (Q18)
  PODIUM: 19,                     // Col T (Q19)
  STAGE: 20,                      // Col U (Q20)
  RISERS: 21,                     // Col V (Q21)
  COFFEE_POT: 22,                 // Col W (Q22)
  PA_SYSTEM: 23,                  // Col X (Q23)
  PROJECTOR: 24,                  // Col Y (Q24)
  SCREEN: 25,                     // Col Z (Q25)
  MICROPHONES: 26,                // Col AA (Q26)
  STAGE_USAGE: 27,                // Col AB (Q27)
  MAIN_CURTAIN: 28,               // Col AC (Q28)
  ADDITIONAL_INFO: 29,            // Col AD (Q29)
  DIAGRAM_URL: 30,                // Col AE (Q30)

  // Revenue Potential Branching AF
  REVENUE_FORM_SETUP: 31,         // Col AF (Q31)

  // Revenue Potential Section AG-AR
  ACCOUNT_NUM: 32,                // Col AG (Q32)
  SALES_START_DATE: 33,           // Col AH (Q33)
  SALES_END_DATE: 34,             // Col AI (Q34)
  UNITS_PURCHASED: 35,            // Col AJ (Q35)
  COST_EACH: 36,                  // Col AK (Q36)
  TOTAL_NET_COST: 37,             // Col AL (Q37)
  PROJECTED_SALES_UNITS: 38,      // Col AM (Q38)
  PROJECTED_SALES_AMOUNT_EACH: 39,// Col AN (Q39)
  PROJECTED_SALES_TOTAL: 40,      // Col AO (Q40)
  PROJECTED_GROSS_INCOME: 41,     // Col AP (Q41)
  ESTIMATED_EXPENSES: 42,         // Col AQ (Q42)
  POTENTIAL_NET_PROFIT: 43,       // Col AR (Q43)

  // Workflow System Columns AS-AY (Starting at 44 / Col 45)
  REQUEST_ID: 44,                 // Col AS
  OVERALL_STATUS: 45,             // Col AT
  CURRENT_APPROVER: 46,           // Col AU
  APPROVAL_LOG: 47,               // Col AV
  CALENDAR_EVENT_IDS: 48,         // Col AW
  CALENDAR_SYNC_STATUS: 49,       // Col AX
  LAST_UPDATED: 50                // Col AY
};

const SYSTEM_COLUMNS = [
  'Request ID',
  'Overall Status',
  'Current Approver',
  'Approval Log',
  'Calendar Event IDs',
  'Calendar Sync Status',
  'Last Updated'
];

const ALL_FORM_QUESTIONS = [
  'Timestamp',
  'Email Address',
  'Requesting Group',
  'Advisor',
  'Advisor Email',
  'Event Date',
  'Event Title',
  'Is this event reoccurring?',
  'If yes, please add the dates below',
  'Event Description',
  'Location',
  'Arrival Time',
  'Event Start Time',
  'Event End Time',
  'Set Up Required?',
  'Revenue Potential Form needed?',
  'Total duration of facility use including set up and clean up',
  'Number of Chairs',
  'Number of Tables',
  'Podium',
  'Stage',
  'Risers',
  'Coffee Pot',
  'Portable PA System',
  'Projector',
  'Screen',
  'Microphones',
  'Stage usage',
  'Main Curtain',
  'Additional Information',
  'If needed, upload a diagram of the exact placement of the tables, chairs, riser, PA, etc.',
  'Revenue Potential Form Required? (Set-Up)',
  'Account #',
  'Date beginning sales',
  'Date ending sales',
  'Estimated Total Units Purchased',
  'Estimated Cost Each',
  'Estimated Total Net Cost',
  'Estimated Projected Sales (Units)',
  'Estimated Projected Sales (Amount each)',
  'Estimated Projected Sales (Total)',
  'Projected Gross Income',
  'Estimated Expenses',
  'Potential Net Profit'
];


// =================================================================================
// 2. WEB APPLICATION ENTRY POINTS & JSON REST API
// =================================================================================

/**
 * Creates formatted JSON response output with permissive CORS headers.
 */
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Handles HTTP GET requests to render the web application or query JSON status.
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action).trim() : '';
  const reqId = (e && e.parameter && (e.parameter.id || e.parameter.requestId)) ? String(e.parameter.id || e.parameter.requestId).trim() : '';

  if (action === 'getPortalData') {
    try {
      const email = (e && e.parameter && e.parameter.email) ? String(e.parameter.email).trim() : '';
      const data = getPortalData(email);
      return createJsonResponse({ success: true, data: data });
    } catch (err) {
      return createJsonResponse({ success: false, error: err.message });
    }
  }

  if (action === 'getRequestById' && reqId) {
    try {
      const req = getRequestById(reqId);
      return createJsonResponse({ success: true, data: req });
    } catch (err) {
      return createJsonResponse({ success: false, error: err.message });
    }
  }

  if (action === 'ping') {
    return createJsonResponse({
      success: true,
      service: CONFIG.APP_TITLE,
      status: 'Active',
      timestamp: new Date().toISOString()
    });
  }

  // HTML Web App fallback
  try {
    const template = HtmlService.createTemplateFromFile('Index');
    template.initialRequestId = reqId;
    return template.evaluate()
      .setTitle(CONFIG.APP_TITLE)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return createJsonResponse({
      service: CONFIG.APP_TITLE,
      status: 'Active',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handles HTTP POST requests: Universal JSON API for the React/Vite Staff Portal
 * (Uses Content-Type: text/plain to avoid CORS OPTIONS preflight blocks).
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: 'Empty request payload' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({ success: false, error: 'Invalid JSON payload: ' + parseErr.message });
    }

    const action = payload.action;
    if (!action) {
      return createJsonResponse({ success: false, error: 'Missing action parameter' });
    }

    // Verify User / Token
    const authUser = verifyAuthUser_(payload);

    if (action === 'verifyAuth') {
      const approversDir = getApproversDirectory_();
      const userEmail = authUser.email;
      const isOps = approversDir.calendarEditors.includes(userEmail);
      const isApprover = approversDir.allApprovers.has(userEmail);
      const isAdmin = isOps || (userEmail.endsWith('@wvusd.org') && (userEmail.startsWith('kwendland') || isOps));

      return createJsonResponse({
        success: true,
        data: {
          user: {
            email: userEmail,
            name: authUser.name || userEmail,
            roles: {
              isApprover: isApprover,
              isOpsSecretary: isOps,
              isAdmin: isAdmin
            }
          }
        }
      });
    }

    if (action === 'getPortalData') {
      const portalData = getPortalData(authUser.email);
      return createJsonResponse({ success: true, data: portalData });
    }

    if (action === 'submitActivityRequest') {
      const result = submitActivityRequest(payload, authUser.email);
      return createJsonResponse({ success: true, data: result });
    }

    if (action === 'handleApprovalAction') {
      const result = handleApprovalAction(payload, authUser.email);
      return createJsonResponse({ success: true, data: result });
    }

    if (action === 'updateCalendarSchedule') {
      const result = updateCalendarSchedule(payload, authUser.email);
      return createJsonResponse({ success: true, data: result });
    }

    if (action === 'addActivityNote') {
      const result = addActivityNote(payload, authUser.email);
      return createJsonResponse({ success: true, data: result });
    }

    return createJsonResponse({ success: false, error: 'Unknown action: ' + action });

  } catch (err) {
    Logger.log('Error in doPost: ' + err.message + (err.stack ? '\n' + err.stack : ''));
    return createJsonResponse({ success: false, error: err.message });
  }
}

/**
 * Validates Google ID token, DEV_MOCK_ credentials, or falls back to active session / test user.
 */
function verifyAuthUser_(payload) {
  const token = payload.idToken || payload.token || '';
  const emailParam = (payload.userEmail || payload.email || '').toLowerCase().trim();

  // 1. Support DEV_MOCK_ tokens for local/demo testing (matching wvusd-field-trips)
  if (token && token.indexOf('DEV_MOCK_') === 0) {
    const mockEmail = token.replace('DEV_MOCK_', '').toLowerCase().trim();
    return { email: mockEmail, name: mockEmail };
  }

  // 2. Direct email fallback if provided and valid domain
  if (emailParam && emailParam.endsWith('@wvusd.org')) {
    return { email: emailParam, name: emailParam };
  }

  // 3. Google ID Token verification
  if (token && token.length > 30) {
    try {
      const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), {
        muteHttpExceptions: true
      });
      if (res.getResponseCode() === 200) {
        const body = JSON.parse(res.getContentText());
        const email = String(body.email || '').toLowerCase().trim();
        if (email.endsWith('@wvusd.org')) {
          return { email: email, name: body.name || email, picture: body.picture || '' };
        }
      }
    } catch (e) {
      Logger.log('Token validation error: ' + e);
    }
  }

  // 4. Session active user fallback
  try {
    const sessionEmail = Session.getActiveUser().getEmail().toLowerCase().trim();
    if (sessionEmail) {
      return { email: sessionEmail, name: sessionEmail };
    }
  } catch (e) {}

  return { email: CONFIG.TEST_EMAIL, name: 'Kevin Wendland' };
}

/**
 * Saves a base64 encoded diagram image directly to Google Drive and returns view link.
 */
function saveDiagramToDrive_(base64Data, fileName, requestId) {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const decoded = Utilities.base64Decode(cleanBase64);
    const safeName = (requestId || 'DBHS') + '_Diagram_' + (fileName || 'diagram.jpg');
    const blob = Utilities.newBlob(decoded, 'image/jpeg', safeName);
    const file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log('Could not save diagram to Drive: ' + e);
    return '';
  }
}

/**
 * Appends a timestamped note from an Ops Secretary or Approver to the request's audit log.
 */
function addActivityNote(payload, userEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    throw new Error('System is busy. Please try again.');
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
    const respSheet = getResponsesSheet_(ss);
    const data = respSheet.getDataRange().getValues();
    const requestId = String(payload.requestId || '').trim().toUpperCase();
    const noteText = String(payload.note || '').trim();

    if (!requestId || !noteText) {
      throw new Error('Missing request ID or note content.');
    }

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][COL.REQUEST_ID] || '').trim().toUpperCase() === requestId) {
        const rowIndex = i + 1;
        const now = new Date();
        const existingLog = String(data[i][COL.APPROVAL_LOG] || '');
        const entry = Utilities.formatDate(now, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm') +
          ': [Note by ' + (userEmail || 'Editor') + ']: ' + noteText;
        const updatedLog = existingLog ? existingLog + '\n' + entry : entry;

        respSheet.getRange(rowIndex, COL.APPROVAL_LOG + 1).setValue(updatedLog);
        respSheet.getRange(rowIndex, COL.LAST_UPDATED + 1).setValue(now);

        return { success: true, updatedLog: updatedLog };
      }
    }
    throw new Error('Request ' + requestId + ' not found.');
  } finally {
    lock.releaseLock();
  }
}

/**
 * Submits a new DBHS Activities Request directly from the React/Vite form wizard.
 */
function submitActivityRequest(payload, userEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    throw new Error('System is busy. Please try submitting again in a moment.');
  }

  try {
    initializeSystemColumns();
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
    const respSheet = getResponsesSheet_(ss);
    const data = respSheet.getDataRange().getValues();

    // Determine next sequential Request ID
    let maxIdNum = 0;
    for (let i = 1; i < data.length; i++) {
      const existingId = String(data[i][COL.REQUEST_ID] || '').trim();
      const match = existingId.match(/DBHS-ACT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdNum) maxIdNum = num;
      }
    }
    maxIdNum++;
    const requestId = Utilities.formatString('%s%03d', CONFIG.ID_PREFIX, maxIdNum);

    // Save diagram to Google Drive if base64 provided
    let diagramUrl = String(payload.diagramUrl || '').trim();
    if (payload.diagramBase64) {
      diagramUrl = saveDiagramToDrive_(payload.diagramBase64, payload.diagramFileName, requestId);
    }

    const now = new Date();
    const submitter = String(payload.submitterEmail || userEmail || '').trim().toLowerCase();
    const advisorEmail = String(payload.advisorEmail || '').trim().toLowerCase();
    const locationVal = String(payload.location || '').trim();
    const approversDir = getApproversDirectory_();
    const approversList = resolveApproversForLocation_(locationVal, approversDir);
    const approversEmailStr = approversList.join(', ');

    const initialLog = Utilities.formatDate(now, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm') +
      ': Submitted by ' + (submitter || 'Applicant') + '. Routed to: ' + (approversEmailStr || 'Other Approver');

    // Build row array of 51 columns
    const newRow = new Array(51).fill('');
    newRow[COL.TIMESTAMP] = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    newRow[COL.SUBMITTER_EMAIL] = submitter;
    newRow[COL.REQUESTING_GROUP] = payload.requestingGroup || '';
    newRow[COL.ADVISOR_NAME] = payload.advisorName || '';
    newRow[COL.ADVISOR_EMAIL] = advisorEmail;
    newRow[COL.EVENT_DATE] = payload.eventDate || '';
    newRow[COL.EVENT_TITLE] = payload.eventTitle || '';
    newRow[COL.IS_REOCCURRING] = payload.isReoccurring || 'No';
    newRow[COL.REOCCURRING_DATES] = payload.reoccurringDates || '';
    newRow[COL.EVENT_DESCRIPTION] = payload.eventDescription || '';
    newRow[COL.LOCATION] = locationVal;
    newRow[COL.ARRIVAL_TIME] = payload.arrivalTime || '';
    newRow[COL.START_TIME] = payload.startTime || '';
    newRow[COL.END_TIME] = payload.endTime || '';
    newRow[COL.SETUP_REQUIRED] = payload.setupRequired || 'No';
    newRow[COL.REVENUE_FORM_NEEDED] = payload.revenueFormNeeded || 'No';

    // Set-Up
    newRow[COL.FACILITY_DURATION] = payload.facilityDuration || '';
    newRow[COL.NUM_CHAIRS] = payload.numChairs || '';
    newRow[COL.NUM_TABLES] = payload.numTables || '';
    newRow[COL.PODIUM] = payload.podium || 'No';
    newRow[COL.STAGE] = payload.stage || 'No';
    newRow[COL.RISERS] = payload.risers || 'No';
    newRow[COL.COFFEE_POT] = payload.coffeePot || 'No';
    newRow[COL.PA_SYSTEM] = payload.paSystem || 'No';
    newRow[COL.PROJECTOR] = payload.projector || 'No';
    newRow[COL.SCREEN] = payload.screen || 'No';
    newRow[COL.MICROPHONES] = payload.microphones || 'No';
    newRow[COL.STAGE_USAGE] = payload.stageUsage || 'N/A';
    newRow[COL.MAIN_CURTAIN] = payload.mainCurtain || 'No';
    newRow[COL.ADDITIONAL_INFO] = payload.additionalInfo || '';
    newRow[COL.DIAGRAM_URL] = diagramUrl;
    newRow[COL.REVENUE_FORM_SETUP] = payload.revenueFormSetup || 'No';

    // Revenue Potential
    newRow[COL.ACCOUNT_NUM] = payload.accountNum || '';
    newRow[COL.SALES_START_DATE] = payload.salesStartDate || '';
    newRow[COL.SALES_END_DATE] = payload.salesEndDate || '';
    newRow[COL.UNITS_PURCHASED] = payload.unitsPurchased || '';
    newRow[COL.COST_EACH] = payload.costEach || '';
    newRow[COL.TOTAL_NET_COST] = payload.totalNetCost || '';
    newRow[COL.PROJECTED_SALES_UNITS] = payload.projectedSalesUnits || '';
    newRow[COL.PROJECTED_SALES_AMOUNT_EACH] = payload.projectedSalesAmountEach || '';
    newRow[COL.PROJECTED_SALES_TOTAL] = payload.projectedSalesTotal || '';
    newRow[COL.PROJECTED_GROSS_INCOME] = payload.projectedGrossIncome || '';
    newRow[COL.ESTIMATED_EXPENSES] = payload.estimatedExpenses || '';
    newRow[COL.POTENTIAL_NET_PROFIT] = payload.potentialNetProfit || '';

    // System Columns
    newRow[COL.REQUEST_ID] = requestId;
    newRow[COL.OVERALL_STATUS] = CONFIG.STATUS.PENDING;
    newRow[COL.CURRENT_APPROVER] = approversEmailStr;
    newRow[COL.APPROVAL_LOG] = initialLog;
    newRow[COL.CALENDAR_EVENT_IDS] = '';
    newRow[COL.CALENDAR_SYNC_STATUS] = 'Not Synced';
    newRow[COL.LAST_UPDATED] = Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

    // Append to sheet
    respSheet.appendRow(newRow);

    const rowIndex = respSheet.getLastRow();
    const reqObj = mapRowToRequestObject_(newRow, rowIndex);

    // Send Emails
    try {
      if (approversList.length > 0) {
        sendApproverNotificationEmail_(approversList, reqObj);
      }
      const applicants = [submitter, advisorEmail].filter(Boolean);
      if (applicants.length > 0) {
        sendSubmitterConfirmationEmail_(applicants, reqObj);
      }
    } catch (mailErr) {
      Logger.log('Email sending error on submission: ' + mailErr);
    }

    return {
      requestId: requestId,
      status: CONFIG.STATUS.PENDING,
      currentApprover: approversEmailStr,
      diagramUrl: diagramUrl
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper to include HTML partials inside templates.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Returns current user's email in lower-case, respecting testing mode.
 */
function getCurrentUserEmail_() {
  if (CONFIG.IS_TESTING) {
    return CONFIG.TEST_EMAIL.toLowerCase().trim();
  }
  return Session.getActiveUser().getEmail().toLowerCase().trim();
}

/**
 * Returns published Web App URL.
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl() || '';
}


// =================================================================================
// 3. SYSTEM INITIALIZATION & SHEET SETUP
// =================================================================================

/**
 * Returns the responses sheet regardless of whether it is named 'Responses',
 * 'Form Responses 1', or the default first sheet.
 */
function getResponsesSheet_(ss) {
  if (!ss) ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.RESPONSES_SHEET);
  if (sheet) return sheet;
  sheet = ss.getSheetByName('Form Responses 1');
  if (sheet) return sheet;
  sheet = ss.getSheetByName('Form Responses');
  if (sheet) return sheet;

  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== CONFIG.APPROVERS_SHEET) {
      return sheets[i];
    }
  }
  return sheets[0];
}

/**
 * Setup function: Safely initializes all 44 form questions (Col A-AR) and 7 system
 * workflow columns (Col AS-AY), auto-expanding the sheet to at least 51 columns,
 * formatting with DBHS purple (#6f31a0) & gold (#ffd760), and pre-populating
 * the Approvers tab with all DBHS locations.
 */
function initializeSystemColumns() {
  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  let respSheet = getResponsesSheet_(ss);

  if (!respSheet) {
    respSheet = ss.insertSheet(CONFIG.RESPONSES_SHEET);
  }

  // Normalize sheet name to 'Responses' if possible
  if (respSheet.getName() !== CONFIG.RESPONSES_SHEET) {
    try {
      respSheet.setName(CONFIG.RESPONSES_SHEET);
    } catch (e) {
      // If name collision, continue with current sheet
    }
  }

  // Ensure sheet has at least 51 columns (44 form questions + 7 system columns)
  const totalColsNeeded = ALL_FORM_QUESTIONS.length + SYSTEM_COLUMNS.length; // 51
  const currentMaxCols = respSheet.getMaxColumns();
  if (currentMaxCols < totalColsNeeded) {
    respSheet.insertColumnsAfter(currentMaxCols, totalColsNeeded - currentMaxCols);
  }

  // Read current header row
  const currentHeaders = respSheet.getRange(1, 1, 1, totalColsNeeded).getValues()[0];

  // Check if form question headers (Col 1-44) need initialization
  let formHeadersEmpty = true;
  for (let i = 1; i < ALL_FORM_QUESTIONS.length; i++) {
    if (currentHeaders[i] && String(currentHeaders[i]).trim() !== '') {
      formHeadersEmpty = false;
      break;
    }
  }

  if (formHeadersEmpty) {
    const formRange = respSheet.getRange(1, 1, 1, ALL_FORM_QUESTIONS.length);
    formRange.setValues([ALL_FORM_QUESTIONS]);
    formRange.setBackground('#f4edf8');
    formRange.setFontColor('#3a1357');
    formRange.setFontWeight('bold');
    formRange.setHorizontalAlignment('left');
  }

  // Set / format the 7 System Workflow Columns (Col 45-51 / Col AS-AY)
  const startCol = 45;
  const sysRange = respSheet.getRange(1, startCol, 1, SYSTEM_COLUMNS.length);
  sysRange.setValues([SYSTEM_COLUMNS]);
  sysRange.setBackground(CONFIG.COLORS.PRIMARY); // #6f31a0
  sysRange.setFontColor('#ffffff');
  sysRange.setFontWeight('bold');
  sysRange.setHorizontalAlignment('center');

  // Freeze Row 1
  respSheet.setFrozenRows(1);

  // Setup Approvers Tab
  let approversSheet = ss.getSheetByName(CONFIG.APPROVERS_SHEET);
  if (!approversSheet) {
    approversSheet = ss.insertSheet(CONFIG.APPROVERS_SHEET);
  }

  if (approversSheet.getLastRow() <= 1) {
    approversSheet.clear();
    const appHeaders = [['Location', 'Approver Emails', 'Calendar Dashboard Editors']];
    const appRange = approversSheet.getRange(1, 1, 1, 3);
    appRange.setValues(appHeaders);
    appRange.setBackground(CONFIG.COLORS.PRIMARY);
    appRange.setFontColor('#ffffff');
    appRange.setFontWeight('bold');
    appRange.setHorizontalAlignment('center');

    const defaultApprovers = [
      ['Amphitheater', 'kwendland@wvusd.org', 'kwendland@wvusd.org'],
      ['Bullpen', 'kwendland@wvusd.org', ''],
      ['Corkrum Corral', 'kwendland@wvusd.org', ''],
      ['Gym', 'kwendland@wvusd.org', ''],
      ['Golden Horseshoe', 'kwendland@wvusd.org', ''],
      ['Library', 'kwendland@wvusd.org', ''],
      ['Stadium', 'kwendland@wvusd.org', ''],
      ['Theater', 'kwendland@wvusd.org', ''],
      ['Upper Quad', 'kwendland@wvusd.org', ''],
      ['Other', 'kwendland@wvusd.org', '']
    ];
    approversSheet.getRange(2, 1, defaultApprovers.length, 3).setValues(defaultApprovers);
    approversSheet.setFrozenRows(1);
    approversSheet.autoResizeColumns(1, 3);
  }

  return 'System and form question columns initialized successfully (51 columns total: Col A through Col AY).';
}

/**
 * Initializes the Master Google Sheet with all 51 headers, populates the Approvers tab,
 * and seeds 3 realistic DBHS test requests:
 * 1. DBHS-ACT-001: Robotics Club Showcase (Gym, Pending approval, recurring dates, complex setup)
 * 2. DBHS-ACT-002: Drama Club Spring Musical (Theater, Approved & Calendar Synced, revenue potential)
 * 3. DBHS-ACT-003: ASB Winter Holiday Lunch Rally (Amphitheater, Pending approval)
 */
function initializeSheetAndDummyData() {
  initializeSystemColumns();
  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  const respSheet = getResponsesSheet_(ss);

  // Clear existing data rows below header if present to avoid duplicate tests
  if (respSheet.getLastRow() > 1) {
    respSheet.getRange(2, 1, respSheet.getLastRow() - 1, 51).clearContent();
  }

  // --- REQUEST 1: Robotics Club Showcase (Gym, Pending, Multi-Date Setup) ---
  const dummy1 = new Array(51).fill('');
  dummy1[COL.TIMESTAMP] = '2026-11-20 08:00:00';
  dummy1[COL.SUBMITTER_EMAIL] = 'kwendland@wvusd.org';
  dummy1[COL.REQUESTING_GROUP] = 'Robotics Club';
  dummy1[COL.ADVISOR_NAME] = 'Kevin Wendland';
  dummy1[COL.ADVISOR_EMAIL] = 'kwendland@wvusd.org';
  dummy1[COL.EVENT_DATE] = '2026-12-05';
  dummy1[COL.EVENT_TITLE] = 'Robotics Club STEM Showcase & Tournament';
  dummy1[COL.IS_REOCCURRING] = 'Yes';
  dummy1[COL.REOCCURRING_DATES] = '2026-12-06, 2026-12-07';
  dummy1[COL.EVENT_DESCRIPTION] = 'Annual Robotics Competition & STEM Showcase featuring student robot demos, arena challenges, and community partner exhibits.';
  dummy1[COL.LOCATION] = 'Gym';
  dummy1[COL.ARRIVAL_TIME] = '07:30 AM';
  dummy1[COL.START_TIME] = '08:30 AM';
  dummy1[COL.END_TIME] = '04:30 PM';
  dummy1[COL.SETUP_REQUIRED] = 'Yes';
  dummy1[COL.REVENUE_FORM_NEEDED] = 'No';
  dummy1[COL.FACILITY_DURATION] = '7:00 am - 5:30 pm';
  dummy1[COL.NUM_CHAIRS] = '150';
  dummy1[COL.NUM_TABLES] = '20';
  dummy1[COL.PODIUM] = 'Yes';
  dummy1[COL.STAGE] = 'Yes';
  dummy1[COL.RISERS] = 'No';
  dummy1[COL.COFFEE_POT] = 'Yes';
  dummy1[COL.PA_SYSTEM] = 'Yes';
  dummy1[COL.PROJECTOR] = 'Yes';
  dummy1[COL.SCREEN] = 'Yes';
  dummy1[COL.MICROPHONES] = 'Yes';
  dummy1[COL.STAGE_USAGE] = 'Full Stage';
  dummy1[COL.MAIN_CURTAIN] = 'N/A';
  dummy1[COL.ADDITIONAL_INFO] = 'Need floor tarps placed under competition ring and pit tables along the west wall.';
  dummy1[COL.DIAGRAM_URL] = 'https://drive.google.com/file/d/1sample_gym_robotics_floorplan/view';
  dummy1[COL.REVENUE_FORM_SETUP] = 'No';
  dummy1[COL.REQUEST_ID] = 'DBHS-ACT-001';
  dummy1[COL.OVERALL_STATUS] = 'Pending';
  dummy1[COL.CURRENT_APPROVER] = 'kwendland@wvusd.org';
  dummy1[COL.APPROVAL_LOG] = '11/20/2026 08:00: Submitted by kwendland@wvusd.org. Routed to Gym Approver (kwendland@wvusd.org)';
  dummy1[COL.CALENDAR_EVENT_IDS] = '';
  dummy1[COL.CALENDAR_SYNC_STATUS] = 'Not Synced';
  dummy1[COL.LAST_UPDATED] = '2026-11-20 08:00:00';

  // --- REQUEST 2: Drama Musical (Theater, Approved & Calendar Synced with Revenue Potential) ---
  const dummy2 = new Array(51).fill('');
  dummy2[COL.TIMESTAMP] = '2026-11-20 08:15:00';
  dummy2[COL.SUBMITTER_EMAIL] = 'kwendland@wvusd.org';
  dummy2[COL.REQUESTING_GROUP] = 'DBHS Drama Department';
  dummy2[COL.ADVISOR_NAME] = 'Kevin Wendland';
  dummy2[COL.ADVISOR_EMAIL] = 'kwendland@wvusd.org';
  dummy2[COL.EVENT_DATE] = '2026-12-11';
  dummy2[COL.EVENT_TITLE] = 'Drama Club Spring Musical: Into the Woods';
  dummy2[COL.IS_REOCCURRING] = 'Yes';
  dummy2[COL.REOCCURRING_DATES] = '2026-12-12, 2026-12-13';
  dummy2[COL.EVENT_DESCRIPTION] = 'Three evening public theatrical performances with student orchestra and technical lighting crew.';
  dummy2[COL.LOCATION] = 'Theater';
  dummy2[COL.ARRIVAL_TIME] = '05:30 PM';
  dummy2[COL.START_TIME] = '07:00 PM';
  dummy2[COL.END_TIME] = '09:30 PM';
  dummy2[COL.SETUP_REQUIRED] = 'Yes';
  dummy2[COL.REVENUE_FORM_NEEDED] = 'Yes';
  dummy2[COL.FACILITY_DURATION] = '5:00 pm - 10:30 pm';
  dummy2[COL.NUM_CHAIRS] = '0';
  dummy2[COL.NUM_TABLES] = '4';
  dummy2[COL.PODIUM] = 'No';
  dummy2[COL.STAGE] = 'Yes';
  dummy2[COL.RISERS] = 'Yes';
  dummy2[COL.COFFEE_POT] = 'No';
  dummy2[COL.PA_SYSTEM] = 'Yes';
  dummy2[COL.PROJECTOR] = 'Yes';
  dummy2[COL.SCREEN] = 'Yes';
  dummy2[COL.MICROPHONES] = 'Yes';
  dummy2[COL.STAGE_USAGE] = 'Full Stage';
  dummy2[COL.MAIN_CURTAIN] = 'Yes';
  dummy2[COL.ADDITIONAL_INFO] = 'Box office table needed in lobby. Technical rehearsal completed during after-school sessions.';
  dummy2[COL.DIAGRAM_URL] = 'https://drive.google.com/file/d/1sample_theater_stage_layout/view';
  dummy2[COL.REVENUE_FORM_SETUP] = 'Yes';
  dummy2[COL.ACCOUNT_NUM] = 'ACT-5421';
  dummy2[COL.SALES_START_DATE] = '2026-11-25';
  dummy2[COL.SALES_END_DATE] = '2026-12-13';
  dummy2[COL.UNITS_PURCHASED] = '500';
  dummy2[COL.COST_EACH] = '$3.00';
  dummy2[COL.TOTAL_NET_COST] = '$1,500.00';
  dummy2[COL.PROJECTED_SALES_UNITS] = '450';
  dummy2[COL.PROJECTED_SALES_AMOUNT_EACH] = '$15.00';
  dummy2[COL.PROJECTED_SALES_TOTAL] = '$6,750.00';
  dummy2[COL.PROJECTED_GROSS_INCOME] = '$6,750.00';
  dummy2[COL.ESTIMATED_EXPENSES] = '$1,500.00';
  dummy2[COL.POTENTIAL_NET_PROFIT] = '$5,250.00';
  dummy2[COL.REQUEST_ID] = 'DBHS-ACT-002';
  dummy2[COL.OVERALL_STATUS] = 'Approved';
  dummy2[COL.CURRENT_APPROVER] = 'kwendland@wvusd.org';
  dummy2[COL.APPROVAL_LOG] = '11/20/2026 08:15: Submitted by kwendland@wvusd.org. Routed to Theater Approver (kwendland@wvusd.org)\n11/20/2026 08:20: [Approved by kwendland@wvusd.org]: All technical and facility requirements verified.\n11/20/2026 08:20: Google Calendar events scheduled (3 dates).';
  dummy2[COL.CALENDAR_EVENT_IDS] = 'c_mock_drama_001, c_mock_drama_002, c_mock_drama_003';
  dummy2[COL.CALENDAR_SYNC_STATUS] = 'Synced';
  dummy2[COL.LAST_UPDATED] = '2026-11-20 08:20:00';

  // --- REQUEST 3: ASB Holiday Rally (Amphitheater, Pending, Single Day) ---
  const dummy3 = new Array(51).fill('');
  dummy3[COL.TIMESTAMP] = '2026-11-20 08:30:00';
  dummy3[COL.SUBMITTER_EMAIL] = 'kwendland@wvusd.org';
  dummy3[COL.REQUESTING_GROUP] = 'ASB Leadership';
  dummy3[COL.ADVISOR_NAME] = 'Kevin Wendland';
  dummy3[COL.ADVISOR_EMAIL] = 'kwendland@wvusd.org';
  dummy3[COL.EVENT_DATE] = '2026-12-18';
  dummy3[COL.EVENT_TITLE] = 'ASB Winter Holiday Lunch Rally';
  dummy3[COL.IS_REOCCURRING] = 'No';
  dummy3[COL.REOCCURRING_DATES] = '';
  dummy3[COL.EVENT_DESCRIPTION] = 'Schoolwide lunchtime holiday spirit rally with music, class games, Brahma mascot, and club recognitions.';
  dummy3[COL.LOCATION] = 'Amphitheater';
  dummy3[COL.ARRIVAL_TIME] = '11:45 AM';
  dummy3[COL.START_TIME] = '12:15 PM';
  dummy3[COL.END_TIME] = '01:00 PM';
  dummy3[COL.SETUP_REQUIRED] = 'Yes';
  dummy3[COL.REVENUE_FORM_NEEDED] = 'No';
  dummy3[COL.FACILITY_DURATION] = '11:30 am - 1:30 pm';
  dummy3[COL.NUM_CHAIRS] = '10';
  dummy3[COL.NUM_TABLES] = '6';
  dummy3[COL.PODIUM] = 'Yes';
  dummy3[COL.STAGE] = 'N/A';
  dummy3[COL.RISERS] = 'No';
  dummy3[COL.COFFEE_POT] = 'No';
  dummy3[COL.PA_SYSTEM] = 'Yes';
  dummy3[COL.PROJECTOR] = 'No';
  dummy3[COL.SCREEN] = 'No';
  dummy3[COL.MICROPHONES] = 'Yes';
  dummy3[COL.STAGE_USAGE] = 'N/A';
  dummy3[COL.MAIN_CURTAIN] = 'No';
  dummy3[COL.ADDITIONAL_INFO] = 'Power cord extension needed to sound table.';
  dummy3[COL.DIAGRAM_URL] = '';
  dummy3[COL.REVENUE_FORM_SETUP] = 'No';
  dummy3[COL.REQUEST_ID] = 'DBHS-ACT-003';
  dummy3[COL.OVERALL_STATUS] = 'Pending';
  dummy3[COL.CURRENT_APPROVER] = 'kwendland@wvusd.org';
  dummy3[COL.APPROVAL_LOG] = '11/20/2026 08:30: Submitted by kwendland@wvusd.org. Routed to Amphitheater Approver (kwendland@wvusd.org)';
  dummy3[COL.CALENDAR_EVENT_IDS] = '';
  dummy3[COL.CALENDAR_SYNC_STATUS] = 'Not Synced';
  dummy3[COL.LAST_UPDATED] = '2026-11-20 08:30:00';

  respSheet.appendRow(dummy1);
  respSheet.appendRow(dummy2);
  respSheet.appendRow(dummy3);

  respSheet.getRange(2, 1, 3, 51).setVerticalAlignment('middle');

  return 'Success: Initialized 51 columns and seeded 3 realistic test requests (DBHS-ACT-001, DBHS-ACT-002, DBHS-ACT-003).';
}

/**
 * Installs form submit trigger programmatically if needed.
 */
function setupInstallableFormSubmitTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'onFormSubmit') {
      return 'Trigger already installed.';
    }
  }

  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  return 'Installable onFormSubmit trigger registered successfully.';
}

/**
 * Programmatically builds the entire DBHS Activities Request Form in Google Forms,
 * configuring all sections, questions, and conditional branching, and connects
 * its response destination directly to the Master Spreadsheet.
 */
function createDBHSGoogleForm() {
  const form = FormApp.create('DBHS Activities Request Form');
  form.setTitle('Activities Request Form');
  form.setDescription(
    'The following rules and regulations shall be followed by all clubs and organizations when using school equipment and facilities for any extra curricular activities.\n\n' +
    '• An Activity Request Form must be submitted by an advisor at least 3 weeks in advance of the activity.\n' +
    '• If needed, a diagram of the facilities form may be filled out and attached to the form. This must be submitted at the time of the form submission.\n' +
    '• Payment for custodial cleanup of the facility and surrounding area shall be agreed upon in advance by the Club advisor and Operations Manager.\n' +
    '• The club or organization is responsible for any damage to school equipment or facilities that occurs during its use, including the cost of repairs. The Division Dean and Operations Manager will determine the amount to be charged to the appropriated club or organization\'s account.\n' +
    '• The club or organization is responsible for the cleanup of all food and drink items. A fee will be assessed for non-compliance.'
  );
  form.setCollectEmail(true);

  // --- SECTION 1: Activity Request (Questions 2-13) ---
  form.addTextItem().setTitle('Requesting Group').setRequired(true);
  form.addTextItem().setTitle('Advisor').setRequired(true);
  form.addTextItem().setTitle('Advisor Email').setRequired(true);
  form.addDateItem().setTitle('Event Date').setRequired(true);
  form.addTextItem().setTitle('Event Title').setRequired(true);
  form.addCheckboxItem().setTitle('Is this event reoccurring?').setChoiceValues(['Yes', 'No']).setRequired(true);
  form.addTextItem().setTitle('If yes, please add the dates below').setRequired(false);
  form.addParagraphTextItem().setTitle('Event Description').setRequired(true);

  const locItem = form.addMultipleChoiceItem();
  locItem.setTitle('Location')
    .setChoices([
      locItem.createChoice('Amphitheater'),
      locItem.createChoice('Bullpen'),
      locItem.createChoice('Corkrum Corral'),
      locItem.createChoice('Gym'),
      locItem.createChoice('Golden Horseshoe'),
      locItem.createChoice('Library'),
      locItem.createChoice('Stadium'),
      locItem.createChoice('Theater'),
      locItem.createChoice('Upper Quad')
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addTimeItem().setTitle('Arrival Time').setRequired(true);
  form.addTimeItem().setTitle('Event Start Time').setRequired(true);
  form.addTimeItem().setTitle('Event End Time').setRequired(true);

  // Q14 Set Up Required (choices linked to sections below)
  const q14SetUpRequired = form.addMultipleChoiceItem();
  q14SetUpRequired.setTitle('Set Up Required?').setRequired(true);

  // --- SECTION 2: Revenue Potential Check (Question 15) ---
  const sectionRevenueCheck = form.addPageBreakItem().setTitle('Revenue Potential');
  const q15RevNeeded = form.addMultipleChoiceItem();
  q15RevNeeded.setTitle('Revenue Potential Form needed?').setRequired(true);

  // --- SECTION 3: Operations Set - Up (Questions 16-31) ---
  const sectionSetup = form.addPageBreakItem().setTitle('Set - Up').setHelpText('Operations Setup:');
  form.addTextItem().setTitle('Total duration of facility use including set up and clean up')
    .setHelpText('ex: 3:30 pm – 9:30 pm').setRequired(true);
  form.addTextItem().setTitle('Number of Chairs').setRequired(false);
  form.addTextItem().setTitle('Number of Tables').setRequired(false);
  form.addMultipleChoiceItem().setTitle('Podium').setChoiceValues(['Yes', 'No']).setRequired(false);
  form.addTextItem().setTitle('Stage').setRequired(false);
  form.addTextItem().setTitle('Risers').setRequired(false);
  form.addTextItem().setTitle('Coffee Pot').setRequired(false);

  // AV Needs
  form.addMultipleChoiceItem().setTitle('Portable PA System').setHelpText('AV Needs:').setChoiceValues(['Yes', 'No']).setRequired(false);

  // Theater Needs
  form.addMultipleChoiceItem().setTitle('Projector').setHelpText('Theater Needs:').setChoiceValues(['Yes', 'No']).setRequired(false);
  form.addMultipleChoiceItem().setTitle('Screen').setChoiceValues(['Yes', 'No']).setRequired(false);
  form.addMultipleChoiceItem().setTitle('Microphones').setChoiceValues(['Yes', 'No']).setRequired(false);
  form.addMultipleChoiceItem().setTitle('Stage usage').setChoiceValues(['Full Stage', '1/2 Stage', 'N/A']).setRequired(false);
  form.addTextItem().setTitle('Main Curtain').setRequired(false);
  form.addParagraphTextItem().setTitle('Additional Information').setRequired(false);
  
  // Note on diagram: Since FormApp does not support addFileUploadItem via script,
  // we add a TextItem for the URL and mention how to switch it to File Upload in Form Editor if desired.
  form.addTextItem()
    .setTitle('If needed, upload a diagram of the exact placement of the tables, chairs, riser, PA, etc.')
    .setHelpText('Paste Google Drive share link here (jpg format only). Can also be converted to File Upload directly in Form Editor.')
    .setRequired(false);

  const q31RevSetup = form.addMultipleChoiceItem();
  q31RevSetup.setTitle('Revenue Potential Form Required? (Set-Up)').setRequired(true);

  // --- SECTION 4: Revenue Potential Form (Questions 32-43) ---
  const sectionRevenueForm = form.addPageBreakItem().setTitle('Revenue Potential Form');
  form.addTextItem().setTitle('Account #').setRequired(false);
  form.addDateItem().setTitle('Date beginning sales').setRequired(true);
  form.addDateItem().setTitle('Date ending sales').setRequired(true);
  form.addTextItem().setTitle('Estimated Total Units Purchased').setRequired(false);
  form.addTextItem().setTitle('Estimated Cost Each').setRequired(true);
  form.addTextItem().setTitle('Estimated Total Net Cost').setRequired(true);

  // Projected Sales
  form.addTextItem().setTitle('Estimated Projected Sales (Units)').setHelpText('Projected Sales').setRequired(true);
  form.addTextItem().setTitle('Estimated Projected Sales (Amount each)').setRequired(true);
  form.addTextItem().setTitle('Estimated Projected Sales (Total)').setRequired(true);
  form.addTextItem().setTitle('Projected Gross Income').setRequired(true);
  form.addTextItem().setTitle('Estimated Expenses').setRequired(true);
  form.addTextItem().setTitle('Potential Net Profit').setRequired(true);

  // --- WIRE CONDITIONAL NAVIGATION ---
  // Q14: Set Up Required?
  // Yes -> Skip to Set - Up section
  // No  -> Skip to Revenue Potential section
  q14SetUpRequired.setChoices([
    q14SetUpRequired.createChoice('Yes', sectionSetup),
    q14SetUpRequired.createChoice('No', sectionRevenueCheck)
  ]);

  // Q15: Revenue Potential Form needed?
  // Yes -> Skip to Revenue Potential Form section
  // No  -> Submit form
  q15RevNeeded.setChoices([
    q15RevNeeded.createChoice('Yes', sectionRevenueForm),
    q15RevNeeded.createChoice('No', FormApp.PageNavigationType.SUBMIT)
  ]);

  // Q31: Revenue Potential Form Required? (Set-Up)
  // Yes -> Skip to Revenue Potential Form section
  // No  -> Submit form
  q31RevSetup.setChoices([
    q31RevSetup.createChoice('Yes', sectionRevenueForm),
    q31RevSetup.createChoice('No', FormApp.PageNavigationType.SUBMIT)
  ]);

  // Link response destination to Master Spreadsheet
  try {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, CONFIG.MASTER_SHEET_ID);
  } catch (err) {
    Logger.log('Could not automatically link form destination to spreadsheet: ' + err);
  }

  const editUrl = form.getEditUrl();
  const publishedUrl = form.getPublishedUrl();
  Logger.log('Form Created Successfully!');
  Logger.log('Edit URL: ' + editUrl);
  Logger.log('Published URL: ' + publishedUrl);

  return 'Form created successfully!\nEdit URL: ' + editUrl + '\nPublished URL: ' + publishedUrl;
}


// =================================================================================
// 4. ROUTING & APPROVERS LOGIC
// =================================================================================

/**
 * Reads Approvers tab and builds routing directory.
 * Col A = Location
 * Col B = Approver Emails (comma-separated)
 * Col C = Calendar Dashboard Editors (comma-separated)
 */
function getApproversDirectory_() {
  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.APPROVERS_SHEET);
  const directory = {
    locationMap: {},
    calendarEditors: [],
    allApprovers: new Set()
  };

  if (!sheet) return directory;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const loc = String(data[i][0] || '').trim();
    const approverEmailsStr = String(data[i][1] || '').trim();
    const secretaryEmailsStr = String(data[i][2] || '').trim();

    if (loc) {
      const approverList = approverEmailsStr.split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      directory.locationMap[loc.toLowerCase()] = approverList;
      directory.locationMap[loc] = approverList; // also preserve exact
      approverList.forEach(e => directory.allApprovers.add(e));
    }

    if (secretaryEmailsStr) {
      const secList = secretaryEmailsStr.split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      secList.forEach(e => {
        if (!directory.calendarEditors.includes(e)) {
          directory.calendarEditors.push(e);
        }
      });
    }
  }

  return directory;
}

/**
 * Resolves location approver(s) for a given location string.
 */
function resolveApproversForLocation_(locationStr, approversDir) {
  if (!locationStr) {
    return approversDir.locationMap['other'] || [];
  }
  const cleanLoc = String(locationStr).trim();
  const lowerLoc = cleanLoc.toLowerCase();

  // Direct match
  if (approversDir.locationMap[lowerLoc] && approversDir.locationMap[lowerLoc].length > 0) {
    return approversDir.locationMap[lowerLoc];
  }

  // Partial match
  for (const locKey in approversDir.locationMap) {
    if (lowerLoc.includes(locKey.toLowerCase()) || locKey.toLowerCase().includes(lowerLoc)) {
      if (approversDir.locationMap[locKey].length > 0) {
        return approversDir.locationMap[locKey];
      }
    }
  }

  // Fallback to "Other"
  return approversDir.locationMap['other'] || approversDir.locationMap['Other'] || [];
}


// =================================================================================
// 5. FORM SUBMISSION PROCESSOR (TRIGGER & BATCH)
// =================================================================================

/**
 * Installable Form Submit Trigger
 */
function onFormSubmit(e) {
  processPendingFormSubmissions();
}

/**
 * Processes uninitialized form submissions safely with concurrency lock.
 */
function processPendingFormSubmissions() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    Logger.log('Could not obtain script lock: ' + e);
    return;
  }

  try {
    initializeSystemColumns();
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
    const respSheet = getResponsesSheet_(ss);
    const data = respSheet.getDataRange().getValues();
    if (data.length <= 1) return;

    const approversDir = getApproversDirectory_();
    let maxIdNum = 0;

    // Scan existing Request IDs to find highest sequence number
    for (let i = 1; i < data.length; i++) {
      const existingId = String(data[i][COL.REQUEST_ID] || '').trim();
      const match = existingId.match(/DBHS-ACT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIdNum) maxIdNum = num;
      }
    }

    // Process rows that do not have a Request ID yet
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const existingId = String(row[COL.REQUEST_ID] || '').trim();
      const timestampVal = row[COL.TIMESTAMP];

      if (!existingId && timestampVal) {
        maxIdNum++;
        const newRequestId = Utilities.formatString('%s%03d', CONFIG.ID_PREFIX, maxIdNum);
        const locationVal = String(row[COL.LOCATION] || '').trim();
        const approversList = resolveApproversForLocation_(locationVal, approversDir);
        const approversEmailStr = approversList.join(', ');

        const now = new Date();
        const submitterEmail = String(row[COL.SUBMITTER_EMAIL] || '').trim();
        const advisorEmail = String(row[COL.ADVISOR_EMAIL] || '').trim();
        const initialLog = Utilities.formatDate(now, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm') +
          ': Submitted by ' + (submitterEmail || 'Applicant') + '. Routed to: ' + (approversEmailStr || 'Other Approver');

        // Update sheet row (Col AS to AY -> indices 45 to 51)
        const rowIndex = i + 1;
        respSheet.getRange(rowIndex, COL.REQUEST_ID + 1).setValue(newRequestId);
        respSheet.getRange(rowIndex, COL.OVERALL_STATUS + 1).setValue(CONFIG.STATUS.PENDING);
        respSheet.getRange(rowIndex, COL.CURRENT_APPROVER + 1).setValue(approversEmailStr || 'Unassigned');
        respSheet.getRange(rowIndex, COL.APPROVAL_LOG + 1).setValue(initialLog);
        respSheet.getRange(rowIndex, COL.CALENDAR_EVENT_IDS + 1).setValue('');
        respSheet.getRange(rowIndex, COL.CALENDAR_SYNC_STATUS + 1).setValue('Not Synced');
        respSheet.getRange(rowIndex, COL.LAST_UPDATED + 1).setValue(now);

        // Populate in-memory row representation for emails
        row[COL.REQUEST_ID] = newRequestId;
        row[COL.OVERALL_STATUS] = CONFIG.STATUS.PENDING;
        row[COL.CURRENT_APPROVER] = approversEmailStr;
        const requestObj = mapRowToRequestObject_(row, rowIndex);

        // 1. Email Location Approver(s)
        if (approversList.length > 0) {
          sendApproverNotificationEmail_(approversList, requestObj);
        }

        // 2. Email Confirmation to Submitter & Advisor
        const applicantEmails = [submitterEmail, advisorEmail].filter(Boolean);
        if (applicantEmails.length > 0) {
          sendSubmitterConfirmationEmail_(applicantEmails, requestObj);
        }
      }
    }
  } finally {
    lock.releaseLock();
  }
}


// =================================================================================
// 6. PORTAL DATA SERVICE (ROLE-BASED)
// =================================================================================

/**
 * Returns full portal payload for active user.
 */
function getPortalData(passedUserEmail) {
  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  const respSheet = getResponsesSheet_(ss);
  const userEmail = (passedUserEmail || getCurrentUserEmail_()).toLowerCase().trim();
  const approversDir = getApproversDirectory_();

  const isOpsSecretary = approversDir.calendarEditors.includes(userEmail);
  const isLocationApprover = approversDir.allApprovers.has(userEmail);
  const isAdmin = isOpsSecretary || (userEmail.endsWith('@wvusd.org') && (userEmail.startsWith('kwendland') || isOpsSecretary));

  // Find locations assigned to current approver
  const userLocations = [];
  for (const loc in approversDir.locationMap) {
    if (approversDir.locationMap[loc].includes(userEmail)) {
      userLocations.push(loc);
    }
  }

  const requests = [];
  if (respSheet) {
    const data = respSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const requestId = String(row[COL.REQUEST_ID] || '').trim();
      if (!requestId) continue;

      const req = mapRowToRequestObject_(row, i + 1);
      requests.push(req);
    }
  }

  // Reverse so newest requests are on top
  requests.reverse();

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === CONFIG.STATUS.PENDING).length,
    approved: requests.filter(r => r.status === CONFIG.STATUS.APPROVED).length,
    denied: requests.filter(r => r.status === CONFIG.STATUS.DENIED).length,
    changesRequested: requests.filter(r => r.status === CONFIG.STATUS.CHANGES_REQUESTED).length,
    calendarSynced: requests.filter(r => r.calendarSyncStatus === 'Synced').length
  };

  return {
    currentUser: {
      email: userEmail,
      isOpsSecretary: isOpsSecretary,
      isApprover: isLocationApprover,
      isAdmin: isAdmin,
      locations: userLocations
    },
    requests: requests,
    stats: stats,
    webAppUrl: getWebAppUrl(),
    approverLocations: Object.keys(approversDir.locationMap).filter(k => k.toLowerCase() !== 'other')
  };
}

/**
 * Retrieves a single request by its Request ID (for direct deep links or status tracker).
 */
function getRequestById(requestId) {
  if (!requestId) return null;
  const targetId = String(requestId).trim().toUpperCase();

  const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
  const respSheet = getResponsesSheet_(ss);
  if (!respSheet) return null;

  const data = respSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentId = String(row[COL.REQUEST_ID] || '').trim().toUpperCase();
    if (currentId === targetId) {
      return mapRowToRequestObject_(row, i + 1);
    }
  }
  return null;
}

/**
 * Maps raw sheet row array to clean JavaScript object.
 */
function mapRowToRequestObject_(row, rowIndex) {
  const isSetUpYes = String(row[COL.SETUP_REQUIRED] || '').trim().toLowerCase() === 'yes';
  const isRevYes1 = String(row[COL.REVENUE_FORM_NEEDED] || '').trim().toLowerCase() === 'yes';
  const isRevYes2 = String(row[COL.REVENUE_FORM_SETUP] || '').trim().toLowerCase() === 'yes';
  const isRevenueNeeded = isRevYes1 || isRevYes2;

  const eventDateRaw = row[COL.EVENT_DATE];
  const formattedDate = eventDateRaw instanceof Date
    ? Utilities.formatDate(eventDateRaw, CONFIG.TIMEZONE, 'MM/dd/yyyy')
    : String(eventDateRaw || '').trim();

  const salesStartRaw = row[COL.SALES_START_DATE];
  const formattedSalesStart = salesStartRaw instanceof Date
    ? Utilities.formatDate(salesStartRaw, CONFIG.TIMEZONE, 'MM/dd/yyyy')
    : String(salesStartRaw || '').trim();

  const salesEndRaw = row[COL.SALES_END_DATE];
  const formattedSalesEnd = salesEndRaw instanceof Date
    ? Utilities.formatDate(salesEndRaw, CONFIG.TIMEZONE, 'MM/dd/yyyy')
    : String(salesEndRaw || '').trim();

  const timestampRaw = row[COL.TIMESTAMP];
  const formattedTimestamp = timestampRaw instanceof Date
    ? Utilities.formatDate(timestampRaw, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm')
    : String(timestampRaw || '').trim();

  const lastUpdatedRaw = row[COL.LAST_UPDATED];
  const formattedLastUpdated = lastUpdatedRaw instanceof Date
    ? Utilities.formatDate(lastUpdatedRaw, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm')
    : String(lastUpdatedRaw || '').trim();

  return {
    rowIndex: rowIndex,
    requestId: String(row[COL.REQUEST_ID] || ''),
    timestamp: formattedTimestamp,
    submitterEmail: String(row[COL.SUBMITTER_EMAIL] || ''),
    requestingGroup: String(row[COL.REQUESTING_GROUP] || ''),
    advisor: String(row[COL.ADVISOR_NAME] || ''),
    advisorEmail: String(row[COL.ADVISOR_EMAIL] || ''),

    // Event Details
    eventDate: formattedDate,
    eventDateRaw: eventDateRaw,
    eventTitle: String(row[COL.EVENT_TITLE] || ''),
    isReoccurring: String(row[COL.IS_REOCCURRING] || '').trim(),
    reoccurringDates: String(row[COL.REOCCURRING_DATES] || '').trim(),
    eventDescription: String(row[COL.EVENT_DESCRIPTION] || ''),
    location: String(row[COL.LOCATION] || ''),
    arrivalTime: formatTimeString_(row[COL.ARRIVAL_TIME]),
    startTime: formatTimeString_(row[COL.START_TIME]),
    endTime: formatTimeString_(row[COL.END_TIME]),

    // Branch Flags
    setupRequired: isSetUpYes ? 'Yes' : 'No',
    revenueFormNeeded: isRevenueNeeded ? 'Yes' : 'No',

    // Set-up Details
    facilityDuration: String(row[COL.FACILITY_DURATION] || ''),
    numChairs: String(row[COL.NUM_CHAIRS] || ''),
    numTables: String(row[COL.NUM_TABLES] || ''),
    podium: String(row[COL.PODIUM] || ''),
    stage: String(row[COL.STAGE] || ''),
    risers: String(row[COL.RISERS] || ''),
    coffeePot: String(row[COL.COFFEE_POT] || ''),
    paSystem: String(row[COL.PA_SYSTEM] || ''),
    projector: String(row[COL.PROJECTOR] || ''),
    screen: String(row[COL.SCREEN] || ''),
    microphones: String(row[COL.MICROPHONES] || ''),
    stageUsage: String(row[COL.STAGE_USAGE] || ''),
    mainCurtain: String(row[COL.MAIN_CURTAIN] || ''),
    additionalInfo: String(row[COL.ADDITIONAL_INFO] || ''),
    diagramUrl: String(row[COL.DIAGRAM_URL] || '').trim(),

    // Revenue Potential Details
    accountNum: String(row[COL.ACCOUNT_NUM] || ''),
    salesStartDate: formattedSalesStart,
    salesEndDate: formattedSalesEnd,
    unitsPurchased: String(row[COL.UNITS_PURCHASED] || ''),
    costEach: String(row[COL.COST_EACH] || ''),
    totalNetCost: String(row[COL.TOTAL_NET_COST] || ''),
    projectedSalesUnits: String(row[COL.PROJECTED_SALES_UNITS] || ''),
    projectedSalesAmountEach: String(row[COL.PROJECTED_SALES_AMOUNT_EACH] || ''),
    projectedSalesTotal: String(row[COL.PROJECTED_SALES_TOTAL] || ''),
    projectedGrossIncome: String(row[COL.PROJECTED_GROSS_INCOME] || ''),
    estimatedExpenses: String(row[COL.ESTIMATED_EXPENSES] || ''),
    potentialNetProfit: String(row[COL.POTENTIAL_NET_PROFIT] || ''),

    // System Workflow Columns
    status: String(row[COL.OVERALL_STATUS] || CONFIG.STATUS.PENDING),
    currentApprover: String(row[COL.CURRENT_APPROVER] || ''),
    approvalLog: String(row[COL.APPROVAL_LOG] || ''),
    calendarEventIds: String(row[COL.CALENDAR_EVENT_IDS] || ''),
    calendarSyncStatus: String(row[COL.CALENDAR_SYNC_STATUS] || 'Not Synced'),
    lastUpdated: formattedLastUpdated
  };
}

/**
 * Formats time cell values into clean human-readable strings (e.g. "02:30 PM").
 */
function formatTimeString_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, CONFIG.TIMEZONE, 'hh:mm a');
  }
  return String(val).trim();
}


// =================================================================================
// 7. APPROVAL WORKFLOW ACTION HANDLER
// =================================================================================

/**
 * Handles Approve, Deny, or Request Changes actions submitted from portal.
 */
function handleApprovalAction(payload, passedUserEmail) {
  if (!payload || !payload.requestId || !payload.action) {
    throw new Error('Invalid approval payload.');
  }

  const userEmail = (passedUserEmail || payload.userEmail || getCurrentUserEmail_()).toLowerCase().trim();
  const requestId = String(payload.requestId).trim().toUpperCase();
  const action = String(payload.action).trim().toLowerCase();
  const comments = String(payload.comments || '').trim();

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    throw new Error('System is busy processing another request. Please try again.');
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
    const respSheet = getResponsesSheet_(ss);
    const data = respSheet.getDataRange().getValues();

    let targetRowIndex = -1;
    let targetRow = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][COL.REQUEST_ID] || '').trim().toUpperCase() === requestId) {
        targetRowIndex = i + 1;
        targetRow = data[i];
        break;
      }
    }

    if (targetRowIndex === -1 || !targetRow) {
      throw new Error('Request ' + requestId + ' not found in sheet.');
    }

    // Authorization verification
    const approversDir = getApproversDirectory_();
    const isOpsSecretary = approversDir.calendarEditors.includes(userEmail);
    const isAdmin = isOpsSecretary || userEmail.startsWith('kwendland');
    const locationApprovers = resolveApproversForLocation_(targetRow[COL.LOCATION], approversDir);
    const isAuthorizedApprover = locationApprovers.includes(userEmail) || isAdmin;

    if (!isAuthorizedApprover) {
      throw new Error('Unauthorized: You are not an assigned approver for location "' + targetRow[COL.LOCATION] + '".');
    }

    const now = new Date();
    const timestampStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm');
    let existingLog = String(targetRow[COL.APPROVAL_LOG] || '');

    let newStatus = targetRow[COL.OVERALL_STATUS];
    let newCurrentApprover = targetRow[COL.CURRENT_APPROVER];
    let calendarEventIds = String(targetRow[COL.CALENDAR_EVENT_IDS] || '');
    let calendarSyncStatus = String(targetRow[COL.CALENDAR_SYNC_STATUS] || 'Not Synced');

    const submitterEmail = String(targetRow[COL.SUBMITTER_EMAIL] || '');
    const advisorEmail = String(targetRow[COL.ADVISOR_EMAIL] || '');

    if (action === 'approve') {
      newStatus = CONFIG.STATUS.APPROVED;
      newCurrentApprover = 'Complete';
      const logEntry = timestampStr + ': Approved by ' + userEmail + (comments ? ' (Comments: ' + comments + ')' : '');
      existingLog = existingLog ? existingLog + '\n' + logEntry : logEntry;

      // Create Calendar Events for all parsed dates
      const calendarResult = createCalendarEventsForRequest_(targetRow);
      calendarEventIds = calendarResult.eventIds.join(', ');
      calendarSyncStatus = calendarResult.success ? 'Synced' : 'Sync Error: ' + calendarResult.error;

      // Append calendar log
      if (calendarResult.success) {
        const calLog = timestampStr + ': Calendar events synced (' + calendarResult.eventIds.length + ' event(s))';
        existingLog += '\n' + calLog;
      }

      // Update row in sheet
      respSheet.getRange(targetRowIndex, COL.OVERALL_STATUS + 1).setValue(newStatus);
      respSheet.getRange(targetRowIndex, COL.CURRENT_APPROVER + 1).setValue(newCurrentApprover);
      respSheet.getRange(targetRowIndex, COL.APPROVAL_LOG + 1).setValue(existingLog);
      respSheet.getRange(targetRowIndex, COL.CALENDAR_EVENT_IDS + 1).setValue(calendarEventIds);
      respSheet.getRange(targetRowIndex, COL.CALENDAR_SYNC_STATUS + 1).setValue(calendarSyncStatus);
      respSheet.getRange(targetRowIndex, COL.LAST_UPDATED + 1).setValue(now);

      // Build updated request object
      targetRow[COL.OVERALL_STATUS] = newStatus;
      targetRow[COL.CURRENT_APPROVER] = newCurrentApprover;
      targetRow[COL.APPROVAL_LOG] = existingLog;
      targetRow[COL.CALENDAR_EVENT_IDS] = calendarEventIds;
      targetRow[COL.CALENDAR_SYNC_STATUS] = calendarSyncStatus;
      targetRow[COL.LAST_UPDATED] = now;
      const updatedReq = mapRowToRequestObject_(targetRow, targetRowIndex);

      // Send approval confirmation emails to Advisor, Submitter, and Ops Secretaries
      const recipients = [advisorEmail, submitterEmail].filter(Boolean);
      sendApprovalCompletedEmail_(recipients, approversDir.calendarEditors, updatedReq, comments);

      return {
        success: true,
        message: 'Request ' + requestId + ' approved and calendar event(s) synced.',
        request: updatedReq
      };

    } else if (action === 'deny') {
      newStatus = CONFIG.STATUS.DENIED;
      newCurrentApprover = '-';
      const logEntry = timestampStr + ': Denied by ' + userEmail + (comments ? ' (Reason: ' + comments + ')' : '');
      existingLog = existingLog ? existingLog + '\n' + logEntry : logEntry;

      respSheet.getRange(targetRowIndex, COL.OVERALL_STATUS + 1).setValue(newStatus);
      respSheet.getRange(targetRowIndex, COL.CURRENT_APPROVER + 1).setValue(newCurrentApprover);
      respSheet.getRange(targetRowIndex, COL.APPROVAL_LOG + 1).setValue(existingLog);
      respSheet.getRange(targetRowIndex, COL.LAST_UPDATED + 1).setValue(now);

      targetRow[COL.OVERALL_STATUS] = newStatus;
      targetRow[COL.CURRENT_APPROVER] = newCurrentApprover;
      targetRow[COL.APPROVAL_LOG] = existingLog;
      targetRow[COL.LAST_UPDATED] = now;
      const updatedReq = mapRowToRequestObject_(targetRow, targetRowIndex);

      sendDenialEmail_([submitterEmail, advisorEmail].filter(Boolean), updatedReq, comments);

      return {
        success: true,
        message: 'Request ' + requestId + ' denied.',
        request: updatedReq
      };

    } else if (action === 'request_changes') {
      newStatus = CONFIG.STATUS.CHANGES_REQUESTED;
      newCurrentApprover = 'Submitter (' + submitterEmail + ')';
      const logEntry = timestampStr + ': Changes Requested by ' + userEmail + (comments ? ' (Notes: ' + comments + ')' : '');
      existingLog = existingLog ? existingLog + '\n' + logEntry : logEntry;

      respSheet.getRange(targetRowIndex, COL.OVERALL_STATUS + 1).setValue(newStatus);
      respSheet.getRange(targetRowIndex, COL.CURRENT_APPROVER + 1).setValue(newCurrentApprover);
      respSheet.getRange(targetRowIndex, COL.APPROVAL_LOG + 1).setValue(existingLog);
      respSheet.getRange(targetRowIndex, COL.LAST_UPDATED + 1).setValue(now);

      targetRow[COL.OVERALL_STATUS] = newStatus;
      targetRow[COL.CURRENT_APPROVER] = newCurrentApprover;
      targetRow[COL.APPROVAL_LOG] = existingLog;
      targetRow[COL.LAST_UPDATED] = now;
      const updatedReq = mapRowToRequestObject_(targetRow, targetRowIndex);

      sendChangesRequestedEmail_([submitterEmail, advisorEmail].filter(Boolean), updatedReq, comments);

      return {
        success: true,
        message: 'Changes requested for ' + requestId + '.',
        request: updatedReq
      };

    } else {
      throw new Error('Unknown approval action: ' + action);
    }
  } finally {
    lock.releaseLock();
  }
}


// =================================================================================
// 8. CALENDAR INTEGRATION & EVENT CREATION
// =================================================================================

/**
 * Creates Google Calendar events for all parsed primary and reoccurring dates.
 */
function createCalendarEventsForRequest_(row) {
  const primaryDateVal = row[COL.EVENT_DATE];
  const isReoccurring = String(row[COL.IS_REOCCURRING] || '').trim().toLowerCase() === 'yes';
  const additionalDatesStr = String(row[COL.REOCCURRING_DATES] || '').trim();

  const allDates = parseAndDeduplicateDates_(primaryDateVal, isReoccurring, additionalDatesStr);
  if (allDates.length === 0) {
    return { success: false, error: 'No valid dates found to schedule.', eventIds: [] };
  }

  const title = String(row[COL.EVENT_TITLE] || 'DBHS Activity').trim();
  const location = String(row[COL.LOCATION] || '').trim();
  const startTimeVal = row[COL.START_TIME];
  const endTimeVal = row[COL.END_TIME];

  const description = buildCalendarEventDescription_(row);
  const createdEventIds = [];

  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    if (!calendar) {
      throw new Error('Could not access Google Calendar with ID: ' + CONFIG.CALENDAR_ID);
    }

    for (let i = 0; i < allDates.length; i++) {
      const dateObj = allDates[i];
      const timeRange = computeStartAndEndTimeDate_(dateObj, startTimeVal, endTimeVal);

      let event;
      if (timeRange.isTimed) {
        event = calendar.createEvent(title, timeRange.startDate, timeRange.endDate, {
          location: location,
          description: description
        });
      } else {
        event = calendar.createAllDayEvent(title, dateObj, {
          location: location,
          description: description
        });
      }

      if (event) {
        createdEventIds.push(event.getId());
      }
    }

    return { success: true, eventIds: createdEventIds };
  } catch (err) {
    Logger.log('Error creating calendar events: ' + err);
    return { success: false, error: err.message, eventIds: createdEventIds };
  }
}

/**
 * Builds rich, structured event description for Google Calendar.
 */
function buildCalendarEventDescription_(row) {
  const requestId = String(row[COL.REQUEST_ID] || '');
  const group = String(row[COL.REQUESTING_GROUP] || '');
  const advisor = String(row[COL.ADVISOR_NAME] || '') + ' (' + String(row[COL.ADVISOR_EMAIL] || '') + ')';
  const arrival = formatTimeString_(row[COL.ARRIVAL_TIME]);
  const isSetUpYes = String(row[COL.SETUP_REQUIRED] || '').trim().toLowerCase() === 'yes';
  const duration = String(row[COL.FACILITY_DURATION] || '');

  const lines = [
    '=== DBHS ACTIVITY REQUEST DETAILS ===',
    'Request ID: ' + requestId,
    'Requesting Group: ' + group,
    'Advisor: ' + advisor,
    'Arrival Time: ' + (arrival || 'N/A')
  ];

  if (isSetUpYes) {
    lines.push('Total Facility Duration: ' + (duration || 'N/A'));
    lines.push('');
    lines.push('--- FACILITY & SET-UP REQUIREMENTS ---');
    if (row[COL.NUM_CHAIRS]) lines.push('• Chairs: ' + row[COL.NUM_CHAIRS]);
    if (row[COL.NUM_TABLES]) lines.push('• Tables: ' + row[COL.NUM_TABLES]);
    if (row[COL.PODIUM]) lines.push('• Podium: ' + row[COL.PODIUM]);
    if (row[COL.STAGE]) lines.push('• Stage: ' + row[COL.STAGE]);
    if (row[COL.RISERS]) lines.push('• Risers: ' + row[COL.RISERS]);
    if (row[COL.COFFEE_POT]) lines.push('• Coffee Pot: ' + row[COL.COFFEE_POT]);
    if (row[COL.PA_SYSTEM]) lines.push('• PA System: ' + row[COL.PA_SYSTEM]);
    if (row[COL.PROJECTOR]) lines.push('• Projector: ' + row[COL.PROJECTOR]);
    if (row[COL.SCREEN]) lines.push('• Screen: ' + row[COL.SCREEN]);
    if (row[COL.MICROPHONES]) lines.push('• Microphones: ' + row[COL.MICROPHONES]);
    if (row[COL.STAGE_USAGE]) lines.push('• Stage Usage: ' + row[COL.STAGE_USAGE]);
    if (row[COL.MAIN_CURTAIN]) lines.push('• Main Curtain: ' + row[COL.MAIN_CURTAIN]);
    if (row[COL.ADDITIONAL_INFO]) lines.push('• Additional Info: ' + row[COL.ADDITIONAL_INFO]);
    if (row[COL.DIAGRAM_URL]) lines.push('• Setup Diagram: ' + row[COL.DIAGRAM_URL]);
  }

  const desc = String(row[COL.EVENT_DESCRIPTION] || '').trim();
  if (desc) {
    lines.push('');
    lines.push('--- EVENT DESCRIPTION ---');
    lines.push(desc);
  }

  lines.push('');
  lines.push('Managed via DBHS Activities Portal: ' + getWebAppUrl() + '?id=' + requestId);
  return lines.join('\n');
}

/**
 * Parses primary date and comma-separated reoccurring dates, deduplicating them.
 */
function parseAndDeduplicateDates_(primaryDateVal, isReoccurring, additionalDatesStr) {
  const datesMap = {};
  const validDates = [];

  const addDateIfValid = function(dVal) {
    if (!dVal) return;
    let d = null;
    if (dVal instanceof Date) {
      d = new Date(dVal.getTime());
    } else {
      const parsed = Date.parse(String(dVal).trim());
      if (!isNaN(parsed)) {
        d = new Date(parsed);
      }
    }

    if (d && !isNaN(d.getTime())) {
      // Normalize to date string YYYY-MM-DD for deduplication
      const dateKey = Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM-dd');
      if (!datesMap[dateKey]) {
        datesMap[dateKey] = true;
        validDates.push(d);
      }
    }
  };

  // 1. Add primary date
  addDateIfValid(primaryDateVal);

  // 2. If reoccurring, parse comma-separated dates
  if (isReoccurring && additionalDatesStr) {
    const rawTokens = additionalDatesStr.split(',');
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i].trim();
      if (token) {
        addDateIfValid(token);
      }
    }
  }

  // Sort dates chronologically
  validDates.sort(function(a, b) {
    return a.getTime() - b.getTime();
  });

  return validDates;
}

/**
 * Combines a Date object with Start/End time strings or Dates.
 */
function computeStartAndEndTimeDate_(baseDate, startTimeVal, endTimeVal) {
  const baseYear = baseDate.getFullYear();
  const baseMonth = baseDate.getMonth();
  const baseDay = baseDate.getDate();

  const parseHourMinute = function(tVal, defaultH, defaultM) {
    if (!tVal) return { h: defaultH, m: defaultM, isSet: false };
    if (tVal instanceof Date) {
      return { h: tVal.getHours(), m: tVal.getMinutes(), isSet: true };
    }
    const str = String(tVal).trim().toLowerCase();
    const match = str.match(/(\d+):(\d+)(?::\d+)?\s*(am|pm)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const mer = match[3] ? match[3].toLowerCase() : '';
      if (mer === 'pm' && h < 12) h += 12;
      if (mer === 'am' && h === 12) h = 0;
      return { h: h, m: m, isSet: true };
    }
    return { h: defaultH, m: defaultM, isSet: false };
  };

  const startParsed = parseHourMinute(startTimeVal, 8, 0);
  const endParsed = parseHourMinute(endTimeVal, startParsed.h + 1, startParsed.m);

  const startDate = new Date(baseYear, baseMonth, baseDay, startParsed.h, startParsed.m, 0);
  let endDate = new Date(baseYear, baseMonth, baseDay, endParsed.h, endParsed.m, 0);

  // If end time is before start time, assume same-day 1-hour duration
  if (endDate <= startDate) {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  return {
    isTimed: (startParsed.isSet || endParsed.isSet),
    startDate: startDate,
    endDate: endDate
  };
}


// =================================================================================
// 9. SECRETARY DASHBOARD & CALENDAR EDITOR (OPS SECRETARY PATTERN)
// =================================================================================

/**
 * Allows authorized Ops Secretaries to edit and synchronize an Approved request's
 * calendar schedule directly from the portal.
 */
function updateCalendarSchedule(payload, passedUserEmail) {
  if (!payload || !payload.requestId) {
    throw new Error('Invalid schedule update payload.');
  }

  const userEmail = (passedUserEmail || payload.userEmail || getCurrentUserEmail_()).toLowerCase().trim();
  const approversDir = getApproversDirectory_();
  const isOpsSecretary = approversDir.calendarEditors.includes(userEmail);
  const isAdmin = isOpsSecretary || userEmail.startsWith('kwendland');

  // Server-side authorization check
  if (!isOpsSecretary && !isAdmin) {
    throw new Error('Unauthorized: Only Calendar Dashboard Editors (Ops Secretaries) can modify schedules.');
  }

  const requestId = String(payload.requestId).trim().toUpperCase();

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    throw new Error('System is busy processing another request. Please try again.');
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID);
    const respSheet = getResponsesSheet_(ss);
    const data = respSheet.getDataRange().getValues();

    let targetRowIndex = -1;
    let targetRow = null;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][COL.REQUEST_ID] || '').trim().toUpperCase() === requestId) {
        targetRowIndex = i + 1;
        targetRow = data[i];
        break;
      }
    }

    if (targetRowIndex === -1 || !targetRow) {
      throw new Error('Request ' + requestId + ' not found.');
    }

    // Prepare updated values
    const newTitle = String(payload.eventTitle || targetRow[COL.EVENT_TITLE]).trim();
    const newLocation = String(payload.location || targetRow[COL.LOCATION]).trim();
    const newDate = payload.eventDate ? new Date(payload.eventDate) : targetRow[COL.EVENT_DATE];
    const newReoccurringDates = payload.additionalDates !== undefined ? String(payload.additionalDates).trim() : String(targetRow[COL.REOCCURRING_DATES] || '');
    const newIsReoccurring = (newReoccurringDates && newReoccurringDates.length > 0) ? 'Yes' : 'No';
    const newStartTime = payload.eventStartTime || targetRow[COL.START_TIME];
    const newEndTime = payload.eventEndTime || targetRow[COL.END_TIME];
    const newDescription = payload.eventDescription !== undefined ? String(payload.eventDescription).trim() : String(targetRow[COL.EVENT_DESCRIPTION] || '');

    // Synchronize Calendar Events
    const existingIdsStr = String(targetRow[COL.CALENDAR_EVENT_IDS] || '');
    const existingIds = existingIdsStr.split(',').map(s => s.trim()).filter(Boolean);

    // Calculate target dates
    const targetDates = parseAndDeduplicateDates_(newDate, newIsReoccurring === 'Yes', newReoccurringDates);

    // Update in-memory row to construct new description
    targetRow[COL.EVENT_TITLE] = newTitle;
    targetRow[COL.LOCATION] = newLocation;
    targetRow[COL.EVENT_DATE] = newDate;
    targetRow[COL.IS_REOCCURRING] = newIsReoccurring;
    targetRow[COL.REOCCURRING_DATES] = newReoccurringDates;
    targetRow[COL.START_TIME] = newStartTime;
    targetRow[COL.END_TIME] = newEndTime;
    targetRow[COL.EVENT_DESCRIPTION] = newDescription;

    const eventDescription = buildCalendarEventDescription_(targetRow);
    const finalEventIds = [];
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);

    if (calendar) {
      // Match existing events or create new ones
      for (let d = 0; d < targetDates.length; d++) {
        const dateObj = targetDates[d];
        const timeRange = computeStartAndEndTimeDate_(dateObj, newStartTime, newEndTime);

        if (d < existingIds.length) {
          // Update existing event
          const eventId = existingIds[d];
          try {
            const ev = calendar.getEventById(eventId);
            if (ev) {
              ev.setTitle(newTitle);
              ev.setLocation(newLocation);
              ev.setDescription(eventDescription);
              if (timeRange.isTimed) {
                ev.setTime(timeRange.startDate, timeRange.endDate);
              }
              finalEventIds.push(eventId);
              continue;
            }
          } catch (e) {
            Logger.log('Could not find existing event ' + eventId + ', recreating: ' + e);
          }
        }

        // If not updated or not found, create new event
        let newEvent;
        if (timeRange.isTimed) {
          newEvent = calendar.createEvent(newTitle, timeRange.startDate, timeRange.endDate, {
            location: newLocation,
            description: eventDescription
          });
        } else {
          newEvent = calendar.createAllDayEvent(newTitle, dateObj, {
            location: newLocation,
            description: eventDescription
          });
        }
        if (newEvent) {
          finalEventIds.push(newEvent.getId());
        }
      }

      // If fewer target dates than existing events, delete extra events
      if (existingIds.length > targetDates.length) {
        for (let rem = targetDates.length; rem < existingIds.length; rem++) {
          try {
            const evToDelete = calendar.getEventById(existingIds[rem]);
            if (evToDelete) {
              evToDelete.deleteEvent();
            }
          } catch (delErr) {
            Logger.log('Error deleting removed event ' + existingIds[rem] + ': ' + delErr);
          }
        }
      }
    }

    const now = new Date();
    const timestampStr = Utilities.formatDate(now, CONFIG.TIMEZONE, 'MM/dd/yyyy HH:mm');
    const existingLog = String(targetRow[COL.APPROVAL_LOG] || '');
    const updateLogEntry = timestampStr + ': Schedule / Calendar updated by Secretary ' + userEmail + ' (' + finalEventIds.length + ' event(s))';
    const updatedLog = existingLog ? existingLog + '\n' + updateLogEntry : updateLogEntry;

    // Write updates to Google Sheet
    respSheet.getRange(targetRowIndex, COL.EVENT_TITLE + 1).setValue(newTitle);
    respSheet.getRange(targetRowIndex, COL.LOCATION + 1).setValue(newLocation);
    respSheet.getRange(targetRowIndex, COL.EVENT_DATE + 1).setValue(newDate);
    respSheet.getRange(targetRowIndex, COL.IS_REOCCURRING + 1).setValue(newIsReoccurring);
    respSheet.getRange(targetRowIndex, COL.REOCCURRING_DATES + 1).setValue(newReoccurringDates);
    respSheet.getRange(targetRowIndex, COL.START_TIME + 1).setValue(newStartTime);
    respSheet.getRange(targetRowIndex, COL.END_TIME + 1).setValue(newEndTime);
    respSheet.getRange(targetRowIndex, COL.EVENT_DESCRIPTION + 1).setValue(newDescription);
    respSheet.getRange(targetRowIndex, COL.CALENDAR_EVENT_IDS + 1).setValue(finalEventIds.join(', '));
    respSheet.getRange(targetRowIndex, COL.CALENDAR_SYNC_STATUS + 1).setValue('Synced');
    respSheet.getRange(targetRowIndex, COL.APPROVAL_LOG + 1).setValue(updatedLog);
    respSheet.getRange(targetRowIndex, COL.LAST_UPDATED + 1).setValue(now);

    targetRow[COL.CALENDAR_EVENT_IDS] = finalEventIds.join(', ');
    targetRow[COL.CALENDAR_SYNC_STATUS] = 'Synced';
    targetRow[COL.APPROVAL_LOG] = updatedLog;
    targetRow[COL.LAST_UPDATED] = now;
    const updatedReq = mapRowToRequestObject_(targetRow, targetRowIndex);

    return {
      success: true,
      message: 'Schedule and calendar synchronized successfully.',
      request: updatedReq
    };
  } finally {
    lock.releaseLock();
  }
}


// =================================================================================
// 10. BRANDED HTML EMAIL TEMPLATES & NOTIFICATIONS
// =================================================================================

/**
 * Generates official DBHS branded email header.
 */
function generateEmailHeader_(subtitle) {
  return '<div style="font-family: \'Product Sans\', -apple-system, Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e0d0f0; border-radius: 8px; overflow: hidden; background: #ffffff;">' +
    '<div style="background-color: ' + CONFIG.COLORS.PRIMARY + '; padding: 22px 20px; text-align: center; border-bottom: 4px solid ' + CONFIG.COLORS.SECONDARY + ';">' +
      '<img src="' + CONFIG.DBHS_LOGO_URL + '" alt="DBHS Brahmas" style="max-height: 65px; width: auto; max-width: 90%; display: block; margin: 0 auto;" />' +
      '<div style="color: #ffffff; font-size: 19px; font-weight: 700; margin-top: 10px; letter-spacing: 0.5px;">DBHS Activities Request System</div>' +
      (subtitle ? '<div style="color: ' + CONFIG.COLORS.SECONDARY + '; font-size: 13px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">' + subtitle + '</div>' : '') +
    '</div>' +
    '<div style="padding: 24px 22px; color: #333333; line-height: 1.55; font-size: 14px;">';
}

/**
 * Generates official email footer.
 */
function generateEmailFooter_() {
  return '</div>' +
    '<div style="background-color: #f7f3fb; padding: 16px 20px; border-top: 1px solid #ebdcf5; text-align: center; font-size: 12px; color: #666666;">' +
      '<img src="' + CONFIG.WVUSD_LOGO_URL + '" alt="WVUSD" style="max-height: 28px; width: auto; opacity: 0.85; margin-bottom: 6px;" />' +
      '<div>Diamond Bar High School &bull; Walnut Valley Unified School District</div>' +
      '<div style="margin-top: 4px; color: #888888;">This is an automated notification. Please do not reply directly to this email.</div>' +
    '</div>' +
  '</div>';
}

/**
 * Sends Action Required email to Location Approver(s).
 */
function sendApproverNotificationEmail_(approverEmails, req) {
  const portalUrl = getWebAppUrl() + '?id=' + req.requestId;
  const subject = '[Action Required] DBHS Activity Request: ' + req.eventTitle + ' (' + req.requestId + ')';

  let body = generateEmailHeader_('Approval Action Required');
  body += '<p style="font-size: 15px; margin-top: 0;"><strong>Hello DBHS Approver,</strong></p>';
  body += '<p>A new activity request has been submitted requiring your facility review and location approval.</p>';

  body += generateRequestSummaryHtmlTable_(req, true);

  body += '<div style="text-align: center; margin: 28px 0 20px 0;">' +
    '<a href="' + portalUrl + '" style="background-color: ' + CONFIG.COLORS.PRIMARY + '; color: #ffffff; padding: 13px 26px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.15); border: 2px solid ' + CONFIG.COLORS.SECONDARY + ';">' +
      'Open Request in Approval Portal &rarr;' +
    '</a>' +
  '</div>';

  body += '<p style="font-size: 12px; color: #666666; text-align: center;">You can Approve, Deny, or Request Changes directly from the portal view.</p>';
  body += generateEmailFooter_();

  GmailApp.sendEmail(approverEmails.join(','), subject, '', {
    htmlBody: body,
    name: 'DBHS Activities Portal'
  });
}

/**
 * Sends Confirmation email to Submitter & Advisor.
 */
function sendSubmitterConfirmationEmail_(applicantEmails, req) {
  const portalUrl = getWebAppUrl() + '?id=' + req.requestId;
  const subject = 'DBHS Activity Request Received: ' + req.eventTitle + ' (' + req.requestId + ')';

  let body = generateEmailHeader_('Request Confirmation');
  body += '<p style="font-size: 15px; margin-top: 0;"><strong>Hello ' + (req.advisor || 'Applicant') + ',</strong></p>';
  body += '<p>Your DBHS Activities Request Form has been received and logged under <strong>' + req.requestId + '</strong>. It is currently pending review by the designated facility approver.</p>';

  body += generateRequestSummaryHtmlTable_(req, false);

  body += '<div style="text-align: center; margin: 26px 0 18px 0;">' +
    '<a href="' + portalUrl + '" style="background-color: ' + CONFIG.COLORS.PRIMARY + '; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; border: 1px solid ' + CONFIG.COLORS.SECONDARY + ';">' +
      'View Real-Time Status Tracker &rarr;' +
    '</a>' +
  '</div>';

  body += generateEmailFooter_();

  GmailApp.sendEmail(applicantEmails.join(','), subject, '', {
    htmlBody: body,
    name: 'DBHS Activities Portal'
  });
}

/**
 * Sends Approval & Calendar Synced notification to Submitter, Advisor & Ops Secretary.
 */
function sendApprovalCompletedEmail_(applicantEmails, secretaryEmails, req, comments) {
  const portalUrl = getWebAppUrl() + '?id=' + req.requestId;
  const subject = '[Approved & Synced] DBHS Activity: ' + req.eventTitle + ' (' + req.requestId + ')';
  const allRecipients = applicantEmails.concat(secretaryEmails).filter(Boolean);

  let body = generateEmailHeader_('Request Approved & Scheduled');
  body += '<div style="background-color: #e8f5e9; border-left: 5px solid #2e7d32; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">' +
    '<strong style="color: #2e7d32; font-size: 15px;">Activity Approved & Calendar Synced!</strong>' +
    '<div style="color: #333; margin-top: 4px;">This activity has received full facility approval and has been published to the DBHS Activities Master Calendar.</div>' +
  '</div>';

  if (comments) {
    body += '<div style="background-color: #f7f3fb; border: 1px solid #e1d4f0; padding: 12px 14px; border-radius: 6px; margin-bottom: 18px;">' +
      '<strong>Approver Comments:</strong> ' + comments +
    '</div>';
  }

  body += generateRequestSummaryHtmlTable_(req, false);

  body += '<div style="text-align: center; margin: 24px 0 16px 0;">' +
    '<a href="' + portalUrl + '" style="background-color: ' + CONFIG.COLORS.PRIMARY + '; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">' +
      'Open in DBHS Portal &rarr;' +
    '</a>' +
  '</div>';

  body += generateEmailFooter_();

  GmailApp.sendEmail(allRecipients.join(','), subject, '', {
    htmlBody: body,
    name: 'DBHS Activities Portal'
  });
}

/**
 * Sends Denial Notification.
 */
function sendDenialEmail_(applicantEmails, req, reason) {
  const portalUrl = getWebAppUrl() + '?id=' + req.requestId;
  const subject = '[Decision] DBHS Activity Denied: ' + req.eventTitle + ' (' + req.requestId + ')';

  let body = generateEmailHeader_('Request Denied');
  body += '<div style="background-color: #fdecea; border-left: 5px solid #d32f2f; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">' +
    '<strong style="color: #c62828; font-size: 15px;">Activity Request Not Approved</strong>' +
    '<div style="color: #333; margin-top: 4px;">Your request for ' + req.eventTitle + ' (' + req.requestId + ') could not be approved at this time.</div>' +
  '</div>';

  if (reason) {
    body += '<div style="background-color: #fef7f7; border: 1px solid #f5c6cb; padding: 12px 14px; border-radius: 6px; margin-bottom: 18px;">' +
      '<strong style="color: #721c24;">Reason Provided:</strong> ' + reason +
    '</div>';
  }

  body += generateRequestSummaryHtmlTable_(req, false);
  body += generateEmailFooter_();

  GmailApp.sendEmail(applicantEmails.join(','), subject, '', {
    htmlBody: body,
    name: 'DBHS Activities Portal'
  });
}

/**
 * Sends Changes Requested Notification.
 */
function sendChangesRequestedEmail_(applicantEmails, req, notes) {
  const portalUrl = getWebAppUrl() + '?id=' + req.requestId;
  const subject = '[Action Needed] DBHS Activity Changes Requested: ' + req.eventTitle + ' (' + req.requestId + ')';

  let body = generateEmailHeader_('Changes Requested');
  body += '<div style="background-color: #fff9e6; border-left: 5px solid #ffb300; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">' +
    '<strong style="color: #8f6200; font-size: 15px;">Modifications Required</strong>' +
    '<div style="color: #333; margin-top: 4px;">The approver has requested modifications or additional information before this activity can be scheduled.</div>' +
  '</div>';

  if (notes) {
    body += '<div style="background-color: #fffbf0; border: 1px solid #ffeeba; padding: 12px 14px; border-radius: 6px; margin-bottom: 18px;">' +
      '<strong style="color: #856404;">Requested Changes:</strong> ' + notes +
    '</div>';
  }

  body += generateRequestSummaryHtmlTable_(req, false);

  body += '<div style="text-align: center; margin: 24px 0 16px 0;">' +
    '<a href="' + portalUrl + '" style="background-color: ' + CONFIG.COLORS.PRIMARY + '; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">' +
      'Review & Update in Portal &rarr;' +
    '</a>' +
  '</div>';

  body += generateEmailFooter_();

  GmailApp.sendEmail(applicantEmails.join(','), subject, '', {
    htmlBody: body,
    name: 'DBHS Activities Portal'
  });
}

/**
 * Builds HTML Table summarizing populated fields with branching awareness.
 */
function generateRequestSummaryHtmlTable_(req, showAllDetails) {
  let html = '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">';

  const addRow = function(label, value, isHighlight) {
    if (!value) return;
    const bg = isHighlight ? 'background-color: #faf7fd;' : '';
    html += '<tr style="border-bottom: 1px solid #eee; ' + bg + '">' +
      '<td style="padding: 7px 10px; font-weight: 600; color: #555; width: 38%;">' + label + '</td>' +
      '<td style="padding: 7px 10px; color: #111;">' + value + '</td>' +
    '</tr>';
  };

  addRow('Request ID', '<strong>' + req.requestId + '</strong>');
  addRow('Event Title', '<strong>' + req.eventTitle + '</strong>');
  addRow('Requesting Group', req.requestingGroup);
  addRow('Advisor', req.advisor + ' (' + req.advisorEmail + ')');
  addRow('Location', '<strong>' + req.location + '</strong>', true);
  addRow('Event Date', req.eventDate, true);
  if (req.isReoccurring === 'Yes' && req.reoccurringDates) {
    addRow('Additional Dates', req.reoccurringDates);
  }
  addRow('Arrival Time', req.arrivalTime);
  addRow('Event Time', req.startTime + ' - ' + req.endTime);
  addRow('Description', req.eventDescription);

  // Set-up Section (Only show if Set-Up = Yes)
  if (req.setupRequired === 'Yes') {
    html += '<tr style="background-color: #f1e9f9;"><td colspan="2" style="padding: 8px 10px; font-weight: 700; color: ' + CONFIG.COLORS.PRIMARY + ';">Facility & Set-Up Details</td></tr>';
    addRow('Total Duration', req.facilityDuration);
    addRow('Chairs Needed', req.numChairs);
    addRow('Tables Needed', req.numTables);
    addRow('Podium', req.podium);
    addRow('Stage', req.stage);
    addRow('Risers', req.risers);
    addRow('Coffee Pot', req.coffeePot);
    addRow('PA System', req.paSystem);
    addRow('Projector & Screen', (req.projector || req.screen) ? (req.projector ? 'Projector: ' + req.projector + '; ' : '') + (req.screen ? 'Screen: ' + req.screen : '') : '');
    addRow('Microphones', req.microphones);
    addRow('Stage Usage / Curtain', (req.stageUsage || req.mainCurtain) ? (req.stageUsage ? 'Stage: ' + req.stageUsage + '; ' : '') + (req.mainCurtain ? 'Curtain: ' + req.mainCurtain : '') : '');
    addRow('Additional Notes', req.additionalInfo);
    if (req.diagramUrl) {
      addRow('Uploaded Diagram', '<a href="' + req.diagramUrl + '" target="_blank" style="color: ' + CONFIG.COLORS.PRIMARY + '; font-weight: 600;">View Diagram File &nearr;</a>');
    }
  }

  // Revenue Potential Section (Only show if Revenue Form Needed = Yes)
  if (req.revenueFormNeeded === 'Yes') {
    html += '<tr style="background-color: #fef9e7;"><td colspan="2" style="padding: 8px 10px; font-weight: 700; color: #856404;">Revenue Potential Summary</td></tr>';
    addRow('Account #', req.accountNum);
    addRow('Sales Period', req.salesStartDate + ' to ' + req.salesEndDate);
    addRow('Units Purchased & Cost', req.unitsPurchased ? req.unitsPurchased + ' units @ ' + req.costEach + ' (Total Cost: ' + req.totalNetCost + ')' : '');
    addRow('Projected Sales', req.projectedSalesUnits ? req.projectedSalesUnits + ' units @ ' + req.projectedSalesAmountEach + ' (Total: ' + req.projectedSalesTotal + ')' : '');
    addRow('Gross Income / Net Profit', 'Gross: ' + (req.projectedGrossIncome || '$0') + ' | Expenses: ' + (req.estimatedExpenses || '$0') + ' | <strong>Net Profit: ' + (req.potentialNetProfit || '$0') + '</strong>');
  }

  html += '</table>';
  return html;
}
