import React, { useState, useEffect } from 'react';
import { UserCheck, X, Calendar, BookOpen, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function TeacherManualAttendanceModal({ isOpen, onClose, students = [], subjects = [], onAttendanceUpdated, initialStudentId = null, initialSubjectId = null }) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('Present');
  const [notes, setNotes] = useState('Faculty Manual Entry');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStudentId) setSelectedStudent(String(initialStudentId));
      else if (students.length > 0) setSelectedStudent(String(students[0].id));

      if (initialSubjectId) setSelectedSubject(String(initialSubjectId));
      else if (subjects.length > 0) setSelectedSubject(String(subjects[0].id));

      setDate(new Date().toISOString().slice(0, 10));
      setStatus('Present');
      setNotes('Faculty Manual Override');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialStudentId, initialSubjectId, students, subjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubject || !date) {
      setErrorMessage('Please select a student, subject, and date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.teacher.markManualAttendance({
        student_id: parseInt(selectedStudent, 10),
        subject_id: parseInt(selectedSubject, 10),
        date,
        status,
        notes
      });

      if (res.success) {
        setSuccessMessage(res.message);
        if (onAttendanceUpdated) {
          onAttendanceUpdated();
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to update attendance.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error updating attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <UserCheck size={22} color="#1d4ed8" />
            <span>Manual Attendance Entry / Override</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {successMessage ? (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ color: '#065f46', fontSize: '1.1rem', fontWeight: 700 }}>
                  Attendance Updated!
                </h4>
                <p style={{ color: '#047857', fontSize: '0.875rem', marginTop: '6px' }}>
                  {successMessage}
                </p>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem' }}>{errorMessage}</span>
                  </div>
                )}

                {/* Student Selector */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} />
                    <span>Select Student:</span>
                  </label>
                  <select
                    className="form-control"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.roll_number} - {st.name} ({st.course})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selector */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={15} />
                    <span>Select Course / Subject:</span>
                  </label>
                  <select
                    className="form-control"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    required
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} />
                    <span>Lecture Date:</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                {/* Status Toggle */}
                <div className="form-group">
                  <label className="form-label">Attendance Status:</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: status === 'Present' ? '2px solid #10b981' : '1px solid var(--border)',
                      background: status === 'Present' ? '#ecfdf5' : '#ffffff',
                      color: status === 'Present' ? '#065f46' : '#64748b',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="status"
                        value="Present"
                        checked={status === 'Present'}
                        onChange={() => setStatus('Present')}
                        style={{ display: 'none' }}
                      />
                      <span>Present</span>
                    </label>

                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '8px',
                      border: status === 'Absent' ? '2px solid #ef4444' : '1px solid var(--border)',
                      background: status === 'Absent' ? '#fef2f2' : '#ffffff',
                      color: status === 'Absent' ? '#991b1b' : '#64748b',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      <input
                        type="radio"
                        name="status"
                        value="Absent"
                        checked={status === 'Absent'}
                        onChange={() => setStatus('Absent')}
                        style={{ display: 'none' }}
                      />
                      <span>Absent</span>
                    </label>
                  </div>
                </div>

                {/* Reason / Notes */}
                <div className="form-group">
                  <label className="form-label">Reason / Notes:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Medical leave, camera hardware issue, manual verification"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            {successMessage ? (
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Record...</span>
                    </>
                  ) : (
                    <span>Save Attendance Record</span>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
