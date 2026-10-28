import React from 'react';
import { User, LogOut, ShieldCheck, GraduationCap, Calendar } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const isStudent = user?.role === 'student';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      padding: '12px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand & Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            color: '#fff',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              AttendSmart <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>AI Face</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Student Attendance Monitoring System
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: isStudent ? '#eff6ff' : '#f0fdf4',
          color: isStudent ? '#1d4ed8' : '#15803d',
          border: `1px solid ${isStudent ? '#bfdbfe' : '#bbf7d0'}`
        }}>
          {isStudent ? <GraduationCap size={14} /> : <ShieldCheck size={14} />}
          <span>{isStudent ? 'STUDENT PORTAL' : 'TEACHER PORTAL'}</span>
        </div>
      </div>

      {/* Right Controls: Date & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Calendar size={14} color="#64748b" />
          <span>{todayFormatted}</span>
        </div>

        {/* User Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user?.face_image ? (
            <img
              src={user.face_image}
              alt={user.full_name}
              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6' }}
            />
          ) : (
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#e2e8f0',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
          )}

          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
              {user?.full_name || 'Guest User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {isStudent ? user?.roll_number : (user?.designation || user?.email)}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              color: '#64748b',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginLeft: '8px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = '#fecaca';
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.background = '#f8fafc';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
