import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Calendar, MapPin, Clock, ArrowRight, 
  FileText, CheckCircle2, AlertCircle, Sparkles, Filter 
} from 'lucide-react';
import ActivityDrawer from './ActivityDrawer';

export default function TeacherDashboard({ 
  requests = [], 
  currentUser, 
  onOpenNewModal, 
  onRefresh,
  approvalChain = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Filter requests for teacher (or show all if admin/tester)
  const myRequests = useMemo(() => {
    return requests.filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.requestId || '').toLowerCase().includes(q) ||
        (r.eventTitle || '').toLowerCase().includes(q) ||
        (r.requestingGroup || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => String(r.status || '').toLowerCase().includes('pending')).length,
      approved: requests.filter(r => r.status === 'Approved').length,
      changes: requests.filter(r => r.status === 'Changes Requested').length
    };
  }, [requests]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-[#6f31a0] to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="bg-[#ffd760] text-purple-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Staff & Club Advisor Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-white">
            Activities Request Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-xl">
            Submit on-campus facility, equipment, and event requests. Approvals automatically sync to the DBHS master activities calendar.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          className="bg-[#ffd760] hover:bg-amber-300 text-purple-950 font-black px-6 py-3.5 rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 shrink-0"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          Submit New Activity
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Total Activities</span>
          <span className="text-2xl font-black text-purple-950">{stats.total}</span>
        </div>
        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm">
          <span className="text-xs uppercase font-bold text-amber-600 block mb-1">Pending Approval</span>
          <span className="text-2xl font-black text-amber-600">{stats.pending}</span>
        </div>
        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm">
          <span className="text-xs uppercase font-bold text-emerald-600 block mb-1">Approved & Synced</span>
          <span className="text-2xl font-black text-emerald-700">{stats.approved}</span>
        </div>
        <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm">
          <span className="text-xs uppercase font-bold text-amber-800 block mb-1">Changes Requested</span>
          <span className="text-2xl font-black text-amber-900">{stats.changes}</span>
        </div>
      </div>

      {/* Search & Request List */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
        
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="font-bold text-base text-purple-950 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700" />
            Submitted Activity Requests
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, ID, group, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Requests List */}
        {myRequests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Calendar className="w-12 h-12 text-purple-200 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No activities found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Get started by submitting your first club or department activity request using the button above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myRequests.map((req) => (
              <div
                key={req.requestId}
                onClick={() => setSelectedRequest(req)}
                className="p-4 sm:p-5 hover:bg-purple-50/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md">
                      {req.requestId}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {req.requestingGroup}
                    </span>
                    {req.setupRequired === 'Yes' && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                        Set-Up Req
                      </span>
                    )}
                    {req.revenueFormNeeded === 'Yes' && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        Revenue Potential
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-purple-950 group-hover:text-purple-700 transition">
                    {req.eventTitle}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      {req.eventDate}
                      {req.isReoccurring === 'Yes' && ' (+ recurring)'}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      {req.startTime} - {req.endTime}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      {req.location}
                    </span>
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
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Detail Drawer */}
      <ActivityDrawer
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        currentUser={currentUser}
        approvalChain={approvalChain}
        onActionComplete={onRefresh}
      />
    </div>
  );
}
