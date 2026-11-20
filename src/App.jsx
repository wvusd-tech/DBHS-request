import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginGate from './components/LoginGate';
import TeacherDashboard from './components/TeacherDashboard';
import ApproverDashboard from './components/ApproverDashboard';
import OpsDashboard from './components/OpsDashboard';
import NewActivityModal from './components/NewActivityModal';
import { api } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' | 'approver' | 'ops'
  
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Check stored user on load
  useEffect(() => {
    const savedToken = localStorage.getItem('dbhs_id_token');
    const savedUser = localStorage.getItem('dbhs_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setIdToken(savedToken);
      } catch (e) {
        localStorage.removeItem('dbhs_user');
      }
    } else {
      // Auto-init with Kevin Wendland demo account for immediate zero-friction preview
      const defaultUser = {
        email: 'kwendland@wvusd.org',
        name: 'Kevin Wendland',
        roles: {
          isAdmin: true,
          isOpsSecretary: true,
          isApprover: true
        }
      };
      setCurrentUser(defaultUser);
      setIdToken('DEV_MOCK_kwendland@wvusd.org');
      localStorage.setItem('dbhs_user', JSON.stringify(defaultUser));
      localStorage.setItem('dbhs_id_token', 'DEV_MOCK_kwendland@wvusd.org');
    }
  }, []);

  // Fetch requests whenever user changes or on refresh
  const loadPortalData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await api.getPortalData(currentUser.email);
      if (data && data.requests) {
        setRequests(data.requests || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.warn('Could not load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPortalData();
    }
  }, [currentUser]);

  const handleLogin = (user, token) => {
    setCurrentUser(user);
    setIdToken(token);
    localStorage.setItem('dbhs_user', JSON.stringify(user));
    localStorage.setItem('dbhs_id_token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIdToken(null);
    localStorage.removeItem('dbhs_user');
    localStorage.removeItem('dbhs_id_token');
  };

  if (!currentUser) {
    return <LoginGate onLogin={handleLogin} />;
  }

  const pendingApproverCount = requests.filter(r => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-[#fbf9fd] text-slate-800 flex flex-col font-sans">
      
      {/* Universal DBHS Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        pendingCount={pendingApproverCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {activeTab === 'teacher' && (
          <TeacherDashboard
            requests={requests}
            currentUser={currentUser}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onRefresh={loadPortalData}
          />
        )}

        {activeTab === 'approver' && (
          <ApproverDashboard
            requests={requests}
            currentUser={currentUser}
            onRefresh={loadPortalData}
          />
        )}

        {activeTab === 'ops' && (
          <OpsDashboard
            requests={requests}
            currentUser={currentUser}
            onRefresh={loadPortalData}
          />
        )}

      </main>

      {/* Modal: New Activity Request */}
      <NewActivityModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        currentUser={currentUser}
        onSubmitSuccess={() => {
          loadPortalData();
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-6 text-center text-xs text-slate-400">
        <p className="font-semibold text-purple-950">Diamond Bar High School • Walnut Valley Unified School District</p>
        <p className="text-[11px] text-slate-400 mt-1">Activities Approval & Google Calendar Automation Ecosystem</p>
      </footer>

    </div>
  );
}
