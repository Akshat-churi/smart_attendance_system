import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  BookOpen, 
  History, 
  Users, 
  FileSpreadsheet, 
  ScanFace,
  Sparkles,
  LogOut
} from 'lucide-react';

export default function Sidebar({ user, activeTab, onTabChange, onOpenAttendanceModal, onOpenRegisterModal, onSwitchDemoUser }) {
  const isStudent = user?.role === 'student';

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid #1e293b'
    }}>
      {/* Top Header / Role */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Portal Navigation
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
          {isStudent ? 'Student Space' : 'Faculty Space'}
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => onTabChange('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textAlign: 'left',
            color: activeTab === 'dashboard' ? '#ffffff' : '#94a3b8',
            background: activeTab === 'dashboard' ? 'var(--bg-sidebar-active)' : 'transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard Overview</span>
        </button>

        {isStudent ? (
          <>
            <button
              onClick={onOpenRegisterModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left',
                color: activeTab === 'register' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'register' ? 'var(--bg-sidebar-hover)' : 'transparent',
                marginTop: '6px'
              }}
            >
              <ScanFace size={18} />
              <span>Face Registration ID</span>
            </button>

            <button
              onClick={() => onTabChange('subjects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left',
                color: activeTab === 'subjects' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'subjects' ? 'var(--bg-sidebar-active)' : 'transparent'
              }}
            >
              <BookOpen size={18} />
              <span>My Subjects</span>
            </button>

            <button
              onClick={() => onTabChange('history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left',
                color: activeTab === 'history' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'history' ? 'var(--bg-sidebar-active)' : 'transparent'
              }}
            >
              <History size={18} />
              <span>Attendance History</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onTabChange('scanner')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 700,
                textAlign: 'left',
                color: '#ffffff',
                background: activeTab === 'scanner' 
                  ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' 
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                marginTop: '6px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Camera size={18} />
              <span>Classroom Face Scanner</span>
            </button>

            <button
              onClick={() => onTabChange('records')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left',
                color: activeTab === 'records' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'records' ? 'var(--bg-sidebar-active)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <FileSpreadsheet size={18} />
              <span>Attendance Records</span>
            </button>

            <button
              onClick={() => onTabChange('students')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left',
                color: activeTab === 'students' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'students' ? 'var(--bg-sidebar-active)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={18} />
              <span>Student Performance</span>
            </button>

            <button
              onClick={() => onTabChange('subjects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'left',
                color: activeTab === 'subjects' ? '#ffffff' : '#94a3b8',
                background: activeTab === 'subjects' ? 'var(--bg-sidebar-active)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={18} />
              <span>Subject Analytics</span>
            </button>
          </>
        )}
      </nav>

      {/* Quick Demo Switcher Widget for Easy Testing */}
      <div style={{
        margin: '12px',
        padding: '14px',
        background: '#1e293b',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, marginBottom: '8px' }}>
          <Sparkles size={14} />
          <span>SWITCH TEST ACCOUNT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
          <button
            onClick={() => onSwitchDemoUser('CS202601', 'student123', 'student')}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              background: user?.username === 'CS202601' ? '#2563eb' : '#334155',
              color: '#fff',
              textAlign: 'left'
            }}
          >
            👨‍🎓 Aarav (Student)
          </button>
          <button
            onClick={() => onSwitchDemoUser('CS202602', 'student123', 'student')}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              background: user?.username === 'CS202602' ? '#ef4444' : '#334155',
              color: '#fff',
              textAlign: 'left'
            }}
          >
            ⚠️ Priya (&lt;75% Warning)
          </button>
          <button
            onClick={() => onSwitchDemoUser('prof.sharma@college.edu', 'teacher123', 'teacher')}
            style={{
              padding: '6px 10px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              background: user?.username === 'prof.sharma@college.edu' ? '#10b981' : '#334155',
              color: '#fff',
              textAlign: 'left'
            }}
          >
            👨‍🏫 Dr. Sharma (Teacher)
          </button>
        </div>
      </div>
    </aside>
  );
}
