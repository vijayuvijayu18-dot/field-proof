import React from 'react';
import { ClassificationResult, ReactionAreaData, WorkflowState } from '../types';
import { StatusBadge } from './StatusBadge';
import { AlertTriangle, CheckCircle2, RotateCcw, AlertOctagon, Check, Lock, Camera, ShieldAlert } from 'lucide-react';

interface ClassificationResultCardProps {
  workflowState: WorkflowState;
  classification: ClassificationResult | null;
  reactionArea: ReactionAreaData | null;
  onRecapture?: () => void;
  onCreateRecord?: () => void;
  onApplyStandardCard?: () => void;
  isRecordCreated?: boolean;
}

export const ClassificationResultCard: React.FC<ClassificationResultCardProps> = ({
  workflowState,
  classification,
  reactionArea,
  onRecapture,
  onCreateRecord,
  onApplyStandardCard,
  isRecordCreated = false
}) => {
  // 1. STATE: WAITING / NOT STARTED
  if (workflowState === 'NOT_STARTED' || !classification) {
    return (
      <div className="rounded-md border border-slate-800 bg-[#111726] p-5 font-sans space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
              FIELD TEST STATUS
            </span>
            <h3 className="text-lg font-bold font-mono tracking-tight text-slate-200 mt-0.5">
              WAITING FOR CAPTURE
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            AWAITING INPUT
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
            <Camera className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-200 font-mono">
                Capture an image to begin.
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                Position the existing test pouch and physical reference colour card inside the camera brackets.
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-[#0b0f19] border border-slate-800/80 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              STRICT VERIFICATION WORKFLOW
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
              <span className="text-sky-400 font-semibold">01 CAPTURE</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-500">02 VERIFY</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-500">03 ANALYSE</span>
              <span className="text-slate-600">→</span>
              <span className="text-slate-500">04 RECORD</span>
            </div>
          </div>
        </div>

        <div className="pt-1 text-[11px] text-slate-400 italic">
          Analysis and test result are unavailable until image capture and validation checks succeed.
        </div>
      </div>
    );
  }

  // 2. STATE: RECAPTURE REQUIRED
  if (workflowState === 'RECAPTURE_REQUIRED') {
    return (
      <div className="rounded-md border border-amber-500/40 bg-[#171412] p-5 font-sans space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-amber-400 font-semibold">
              EVIDENCE CHECK
            </span>
            <h3 className="text-xl font-bold font-mono tracking-tight text-amber-300 mt-0.5">
              REFERENCE CARD NOT DETECTED
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
            RECAPTURE REQUIRED
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-2 font-mono text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>REFERENCE CARD NOT DETECTED IN FRAME</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans pl-6">
              Position physical reference card inside lower-left brackets, or apply the standard calibration card.
            </p>
          </div>

          {/* Strict Dependency Status Block */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded p-2.5 space-y-1.5 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              CASCADING VALIDATION STATUS
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded">
                <span>02 Reference Card Detection</span>
                <span className="text-rose-400 font-bold">NOT DETECTED</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded">
                <span>03 Calibration</span>
                <span className="text-slate-500 font-semibold">CALIBRATION — BLOCKED</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded">
                <span>04 Reaction Analysis</span>
                <span className="text-slate-500 font-semibold">REACTION ANALYSIS — BLOCKED</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded">
                <span>05 Classification</span>
                <span className="text-slate-500 font-semibold">CLASSIFICATION — BLOCKED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-1 flex flex-col gap-2">
          {onApplyStandardCard && (
            <button
              onClick={onApplyStandardCard}
              className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold font-mono tracking-wide flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Check className="w-4 h-4" />
              APPLY STANDARD CALIBRATION CARD & CONTINUE
            </button>
          )}
          <button
            onClick={onRecapture}
            className="w-full py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RECAPTURE WITH PHYSICAL CARD
          </button>
        </div>
      </div>
    );
  }

  // 3. STATE: ANALYSIS BLOCKED
  if (workflowState === 'ANALYSIS_BLOCKED') {
    return (
      <div className="rounded-md border border-rose-500/40 bg-[#191214] p-5 font-sans space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-rose-400 font-semibold">
              STAGE BLOCKED
            </span>
            <h3 className="text-xl font-bold font-mono tracking-tight text-rose-300 mt-0.5">
              ANALYSIS BLOCKED
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
            BLOCKED
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded bg-rose-950/20 border border-rose-500/30 text-rose-200 text-xs space-y-2">
            <div className="font-semibold flex items-center gap-2 font-mono text-rose-300">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{classification.summary}</span>
            </div>
            {classification.recaptureReason && (
              <p className="text-xs text-rose-200/90 leading-relaxed font-sans pl-6">
                {classification.recaptureReason}
              </p>
            )}
          </div>

          <div className="bg-[#0b0f19] border border-slate-800 rounded p-3 space-y-2 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              VALIDATION FAILURE REASON
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              {classification.blockedReason || 'Later stages cannot proceed until all prerequisite calibration and framing criteria pass.'}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onRecapture}
            className="w-full py-2.5 px-4 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold font-mono tracking-wide flex items-center justify-center gap-2 transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            RECAPTURE TEST
          </button>
        </div>
      </div>
    );
  }

  // 4. STATE: INCONCLUSIVE (Validations passed, but reaction color is ambiguous)
  if (workflowState === 'INCONCLUSIVE') {
    return (
      <div className="rounded-md border border-amber-500/40 bg-[#171512] p-5 font-sans space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
              FIELD TEST RESULT
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <h3 className="text-xl font-bold font-mono tracking-tight text-amber-300">
                INCONCLUSIVE
              </h3>
              <StatusBadge type="outcome" value="INCONCLUSIVE" />
            </div>
          </div>

          {reactionArea && (
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono">OBSERVED COLOUR</div>
                <div className="text-xs font-semibold text-slate-200">
                  {reactionArea.observedColorName}
                </div>
              </div>
              <div 
                className="w-6 h-6 rounded border border-white/20 shadow-sm shrink-0"
                style={{ backgroundColor: reactionArea.calibratedHex }}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 font-sans">
          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono font-medium">
            INCONCLUSIVE — REQUIRED VISUAL EVIDENCE NOT AVAILABLE.
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Software classification based on configured visual criteria could not establish a definitive match against demonstration standards.
          </p>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-slate-300">IMPORTANT NOTICE:</strong> Presumptive field-test result. Laboratory confirmation is separate.
            </span>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={onRecapture}
            className="flex-1 py-2 px-4 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold font-mono tracking-wide flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            CAPTURE AGAIN
          </button>
        </div>
      </div>
    );
  }

  // 5. STATE: ANALYSIS COMPLETE (POSITIVE or NEGATIVE)
  const isPositive = classification.outcome === 'POSITIVE';

  return (
    <div className={`rounded-md border p-5 transition-all font-sans ${
      isPositive 
        ? 'bg-[#15121b] border-rose-500/40' 
        : 'bg-[#101717] border-emerald-500/40'
    }`}>
      {/* Top Header: FIELD TEST ANALYSIS */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
            FIELD TEST ANALYSIS
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-xs font-mono text-slate-400">FINAL RESULT:</span>
            <h3 className="text-xl font-bold font-mono tracking-tight text-slate-100">
              {isPositive ? 'POSITIVE' : 'NEGATIVE'}
            </h3>
            <StatusBadge type="outcome" value={classification.outcome} />
          </div>
        </div>

        {/* Reaction color preview */}
        {reactionArea && (
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">OBSERVED COLOUR</div>
              <div className="text-xs font-semibold text-slate-200">
                {reactionArea.observedColorName}
              </div>
            </div>
            <div 
              className="w-6 h-6 rounded border border-white/20 shadow-sm shrink-0"
              style={{ backgroundColor: reactionArea.calibratedHex }}
            />
          </div>
        )}
      </div>

      {/* Prerequisite Stages Checklist */}
      <div className="py-3.5 space-y-3 font-sans">
        <div className="bg-[#0b0f19] border border-slate-800 rounded p-3 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            PREREQUISITE VERIFICATION AUDIT
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800/60">
              <span className="text-slate-300">Reference Card</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Detected
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800/60">
              <span className="text-slate-300">Calibration</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Completed
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800/60">
              <span className="text-slate-300">Reaction Area</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Detected
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800/60">
              <span className="text-slate-300">Visual Analysis</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Completed
              </span>
            </div>
          </div>
        </div>

        {/* Technical Summary */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono text-sky-400 font-semibold uppercase">
            Software classification based on the configured visual criteria.
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {classification.summary}
          </p>
        </div>

        {/* Clear Presumptive Disclaimer */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">Presumptive field-test result. Laboratory confirmation is separate.</strong> This software is a companion for documenting and interpreting an existing field-test workflow.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-1 flex flex-wrap items-center gap-2.5">
        <button
          onClick={onCreateRecord}
          disabled={isRecordCreated}
          className={`flex-1 py-2.5 px-4 rounded text-xs font-semibold font-mono tracking-wide flex items-center justify-center gap-2 transition ${
            isRecordCreated
              ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 cursor-default'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
          }`}
        >
          {isRecordCreated ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ✓ DIGITAL RECORD SEALED
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              CREATE DIGITAL RECORD
            </>
          )}
        </button>
        <button
          onClick={onRecapture}
          className="py-2.5 px-3.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
        >
          NEW TEST
        </button>
      </div>
    </div>
  );
};
