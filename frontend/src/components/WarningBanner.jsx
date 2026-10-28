import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function WarningBanner({ percentage, attended, total, course }) {
  if (percentage >= 75) return null;

  // Calculate how many consecutive classes need to be attended to reach 75%
  // (attended + x) / (total + x) >= 0.75 => x >= (0.75 * total - attended) / 0.25
  const needed = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));

  return (
    <div style={{
      background: 'linear-gradient(90deg, #fff1f2 0%, #fffbeb 100%)',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.06)'
    }}>
      <div style={{
        background: '#fee2e2',
        color: '#dc2626',
        padding: '10px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <AlertTriangle size={24} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
            Mandatory Attendance Shortage Warning
          </h4>
          <span className="badge badge-danger">Attendance: {percentage}%</span>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginTop: '6px', lineHeight: 1.5 }}>
          Your cumulative attendance has fallen below the university's mandatory <strong>75% minimum threshold</strong>.
          You currently have attended <strong>{attended}</strong> out of <strong>{total}</strong> conducted classes.
          {needed > 0 && (
            <span> You must attend at least the next <strong>{needed} consecutive classes</strong> without absence to regain eligibility for semester examinations.</span>
          )}
        </p>
      </div>
    </div>
  );
}
