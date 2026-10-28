import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';

export default function LoginPage({ onLoginSuccess }) {
  const [role, setRole] = useState(storage.getLastRole() || 'student');
  const [username, setUsername] = useState('CS202601');
  const [password, setPassword] = useState('student123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMessage(null);
    if (newRole === 'student') {
      setUsername('CS202601');
      setPassword('student123');
    } else {
      setUsername('prof.sharma@college.edu');
      setPassword('teacher123');
    }
  };

  const fillDemoAccount = (accUsername, accPassword, accRole) => {
    setRole(accRole);
    setUsername(accUsername);
    setPassword(accPassword);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.auth.login(username, password, role);
      if (response.success) {
        storage.setSession({
          user: response.user,
          token: response.token
        });
        onLoginSuccess(response.user);
      } else {
        setErrorMessage(response.error || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #eff6ff 0%, #f8fafc 100%)',
      padding: '24px 16px'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: '#ffffff',
          padding: '32px 28px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <GraduationCap size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            AttendSmart Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#bfdbfe', marginTop: '6px' }}>
            AI-Powered Student Attendance & Face Verification
          </p>
        </div>

        {/* Form Container */}
        <div style={{ padding: '28px' }}>
          {/* Role Selector Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px'
          }}>
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: role === 'student' ? '#1e40af' : '#64748b',
                background: role === 'student' ? '#ffffff' : 'transparent',
                boxShadow: role === 'student' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <GraduationCap size={18} />
              <span>Student Login</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('teacher')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: role === 'teacher' ? '#1e40af' : '#64748b',
                background: role === 'teacher' ? '#ffffff' : 'transparent',
                boxShadow: role === 'teacher' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={18} />
              <span>Teacher Login</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                {role === 'student' ? 'Roll Number / Student ID' : 'Faculty Email / Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder={role === 'student' ? 'e.g., CS202601' : 'e.g., prof.sharma@college.edu'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '24px' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {role === 'student' ? 'Student' : 'Faculty'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
              <Sparkles size={15} color="#2563eb" />
              <span>TEST DEMO ACCOUNTS (1-CLICK AUTOFILL)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {/* Student 1 */}
              <button
                type="button"
                onClick={() => fillDemoAccount('CS202601', 'student123', 'student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong>Aarav Sharma</strong> (CS202601)
                  <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Good Attendance (85%) &bull; Ready for Face Registration</div>
                </div>
                <span className="badge badge-info">Select</span>
              </button>

              {/* Student 2 - Warning */}
              <button
                type="button"
                onClick={() => fillDemoAccount('CS202602', 'student123', 'student')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong>Priya Patel</strong> (CS202602)
                  <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                    ⚠️ Shortage Warning (59%) &lt; 75% Alert Demo
                  </div>
                </div>
                <span className="badge badge-danger">Select</span>
              </button>

              {/* Teacher 1 */}
              <button
                type="button"
                onClick={() => fillDemoAccount('prof.sharma@college.edu', 'teacher123', 'teacher')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong>Dr. Vikram Sharma</strong>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>HOD & Associate Professor (CSE)</div>
                </div>
                <span className="badge badge-success">Teacher</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
