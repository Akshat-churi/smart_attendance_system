import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  ScanFace, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  UserCheck, 
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import AttendanceGauge from '../components/AttendanceGauge';
import WarningBanner from '../components/WarningBanner';
import StatusBadge from '../components/StatusBadge';
import FaceRegisterModal from '../components/FaceRegisterModal';

export default function StudentDashboard({ 
  user, 
  onUpdateUser, 
  activeTab = 'dashboard', 
  onTabChange,
  externalModalTrigger,
  onClearExternalModalTrigger
}) {
  const [data, setData] = useState(() => storage.getCachedStudentData()?.data || null);
  const [loading, setLoading] = useState(!data);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  // External trigger effect from sidebar
  useEffect(() => {
    if (externalModalTrigger === 'register') {
      setIsRegisterModalOpen(true);
      if (onClearExternalModalTrigger) onClearExternalModalTrigger();
    }
  }, [externalModalTrigger]);

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [historySubjectFilter, setHistorySubjectFilter] = useState('all');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else if (!data) setLoading(true);
    setError(null);

    try {
      const res = await api.student.getDashboard();
      if (res.success) {
        setData(res);
        if (onUpdateUser && res.profile) {
          onUpdateUser({
            ...user,
            face_registered: res.profile.face_registered,
            face_image: res.profile.face_image
          });
        }
      } else {
        setError(res.error || 'Failed to load student attendance data.');
      }
    } catch (err) {
      console.error('Fetch student dashboard error:', err);
      setError(err.message || 'Error connecting to backend server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const handleFaceRegistered = (faceImage) => {
    setLastNotification({
      type: 'success',
      message: 'Face ID successfully registered and saved to database!'
    });
    setIsRegisterModalOpen(false);
    fetchDashboardData(true);
  };

  const exportStudentHistoryCSV = () => {
    if (!recentHistory.length) return;
    const headers = ['Subject Code', 'Subject Name', 'Date', 'Time', 'Status', 'Verification Method', 'Biometric Score'];
    const rows = recentHistory.map((r) => [
      `"${r.subject_code}"`,
      `"${r.subject_name}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.status}"`,
      `"${r.verification_method || 'Face Recognition'}"`,
      `"${r.verification_score || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Attendance_${user?.roll_number || 'export'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <Loader2 size={36} className="animate-spin" color="#2563eb" />
        <div style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading Student Attendance Record...</div>
      </div>
    );
  }

  const profile = data?.profile || {};
  const stats = data?.stats || { overall_percentage: 0, total_classes: 0, attended_classes: 0, missed_classes: 0, is_warning: false };
  const subjectList = data?.subject_wise || [];
  const recentHistory = data?.recent_history || [];
  const todayMarkedIds = data?.today_marked_subject_ids || [];

  // Filtered history
  const filteredHistory = recentHistory.filter((item) => {
    const matchSearch = !historySearch || 
      item.subject_name.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.subject_code.toLowerCase().includes(historySearch.toLowerCase());
    const matchSubject = historySubjectFilter === 'all' || item.subject_code === historySubjectFilter;
    const matchDate = !historyDateFilter || item.date === historyDateFilter;
    return matchSearch && matchSubject && matchDate;
  });

  return (
    <div className="page-body">
      {/* Top Banner / Student Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {profile.face_image ? (
            <img
              src={profile.face_image}
              alt={profile.name}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            />
          ) : (
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.75rem',
              color: '#ffffff'
            }}>
              {profile.name ? profile.name.charAt(0) : 'S'}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                {profile.name || user?.full_name}
              </h2>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Roll: {profile.roll_number || user?.roll_number}
              </span>
              {profile.face_registered ? (
                <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Face ID Active
                </span>
              ) : (
                <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Face ID Pending
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#bfdbfe', marginTop: '4px' }}>
              {profile.course || 'B.Tech Computer Science'} &bull; {profile.semester || 'Semester 5'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Face ID Registration and Classroom Verification Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: profile.face_registered ? 'rgba(255,255,255,0.15)' : '#ffffff',
              color: profile.face_registered ? '#ffffff' : '#1e3a8a',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer'
            }}
          >
            <ScanFace size={18} />
            <span>{profile.face_registered ? 'Update Face ID' : 'Register Face ID'}</span>
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <ShieldCheck size={18} color="#93c5fd" />
            <span>Classroom Terminal Attendance Only</span>
          </div>
        </div>
      </div>

      {/* In-app Notification */}
      {lastNotification && (
        <div className={`alert alert-${lastNotification.type}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{lastNotification.message}</span>
          </div>
          <button onClick={() => setLastNotification(null)} style={{ color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* Mandatory <75% Attendance Warning Banner */}
      <WarningBanner
        percentage={stats.overall_percentage}
        attended={stats.attended_classes}
        total={stats.total_classes}
        course={profile.course}
      />

      {/* Sub-Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => onTabChange && onTabChange('dashboard')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: activeTab === 'dashboard' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'dashboard' ? '#1d4ed8' : '#64748b'
          }}
        >
          Dashboard Overview
        </button>

        <button
          onClick={() => onTabChange && onTabChange('subjects')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: activeTab === 'subjects' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'subjects' ? '#1d4ed8' : '#64748b'
          }}
        >
          My Enrolled Subjects ({subjectList.length})
        </button>

        <button
          onClick={() => onTabChange && onTabChange('history')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: activeTab === 'history' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'history' ? '#1d4ed8' : '#64748b'
          }}
        >
          Attendance History Logs ({recentHistory.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {(activeTab === 'dashboard' || !activeTab) && (
        <>
          {/* Stats Summary Cards */}
          <div className="stats-grid">
            {/* Attendance Rate Card with Circular Gauge */}
            <div className="stat-card">
              <AttendanceGauge percentage={stats.overall_percentage} size={84} strokeWidth={8} />
              <div className="stat-info">
                <div className="stat-label">Overall Attendance</div>
                <div className="stat-value">{stats.overall_percentage}%</div>
                <div className="stat-sub">
                  {stats.overall_percentage >= 75 ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>&ge; 75% Requirement Met</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Shortage Alert</span>
                  )}
                </div>
              </div>
            </div>

            {/* Total Conducted Classes */}
            <div className="stat-card">
              <div className="stat-icon primary">
                <BookOpen size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Total Classes</div>
                <div className="stat-value">{stats.total_classes}</div>
                <div className="stat-sub">Conducted across {subjectList.length} courses</div>
              </div>
            </div>

            {/* Classes Attended */}
            <div className="stat-card">
              <div className="stat-icon success">
                <UserCheck size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Classes Attended</div>
                <div className="stat-value" style={{ color: '#059669' }}>{stats.attended_classes}</div>
                <div className="stat-sub">Present through verification</div>
              </div>
            </div>

            {/* Classes Missed */}
            <div className="stat-card">
              <div className="stat-icon danger">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-label">Classes Missed</div>
                <div className="stat-value" style={{ color: '#dc2626' }}>{stats.missed_classes}</div>
                <div className="stat-sub">Absences recorded</div>
              </div>
            </div>
          </div>

          {/* Today's Schedule & Quick Action Cards */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div className="card-title">
                <Calendar size={20} color="#2563eb" />
                <span>Today's Course Lectures &amp; Status</span>
              </div>
              <span className="badge badge-info">{data?.today_date || 'Today'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {subjectList.map((sub) => {
                const isMarked = todayMarkedIds.includes(sub.subject_id);
                return (
                  <div
                    key={sub.subject_id}
                    style={{
                      border: isMarked ? '1px solid #a7f3d0' : '1px solid var(--border)',
                      background: isMarked ? '#f0fdf4' : '#ffffff',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.85rem' }}>{sub.code}</span>
                        {isMarked ? (
                          <span className="badge badge-success">
                            <CheckCircle size={12} /> Present Today
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <Clock size={12} /> Pending Today
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', marginTop: '4px' }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {sub.schedule} &bull; Faculty: {sub.teacher_name}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: sub.is_shortage ? '#dc2626' : '#16a34a' }}>
                        Attendance: {sub.percentage}%
                      </span>
                      {isMarked ? (
                        <span className="badge badge-success" style={{ padding: '4px 10px' }}>
                          <CheckCircle size={12} /> Present
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ padding: '4px 10px' }}>
                          <Clock size={12} /> Pending Scan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Subject Overview */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <div className="card-title">
                <BookOpen size={20} color="#2563eb" />
                <span>Subject-Wise Attendance Breakdown</span>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                className="btn btn-secondary btn-sm"
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Faculty</th>
                    <th>Total Classes</th>
                    <th>Attended</th>
                    <th>Attendance %</th>
                    <th>Eligibility Status</th>
                    <th>Verification Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectList.map((sub) => (
                    <tr key={sub.subject_id}>
                      <td><span style={{ fontWeight: 600, color: '#1e40af' }}>{sub.code}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sub.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.schedule}</div>
                      </td>
                      <td>{sub.teacher_name}</td>
                      <td>{sub.total_classes}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{sub.attended_classes}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}> / {sub.total_classes}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '70px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(sub.percentage, 100)}%`,
                                height: '100%',
                                background: sub.is_shortage ? '#ef4444' : '#10b981'
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 700, color: sub.is_shortage ? '#dc2626' : '#16a34a' }}>
                            {sub.percentage}%
                          </span>
                        </div>
                      </td>
                      <td><StatusBadge status={!sub.is_shortage} type="eligibility" /></td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={13} color="#2563eb" /> Faculty Terminal
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: MY ENROLLED SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BookOpen size={20} color="#2563eb" />
              <span>My Enrolled Courses &amp; Attendance Standing</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {subjectList.map((sub) => (
              <div
                key={sub.subject_id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, color: '#1e40af', fontSize: '1rem' }}>{sub.code}</span>
                    <StatusBadge status={!sub.is_shortage} type="eligibility" />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                    {sub.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Faculty: <strong>{sub.teacher_name}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Schedule: <strong>{sub.schedule}</strong>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Classes Attended:</span>
                    <strong>{sub.attended_classes} of {sub.total_classes}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b' }}>Percentage:</span>
                    <strong style={{ color: sub.is_shortage ? '#dc2626' : '#16a34a' }}>{sub.percentage}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(sub.percentage, 100)}%`,
                        height: '100%',
                        background: sub.is_shortage ? '#ef4444' : '#10b981'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#64748b',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}>
                  <ShieldCheck size={15} color="#2563eb" />
                  <span>Face Attendance Marked by Teacher in Classroom</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE HISTORY LOGS */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="#2563eb" />
              <span>Full Biometric Attendance History Logs</span>
            </div>
            <button onClick={exportStudentHistoryCSV} className="btn btn-success btn-sm">
              <Download size={14} />
              <span>Export Slip (CSV)</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
            background: '#f8fafc',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Course</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ paddingLeft: '30px' }}
                  placeholder="Subject or code..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter by Subject</label>
              <select
                className="form-control form-control-sm"
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjectList.map((s) => (
                  <option key={s.subject_id} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Filter Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={() => {
                  setHistorySearch('');
                  setHistorySubjectFilter('all');
                  setHistoryDateFilter('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Verification Method</th>
                  <th>Biometric Match Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{rec.subject_code}</span> - {rec.subject_name}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#64748b" />
                          <span>{rec.date}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#64748b" />
                          <span>{rec.time}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={rec.status} type="attendance" />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} color="#16a34a" />
                          <span>{rec.verification_method || 'Face Recognition'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          color: rec.verification_score >= 0.75 ? '#16a34a' : '#2563eb'
                        }}>
                          {rec.verification_score ? `${rec.verification_score} (Verified)` : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No attendance records match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <FaceRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegistered={handleFaceRegistered}
      />
    </div>
  );
}
