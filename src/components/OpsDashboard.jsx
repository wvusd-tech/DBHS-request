import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, MapPin, Search, Filter, Edit3, 
  Save, RefreshCw, CheckCircle2, AlertCircle, History, 
  MessageSquare, ExternalLink, ArrowRight, X, Plus, Trash2,
  Wrench, DollarSign, Send, Check, ShieldAlert
} from 'lucide-react';
import { DBHS_LOCATIONS } from '../constants/locations';
import { api } from '../api';

function getMonthYearString(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    const parts = String(dateVal).split('/');
    if (parts.length === 3) {
      const monthNum = parseInt(parts[0], 10);
      const yearNum = parseInt(parts[2], 10);
      if (!isNaN(monthNum) && !isNaN(yearNum)) {
        return new Date(yearNum, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      }
    }
    return null;
  }
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function OpsDashboard({ 
  requests = [], 
  currentUser, 
  onRefresh 
}) {
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Approved' | 'Pending' | 'Changes Requested'
  const [locationFilter, setLocationFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Calendar Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    eventTitle: '',
    location: '',
    eventDate: '',
    additionalDates: '',
    editAllRecurring: true,
    eventStartTime: '',
    eventEndTime: '',
    eventDescription: ''
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Add Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');

  // Access control check for Ops Secretary
  const hasAccess = currentUser?.roles?.isOpsSecretary || currentUser?.roles?.isAdmin;

  // Extract distinct months for the month dropdown filter
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    requests.forEach(r => {
      const m = getMonthYearString(r.eventDateRaw || r.eventDate);
      if (m) monthsSet.add(m);
    });
    return Array.from(monthsSet);
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter === 'Approved' && r.status !== 'Approved') return false;
      if (statusFilter === 'Pending' && r.status !== 'Pending') return false;
      if (statusFilter === 'Changes Requested' && r.status !== 'Changes Requested') return false;
      if (locationFilter !== 'All' && r.location !== locationFilter) return false;

      if (monthFilter !== 'All') {
        const m = getMonthYearString(r.eventDateRaw || r.eventDate);
        if (m !== monthFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (r.requestId || '').toLowerCase().includes(q) ||
          (r.eventTitle || '').toLowerCase().includes(q) ||
          (r.requestingGroup || '').toLowerCase().includes(q) ||
          (r.location || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, statusFilter, locationFilter, monthFilter, searchQuery]);

  // Currently selected request (kept clear until an activity is clicked)
  const currentRequest = useMemo(() => {
    if (!selectedReqId) return null;
    return requests.find(r => r.requestId === selectedReqId) || null;
  }, [selectedReqId, requests]);

  // Security gate for non-Ops Secretaries
  if (!hasAccess) {
    return (
      <div className="bg-white rounded-3xl border border-purple-100 p-10 max-w-lg mx-auto shadow-sm my-12 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-purple-950">Calendar Dashboard Restricted</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          The Calendar Dashboard and Master Google Calendar Schedule Editor is locked to authorized Operations Secretaries listed in <strong>Approvers Tab Col C (Calendar Dashboard Editors)</strong>.
        </p>
        <div className="mt-4 p-3 bg-purple-50 rounded-xl text-xs text-purple-900 font-mono">
          Current account: {currentUser?.email || 'Guest'}
        </div>
        <p className="text-[11px] text-slate-400 mt-4">
          Switch to an authorized secretary demo account (e.g. <code>kwendland@wvusd.org</code>) via the top right profile menu to view and edit.
        </p>
      </div>
    );
  }

  // Open Edit Calendar Modal
  const handleOpenEditModal = () => {
    if (!currentRequest) return;

    // Convert date string to YYYY-MM-DD for the HTML5 <input type="date">
    let dateForInput = '';
    const rawDate = currentRequest.eventDateRaw || currentRequest.eventDate;
    if (rawDate) {
      const str = String(rawDate).trim();
      const usMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (usMatch) {
        const m = usMatch[1].padStart(2, '0');
        const d = usMatch[2].padStart(2, '0');
        const y = usMatch[3];
        dateForInput = `${y}-${m}-${d}`;
      } else if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateForInput = str;
      } else {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateForInput = `${y}-${m}-${day}`;
        }
      }
    }

    setEditFormData({
      eventTitle: currentRequest.eventTitle || '',
      location: currentRequest.location || 'Gym',
      eventDate: dateForInput,
      additionalDates: currentRequest.reoccurringDates || '',
      editAllRecurring: true,
      eventStartTime: currentRequest.startTime || '',
      eventEndTime: currentRequest.endTime || '',
      eventDescription: currentRequest.eventDescription || ''
    });
    setEditSuccessMsg('');
    setEditErrorMsg('');
    setShowEditModal(true);
  };

  // Submit Calendar Schedule Edits
  const handleSaveCalendarSchedule = async (e) => {
    e.preventDefault();
    if (!currentRequest) return;
    setSavingSchedule(true);
    setEditSuccessMsg('');
    setEditErrorMsg('');
    try {
      await api.updateCalendarSchedule({
        requestId: currentRequest.requestId,
        ...editFormData,
        userEmail: currentUser?.email
      });
      setEditSuccessMsg('Calendar schedule successfully updated and synced to Google Calendar!');
      setTimeout(() => {
        setShowEditModal(false);
        if (onRefresh) onRefresh();
      }, 1500);
    } catch (err) {
      setEditErrorMsg(err.message || 'Error updating schedule.');
    } finally {
      setSavingSchedule(false);
    }
  };

  // Submit Historical Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !currentRequest) return;
    setSavingNote(true);
    setNoteMsg('');
    try {
      await api.addActivityNote(currentRequest.requestId, newNoteText.trim(), currentUser?.email);
      setNewNoteText('');
      setNoteMsg('Note posted successfully to audit log.');
      setTimeout(() => setNoteMsg(''), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      setNoteMsg('Failed to add note: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#6f31a0] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#ffd760] text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Ops Secretary & Master Calendar
            </span>
            <span className="text-xs text-purple-200">
              Calendar ID: <code className="font-mono text-purple-100">c_classroom7fd4022b@group.calendar.google.com</code>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1.5 tracking-tight text-white">
            Calendar Dashboard & Schedule Editor
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl">
            Inspect facility commitments, review equipment setups, post audit notes, and directly modify synchronized Google Calendar events.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="bg-[#ffd760] hover:bg-amber-300 text-purple-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 self-start sm:self-center transition shadow-md hover:shadow-lg active:scale-95 border border-amber-300"
        >
          <RefreshCw className="w-4 h-4 text-purple-950 stroke-[2.5]" />
          Refresh Live Data
        </button>
      </div>

      {/* Two-Column Master / Detail Layout (Field Trip 4.0 OpsSecretary Pattern) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Filter & Activity List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Filter Activities</span>
              <div className="flex gap-1 flex-wrap justify-end">
                {['All', 'Approved', 'Pending', 'Changes Requested'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      statusFilter === st
                        ? 'bg-[#6f31a0] text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Month Dropdown Filter */}
              <div>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="All">📅 All Months</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold">No activities match your filters.</p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = currentRequest?.requestId === req.requestId;
                return (
                  <div
                    key={req.requestId}
                    onClick={() => setSelectedReqId(req.requestId)}
                    className={`p-4 cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-purple-50/80 border-l-4 border-[#6f31a0]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black bg-purple-100 text-purple-950 px-2 py-0.5 rounded">
                        {req.requestId}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 line-clamp-1">
                      {req.eventTitle}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-purple-900">
                        <MapPin className="w-3 h-3 text-purple-600" />
                        {req.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-600" />
                        {req.eventDate}
                        {req.isReoccurring === 'Yes' && ' (+ recurring)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-400 truncate max-w-[180px]">{req.requestingGroup}</span>
                      <span className={`font-bold ${req.calendarSyncStatus === 'Synced' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {req.calendarSyncStatus === 'Synced' ? '✓ Synced to Calendar' : 'Not Synced'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Selected Activity Detail & Live Calendar Editor (7 Cols) */}
        <div className="lg:col-span-7">
          {currentRequest ? (
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm p-6 sm:p-7 space-y-6">
              
              {/* Detail Header & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-[#ffd760] text-purple-950 px-2.5 py-0.5 rounded-full">
                      {currentRequest.requestId}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      currentRequest.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-purple-100 text-purple-900'
                    }`}>
                      {currentRequest.status}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      currentRequest.calendarSyncStatus === 'Synced'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {currentRequest.calendarSyncStatus === 'Synced' ? '✓ Google Calendar Synced' : 'Not Synced'}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-purple-950 mt-2 tracking-tight">
                    {currentRequest.eventTitle}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {currentRequest.requestingGroup} • Submitter: {currentRequest.submitterEmail} • Advisor: {currentRequest.advisorName}
                  </p>
                </div>

                <button
                  onClick={handleOpenEditModal}
                  className="bg-[#6f31a0] hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 transition shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Calendar Schedule
                </button>
              </div>

              {/* Event Schedule Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                    <MapPin className="w-4 h-4 text-purple-700" />
                    Facility & Location
                  </div>
                  <p className="text-base font-black text-slate-800">{currentRequest.location}</p>
                  <p className="text-xs text-slate-500 mt-1">Arrival Time: {currentRequest.arrivalTime || 'N/A'}</p>
                  {currentRequest.facilityDuration && (
                    <p className="text-xs text-slate-500">Duration: {currentRequest.facilityDuration}</p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                    <Calendar className="w-4 h-4 text-purple-700" />
                    Dates & Times
                  </div>
                  <p className="text-base font-black text-slate-800">
                    {currentRequest.eventDate} ({currentRequest.startTime} - {currentRequest.endTime})
                  </p>
                  {currentRequest.isReoccurring === 'Yes' && currentRequest.reoccurringDates && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-purple-800 block mb-1">Additional Recurring Dates:</span>
                      <div className="flex flex-wrap gap-1">
                        {currentRequest.reoccurringDates.split(',').map(s => s.trim()).filter(Boolean).map((d, i) => (
                          <span key={i} className="text-xs font-mono font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4">
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Event Description</span>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {currentRequest.eventDescription || 'No description provided.'}
                </p>
              </div>

              {/* Equipment & Setup Summary */}
              {currentRequest.setupRequired === 'Yes' && (
                <div className="border border-purple-200 rounded-2xl p-4 bg-purple-50/30 space-y-2">
                  <h4 className="text-xs font-black text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-purple-700" />
                    Equipment & Setup Requirements
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white border rounded-xl p-2">
                      <span className="text-slate-400 block text-[10px]">Chairs</span>
                      <span className="font-bold text-purple-950">{currentRequest.numChairs || '0'}</span>
                    </div>
                    <div className="bg-white border rounded-xl p-2">
                      <span className="text-slate-400 block text-[10px]">Tables</span>
                      <span className="font-bold text-purple-950">{currentRequest.numTables || '0'}</span>
                    </div>
                    <div className="bg-white border rounded-xl p-2">
                      <span className="text-slate-400 block text-[10px]">Podium</span>
                      <span className="font-bold">{currentRequest.podium || 'No'}</span>
                    </div>
                    <div className="bg-white border rounded-xl p-2">
                      <span className="text-slate-400 block text-[10px]">PA System</span>
                      <span className="font-bold">{currentRequest.paSystem || 'No'}</span>
                    </div>
                  </div>
                  {currentRequest.additionalInfo && (
                    <p className="text-xs text-slate-600 bg-white border rounded-xl p-2.5 mt-2">
                      <strong>Setup Notes:</strong> {currentRequest.additionalInfo}
                    </p>
                  )}
                </div>
              )}

              {/* Historical Notes & Internal Audit Log Box */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-purple-700" />
                    Historical Notes & Audit Log
                  </h4>
                  {noteMsg && (
                    <span className="text-xs font-bold text-emerald-600">{noteMsg}</span>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-700 max-h-44 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {currentRequest.approvalLog || 'No notes or audit entries recorded yet.'}
                </div>

                {/* Add Note Input Form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave an internal secretary note or coordination comment..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNoteText.trim()}
                    className="bg-[#6f31a0] hover:bg-purple-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post Note
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-purple-100 p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 bg-purple-50 text-[#6f31a0] rounded-full flex items-center justify-center mb-4 border border-purple-100 shadow-sm">
                <Calendar className="w-8 h-8 text-[#6f31a0]" />
              </div>
              <h3 className="text-lg font-black text-purple-950">No Activity Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Choose an activity from the list on the left to inspect facility setups, review equipment requirements, post coordination notes, or edit calendar events.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Interactive Calendar Schedule Editor Modal */}
      {showEditModal && currentRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-purple-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#6f31a0] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono bg-[#ffd760] text-purple-950 font-black px-2 py-0.5 rounded">
                  {currentRequest.requestId}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Edit Calendar Event & Schedule
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-purple-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCalendarSchedule} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {editSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3 rounded-xl font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {editSuccessMsg}
                </div>
              )}

              {editErrorMsg && (
                <div className="bg-red-50 border border-red-300 text-red-800 text-xs p-3 rounded-xl font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {editErrorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={editFormData.eventTitle}
                  onChange={(e) => setEditFormData({ ...editFormData, eventTitle: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <select
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none"
                  >
                    {DBHS_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Event Date</label>
                  <input
                    type="date"
                    value={editFormData.eventDate}
                    onChange={(e) => setEditFormData({ ...editFormData, eventDate: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Comma-Separated Recurring Dates
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-12-2026, 12-13-2026 or 2026-12-12, 2026-12-13"
                  value={editFormData.additionalDates}
                  onChange={(e) => setEditFormData({ ...editFormData, additionalDates: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Accepts US format (<code>12-13-2026</code>, <code>12/13/2026</code>) or standard format (<code>2026-12-13</code>). Google Calendar events will be created/updated/removed to match.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    value={editFormData.eventStartTime}
                    onChange={(e) => setEditFormData({ ...editFormData, eventStartTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    value={editFormData.eventEndTime}
                    onChange={(e) => setEditFormData({ ...editFormData, eventEndTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Batch Edit Toggle for Recurring Events */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.editAllRecurring}
                    onChange={(e) => setEditFormData({ ...editFormData, editAllRecurring: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-950">
                    Apply changes to all recurring dates at once
                  </span>
                </label>
                <p className="text-[11px] text-purple-700 mt-1 pl-5">
                  Synchronizes title, time range, location, and description across all linked calendar events.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Calendar Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.eventDescription}
                  onChange={(e) => setEditFormData({ ...editFormData, eventDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="bg-[#6f31a0] hover:bg-purple-800 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs shadow flex items-center gap-1.5 transition"
                >
                  {savingSchedule ? (
                    <span>Syncing Calendar...</span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Push Updates to Google Calendar
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
