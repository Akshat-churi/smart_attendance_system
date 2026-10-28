import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanFace, 
  X, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function FaceRegisterModal({ isOpen, onClose, onRegistered }) {
  const [cameraState, setCameraState] = useState('idle');
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setErrorMessage(null);
      setSuccess(false);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage(null);
    setCameraState('requesting');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam not supported in this browser.');
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
      setCameraState('error');
      setErrorMessage('Camera access unavailable. You can upload a photo or use the sample test photo below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraState('idle');
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Generate a clean test sample face canvas for testing environments without camera
  const handleUseSampleTestFace = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 320, 320);

    // Realistic face proportions for detector
    ctx.fillStyle = '#fbd38d'; // skin
    ctx.beginPath();
    ctx.ellipse(160, 160, 75, 95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.arc(160, 120, 78, Math.PI, 0, false);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1a202c';
    ctx.beginPath();
    ctx.arc(130, 145, 8, 0, Math.PI * 2);
    ctx.arc(190, 145, 8, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.strokeStyle = '#c05621';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(160, 150);
    ctx.lineTo(155, 175);
    ctx.lineTo(165, 175);
    ctx.stroke();

    // Mouth
    ctx.strokeStyle = '#9b2c2c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(160, 195, 20, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRegister = async () => {
    if (!capturedImage) {
      setErrorMessage('Please capture or select a face photo first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await api.face.register(capturedImage);
      if (response.success) {
        setSuccess(true);
        if (onRegistered) {
          onRegistered(response.face_image);
        }
      } else {
        setErrorMessage(response.error || 'Face registration failed.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with face recognition service.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <ScanFace size={22} color="#1d4ed8" />
            <span>Register Student Face ID</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
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
                Face ID Registered Successfully!
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#047857', marginBottom: '20px' }}>
                Your facial biometric embedding has been securely saved to the database. You can now use the scanner to mark attendance.
              </p>
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Registered face preview"
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981', margin: '0 auto' }}
                />
              )}
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
                Look directly into the camera in a well-lit environment. Ensure your entire face is visible without sunglasses or face coverings.
              </p>

              {/* Viewport or Preview */}
              <div className="webcam-box" style={{ marginBottom: '16px' }}>
                {capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Captured face preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="webcam-video"
                      style={{ display: cameraState === 'streaming' ? 'block' : 'none' }}
                    />

                    {cameraState === 'streaming' && (
                      <div className="face-target-guide" />
                    )}

                    {cameraState === 'requesting' && (
                      <div style={{ color: '#94a3b8', textAlign: 'center' }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                        <div>Starting camera...</div>
                      </div>
                    )}

                    {cameraState === 'error' && (
                      <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '20px' }}>
                        <Camera size={32} style={{ margin: '0 auto 8px', color: '#f87171' }} />
                        <div style={{ fontWeight: 600 }}>Webcam Not Available</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                          Upload an image or use the test sample below
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>{errorMessage}</div>
                </div>
              )}

              {/* Action Buttons for Capture / Retake */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {!capturedImage && cameraState === 'streaming' && (
                  <button type="button" className="btn btn-primary" onClick={takeSnapshot} style={{ flex: 1 }}>
                    <Camera size={18} />
                    <span>Take Photo</span>
                  </button>
                )}

                {capturedImage && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCapturedImage(null);
                      startCamera();
                    }}
                    style={{ flex: 1 }}
                  >
                    <RefreshCw size={16} />
                    <span>Retake Photo</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>Upload Image</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleUseSampleTestFace}
                  title="Use simulated human face for quick testing"
                >
                  <Sparkles size={16} color="#3b82f6" />
                  <span>Use Test Face</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {success ? (
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={!capturedImage || isProcessing}
                style={{ minWidth: '150px' }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Face ID...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Confirm & Register</span>
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
