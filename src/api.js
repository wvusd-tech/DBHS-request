/**
 * DBHS Activities Request & Calendar Approval System - API Client
 * Communicates with Google Apps Script backend using text/plain POST to prevent CORS preflight blocks.
 */

export const GAS_API_URL = import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_GAS_API_URL || 
  localStorage.getItem('DBHS_GAS_API_URL') || 
  "";

export function setCustomGasUrl(url) {
  if (url) {
    localStorage.setItem('DBHS_GAS_API_URL', url.trim());
  } else {
    localStorage.removeItem('DBHS_GAS_API_URL');
  }
}

/**
 * Universal JSON post helper with Content-Type: text/plain to avoid CORS OPTIONS preflights
 */
async function callGasApi(action, payload = {}, idToken = null) {
  const currentUrl = GAS_API_URL || localStorage.getItem('DBHS_GAS_API_URL');
  const requestBody = {
    action,
    idToken: idToken || localStorage.getItem('dbhs_id_token') || 'DEV_MOCK_kwendland@wvusd.org',
    ...payload
  };

  if (!currentUrl) {
    console.info(`[DBHS API] No remote GAS URL configured. Using interactive local client state.`);
    return handleLocalFallback(action, requestBody);
  }

  try {
    const response = await fetch(currentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || 'Server reported failure');
    }

    return json.data;
  } catch (err) {
    console.warn(`[DBHS API] Remote call for '${action}' failed (${err.message}). Using local state fallback.`);
    return handleLocalFallback(action, requestBody);
  }
}

// Local mock storage for preview / development
let localRequests = [
  {
    rowIndex: 2,
    timestamp: '2026-11-20 08:00:00',
    submitterEmail: 'kwendland@wvusd.org',
    requestingGroup: 'Robotics Club',
    advisorName: 'Kevin Wendland',
    advisorEmail: 'kwendland@wvusd.org',
    eventDate: '2026-12-05',
    eventTitle: 'Robotics Club STEM Showcase & Tournament',
    isReoccurring: 'Yes',
    reoccurringDates: '2026-12-06, 2026-12-07',
    eventDescription: 'Annual Robotics Competition & STEM Showcase featuring student robot demos, arena challenges, and community partner exhibits.',
    location: 'Gym',
    arrivalTime: '07:30 AM',
    startTime: '08:30 AM',
    endTime: '04:30 PM',
    setupRequired: 'Yes',
    revenueFormNeeded: 'No',
    facilityDuration: '7:00 am - 5:30 pm',
    numChairs: '150',
    numTables: '20',
    podium: 'Yes',
    stage: 'Yes',
    risers: 'No',
    coffeePot: 'Yes',
    paSystem: 'Yes',
    projector: 'Yes',
    screen: 'Yes',
    microphones: 'Yes',
    stageUsage: 'Full Stage',
    mainCurtain: 'N/A',
    additionalInfo: 'Need floor tarps placed under competition ring and pit tables along the west wall.',
    diagramUrl: 'https://drive.google.com/file/d/1sample_gym_robotics_floorplan/view',
    revenueFormSetup: 'No',
    accountNum: '',
    salesStartDate: '',
    salesEndDate: '',
    unitsPurchased: '',
    costEach: '',
    totalNetCost: '',
    projectedSalesUnits: '',
    projectedSalesAmountEach: '',
    projectedSalesTotal: '',
    projectedGrossIncome: '',
    estimatedExpenses: '',
    potentialNetProfit: '',
    requestId: 'DBHS-ACT-001',
    status: 'Pending',
    currentApprover: 'kwendland@wvusd.org',
    approvalLog: '11/20/2026 08:00: Submitted by kwendland@wvusd.org. Routed to Gym Approver (kwendland@wvusd.org)',
    calendarEventIds: '',
    calendarSyncStatus: 'Not Synced',
    lastUpdated: '2026-11-20 08:00:00'
  },
  {
    rowIndex: 3,
    timestamp: '2026-11-20 08:15:00',
    submitterEmail: 'kwendland@wvusd.org',
    requestingGroup: 'DBHS Drama Department',
    advisorName: 'Kevin Wendland',
    advisorEmail: 'kwendland@wvusd.org',
    eventDate: '2026-12-11',
    eventTitle: 'Drama Club Spring Musical: Into the Woods',
    isReoccurring: 'Yes',
    reoccurringDates: '2026-12-12, 2026-12-13',
    eventDescription: 'Three evening public theatrical performances with student orchestra and technical lighting crew.',
    location: 'Theater',
    arrivalTime: '05:30 PM',
    startTime: '07:00 PM',
    endTime: '09:30 PM',
    setupRequired: 'Yes',
    revenueFormNeeded: 'Yes',
    facilityDuration: '5:00 pm - 10:30 pm',
    numChairs: '0',
    numTables: '4',
    podium: 'No',
    stage: 'Yes',
    risers: 'Yes',
    coffeePot: 'No',
    paSystem: 'Yes',
    projector: 'Yes',
    screen: 'Yes',
    microphones: 'Yes',
    stageUsage: 'Full Stage',
    mainCurtain: 'Yes',
    additionalInfo: 'Box office table needed in lobby. Technical rehearsal completed during after-school sessions.',
    diagramUrl: 'https://drive.google.com/file/d/1sample_theater_stage_layout/view',
    revenueFormSetup: 'Yes',
    accountNum: 'ACT-5421',
    salesStartDate: '2026-11-25',
    salesEndDate: '2026-12-13',
    unitsPurchased: '500',
    costEach: '$3.00',
    totalNetCost: '$1,500.00',
    projectedSalesUnits: '450',
    projectedSalesAmountEach: '$15.00',
    projectedSalesTotal: '$6,750.00',
    projectedGrossIncome: '$6,750.00',
    estimatedExpenses: '$1,500.00',
    potentialNetProfit: '$5,250.00',
    requestId: 'DBHS-ACT-002',
    status: 'Approved',
    currentApprover: 'kwendland@wvusd.org',
    approvalLog: '11/20/2026 08:15: Submitted by kwendland@wvusd.org. Routed to Theater Approver (kwendland@wvusd.org)\n11/20/2026 08:20: [Approved by kwendland@wvusd.org]: All technical and facility requirements verified.\n11/20/2026 08:20: Google Calendar events scheduled (3 dates).',
    calendarEventIds: 'c_mock_drama_001, c_mock_drama_002, c_mock_drama_003',
    calendarSyncStatus: 'Synced',
    lastUpdated: '2026-11-20 08:20:00'
  },
  {
    rowIndex: 4,
    timestamp: '2026-11-20 08:30:00',
    submitterEmail: 'kwendland@wvusd.org',
    requestingGroup: 'ASB Leadership',
    advisorName: 'Kevin Wendland',
    advisorEmail: 'kwendland@wvusd.org',
    eventDate: '2026-12-18',
    eventTitle: 'ASB Winter Holiday Lunch Rally',
    isReoccurring: 'No',
    reoccurringDates: '',
    eventDescription: 'Schoolwide lunchtime holiday spirit rally with music, class games, Brahma mascot, and club recognitions.',
    location: 'Amphitheater',
    arrivalTime: '11:45 AM',
    startTime: '12:15 PM',
    endTime: '01:00 PM',
    setupRequired: 'Yes',
    revenueFormNeeded: 'No',
    facilityDuration: '11:30 am - 1:30 pm',
    numChairs: '10',
    numTables: '6',
    podium: 'Yes',
    stage: 'N/A',
    risers: 'No',
    coffeePot: 'No',
    paSystem: 'Yes',
    projector: 'No',
    screen: 'No',
    microphones: 'Yes',
    stageUsage: 'N/A',
    mainCurtain: 'No',
    additionalInfo: 'Power cord extension needed to sound table.',
    diagramUrl: '',
    revenueFormSetup: 'No',
    accountNum: '',
    salesStartDate: '',
    salesEndDate: '',
    unitsPurchased: '',
    costEach: '',
    totalNetCost: '',
    projectedSalesUnits: '',
    projectedSalesAmountEach: '',
    projectedSalesTotal: '',
    projectedGrossIncome: '',
    estimatedExpenses: '',
    potentialNetProfit: '',
    requestId: 'DBHS-ACT-003',
    status: 'Pending',
    currentApprover: 'kwendland@wvusd.org',
    approvalLog: '11/20/2026 08:30: Submitted by kwendland@wvusd.org. Routed to Amphitheater Approver (kwendland@wvusd.org)',
    calendarEventIds: '',
    calendarSyncStatus: 'Not Synced',
    lastUpdated: '2026-11-20 08:30:00'
  }
];

function handleLocalFallback(action, payload) {
  if (action === 'verifyAuth') {
    const userEmail = (payload.userEmail || 'kwendland@wvusd.org').toLowerCase();
    return {
      user: {
        email: userEmail,
        name: userEmail.split('@')[0],
        roles: {
          isApprover: true,
          isOpsSecretary: true,
          isAdmin: true
        }
      }
    };
  }

  if (action === 'getPortalData') {
    const userEmail = (payload.userEmail || 'kwendland@wvusd.org').toLowerCase();
    const stats = {
      total: localRequests.length,
      pending: localRequests.filter(r => r.status === 'Pending').length,
      approved: localRequests.filter(r => r.status === 'Approved').length,
      denied: localRequests.filter(r => r.status === 'Denied').length,
      changesRequested: localRequests.filter(r => r.status === 'Changes Requested').length,
      calendarSynced: localRequests.filter(r => r.calendarSyncStatus === 'Synced').length
    };
    return {
      currentUser: {
        email: userEmail,
        isOpsSecretary: true,
        isApprover: true,
        isAdmin: true,
        locations: ['Amphitheater', 'Bullpen', 'Gym', 'Theater', 'Stadium']
      },
      requests: [...localRequests].reverse(),
      stats,
      approverLocations: ['Amphitheater', 'Bullpen', 'Corkrum Corral', 'Gym', 'Golden Horseshoe', 'Library', 'Stadium', 'Theater', 'Upper Quad']
    };
  }

  if (action === 'submitActivityRequest') {
    const nextNum = localRequests.length + 1;
    const reqId = 'DBHS-ACT-' + String(nextNum).padStart(3, '0');
    const newReq = {
      ...payload,
      requestId: reqId,
      status: 'Pending',
      currentApprover: 'kwendland@wvusd.org',
      calendarSyncStatus: 'Not Synced',
      calendarEventIds: '',
      approvalLog: `${new Date().toLocaleDateString()}: Submitted by ${payload.submitterEmail || 'Applicant'}. Routed to location approver.`,
      lastUpdated: new Date().toISOString()
    };
    localRequests.push(newReq);
    return { requestId: reqId, status: 'Pending', currentApprover: 'kwendland@wvusd.org' };
  }

  if (action === 'handleApprovalAction') {
    const target = localRequests.find(r => r.requestId === payload.requestId);
    if (target) {
      target.status = payload.action === 'approve' ? 'Approved' : (payload.action === 'deny' ? 'Denied' : 'Changes Requested');
      target.approvalLog += `\n${new Date().toLocaleDateString()}: [${target.status} by ${payload.userEmail || 'Approver'}]: ${payload.comments || 'No comment'}`;
      if (payload.action === 'approve') {
        target.calendarSyncStatus = 'Synced';
        target.calendarEventIds = `event_${target.requestId}_p1, event_${target.requestId}_p2`;
      }
      target.lastUpdated = new Date().toISOString();
    }
    return { success: true, requestId: payload.requestId, newStatus: target?.status };
  }

  if (action === 'updateCalendarSchedule') {
    const target = localRequests.find(r => r.requestId === payload.requestId);
    if (target) {
      if (payload.eventTitle) target.eventTitle = payload.eventTitle;
      if (payload.location) target.location = payload.location;
      if (payload.eventDate) target.eventDate = payload.eventDate;
      if (payload.additionalDates !== undefined) target.reoccurringDates = payload.additionalDates;
      if (payload.eventStartTime) target.startTime = payload.eventStartTime;
      if (payload.eventEndTime) target.endTime = payload.eventEndTime;
      if (payload.eventDescription !== undefined) target.eventDescription = payload.eventDescription;
      target.calendarSyncStatus = 'Synced';
      target.approvalLog += `\n${new Date().toLocaleDateString()}: Schedule updated by Secretary (${target.calendarEventIds || 'Events'} synced)`;
      target.lastUpdated = new Date().toISOString();
    }
    return { success: true, requestId: payload.requestId };
  }

  if (action === 'addActivityNote') {
    const target = localRequests.find(r => r.requestId === payload.requestId);
    if (target) {
      target.approvalLog += `\n${new Date().toLocaleDateString()}: [Note by ${payload.userEmail || 'Editor'}]: ${payload.note}`;
      target.lastUpdated = new Date().toISOString();
    }
    return { success: true, updatedLog: target?.approvalLog };
  }

  return { success: true };
}

export const api = {
  verifyAuth: (idToken) => callGasApi('verifyAuth', {}, idToken),
  getPortalData: (userEmail) => callGasApi('getPortalData', { userEmail }),
  submitActivityRequest: (formData) => callGasApi('submitActivityRequest', formData),
  handleApprovalAction: (requestId, action, comments, userEmail) => callGasApi('handleApprovalAction', { requestId, action, comments, userEmail }),
  updateCalendarSchedule: (scheduleData) => callGasApi('updateCalendarSchedule', scheduleData),
  addActivityNote: (requestId, note, userEmail) => callGasApi('addActivityNote', { requestId, note, userEmail }),
  getRequestById: (requestId) => callGasApi('getRequestById', { reqId: requestId })
};
