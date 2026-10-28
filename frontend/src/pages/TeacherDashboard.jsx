import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Loader2,
  PlusCircle,
  Trash2,
  Eye,
  FileSpreadsheet,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import StatusBadge from '../components/StatusBadge';
import TeacherManualAttendanceModal from '../components/TeacherManualAttendanceModal';
import StudentDetailModal from '../components/StudentDetailModal';
import TeacherFaceScanner from '../components/TeacherFaceScanner';

export default function TeacherDashboard({ user, activeTab = 'records', onTabChange }) {
  const [dashboardData, setDashboardData] = useState(() => storage.getCachedTeacherData()?.data || null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(!dashboardData);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualInitialStudentId, setManualInitialStudentId] = useState(null);
  const [manualInitialSubjectId, setManualInitialSubjectId] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailStudentId, setSelectedDetailStudentId] = useState(null);

  const [subjectSummaryData, setSubjectSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Sync internal active view with activeTab prop
  const currentView = activeTab === 'scanner' ? 'scanner' :
                      activeTab === 'students' ? 'students' : 
                      activeTab === 'subjects' ? 'subject_summary' : 'records';

  const setView = (v) => {
    if (onTabChange) {
      if (v === 'scanner') onTabChange('scanner');
      else if (v === 'students') onTabChange('students');
      else if (v === 'subject_summary') onTabChange('subjects');
      else onTabChange('records');
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.teacher.getDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Fetch teacher dashboard error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const res = await api.teacher.getAttendanceRecords({
        search: searchTerm,
        subject_id: selectedSubject,
        date: selectedDate,
        status: selectedStatus,
        limit: 100
      });
      if (res.success) {
        setRecords(res.records);
      }
    } catch (err) {
      console.error('Fetch attendance records error:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchRecords();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSubject, selectedDate, selectedStatus]);

  const handleSubjectSummaryClick = async (subjectId) => {
    setSummaryLoading(true);
    setView('subject_summary');
    try {
      const res = await api.teacher.getSubjectSummary(subjectId);
      if (res.success) {
        setSubjectSummaryData(res);
      }
    } catch (err) {
      console.error('Fetch subject summary error:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete this attendance record for ${studentName}?`)) {
      return;
    }
    try {
      const res = await api.teacher.deleteAttendance(recordId);
      if (res.success) {
        setNotification({ type: 'success', message: 'Attendance record deleted successfully.' });
        fetchRecords();
        fetchDashboardStats();
      }
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to delete record.' });
    }
  };

  const openManualModal = (studentId = null, subjectId = null) => {
    setManualInitialStudentId(studentId);
    setManualInitialSubjectId(subjectId);
    setIsManualModalOpen(true);
  };

  const openStudentDossier = (studentId) => {
    setSelectedDetailStudentId(studentId);
    setIsDetailModalOpen(true);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSubject('all');
    setSelectedDate('');
    setSelectedStatus('all');
  };

  const exportToCSV = () => {
    if (!records.length) return;
    const headers = ['Roll Number', 'Student Name', 'Subject Code', 'Subject Name', 'Date', 'Time', 'Status', 'Verification Score'];
    const rows = records.map((r) => [
      `"${r.roll_number}"`,
      `"${r.student_name}"`,
      `"${r.subject_code}"`,
      `"${r.subject_name}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.status}"`,
      `"${r.verification_score || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Faculty_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = dashboardData?.stats || {
    total_students: 0,
    total_subjects: 0,
    today_attendance: 0,
    total_classes: 0,
    average_attendance: 0
  };
  const subjectsList = dashboardData?.subjects || [];
  const studentsList = dashboardData?.students || [];

  return (
    <div className="page-body">
      {/* Faculty Greeting Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              Faculty Attendance Portal
            </h2>
            <span className="badge badge-success">Live SQLite Sync</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '4px' }}>
            Logged in as <strong>{user?.full_name}</strong> ({user?.department || 'Computer Science & Engineering'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setView('scanner')}
            className="btn btn-primary btn-sm"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Camera size={15} />
            <span>Classroom Face Scanner</span>
          </button>

          <button
            onClick={() => openManualModal()}
            className="btn btn-secondary btn-sm"
          >
            <PlusCircle size={15} />
            <span>Manual Attendance Entry</span>
          </button>

          <button
            onClick={() => {
              fetchDashboardStats();
              fetchRecords();
            }}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh All Data</span>
          </button>

          <button onClick={exportToCSV} className="btn btn-success btn-sm">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`alert alert-${notification.type}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}

      {/* Summary Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setView('students')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{stats.total_students}</div>
            <div className="stat-sub">Click to view roster &rarr;</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => { setSelectedDate(stats.today_date || ''); setView('records'); }} style={{ cursor: 'pointer' }}>
          <div className="stat-icon success">
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Today's Attendance</div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {stats.today_attendance}
            </div>
            <div className="stat-sub">Face scans recorded today &rarr;</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => setView('subject_summary')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon purple">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Classes</div>
            <div className="stat-value">{stats.total_classes}</div>
            <div className="stat-sub">Across {stats.total_subjects} subjects &rarr;</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Average Attendance</div>
            <div className="stat-value" style={{ color: stats.average_attendance >= 75 ? '#059669' : '#d97706' }}>
              {stats.average_attendance}%
            </div>
            <div className="stat-sub">Batch cumulative rate</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Teacher Views */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setView('scanner')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            borderBottom: currentView === 'scanner' ? '2px solid #2563eb' : '2px solid transparent',
            color: currentView === 'scanner' ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: currentView === 'scanner' ? '#eff6ff' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          <Camera size={16} />
          <span>Classroom Face Scanner</span>
          <span style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '999px',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 700
          }}>
            LIVE
          </span>
        </button>

        <button
          onClick={() => setView('records')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: currentView === 'records' ? '2px solid #2563eb' : '2px solid transparent',
            color: currentView === 'records' ? '#1d4ed8' : '#64748b',
            background: currentView === 'records' ? '#eff6ff' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          Attendance Logs &amp; Filters ({records.length})
        </button>

        <button
          onClick={() => setView('students')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: currentView === 'students' ? '2px solid #2563eb' : '2px solid transparent',
            color: currentView === 'students' ? '#1d4ed8' : '#64748b',
            background: currentView === 'students' ? '#eff6ff' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          Student Performance Overview ({studentsList.length})
        </button>

        <button
          onClick={() => setView('subject_summary')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: currentView === 'subject_summary' ? '2px solid #2563eb' : '2px solid transparent',
            color: currentView === 'subject_summary' ? '#1d4ed8' : '#64748b',
            background: currentView === 'subject_summary' ? '#eff6ff' : 'transparent',
            borderRadius: '6px 6px 0 0'
          }}
        >
          Subject-Wise Analytics
        </button>
      </div>

      {/* VIEW 0: CLASSROOM FACE SCANNER */}
      {currentView === 'scanner' && (
        <TeacherFaceScanner
          subjects={subjectsList}
          onAttendanceMarked={() => {
            fetchDashboardStats();
            fetchRecords();
          }}
        />
      )}

      {/* VIEW 1: ATTENDANCE LOGS & FILTERS */}
      {currentView === 'records' && (
        <div className="card">
          {/* Filter Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Search Student</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Name or Roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Subject Filter</label>
              <select
                className="form-control form-control-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Date Filter</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Status</label>
              <select
                className="form-control form-control-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={clearAllFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Verification Method</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#2563eb' }} />
                      <div>Loading records...</div>
                    </td>
                  </tr>
                ) : records.length > 0 ? (
                  records.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span style={{ fontWeight: 600, color: '#1e40af' }}>{r.roll_number}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.course}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.subject_code}</span> - {r.subject_name}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} color="#64748b" />
                          <span>{r.date}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} color="#64748b" />
                          <span>{r.time}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={r.status} type="attendance" />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} color="#16a34a" />
                          <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                            {r.verification_score ? `${r.verification_score}` : 'Verified'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            title="Delete entry"
                            onClick={() => handleDeleteRecord(r.id, r.student_name)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '0.75rem'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No attendance records match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: STUDENT PERFORMANCE OVERVIEW */}
      {currentView === 'students' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Users size={20} color="#2563eb" />
              <span>Student Attendance Roster &amp; Shortage Tracking</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Minimum requirement: 75%
            </span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Classes Attended</th>
                  <th>Overall Percentage</th>
                  <th>Shortage Status</th>
                  <th>Face ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1e40af' }}>{st.roll_number}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {st.face_image ? (
                          <img
                            src={st.face_image}
                            alt={st.name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}>
                            {st.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{st.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{st.course}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{st.attended_classes}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}> / {st.total_classes}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(st.attendance_percentage, 100)}%`,
                              height: '100%',
                              background: st.is_shortage ? '#ef4444' : '#10b981'
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, color: st.is_shortage ? '#dc2626' : '#16a34a' }}>
                          {st.attendance_percentage}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={!st.is_shortage} type="eligibility" />
                    </td>
                    <td>
                      {st.face_registered ? (
                        <span className="badge badge-success">Registered</span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openStudentDossier(st.id)}
                          className="btn btn-secondary btn-sm"
                          title="View Complete Attendance Dossier"
                        >
                          <Eye size={13} />
                          <span>Dossier</span>
                        </button>

                        <button
                          onClick={() => openManualModal(st.id)}
                          className="btn btn-outline-primary btn-sm"
                          title="Manual Attendance Override"
                        >
                          <PlusCircle size={13} />
                          <span>Mark</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SUBJECT-WISE ANALYTICS */}
      {currentView === 'subject_summary' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BookOpen size={20} color="#2563eb" />
              <span>Select Subject to View Enrollment &amp; Attendance</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {subjectsList.map((sub) => (
              <div
                key={sub.id}
                onClick={() => handleSubjectSummaryClick(sub.id)}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: subjectSummaryData?.subject?.id === sub.id ? '2px solid #2563eb' : '1px solid var(--border)',
                  background: subjectSummaryData?.subject?.id === sub.id ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e40af' }}>{sub.code}</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '4px 0' }}>{sub.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Faculty: {sub.teacher_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>
                  {sub.total_classes} classes scheduled
                </div>
              </div>
            ))}
          </div>

          {summaryLoading && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <Loader2 size={24} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 8px' }} />
              <div>Loading subject details...</div>
            </div>
          )}

          {subjectSummaryData && !summaryLoading && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Enrolled Students in {subjectSummaryData.subject.code} - {subjectSummaryData.subject.name}
                </h3>
                <button
                  onClick={() => openManualModal(null, subjectSummaryData.subject.id)}
                  className="btn btn-primary btn-sm"
                >
                  <PlusCircle size={14} />
                  <span>Mark Attendance for this Course</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Student Name</th>
                      <th>Attended</th>
                      <th>Total</th>
                      <th>Percentage</th>
                      <th>Eligibility</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectSummaryData.students.map((st) => (
                      <tr key={st.student_id}>
                        <td style={{ fontWeight: 600, color: '#1e40af' }}>{st.roll_number}</td>
                        <td style={{ fontWeight: 600 }}>{st.name}</td>
                        <td>{st.attended_classes}</td>
                        <td>{st.total_classes}</td>
                        <td style={{ fontWeight: 700, color: st.is_shortage ? '#dc2626' : '#16a34a' }}>
                          {st.percentage}%
                        </td>
                        <td>
                          <StatusBadge status={!st.is_shortage} type="eligibility" />
                        </td>
                        <td>
                          <button
                            onClick={() => openManualModal(st.student_id, subjectSummaryData.subject.id)}
                            className="btn btn-outline-primary btn-sm"
                          >
                            <PlusCircle size={13} />
                            <span>Mark</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Attendance Modal */}
      <TeacherManualAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        students={studentsList}
        subjects={subjectsList}
        initialStudentId={manualInitialStudentId}
        initialSubjectId={manualInitialSubjectId}
        onAttendanceUpdated={() => {
          fetchDashboardStats();
          fetchRecords();
          if (subjectSummaryData?.subject?.id) {
            handleSubjectSummaryClick(subjectSummaryData.subject.id);
          }
        }}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        studentId={selectedDetailStudentId}
        onOpenManualAttendance={(stId) => openManualModal(stId)}
      />
    </div>
  );
}
