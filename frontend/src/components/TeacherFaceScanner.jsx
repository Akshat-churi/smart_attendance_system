import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  BookOpen, 
  Users, 
  Sparkles,
  AlertTriangle,
  User,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function TeacherFaceScanner({ subjects = [], onAttendanceMarked }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [rosterData, setRosterData] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Camera state
  const [cameraState, setCameraState] = useState('idle'); // idle, requesting, streaming, error
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [selectedFallbackStudent, setSelectedFallbackStudent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Scan feedback
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Set default subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(String(subjects[0].id));
    }
  }, [subjects]);

  // Fetch roster status when subject changes
  const fetchRoster = async (subjId) => {
    if (!subjId) return;
    setRosterLoading(true);
    try {
      const res = await api.face.getCourseRosterStatus(subjId);
      if (res.success) {
        setRosterData(res);
      }
    } catch (err) {
      console.error('Fetch course roster status error:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      fetchRoster(selectedSubject);
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [selectedSubject]);

  const startCamera = async () => {
    setErrorMessage(null);
    setCameraState('requesting');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser. Please use Fallback Mode.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState('streaming');
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraState('error');
      setErrorMessage(
        `Camera unavailable (${err.message || 'Permission denied'}). You can use the manual testing fallback below.`
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraState('idle');
  };

  const captureFrameBase64 = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleScanStudentFace = async () => {
    if (!selectedSubject) {
      setErrorMessage('Please select a course for the attendance session.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let imageBase64 = null;
      let isFallback = useFallbackMode || cameraState === 'error';

      if (!isFallback) {
        imageBase64 = captureFrameBase64();
        if (!imageBase64) {
          throw new Error('Failed to capture frame from webcam.');
        }
      }

      const res = await api.face.teacherScan({
        subject_id: parseInt(selectedSubject, 10),
        image: imageBase64,
        is_test_fallback: isFallback,
        student_id: selectedFallbackStudent ? parseInt(selectedFallbackStudent, 10) : undefined
      });

      if (res.success) {
        setLastScannedResult({
          type: 'success',
          student: res.student,
          attendance: res.attendance,
          message: res.message
        });
        fetchRoster(selectedSubject);
        if (onAttendanceMarked) {
          onAttendanceMarked(res.attendance);
        }
      } else {
        setLastScannedResult(null);
        setErrorMessage(res.error || 'Face recognition failed.');
      }
    } catch (err) {
      console.error('Teacher face scan error:', err);
      setLastScannedResult(null);
      setErrorMessage(err.message || 'An error occurred during facial verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
      {/* LEFT COLUMN: Camera Scanner & Live Viewfinder */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div className="card-title">
            <Camera size={22} color="#2563eb" />
            <span>Classroom Live Attendance Scanner</span>
          </div>
          <span className="badge badge-success">Official Faculty Kiosk</span>
        </div>

        {/* Course Selector Dropdown */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Select Lecture Course for Attendance:
          </label>
          <select
            className="form-control"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isProcessing}
            style={{ fontWeight: 600, fontSize: '0.95rem' }}
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name} ({sub.total_classes} total classes)
              </option>
            ))}
          </select>
        </div>

        {/* Live Attendance Counters for Selected Subject */}
        {rosterData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ENROLLED</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{rosterData.total_enrolled}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>PRESENT TODAY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>{rosterData.present_today}</div>
            </div>
            <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>PENDING</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>{rosterData.pending_today}</div>
            </div>
          </div>
        )}

        {/* Viewfinder Box */}
        <div className="webcam-box" style={{ marginBottom: '16px', minHeight: '320px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="webcam-video"
            style={{ display: cameraState === 'streaming' ? 'block' : 'none' }}
          />

          {cameraState === 'streaming' && (
            <>
              <div className="face-target-guide" />
              <div className="webcam-overlay-status">
                <ShieldCheck size={14} color="#38bdf8" />
                <span>Student: Look directly at the camera</span>
              </div>
            </>
          )}

          {cameraState === 'requesting' && (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Initializing Classroom Camera...</div>
            </div>
          )}

          {(cameraState === 'error' || useFallbackMode) && (
            <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '24px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#334155',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Camera size={30} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {useFallbackMode ? 'Manual Testing Mode Active' : 'Camera Unavailable'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                Testing fallback mode ready to verify enrolled student
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alert or Success Banner */}
        {errorMessage && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem' }}>{errorMessage}</div>
          </div>
        )}

        {lastScannedResult && (
          <div style={{
            background: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.25s ease'
          }}>
            {lastScannedResult.student?.face_image ? (
              <img
                src={lastScannedResult.student.face_image}
                alt="Student preview"
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }}
              />
            ) : (
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={32} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                  {lastScannedResult.student?.name}
                </h4>
                <span className="badge badge-success">Present</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '2px' }}>
                Roll No: <strong>{lastScannedResult.student?.roll_number}</strong> &bull; {lastScannedResult.attendance?.time}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                Biometric Score: <strong>{lastScannedResult.attendance?.verification_score}</strong> ({lastScannedResult.attendance?.verification_method})
              </div>
            </div>
          </div>
        )}

        {/* Scan Actions & Fallback Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleScanStudentFace}
            className="btn btn-primary btn-lg"
            disabled={isProcessing}
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Verifying Biometric Face ID...</span>
              </>
            ) : (
              <>
                <Camera size={20} />
                <span>Scan Student Face to Mark Present</span>
              </>
            )}
          </button>

          {/* Fallback Option */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={() => {
                setUseFallbackMode(!useFallbackMode);
                if (!useFallbackMode) stopCamera();
                else startCamera();
              }}
              style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'underline' }}
            >
              {useFallbackMode ? 'Switch to Live Camera Viewfinder' : 'No webcam hardware? Toggle Testing Fallback'}
            </button>

            {useFallbackMode && rosterData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Test Student:</span>
                <select
                  className="form-control form-control-sm"
                  value={selectedFallbackStudent}
                  onChange={(e) => setSelectedFallbackStudent(e.target.value)}
                  style={{ width: '160px', fontSize: '0.8rem' }}
                >
                  <option value="">Auto Next Pending</option>
                  {rosterData.roster.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.roll_number} - {st.name} {st.is_present_today ? '✅' : '⏳'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Class Roster & Attendance Status */}
      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div className="card-title">
            <Users size={20} color="#2563eb" />
            <span>Class Roster &amp; Live Attendance Status</span>
          </div>
          <button
            onClick={() => fetchRoster(selectedSubject)}
            className="btn btn-secondary btn-sm"
            disabled={rosterLoading}
          >
            <RefreshCw size={13} className={rosterLoading ? 'animate-spin' : ''} />
            <span>Refresh Roster</span>
          </button>
        </div>

        {rosterLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Loader2 size={24} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading course enrollment roster...</div>
          </div>
        ) : rosterData && rosterData.roster.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
            {rosterData.roster.map((st) => (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: st.is_present_today ? '1px solid #a7f3d0' : '1px solid var(--border)',
                  background: st.is_present_today ? '#f0fdf4' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {st.face_image ? (
                    <img
                      src={st.face_image}
                      alt={st.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: st.is_present_today ? '2px solid #10b981' : '1px solid #cbd5e1' }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#475569',
                      fontSize: '0.85rem'
                    }}>
                      {st.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{st.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Roll: <strong>{st.roll_number}</strong> &bull; {st.face_registered ? 'Face ID ✅' : 'No Face ID ⚠️'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {st.is_present_today ? (
                    <div>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Present
                      </span>
                      <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '2px' }}>
                        {st.marked_time}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="badge badge-warning">
                        <Clock size={12} /> Pending Scan
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No enrolled students found for this course.
          </div>
        )}
      </div>
    </div>
  );
}
