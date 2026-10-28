import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

export default function App() {
  const [session, setSession] = useState(() => storage.getSession());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalTrigger, setModalTrigger] = useState(null); // 'attendance' | 'register' | null

  // Check session validity or fetch me on boot
  useEffect(() => {
    if (session?.token) {
      api.auth.me()
        .then((res) => {
          if (res.success && res.user) {
            setSession((prev) => ({ ...prev, user: res.user }));
            storage.setSession({ ...session, user: res.user });
          }
        })
        .catch(() => {
          // Keep cached session for smooth UX
        });
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setSession(storage.getSession());
    setActiveTab(user.role === 'teacher' ? 'scanner' : 'dashboard');
  };

  const handleLogout = () => {
    storage.clearSession();
    setSession(null);
  };

  const handleUpdateUser = (updatedUser) => {
    const currentSession = storage.getSession();
    if (currentSession) {
      const newSession = { ...currentSession, user: updatedUser };
      storage.setSession(newSession);
      setSession(newSession);
    }
  };

  // Quick Switcher handler for paired evaluation
  const handleSwitchDemoUser = async (username, password, role) => {
    try {
      const response = await api.auth.login(username, password, role);
      if (response.success) {
        storage.setSession({
          user: response.user,
          token: response.token
        });
        setSession(storage.getSession());
        setActiveTab(role === 'teacher' ? 'scanner' : 'dashboard');
      }
    } catch (err) {
      console.error('Demo switcher error:', err);
    }
  };

  if (!session?.token || !session?.user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const user = session.user;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAttendanceModal={() => setModalTrigger('attendance')}
        onOpenRegisterModal={() => setModalTrigger('register')}
        onSwitchDemoUser={handleSwitchDemoUser}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar user={user} onLogout={handleLogout} />

        <main style={{ flex: 1 }}>
          {user.role === 'student' ? (
            <StudentDashboard
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onUpdateUser={handleUpdateUser}
              externalModalTrigger={modalTrigger}
              onClearExternalModalTrigger={() => setModalTrigger(null)}
            />
          ) : (
            <TeacherDashboard
              user={user}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}
