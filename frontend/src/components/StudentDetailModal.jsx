import React, { useState, useEffect } from 'react';
import { User, X, BookOpen, Calendar, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Loader2, PlusCircle } from 'lucide-react';
import { api } from '../services/api';
import AttendanceGauge from './AttendanceGauge';
import StatusBadge from './StatusBadge';

export default function StudentDetailModal({ isOpen, onClose, studentId, onOpenManualAttendance }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      setError(null);
      api.teacher.getStudentDetail(studentId)
        .then((res) => {
          if (res.success) {
            setData(res);
          } else {
            setError(res.error || 'Failed to fetch student details.');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const student = data?.student || {};
  const subjects = data?.subjects || [];
  const records = data?.records || [];

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '750px', maxHeight: '92vh' }}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={22} color="#1d4ed8" />
            <span>Student Attendance Dossier</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={32} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 12px' }} />
              <div>Loading detailed student profile...</div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              {/* Profile Card */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {student.face_image ? (
                    <img
                      src={student.face_image}
                      alt={student.name}
                      style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3b82f6' }}
                    />
                  ) : (
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.5rem',
                      color: '#475569'
                    }}>
                      {student.name ? student.name.charAt(0) : 'S'}
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      {student.name}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                      Roll No: <strong>{student.roll_number}</strong> &bull; {student.course}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      {student.email} &bull; Face ID: {student.face_registered ? '✅ Registered' : '⚠️ Pending'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <AttendanceGauge percentage={student.overall_percentage || 0} size={76} strokeWidth={7} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Record</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                      {student.total_attended} / {student.total_classes}
                    </div>
                    <div>
                      <StatusBadge status={!student.is_shortage} type="eligibility" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action: Manual Mark Button for Teacher */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    onClose();
                    if (onOpenManualAttendance) {
                      onOpenManualAttendance(student.id);
                    }
                  }}
                >
                  <PlusCircle size={14} />
                  <span>Manual Attendance Entry for {student.name}</span>
                </button>
              </div>

              {/* Subject Breakdown */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                Course-Wise Attendance Breakdown
              </h4>
              <div className="table-responsive" style={{ marginBottom: '24px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Course Name</th>
                      <th>Attended</th>
                      <th>Total</th>
                      <th>Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.subject_id}>
                        <td style={{ fontWeight: 600, color: '#1e40af' }}>{s.code}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.attended}</td>
                        <td>{s.total}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: s.is_shortage ? '#dc2626' : '#16a34a' }}>
                            {s.percentage}%
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={!s.is_shortage} type="eligibility" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Attendance Entries */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>
                Recent Attendance Log (Past 30 Entries)
              </h4>
              <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Verification Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.subject_code} - {r.subject_name}</td>
                        <td>{r.date}</td>
                        <td>{r.time}</td>
                        <td><StatusBadge status={r.status} type="attendance" /></td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.verification_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
