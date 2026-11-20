import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, Search, Filter, Calendar, Clock, MapPin, 
  ArrowRight, AlertCircle, Wrench, DollarSign, Check, X,
  ShieldCheck, Inbox, CheckSquare, RotateCcw
} from 'lucide-react';
import { DBHS_LOCATIONS } from '../constants/locations';
import ActivityDrawer from './ActivityDrawer';

// Helper to format event date to "Month Year" (e.g. "December 2026")
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

export default function ApproverDashboard({ 
  requests = [], 
  currentUser, 
  onRefresh 
}) {
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Approved' | 'Changes Requested' | 'All'
  const [locationFilter, setLocationFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // 1. Determine approver's assigned locations
  const userLocations = useMemo(() => {
    return (currentUser?.locations || []).map(l => l.trim());
  }, [currentUser]);

  const isAreaRestricted = !currentUser?.roles?.isAdmin && userLocations.length > 0;

  // Filter requests strictly to approver's locations first
  const scopedRequests = useMemo(() => {
    return requests.filter(r => {
      if (!isAreaRestricted) return true;
      const reqLoc = (r.location || '').toLowerCase().trim();
      return userLocations.some(ul => ul.toLowerCase().trim() === reqLoc);
    });
  }, [requests, isAreaRestricted, userLocations]);

  // Extract distinct months for the month dropdown filter
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    scopedRequests.forEach(r => {
      const m = getMonthYearString(r.eventDateRaw || r.eventDate);
      if (m) monthsSet.add(m);
    });
    return Array.from(monthsSet);
  }, [scopedRequests]);

  // Calculate counts for tabs
  const counts = useMemo(() => {
    return {
      pending: scopedRequests.filter(r => r.status === 'Pending').length,
      approved: scopedRequests.filter(r => r.status === 'Approved').length,
      changes: scopedRequests.filter(r => r.status === 'Changes Requested').length,
      all: scopedRequests.length
    };
  }, [scopedRequests]);

  // Filter down by active tab, location dropdown, month dropdown, and search query
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter(r => {
      // Tab filter (Pending vs Approved vs Changes vs All)
      if (activeTab === 'Pending' && r.status !== 'Pending') return false;
      if (activeTab === 'Approved' && r.status !== 'Approved') return false;
      if (activeTab === 'Changes Requested' && r.status !== 'Changes Requested') return false;

      // Location filter
      if (locationFilter !== 'All') {
        if ((r.location || '').toLowerCase() !== locationFilter.toLowerCase()) return false;
      }

      // Month filter
      if (monthFilter !== 'All') {
        const m = getMonthYearString(r.eventDateRaw || r.eventDate);
        if (m !== monthFilter) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (r.requestId || '').toLowerCase().includes(q) ||
          (r.eventTitle || '').toLowerCase().includes(q) ||
          (r.requestingGroup || '').toLowerCase().includes(q) ||
          (r.advisorName || '').toLowerCase().includes(q) ||
          (r.location || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [scopedRequests, activeTab, locationFilter, monthFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Approver Header Banner */}
      <div className="bg-white border border-purple-100 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Location Approver Queue
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Reviewing as: <strong>{currentUser?.email}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-purple-950 mt-1.5 tracking-tight">
              Facility & Location Approvals
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              {isAreaRestricted ? (
                <>Assigned Area Review: <strong className="text-purple-900">{userLocations.join(', ')}</strong></>
              ) : (
                'Review equipment, set-up specifications, and dates across all DBHS campus locations.'
              )}
            </p>
          </div>

          {/* Metric Summary Cards / Clickable Quick Toggles */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('Pending')}
              className={`p-3 rounded-2xl border text-left transition ${
                activeTab === 'Pending'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/50 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-amber-50/50'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Review</span>
              <span className="text-xl font-black text-amber-900">{counts.pending}</span>
            </button>

            <button
              onClick={() => setActiveTab('Approved')}
              className={`p-3 rounded-2xl border text-left transition ${
                activeTab === 'Approved'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/50 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-emerald-50/50'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Approved</span>
              <span className="text-xl font-black text-emerald-900">{counts.approved}</span>
            </button>

            <button
              onClick={() => setActiveTab('Changes Requested')}
              className={`p-3 rounded-2xl border text-left transition ${
                activeTab === 'Changes Requested'
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/50 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-purple-50/50'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Needs Changes</span>
              <span className="text-xl font-black text-purple-950">{counts.changes}</span>
            </button>
          </div>
        </div>

        {/* Separated Primary Tabs (Pending vs Approved vs All) */}
        <div className="flex border-b border-slate-200 mt-6 -mb-2 space-x-6">
          <button
            onClick={() => setActiveTab('Pending')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'Pending'
                ? 'border-[#6f31a0] text-[#6f31a0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Pending Approvals</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeTab === 'Pending' ? 'bg-[#ffd760] text-purple-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('Approved')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'Approved'
                ? 'border-[#6f31a0] text-[#6f31a0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Approved History</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeTab === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('Changes Requested')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'Changes Requested'
                ? 'border-[#6f31a0] text-[#6f31a0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Changes Requested</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeTab === 'Changes Requested' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {counts.changes}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('All')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'All'
                ? 'border-[#6f31a0] text-[#6f31a0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>All Requests ({counts.all})</span>
          </button>
        </div>

      </div>

      {/* Filter and Search Bar with Month Dropdown */}
      <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          {/* Location Dropdown */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
            >
              <option value="All">
                {isAreaRestricted ? `All Assigned Areas (${userLocations.join(', ')})` : 'All Campus Locations'}
              </option>
              {(isAreaRestricted ? userLocations : DBHS_LOCATIONS).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Month Dropdown */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-700 shrink-0" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
            >
              <option value="All">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request #, title, advisor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Requests Queue */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No requests to display</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently no "{activeTab}" activities in {locationFilter === 'All' ? 'your assigned areas' : locationFilter} {monthFilter !== 'All' ? `for ${monthFilter}` : ''}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div
                key={req.requestId}
                onClick={() => setSelectedRequest(req)}
                className="p-5 hover:bg-purple-50/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md">
                      {req.requestId}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {req.requestingGroup}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Advisor: {req.advisorName}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-purple-950 group-hover:text-purple-700 transition">
                    {req.eventTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-purple-900">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      {req.location}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      {req.eventDate}
                      {req.isReoccurring === 'Yes' && ' (+ recurring dates)'}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      {req.startTime} - {req.endTime}
                    </span>
                    {req.setupRequired === 'Yes' && (
                      <span className="flex items-center gap-1 text-[11px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                        <Wrench className="w-3 h-3" />
                        Setup Req
                      </span>
                    )}
                    {req.revenueFormNeeded === 'Yes' && (
                      <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                        <DollarSign className="w-3 h-3" />
                        Revenue Form
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    req.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : req.status === 'Denied'
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : req.status === 'Changes Requested'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-purple-100 text-purple-900 border border-purple-200'
                  }`}>
                    {req.status}
                  </span>

                  <button className="bg-[#6f31a0] group-hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1">
                    {req.status === 'Pending' ? 'Review & Decide' : 'View Details'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Drawer */}
      <ActivityDrawer
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        currentUser={currentUser}
        isApproverView={true}
        onActionComplete={onRefresh}
      />
    </div>
  );
}
