import React, { useState } from 'react';
import { EvidenceChainStep } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Tag, 
  Camera, 
  Sliders, 
  Layers, 
  FileCheck, 
  Hash, 
  Lock 
} from 'lucide-react';

interface EvidenceChainProps {
  steps: EvidenceChainStep[];
  interactive?: boolean;
}

export const EvidenceChain: React.FC<EvidenceChainProps> = ({ steps, interactive = true }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getStepIcon = (title: string) => {
    switch (title) {
      case 'IMAGE CAPTURED':
        return Camera;
      case 'REFERENCE VERIFIED':
        return Sliders;
      case 'CALIBRATION':
      case 'CALIBRATION COMPLETED':
        return Sliders;
      case 'REACTION ANALYSIS':
      case 'REACTION ANALYSED':
        return Layers;
      case 'RESULT':
      case 'RESULT RECORDED':
        return FileCheck;
      case 'IMAGE HASH':
      case 'IMAGE HASHED':
        return Hash;
      case 'DIGITAL RECORD':
      case 'DIGITAL RECORD SEALED':
      default:
        return Lock;
    }
  };

  return (
    <div className="bg-[#111726] border border-slate-800 rounded-md p-4 space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            DIGITAL EVIDENCE CHAIN
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          7-STEP AUDIT TRAIL
        </span>
      </div>

      <div className="space-y-1.5 pt-1">
        {steps.map((step, idx) => {
          const isComplete = step.status === 'COMPLETE';
          const isInProgress = step.status === 'IN_PROGRESS';
          const isFailed = step.status === 'FAILED';
          const isBlocked = step.status === 'BLOCKED';
          const isExpanded = expandedIndex === idx;
          const StepIcon = getStepIcon(step.title);

          return (
            <div 
              key={idx}
              className={`rounded border transition-all ${
                isComplete 
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700' 
                  : isInProgress 
                    ? 'bg-sky-950/20 border-sky-500/40' 
                    : isFailed 
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isBlocked
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                        : 'bg-slate-900/20 border-slate-800/40 opacity-60'
              }`}
            >
              <button
                type="button"
                onClick={() => interactive && setExpandedIndex(isExpanded ? null : idx)}
                disabled={!interactive}
                className="w-full flex items-center justify-between p-2.5 text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center justify-center w-4 h-4">
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isInProgress && (
                      <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                    )}
                    {isFailed && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {isBlocked && (
                      <span className="text-xs font-mono font-bold text-slate-500 select-none">—</span>
                    )}
                    {!isComplete && !isInProgress && !isFailed && !isBlocked && (
                      <Circle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {step.stepNumber}
                    </span>
                    <StepIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`text-xs font-semibold ${isBlocked ? 'text-slate-400' : 'text-slate-200'}`}>
                      {step.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono hidden sm:inline ${
                    isBlocked 
                      ? 'text-slate-500 font-semibold uppercase' 
                      : isFailed 
                        ? 'text-rose-400' 
                        : isComplete 
                          ? 'text-slate-300' 
                          : 'text-slate-400'
                  }`}>
                    {step.summary}
                  </span>
                  {interactive && (
                    isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )
                  )}
                </div>
              </button>

              {/* Expandable Technical Detail */}
              {isExpanded && (
                <div className="px-9 pb-3 pt-1 border-t border-slate-800/60 text-xs text-slate-300 font-sans space-y-1">
                  <div className="text-[11px] text-slate-400">
                    {step.technicalDetail}
                  </div>
                  {step.timestamp && (
                    <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                      Recorded: {new Date(step.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
