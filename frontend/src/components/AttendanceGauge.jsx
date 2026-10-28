import React from 'react';

export default function AttendanceGauge({ percentage, size = 120, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const isLow = percentage < 75;
  const strokeColor = isLow ? '#ef4444' : percentage >= 85 ? '#10b981' : '#3b82f6';
  const bgColor = '#e2e8f0';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 700, color: strokeColor, lineHeight: 1 }}>
          {percentage}%
        </div>
        <div style={{ fontSize: size * 0.09, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginTop: 3 }}>
          {isLow ? 'Shortage' : 'Good'}
        </div>
      </div>
    </div>
  );
}
