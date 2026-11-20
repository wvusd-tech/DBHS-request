import React, { useState } from 'react';
import { 
  X, Check, AlertCircle, Calendar, Clock, MapPin, 
  Upload, DollarSign, HelpCircle, ArrowRight, ArrowLeft,
  Info, CheckCircle2, FileText, Plus, Trash2
} from 'lucide-react';
import { DBHS_LOCATIONS, DBHS_RULES_AND_REGULATIONS } from '../constants/locations';
import { api } from '../api';

export default function NewActivityModal({ isOpen, onClose, currentUser, onSubmitSuccess }) {
  if (!isOpen) return null;

  // Step 1: Activity Details, Step 2: Set-Up (conditional), Step 3: Revenue (conditional)
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    submitterEmail: currentUser?.email || '',
    requestingGroup: '',
    advisorName: '',
    advisorEmail: currentUser?.email || '',
    eventDate: '',
    eventTitle: '',
    isReoccurring: 'No',
    reoccurringDates: '',
    eventDescription: '',
    location: 'Gym',
    customLocation: '',
    arrivalTime: '08:00 AM',
    startTime: '08:30 AM',
    endTime: '03:30 PM',
    setupRequired: 'No',
    revenueFormNeeded: 'No',
    
    // Set-up Fields
    facilityDuration: '',
    numChairs: '',
    numTables: '',
    podium: 'No',
    stage: 'No',
    risers: 'No',
    coffeePot: 'No',
    paSystem: 'No',
    projector: 'No',
    screen: 'No',
    microphones: 'No',
    stageUsage: 'N/A',
    mainCurtain: 'No',
    additionalInfo: '',
    diagramBase64: '',
    diagramFileName: '',
    revenueFormSetup: 'No',

    // Revenue Potential Fields
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
    rulesAcknowledged: false
  });

  // Recurring dates helper chips
  const [newDateInput, setNewDateInput] = useState('');

  const handleAddRecurringDate = () => {
    if (!newDateInput) return;
    const currentList = formData.reoccurringDates ? formData.reoccurringDates.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!currentList.includes(newDateInput)) {
      currentList.push(newDateInput);
      currentList.sort();
      setFormData({ ...formData, reoccurringDates: currentList.join(', ') });
    }
    setNewDateInput('');
  };

  const handleRemoveRecurringDate = (dateToRemove) => {
    const currentList = formData.reoccurringDates.split(',').map(s => s.trim()).filter(Boolean);
    const updated = currentList.filter(d => d !== dateToRemove);
    setFormData({ ...formData, reoccurringDates: updated.join(', ') });
  };

  // Diagram file upload to base64
  const handleDiagramUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
      alert('Please upload a JPG/JPEG image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormData({
        ...formData,
        diagramBase64: uploadEvent.target.result,
        diagramFileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  // Auto-calculation for Revenue Potential
  const updateRevenueField = (field, value) => {
    const updated = { ...formData, [field]: value };

    // Total net cost calculation: unitsPurchased * costEach
    const units = parseFloat(updated.unitsPurchased) || 0;
    const cost = parseFloat(String(updated.costEach).replace(/[^0-9.]/g, '')) || 0;
    if (field === 'unitsPurchased' || field === 'costEach') {
      const calcTotalNet = (units * cost).toFixed(2);
      if (calcTotalNet > 0) updated.totalNetCost = `$${calcTotalNet}`;
    }

    // Projected sales total: projectedSalesUnits * projectedSalesAmountEach
    const projUnits = parseFloat(updated.projectedSalesUnits) || 0;
    const projPrice = parseFloat(String(updated.projectedSalesAmountEach).replace(/[^0-9.]/g, '')) || 0;
    if (field === 'projectedSalesUnits' || field === 'projectedSalesAmountEach') {
      const calcProjTotal = (projUnits * projPrice).toFixed(2);
      if (calcProjTotal > 0) {
        updated.projectedSalesTotal = `$${calcProjTotal}`;
        updated.projectedGrossIncome = `$${calcProjTotal}`;
      }
    }

    // Potential net profit: Gross Income - Estimated Expenses
    const gross = parseFloat(String(updated.projectedGrossIncome).replace(/[^0-9.]/g, '')) || 0;
    const expenses = parseFloat(String(updated.estimatedExpenses).replace(/[^0-9.]/g, '')) || 0;
    if (field === 'projectedGrossIncome' || field === 'estimatedExpenses') {
      const calcProfit = (gross - expenses).toFixed(2);
      updated.potentialNetProfit = `$${calcProfit}`;
    }

    setFormData(updated);
  };

  // Step Navigation logic
  const handleNext = () => {
    setSubmitError('');
    if (currentStep === 1) {
      if (!formData.requestingGroup || !formData.advisorName || !formData.advisorEmail || !formData.eventDate || !formData.eventTitle || !formData.eventDescription) {
        setSubmitError('Please complete all required fields marked with * before continuing.');
        return;
      }
      if (!formData.rulesAcknowledged) {
        setSubmitError('You must acknowledge and agree to the DBHS Activity Rules & Regulations.');
        return;
      }
      if (formData.setupRequired === 'Yes') {
        setCurrentStep(2);
      } else if (formData.revenueFormNeeded === 'Yes') {
        setCurrentStep(3);
      } else {
        handleSubmitForm();
      }
    } else if (currentStep === 2) {
      if (!formData.facilityDuration) {
        setSubmitError('Please specify the total facility duration including setup and clean up.');
        return;
      }
      if (formData.revenueFormSetup === 'Yes' || formData.revenueFormNeeded === 'Yes') {
        setCurrentStep(3);
      } else {
        handleSubmitForm();
      }
    } else if (currentStep === 3) {
      handleSubmitForm();
    }
  };

  const handleBack = () => {
    setSubmitError('');
    if (currentStep === 3) {
      if (formData.setupRequired === 'Yes') {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmitForm = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        ...formData,
        location: formData.location === 'Other' && formData.customLocation ? formData.customLocation : formData.location
      };
      const result = await api.submitActivityRequest(payload);
      setSubmittedResult(result);
      if (onSubmitSuccess) onSubmitSuccess(result);
    } catch (err) {
      setSubmitError(err.message || 'Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-purple-100 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#6f31a0] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#ffd760] text-purple-950 text-xs font-black px-2 py-0.5 rounded-full uppercase">
                Activity Form
              </span>
              <span className="text-purple-200 text-xs">
                Step {currentStep} of {formData.setupRequired === 'Yes' ? (formData.revenueFormSetup === 'Yes' || formData.revenueFormNeeded === 'Yes' ? '3' : '2') : (formData.revenueFormNeeded === 'Yes' ? '2' : '1')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight text-white">
              DBHS Activities Request Form
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white hover:bg-purple-800/60 p-2 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">

          {/* Success Screen */}
          {submittedResult ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-purple-950">
                Request Submitted Successfully!
              </h3>
              <div className="inline-block bg-purple-50 border border-purple-200 rounded-2xl px-6 py-3">
                <span className="text-xs uppercase font-bold text-purple-600 block">Generated Request ID</span>
                <span className="text-2xl font-mono font-black text-purple-950">{submittedResult.requestId}</span>
              </div>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your request has been routed to the designated Location Approver (<strong>{submittedResult.currentApprover}</strong>). Confirmation emails have been sent to you and your advisor.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="bg-[#6f31a0] hover:bg-purple-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Rules & Regulations Notice Callout */}
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 text-xs text-purple-950">
                <div className="flex items-center gap-2 font-bold text-sm text-purple-900 mb-1.5">
                  <Info className="w-4 h-4 text-purple-700" />
                  Diamond Bar High School Activities Policy
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
                  {DBHS_RULES_AND_REGULATIONS.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* STEP 1: ACTIVITY DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Submitter Email *
                      </label>
                      <input
                        type="email"
                        value={formData.submitterEmail}
                        onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Requesting Group / Club *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Robotics Club, Drama Dept, ASB"
                        value={formData.requestingGroup}
                        onChange={(e) => setFormData({ ...formData, requestingGroup: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Advisor Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Advisor full name"
                        value={formData.advisorName}
                        onChange={(e) => setFormData({ ...formData, advisorName: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Advisor Email *
                      </label>
                      <input
                        type="email"
                        placeholder="advisor@wvusd.org"
                        value={formData.advisorEmail}
                        onChange={(e) => setFormData({ ...formData, advisorEmail: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        placeholder="Name of activity / event"
                        value={formData.eventTitle}
                        onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Primary Event Date *
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        required
                        className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Recurring Event Toggle & Date Chips */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-purple-950 block">Is this event recurring?</span>
                        <span className="text-[11px] text-slate-500">Will this activity take place on multiple dates?</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {['No', 'Yes'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({ ...formData, isReoccurring: opt })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              formData.isReoccurring === opt
                                ? 'bg-[#6f31a0] text-white shadow'
                                : 'bg-white border text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.isReoccurring === 'Yes' && (
                      <div className="pt-2 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Add Additional Recurring Dates:
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="date"
                            value={newDateInput}
                            onChange={(e) => setNewDateInput(e.target.value)}
                            className="text-xs px-3 py-1.5 border rounded-lg focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddRecurringDate}
                            className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Date
                          </button>
                        </div>
                        {formData.reoccurringDates ? (
                          <div className="flex flex-wrap gap-1.5">
                            {formData.reoccurringDates.split(',').map(s => s.trim()).filter(Boolean).map((d) => (
                              <span key={d} className="bg-purple-100 text-purple-900 border border-purple-300 text-xs font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                {d}
                                <button type="button" onClick={() => handleRemoveRecurringDate(d)} className="text-purple-700 hover:text-red-600">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No additional dates added yet.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location & Times */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full text-sm px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      >
                        {DBHS_LOCATIONS.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    {formData.location === 'Other' && (
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Specify Location *</label>
                        <input
                          type="text"
                          placeholder="Room # or location"
                          value={formData.customLocation}
                          onChange={(e) => setFormData({ ...formData, customLocation: e.target.value })}
                          className="w-full text-sm px-3 py-2 border rounded-xl focus:outline-none"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Arrival Time *</label>
                      <input
                        type="text"
                        placeholder="e.g. 7:30 AM"
                        value={formData.arrivalTime}
                        onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                        className="w-full text-sm px-3 py-2 border rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
                      <input
                        type="text"
                        placeholder="e.g. 8:30 AM"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full text-sm px-3 py-2 border rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">End Time *</label>
                      <input
                        type="text"
                        placeholder="e.g. 3:30 PM"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full text-sm px-3 py-2 border rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Event Description *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the nature of the activity, planned agenda, and participants..."
                      value={formData.eventDescription}
                      onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
                      required
                      className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  {/* Branching Checkbox Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-purple-950 block">Set Up Required? *</span>
                        <span className="text-[11px] text-slate-500">Chairs, tables, risers, PA, podium, etc.</span>
                      </div>
                      <div className="flex gap-1">
                        {['No', 'Yes'].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormData({ ...formData, setupRequired: opt })}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              formData.setupRequired === opt ? 'bg-[#6f31a0] text-white' : 'bg-white border text-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.setupRequired === 'No' && (
                      <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-purple-950 block">Revenue Potential Form Needed? *</span>
                          <span className="text-[11px] text-slate-500">Fundraiser or ticket sales activity?</span>
                        </div>
                        <div className="flex gap-1">
                          {['No', 'Yes'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, revenueFormNeeded: opt })}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                formData.revenueFormNeeded === opt ? 'bg-[#6f31a0] text-white' : 'bg-white border text-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Policy Acknowledgement Checkbox */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.rulesAcknowledged}
                        onChange={(e) => setFormData({ ...formData, rulesAcknowledged: e.target.checked })}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        I have read and agree to follow all DBHS rules, 3-week advance submission timelines, custodial cleanup agreements, and equipment liability requirements.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: OPERATIONS, AV & THEATER SET-UP */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 font-bold">
                    Section 2: Operations, AV & Theater Equipment Setup
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total duration of facility use including set up and clean up *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7:00 am - 5:30 pm"
                      value={formData.facilityDuration}
                      onChange={(e) => setFormData({ ...formData, facilityDuration: e.target.value })}
                      required
                      className="w-full text-sm px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Number of Chairs</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.numChairs}
                        onChange={(e) => setFormData({ ...formData, numChairs: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Number of Tables</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.numTables}
                        onChange={(e) => setFormData({ ...formData, numTables: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Podium</label>
                      <select
                        value={formData.podium}
                        onChange={(e) => setFormData({ ...formData, podium: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Risers</label>
                      <select
                        value={formData.risers}
                        onChange={(e) => setFormData({ ...formData, risers: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stage</label>
                      <select
                        value={formData.stage}
                        onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stage Usage</label>
                      <select
                        value={formData.stageUsage}
                        onChange={(e) => setFormData({ ...formData, stageUsage: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="N/A">N/A</option>
                        <option value="1/2 Stage">1/2 Stage</option>
                        <option value="Full Stage">Full Stage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Main Curtain</label>
                      <select
                        value={formData.mainCurtain}
                        onChange={(e) => setFormData({ ...formData, mainCurtain: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Coffee Pot</label>
                      <select
                        value={formData.coffeePot}
                        onChange={(e) => setFormData({ ...formData, coffeePot: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {/* AV & Theater Items */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Portable PA System</label>
                      <select
                        value={formData.paSystem}
                        onChange={(e) => setFormData({ ...formData, paSystem: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Projector</label>
                      <select
                        value={formData.projector}
                        onChange={(e) => setFormData({ ...formData, projector: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Screen</label>
                      <select
                        value={formData.screen}
                        onChange={(e) => setFormData({ ...formData, screen: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Microphones</label>
                      <select
                        value={formData.microphones}
                        onChange={(e) => setFormData({ ...formData, microphones: e.target.value })}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Additional Information / Setup Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions, electrical cord needs, sound booth technician notes..."
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      className="w-full text-sm px-3 py-1.5 border rounded-xl"
                    />
                  </div>

                  {/* Diagram Upload */}
                  <div className="border border-dashed border-purple-200 rounded-2xl p-4 bg-purple-50/40 text-center">
                    <Upload className="w-6 h-6 text-purple-700 mx-auto mb-1.5" />
                    <label className="text-xs font-bold text-purple-950 block">
                      Upload Facility Placement Diagram (JPG / JPEG)
                    </label>
                    <span className="text-[11px] text-slate-500 block mb-2">
                      Upload image showing table, chair, riser placement. (HEIC files not supported).
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,image/jpeg"
                      onChange={handleDiagramUpload}
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-900 hover:file:bg-purple-200 cursor-pointer"
                    />
                    {formData.diagramFileName && (
                      <div className="mt-2 text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Attached: {formData.diagramFileName}
                      </div>
                    )}
                  </div>

                  {/* Revenue check in Set-Up section */}
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-950 block">Revenue Potential Form Required? (Set-Up) *</span>
                      <span className="text-[11px] text-slate-500">Will money or tickets be sold for this event?</span>
                    </div>
                    <div className="flex gap-1">
                      {['No', 'Yes'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({ ...formData, revenueFormSetup: opt })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            formData.revenueFormSetup === opt ? 'bg-[#6f31a0] text-white' : 'bg-white border text-slate-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: REVENUE POTENTIAL FORM */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-bold flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-700" />
                    Section 3: Revenue Potential & Financial Projections
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account #</label>
                      <input
                        type="text"
                        placeholder="e.g. ACT-1234"
                        value={formData.accountNum}
                        onChange={(e) => updateRevenueField('accountNum', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sales Start Date *</label>
                      <input
                        type="date"
                        value={formData.salesStartDate}
                        onChange={(e) => updateRevenueField('salesStartDate', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sales End Date *</label>
                      <input
                        type="date"
                        value={formData.salesEndDate}
                        onChange={(e) => updateRevenueField('salesEndDate', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Units Purchased</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.unitsPurchased}
                        onChange={(e) => updateRevenueField('unitsPurchased', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Cost Each</label>
                      <input
                        type="text"
                        placeholder="$0.00"
                        value={formData.costEach}
                        onChange={(e) => updateRevenueField('costEach', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Total Net Cost (Calc)</label>
                      <input
                        type="text"
                        value={formData.totalNetCost}
                        onChange={(e) => updateRevenueField('totalNetCost', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl bg-slate-50 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wide block mb-2">Projected Sales</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Projected Units</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={formData.projectedSalesUnits}
                          onChange={(e) => updateRevenueField('projectedSalesUnits', e.target.value)}
                          className="w-full text-sm px-3 py-1.5 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Sales Amount Each</label>
                        <input
                          type="text"
                          placeholder="$0.00"
                          value={formData.projectedSalesAmountEach}
                          onChange={(e) => updateRevenueField('projectedSalesAmountEach', e.target.value)}
                          className="w-full text-sm px-3 py-1.5 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Total Projected Sales (Calc)</label>
                        <input
                          type="text"
                          value={formData.projectedSalesTotal}
                          onChange={(e) => updateRevenueField('projectedSalesTotal', e.target.value)}
                          className="w-full text-sm px-3 py-1.5 border rounded-xl bg-slate-50 font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gross Income</label>
                      <input
                        type="text"
                        value={formData.projectedGrossIncome}
                        onChange={(e) => updateRevenueField('projectedGrossIncome', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Expenses</label>
                      <input
                        type="text"
                        placeholder="$0.00"
                        value={formData.estimatedExpenses}
                        onChange={(e) => updateRevenueField('estimatedExpenses', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-800 mb-1">Potential Net Profit</label>
                      <input
                        type="text"
                        value={formData.potentialNetProfit}
                        onChange={(e) => updateRevenueField('potentialNetProfit', e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border border-emerald-300 rounded-xl bg-emerald-50 text-emerald-900 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer Controls */}
        {!submittedResult && (
          <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="bg-[#6f31a0] hover:bg-purple-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <span>
                      {currentStep === 3 || 
                       (currentStep === 2 && formData.revenueFormSetup !== 'Yes' && formData.revenueFormNeeded !== 'Yes') ||
                       (currentStep === 1 && formData.setupRequired !== 'Yes' && formData.revenueFormNeeded !== 'Yes') 
                        ? 'Submit Request' 
                        : 'Continue'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
