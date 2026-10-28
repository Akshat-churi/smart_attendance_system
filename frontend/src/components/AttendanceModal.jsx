import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  Clock,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function AttendanceModal({ isOpen, onClose, subjects = [], onAttendanceMarked, initialSubjectId = null }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [cameraState, setCameraState] = useState('idle'); // idle, streaming, error
  const [errorMessage, setErrorMessage] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize selected subject when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSubjectId) {
        setSelectedSubject(String(initialSubjectId));
      } else if (subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(String(subjects[0].id || subjects[0].subject_id));
      }
      setErrorMessage(null);
      setSuccessData(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, subjects]);

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

  const handleScanAndVerify = async () => {
    if (!selectedSubject) {
      setErrorMessage('Please select a subject to mark attendance.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessData(null);

    try {
      let imageBase64 = null;
      let isFallback = useFallbackMode || cameraState === 'error';

      if (!isFallback) {
        imageBase64 = captureFrameBase64();
        if (!imageBase64) {
          throw new Error('Failed to capture frame from webcam.');
        }
      }

      const response = await api.face.markAttendance({
        subject_id: parseInt(selectedSubject, 10),
        image: imageBase64,
        is_test_fallback: isFallback
      });

      if (response.success) {
        setSuccessData(response.attendance);
        if (onAttendanceMarked) {
          onAttendanceMarked(response.attendance);
        }
      } else {
        setErrorMessage(response.error || 'Face verification failed.');
      }
    } catch (err) {
      console.error('Attendance mark error:', err);
      setErrorMessage(err.message || 'An error occurred during face recognition.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Camera size={22} color="#1d4ed8" />
            <span>Face Recognition Attendance</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Subject Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} />
              <span>Select Subject for Attendance:</span>
            </label>
            <select
              className="form-control"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isProcessing || successData}
            >
              {subjects.map((sub) => {
                const id = sub.id || sub.subject_id;
                return (
                  <option key={id} value={id}>
                    {sub.code} - {sub.name} ({sub.schedule || 'Scheduled'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Success State */}
          {successData ? (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle size={36} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065f46', marginBottom: '8px' }}>
                Attendance Marked Successfully!
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#047857', marginBottom: '20px' }}>
                Face verified with deep neural recognition match.
              </p>

              <div style={{
                background: '#ffffff',
                border: '1px solid #d1fae5',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'left',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>Student Name:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{successData.student_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Roll Number:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{successData.roll_number}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Subject:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{successData.subject_code} - {successData.subject_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Date & Time:</span>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{successData.date} at {successData.time}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <div><span className="badge badge-success">Present</span></div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Verification:</span>
                  <div style={{ fontWeight: 600, color: '#16a34a' }}>
                    Score: {successData.verification_score} ({successData.verification_method})
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Webcam Viewport */}
              <div className="webcam-box" style={{ marginBottom: '16px' }}>
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
                      <span>Position face within oval guide</span>
                    </div>
                  </>
                )}

                {cameraState === 'requesting' && (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <div>Requesting camera permissions...</div>
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
                      {useFallbackMode ? 'Manual Testing Fallback Mode Active' : 'Camera Unavailable'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      Ready to verify identity using student profile authentication
                    </div>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>{errorMessage}</div>
                </div>
              )}

              {/* Fallback & Helper Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setUseFallbackMode(!useFallbackMode);
                    if (!useFallbackMode) stopCamera();
                    else startCamera();
                  }}
                  style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'underline' }}
                >
                  {useFallbackMode ? 'Switch back to Live Webcam' : 'No webcam? Toggle Manual Test Fallback'}
                </button>

                {cameraState === 'error' && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn btn-secondary btn-sm"
                  >
                    <RefreshCw size={13} />
                    Retry Camera
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          {successData ? (
            <button className="btn btn-primary" onClick={onClose}>
              Done & Return to Dashboard
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleScanAndVerify}
                disabled={isProcessing || !selectedSubject}
                style={{ minWidth: '180px' }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Face...</span>
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    <span>Scan & Mark Present</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
