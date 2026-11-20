import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, Search, Filter, Calendar, Clock, MapPin, 
  ArrowRight, AlertCircle, Wrench, DollarSign, Check, X 
} from 'lucide-react';
import { DBHS_LOCATIONS } from '../constants/locations';
import ActivityDrawer from './ActivityDrawer';

export default function ApproverDashboard({ 
  requests = [], 
  currentUser, 
  onRefresh 
}) {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [locationFilter, setLocationFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Status filter
      if (statusFilter !== 'All') {
        if (r.status !== statusFilter) return false;
      }

      // Location filter
      if (locationFilter !== 'All') {
        if (r.location !== locationFilter) return false;
      }

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (r.requestId || '').toLowerCase().includes(q) ||
          (r.eventTitle || '').toLowerCase().includes(q) ||
          (r.requestingGroup || '').toLowerCase().includes(q) ||
          (r.advisorName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [requests, statusFilter, locationFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Approver Header Banner */}
      <div className="bg-white border border-purple-100 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              Location Approver Queue
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Reviewing as: <strong>{currentUser?.email}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-purple-950 mt-1 tracking-tight">
            Facility Activity Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Review equipment, set-up specifications, and dates. Approvals automatically push scheduled events directly to Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['Pending', 'Approved', 'Changes Requested', 'All'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                statusFilter === st
                  ? 'bg-[#6f31a0] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-purple-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-purple-700 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Filter Location:</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
          >
            <option value="All">All Campus Locations</option>
            {DBHS_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-80">
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
            <h3 className="text-sm font-bold text-slate-700">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">
              No requests currently match the selected "{statusFilter}" filter for {locationFilter === 'All' ? 'any location' : locationFilter}.
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
                    Review
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
