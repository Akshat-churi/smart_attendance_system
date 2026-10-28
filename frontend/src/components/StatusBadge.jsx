import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status, type = 'attendance' }) {
  if (type === 'attendance') {
    if (status === 'Present') {
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={13} />
          Present
        </span>
      );
    }
    return (
      <span className="badge badge-danger">
        <XCircle size={13} />
        {status || 'Absent'}
      </span>
    );
  }

  if (type === 'eligibility') {
    if (status === false || status === 'Shortage') {
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={13} />
          Attendance Shortage (&lt;75%)
        </span>
      );
    }
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={13} />
        Eligible (&ge;75%)
      </span>
    );
  }

  return <span className="badge badge-info">{status}</span>;
}
