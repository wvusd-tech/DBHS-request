import React, { useState } from 'react';
import { 
  Calendar, CheckCircle, FileText, Settings, User, LogOut, 
  ExternalLink, ShieldCheck, ChevronDown, Sparkles 
} from 'lucide-react';
import { DBHS_LOGO_URL } from '../constants/locations';
import { GAS_API_URL, setCustomGasUrl } from '../api';

export default function Navbar({ activeTab, setActiveTab, currentUser, onLogout, pendingCount = 0 }) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(GAS_API_URL || localStorage.getItem('DBHS_GAS_API_URL') || '');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSaveUrl = () => {
    setCustomGasUrl(tempUrl);
    setShowSettings(false);
    window.location.reload();
  };

  return (
    <header className="bg-[#6f31a0] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & School Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('teacher')}>
            <img 
              src={DBHS_LOGO_URL} 
              alt="Diamond Bar High School" 
              className="h-10 w-auto object-contain filter drop-shadow"
            />
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-wide text-white flex items-center gap-1.5">
                DBHS Activities <span className="text-[#ffd760] font-normal text-sm px-2 py-0.5 rounded-full bg-purple-900/60 border border-[#ffd760]/40">Portal</span>
              </span>
              <p className="text-xs text-purple-200">Diamond Bar High School • WVUSD</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'teacher'
                  ? 'bg-[#ffd760] text-purple-950 shadow'
                  : 'text-purple-100 hover:bg-purple-800/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Requests</span>
            </button>

            <button
              onClick={() => setActiveTab('approver')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'approver'
                  ? 'bg-[#ffd760] text-purple-950 shadow'
                  : 'text-purple-100 hover:bg-purple-800/60 hover:text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Location Approvals</span>
              {pendingCount > 0 && (
                <span className="ml-1 bg-amber-400 text-purple-950 text-xs font-black px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ops')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'ops'
                  ? 'bg-[#ffd760] text-purple-950 shadow'
                  : 'text-purple-100 hover:bg-purple-800/60 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar Dashboard</span>
            </button>
          </nav>

          {/* Right: API Settings & User Profile */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              title="Configure Apps Script Web App Endpoint"
              className="p-2 rounded-lg text-purple-200 hover:text-[#ffd760] hover:bg-purple-800/50 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-purple-900/60 hover:bg-purple-900 text-purple-100 px-3 py-1.5 rounded-lg border border-purple-400/30 text-sm font-medium transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#ffd760] text-purple-950 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {currentUser?.email ? currentUser.email.charAt(0) : 'U'}
                </div>
                <span className="hidden md:inline text-xs font-semibold max-w-[130px] truncate">
                  {currentUser?.email || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Signed In Account</p>
                    <p className="text-sm font-bold text-purple-950 truncate">{currentUser?.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {currentUser?.roles?.isAdmin && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">Admin</span>
                      )}
                      {currentUser?.roles?.isOpsSecretary && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">Ops Secretary</span>
                      )}
                      {currentUser?.roles?.isApprover && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Approver</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Switch User / Demo Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* GAS Endpoint Config Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white text-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-100">
            <h3 className="text-lg font-bold text-purple-950 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-700" />
              Apps Script Web App Endpoint
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Paste the deployed Google Apps Script Web App URL below (e.g. from <code>Deploy &gt; Web App</code> with access <em>Anyone within wvusd.org</em>).
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Web App Exec URL</label>
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full text-xs font-mono px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave empty to run in offline local client state mode.
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 text-sm font-semibold bg-[#6f31a0] hover:bg-[#5a2485] text-white rounded-lg shadow"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
