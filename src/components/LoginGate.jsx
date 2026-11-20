import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { DBHS_LOGO_URL } from '../constants/locations';

export default function LoginGate({ onLogin }) {
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  const demoAccounts = [
    { email: 'kwendland@wvusd.org', role: 'Ops Secretary & District Admin', label: 'Kevin Wendland (Full Access)' },
    { email: 'athletics@wvusd.org', role: 'Location Approver', label: 'Gym & Stadium Approver' },
    { email: 'theatertech@wvusd.org', role: 'Location Approver', label: 'Theater Approver' },
    { email: 'advisor@wvusd.org', role: 'Club Advisor', label: 'Staff Submitter' }
  ];

  const handleSelectDemo = (email) => {
    onLogin({
      email,
      name: email.split('@')[0],
      roles: {
        isAdmin: email.includes('kwendland'),
        isOpsSecretary: email.includes('kwendland'),
        isApprover: true
      }
    }, `DEV_MOCK_${email}`);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const cleanEmail = customEmail.trim().toLowerCase();
    onLogin({
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      roles: {
        isAdmin: cleanEmail.includes('kwendland'),
        isOpsSecretary: cleanEmail.includes('kwendland') || cleanEmail.includes('secretary'),
        isApprover: true
      }
    }, `DEV_MOCK_${cleanEmail}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4a1e6d] via-[#6f31a0] to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-purple-100">
        
        {/* Header Branding */}
        <div className="text-center">
          <img 
            src={DBHS_LOGO_URL} 
            alt="DBHS Brahmas" 
            className="h-16 w-auto mx-auto object-contain filter drop-shadow-md"
          />
          <h1 className="text-2xl font-black text-purple-950 mt-4 tracking-tight">
            DBHS Activities Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Activity Request Approval & Google Calendar Synchronization
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mt-8">
          <label className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-4 h-4 text-[#ffd760] fill-[#ffd760]" />
            Quick Demo Accounts
          </label>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleSelectDemo(acc.email)}
                className="w-full text-left p-3 rounded-xl border border-purple-100 hover:border-purple-300 bg-purple-50/50 hover:bg-purple-50 transition group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-purple-950 group-hover:text-purple-700">
                    {acc.label}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {acc.email} • <span className="text-purple-600 font-semibold">{acc.role}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Email Input */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <form onSubmit={handleCustomSubmit}>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Or Sign In with WVUSD Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setError('');
                }}
                placeholder="user@wvusd.org"
                className="flex-1 text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#6f31a0] hover:bg-purple-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-md"
              >
                Sign In
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </form>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-6">
          Authorized Diamond Bar High School Staff & Operations Portal
        </p>
      </div>
    </div>
  );
}
