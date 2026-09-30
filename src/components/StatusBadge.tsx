import React from 'react';
import { ClassificationOutcome, ImageQualityStatus, ReferenceCardStatus } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  type: 'outcome' | 'quality' | 'card' | 'integrity';
  value: ClassificationOutcome | ImageQualityStatus | ReferenceCardStatus | 'SEALED' | 'MISMATCH' | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-semibold'
  }[size];

  if (type === 'outcome') {
    switch (value) {
      case 'POSITIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono tracking-wide ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            PRESUMPTIVE POSITIVE
          </span>
        );
      case 'NEGATIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono tracking-wide ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            PRESUMPTIVE NEGATIVE
          </span>
        );
      case 'RECAPTURE_REQUIRED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono tracking-wide ${sizeClasses} ${className}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            RECAPTURE REQUIRED
          </span>
        );
      case 'INCONCLUSIVE':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono tracking-wide ${sizeClasses} ${className}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            INCONCLUSIVE
          </span>
        );
    }
  }

  if (type === 'card') {
    switch (value) {
      case 'DETECTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono ${sizeClasses} ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CARD DETECTED
          </span>
        );
      case 'NOT_DETECTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-rose-500/10 border border-rose-500/25 text-rose-400 font-mono ${sizeClasses} ${className}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            CARD MISSING
          </span>
        );
      case 'WAITING':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-slate-800 border border-slate-700 text-slate-400 font-mono ${sizeClasses} ${className}`}>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            WAITING
          </span>
        );
    }
  }

  if (type === 'quality') {
    switch (value) {
      case 'GOOD':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-sky-500/10 border border-sky-500/25 text-sky-400 font-mono ${sizeClasses} ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            GOOD
          </span>
        );
      case 'ADEQUATE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-teal-500/10 border border-teal-500/25 text-teal-300 font-mono ${sizeClasses} ${className}`}>
            ADEQUATE
          </span>
        );
      case 'POOR_RECAPTURE_RECOMMENDED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono ${sizeClasses} ${className}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            POOR / SHADOWED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-sm bg-slate-800 border border-slate-700 text-slate-400 font-mono ${sizeClasses} ${className}`}>
            READY
          </span>
        );
    }
  }

  if (type === 'integrity') {
    if (value === 'SEALED' || value === 'TAMPER_EVIDENT_RECORD_CREATED' || value === 'VERIFIED') {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono ${sizeClasses} ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          INTEGRITY SEALED
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono ${sizeClasses} ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        HASH MISMATCH
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-sm bg-slate-800 border border-slate-700 text-slate-300 font-mono ${sizeClasses} ${className}`}>
      {String(value)}
    </span>
  );
};
