import React, { useState } from 'react';
import { 
  X, Calendar, Clock, MapPin, DollarSign, Wrench, 
  CheckCircle, XCircle, AlertCircle, ExternalLink, 
  FileText, History, MessageSquare, Send, Check 
} from 'lucide-react';
import { api } from '../api';

export default function ActivityDrawer({ 
  request, 
  isOpen, 
  onClose, 
  onActionComplete, 
  currentUser, 
  isApproverView = false 
}) {
  if (!isOpen || !request) return null;

  const [decisionNotes, setDecisionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  // Status badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs">Approved</span>;
      case 'Denied':
        return <span className="bg-red-100 text-red-800 border border-red-300 font-bold px-3 py-1 rounded-full text-xs">Denied</span>;
      case 'Changes Requested':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs">Changes Requested</span>;
      default:
        return <span className="bg-purple-100 text-purple-900 border border-purple-300 font-bold px-3 py-1 rounded-full text-xs">Pending Approval</span>;
    }
  };

  const handleDecision = async (actionType) => {
    setProcessing(true);
    setActionError('');
    try {
      await api.handleApprovalAction(request.requestId, actionType, decisionNotes, currentUser?.email);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      setActionError(err.message || 'Error processing action.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="bg-[#6f31a0] text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-[#ffd760] text-purple-950 px-2.5 py-0.5 rounded-full">
                {request.requestId}
              </span>
              <span className="text-xs text-purple-200">
                Submitted {request.timestamp ? new Date(request.timestamp).toLocaleDateString() : 'Recently'}
              </span>
            </div>
            <h2 className="text-xl font-black mt-1 text-white leading-tight">
              {request.eventTitle}
            </h2>
            <p className="text-xs text-purple-200">
              {request.requestingGroup} • Advisor: {request.advisorName} ({request.advisorEmail})
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-purple-200 hover:text-white hover:bg-purple-800/60 p-2 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Status Tracker */}
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Workflow Status</span>
              {getStatusBadge(request.status)}
            </div>
            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Calendar Sync</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                request.calendarSyncStatus === 'Synced'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border'
              }`}>
                {request.calendarSyncStatus || 'Not Synced'}
              </span>
            </div>
          </div>

          {/* Date, Time & Location Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
                <MapPin className="w-4 h-4 text-purple-700" />
                Location
              </div>
              <p className="text-sm font-black text-slate-800">{request.location}</p>
              <p className="text-xs text-slate-500 mt-1">Arrival: {request.arrivalTime || 'N/A'}</p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
                <Calendar className="w-4 h-4 text-purple-700" />
                Schedule
              </div>
              <p className="text-sm font-black text-slate-800">
                {request.eventDate} ({request.startTime} - {request.endTime})
              </p>
              {request.isReoccurring === 'Yes' && request.reoccurringDates && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-purple-800 block mb-1">Additional Recurring Dates:</span>
                  <div className="flex flex-wrap gap-1">
                    {request.reoccurringDates.split(',').map(s => s.trim()).filter(Boolean).map((d, i) => (
                      <span key={i} className="text-[11px] bg-purple-100 text-purple-950 font-mono font-bold px-2 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Event Description
            </h4>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed">
              {request.eventDescription || 'No description provided.'}
            </div>
          </div>

          {/* Operations & Set-Up Section (If applicable) */}
          {request.setupRequired === 'Yes' && (
            <div className="border border-purple-200 rounded-2xl p-5 bg-purple-50/30 space-y-3">
              <h4 className="text-sm font-black text-purple-950 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-700" />
                Operations & Equipment Set-Up Needs
              </h4>
              <p className="text-xs text-slate-600">
                <strong>Facility Duration:</strong> {request.facilityDuration || 'N/A'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700 pt-1">
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Chairs</span>
                  <span className="font-bold text-sm text-purple-950">{request.numChairs || '0'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Tables</span>
                  <span className="font-bold text-sm text-purple-950">{request.numTables || '0'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Podium</span>
                  <span className="font-bold">{request.podium || 'No'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Risers</span>
                  <span className="font-bold">{request.risers || 'No'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">PA System</span>
                  <span className="font-bold">{request.paSystem || 'No'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Projector</span>
                  <span className="font-bold">{request.projector || 'No'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Screen</span>
                  <span className="font-bold">{request.screen || 'No'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Microphones</span>
                  <span className="font-bold">{request.microphones || 'No'}</span>
                </div>
              </div>

              {request.additionalInfo && (
                <div className="bg-white border rounded-xl p-3 text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block mb-0.5">Additional Notes:</span>
                  {request.additionalInfo}
                </div>
              )}

              {request.diagramUrl && (
                <div className="pt-1">
                  <a
                    href={request.diagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-xl transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Uploaded Placement Diagram
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Revenue Potential Section (If applicable) */}
          {(request.revenueFormNeeded === 'Yes' || request.revenueFormSetup === 'Yes') && (
            <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50/40 space-y-3">
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-700" />
                Revenue Potential & Financial Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Account #</span>
                  <span className="font-bold">{request.accountNum || 'N/A'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Sales Start</span>
                  <span className="font-bold">{request.salesStartDate || 'N/A'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Sales End</span>
                  <span className="font-bold">{request.salesEndDate || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Gross Income</span>
                  <span className="font-bold text-purple-950">{request.projectedGrossIncome || '$0.00'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Expenses</span>
                  <span className="font-bold text-slate-700">{request.estimatedExpenses || '$0.00'}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Net Profit</span>
                  <span className="font-black text-emerald-900">{request.potentialNetProfit || '$0.00'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Historical Audit Trail */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Approval & System Audit Log
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {request.approvalLog || 'No log history recorded yet.'}
            </div>
          </div>

          {/* Approver Action Box (Visible in Approver Review) */}
          {isApproverView && request.status === 'Pending' && (
            <div className="border border-purple-200 rounded-2xl p-5 bg-purple-50/60 space-y-4">
              <h4 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-purple-700" />
                Approver Decision
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comments / Modifications Requested:
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter comments, notes, or specific requirements..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full text-xs p-3 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                />
              </div>

              {actionError && (
                <div className="text-xs text-red-600 font-semibold">{actionError}</div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('approve')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Sync Calendar
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('request_changes')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow transition"
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecision('deny')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow transition"
                >
                  Deny
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
