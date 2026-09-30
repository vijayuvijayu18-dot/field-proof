import React from 'react';
import { ReactionAreaData } from '../types';
import { CheckCircle2, AlertTriangle, Clock, Layers, ShieldCheck } from 'lucide-react';

interface ReactionAreaGuideProps {
  reactionArea: ReactionAreaData | null;
  cardDetected?: boolean;
}

export const ReactionAreaGuide: React.FC<ReactionAreaGuideProps> = ({ reactionArea, cardDetected = true }) => {
  const isDetected = reactionArea?.detected ?? false;

  return (
    <div className={`rounded-md border transition-all ${
      isDetected 
        ? 'bg-[#111726] border-emerald-500/40 shadow-sm' 
        : reactionArea && !isDetected
          ? 'bg-[#181214] border-amber-500/40 shadow-sm'
          : 'bg-[#111726] border-slate-800'
    }`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-100">
            TEST / REACTION AREA
          </span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono bg-sky-950/70 border border-sky-500/30 px-2 py-0.5 rounded">
          TARGET REGION
        </span>
      </div>

      <div className="p-3.5 space-y-2.5 font-sans">
        {/* Detection Status Banner */}
        {reactionArea ? (
          isDetected ? (
            <div className="flex items-start gap-2.5 p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-semibold font-mono tracking-wide flex items-center justify-between">
                  <span>✓ Reaction area detected</span>
                  {reactionArea.calibratedHex && (
                    <span 
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0" 
                      style={{ backgroundColor: reactionArea.calibratedHex }}
                      title={`Observed: ${reactionArea.observedColorName}`}
                    />
                  )}
                </div>
                <div className="text-[11px] text-emerald-400/90 mt-0.5 font-sans">
                  Target chamber identified within configured guide brackets.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold font-mono tracking-wide">
                  ⚠ Reaction area not detected
                </div>
                <div className="text-[11px] text-amber-300/90 mt-0.5">
                  {reactionArea.validationError || 'Kit reaction chamber could not be identified inside the target guide brackets.'}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-start gap-2.5 p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-400">
            <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-mono font-medium text-slate-300">
                WAITING FOR CAPTURE
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Align the test pouch viewing window inside the [ TEST / REACTION AREA ] brackets.
              </div>
            </div>
          </div>
        )}

        {/* Observed color pill when detected */}
        {isDetected && reactionArea?.observedColorName && (
          <div className="flex items-center justify-between bg-[#0b0f19] border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Observed Coloration:</span>
            <span className="text-slate-200 font-semibold">{reactionArea.observedColorName}</span>
          </div>
        )}
      </div>
    </div>
  );
};
