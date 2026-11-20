import React, { useState } from 'react';
import { 
  X, Calendar, Clock, MapPin, DollarSign, Wrench, 
  CheckCircle, XCircle, AlertCircle, ExternalLink, 
  FileText, History, MessageSquare, Send, Check,
  ChevronRight, ShieldCheck, ArrowRight, Sparkles
} from 'lucide-react';
import { api } from '../api';

const DEFAULT_CHAIN = [
  { step: 1, stageName: 'Activities Director', emailSource: 'cnorys@wvusd.org' },
  { step: 2, stageName: 'Venue / Location', emailSource: 'Location', isDynamic: true },
  { step: 3, stageName: 'Facilities & Operations', emailSource: 'mbromberg@wvusd.org' },
  { step: 4, stageName: 'Assistant Principal', emailSource: 'yliew@wvusd.org' },
  { step: 5, stageName: 'Principal / Final Sign-off', emailSource: 'jvanhorn@wvusd.org' }
];

export default function ActivityDrawer({ 
  request, 
  isOpen, 
  onClose, 
  onActionComplete, 
  currentUser, 
  isApproverView = false,
  approvalChain = []
}) {
  if (!isOpen || !request) return null;

  const [decisionNotes, setDecisionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const chain = (approvalChain && approvalChain.length > 0) ? approvalChain : DEFAULT_CHAIN;
  const currentStep = request.currentStep || 1;
  const rawStatus = String(request.status || '');
  const isPending = rawStatus.toLowerCase().includes('pending');
  const isApproved = rawStatus === 'Approved';
  const isDenied = rawStatus === 'Denied';
  const isChangesRequested = rawStatus === 'Changes Requested';

  // Authorization check
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = currentUser?.roles?.isAdmin || 
    userEmail.startsWith('kwendland') || 
    userEmail.startsWith('jwai') ||
    currentUser?.roles?.isOpsSecretary;

  const currentApproverStr = (request.currentApprover || '').toLowerCase();
  const isDirectApprover = currentApproverStr.includes(userEmail);
  const isVenueApprover = (currentUser?.locations || []).some(
    loc => loc.toLowerCase().trim() === (request.location || '').toLowerCase().trim()
  );
  const isAuthorizedForCurrentStep = isAdmin || isDirectApprover || (currentStep === 2 && isVenueApprover);

  // Status badge helper
  const getStatusBadge = (status) => {
    if (isApproved) {
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs">Approved & Synced</span>;
    }
    if (isDenied) {
      return <span className="bg-red-100 text-red-800 border border-red-300 font-bold px-3 py-1 rounded-full text-xs">Denied</span>;
    }
    if (isChangesRequested) {
      return <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs">Changes Requested</span>;
    }
    return (
      <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs">
        {status || 'Pending Approval'}
      </span>
    );
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

  const nextStageObj = currentStep < chain.length ? chain[currentStep] : null;

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
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Workflow Status</span>
              {getStatusBadge(request.status)}
            </div>
            <div className="sm:text-right">
              <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Master Calendar Sync</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                request.calendarSyncStatus === 'Synced'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border'
              }`}>
                {request.calendarSyncStatus === 'Synced' ? '✓ Synced to Google Calendar' : 'Pending Final Sign-off'}
              </span>
            </div>
          </div>

          {/* Multi-Step Approval Chain Stepper */}
          <div className="border border-purple-100 bg-gradient-to-b from-purple-50/40 to-white rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Sequential Approval Chain ({chain.length} Stages)
              </h4>
              {isApproved && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  All Stages Complete
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {chain.map((stepItem, idx) => {
                const stepNum = stepItem.step || (idx + 1);
                const isPast = isApproved || stepNum < currentStep;
                const isCurrent = isPending && stepNum === currentStep;
                const isFuture = !isApproved && stepNum > currentStep;
                const approverLabel = stepItem.isDynamic || stepItem.emailSource === 'Location'
                  ? (request.location ? `${request.location} Approver` : 'Venue Approver')
                  : stepItem.emailSource;

                return (
                  <div 
                    key={stepNum}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-purple-100/70 border-purple-300 ring-2 ring-purple-400/40 shadow-sm'
                        : isPast
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#6f31a0] text-white ring-2 ring-purple-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${
                            isCurrent ? 'text-purple-950' : isPast ? 'text-emerald-900' : 'text-slate-600'
                          }`}>
                            {stepItem.stageName}
                          </span>
                          {stepNum === chain.length && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                              Calendar Sync
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] block ${
                          isCurrent ? 'text-purple-700 font-medium' : 'text-slate-400'
                        }`}>
                          {approverLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isPast && (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Approved
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[11px] font-extrabold bg-[#ffd760] text-purple-950 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                          Awaiting Review
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-[11px] font-medium text-slate-400">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
              {request.isReoccurring === 'Yes' && (
                <p className="text-xs text-purple-700 font-bold mt-1">
                  Recurring Dates: {request.reoccurringDates}
                </p>
              )}
            </div>
          </div>

          {/* Event Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Event Description & Purpose
            </h4>
            <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl p-4 leading-relaxed">
              {request.eventDescription || 'No description provided.'}
            </p>
          </div>

          {/* Facility & Equipment Setup */}
          {request.setupRequired === 'Yes' && (
            <div className="border border-purple-200 rounded-2xl p-4 bg-purple-50/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Wrench className="w-4 h-4 text-purple-700" />
                Equipment & Setup Requirements
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Chairs</span>
                  <span className="font-bold">{request.numChairs || '0'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Tables</span>
                  <span className="font-bold">{request.numTables || '0'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">Podium</span>
                  <span className="font-bold">{request.podium || 'No'}</span>
                </div>
                <div className="bg-white border rounded-xl p-2.5">
                  <span className="text-slate-400 block text-[10px] uppercase">PA System</span>
                  <span className="font-bold">{request.paSystem || 'No'}</span>
                </div>
              </div>

              {request.additionalInfo && (
                <div className="bg-white border rounded-xl p-3 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Special Setup Instructions</span>
                  <p className="text-slate-700">{request.additionalInfo}</p>
                </div>
              )}

              {request.diagramUrl && (
                <a
                  href={request.diagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 bg-white border border-purple-200 rounded-xl px-3 py-2 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Setup Diagram File
                </a>
              )}
            </div>
          )}

          {/* Revenue Potential & Fundraiser Details */}
          {request.revenueFormNeeded === 'Yes' && (
            <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <DollarSign className="w-4 h-4 text-amber-700" />
                Revenue Potential / Fundraiser Details
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
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
          {isApproverView && isPending && (
            <div className="border border-purple-200 rounded-2xl p-5 bg-purple-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-700" />
                  Stage Decision: Step {currentStep} ({chain[currentStep - 1]?.stageName || 'Review'})
                </h4>
                {isAdmin && !isDirectApprover && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Admin Override
                  </span>
                )}
              </div>

              {!isAuthorizedForCurrentStep ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
                  <strong>Notice:</strong> This activity is currently waiting for review at <strong>Step {currentStep}: {chain[currentStep - 1]?.stageName}</strong> ({request.currentApprover}). Only assigned approvers for this step or administrators may submit a decision.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Decision Notes / Comments (Optional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add any specific conditions, notes, or instructions..."
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
                      className={`flex-1 font-bold py-2.5 px-4 rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5 ${
                        currentStep === chain.length
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#6f31a0] hover:bg-purple-800 text-white'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {currentStep === chain.length ? (
                        'Final Sign-off & Sync to Calendar'
                      ) : (
                        `Approve & Advance to Step ${currentStep + 1} (${nextStageObj?.stageName})`
                      )}
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
                </>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
