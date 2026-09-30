import React from 'react';
import { ReferenceCardData } from '../types';
import { CheckCircle2, AlertTriangle, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface ReferenceCardGuideProps {
  cardData: ReferenceCardData | null;
}

export const ReferenceCardGuide: React.FC<ReferenceCardGuideProps> = ({ cardData }) => {
  const isDetected = cardData?.detected ?? false;

  return (
    <div className={`rounded-md border transition-all ${
      isDetected 
        ? 'bg-[#111726] border-emerald-500/40 shadow-sm' 
        : cardData && !isDetected
          ? 'bg-[#181214] border-amber-500/40 shadow-sm'
          : 'bg-[#111726] border-slate-800'
    }`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-100">
            REQUIRED REFERENCE CARD
          </span>
        </div>
        <span className="text-[10px] text-sky-400 font-mono bg-sky-950/70 border border-sky-500/30 px-2 py-0.5 rounded">
          CALIBRATION ONLY
        </span>
      </div>

      <div className="p-3 space-y-2.5 font-sans">
        {/* Detection Status Banner */}
        {cardData ? (
          isDetected ? (
            <div className="flex items-start gap-2.5 p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold font-mono tracking-wide">
                  ✓ Reference card detected
                </div>
                <div className="text-[11px] text-emerald-400/90 mt-0.5">
                  Lighting baseline established. Normalization active.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold font-mono tracking-wide">
                  ⚠ Reference card not detected
                </div>
                <div className="text-[11px] text-amber-300/90 mt-0.5">
                  Card missing from lower-left frame. Use standard card or adjust framing.
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
                Awaiting camera capture to detect reference colour card.
              </div>
            </div>
          </div>
        )}

        {/* Visual Reference Card Physical Representation */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-mono text-[11px] font-semibold">Calibration Standards:</span>
            <span className="text-[10px] font-mono text-slate-400">
              {isDetected ? 'VERIFIED' : '4-PATCH STANDARD'}
            </span>
          </div>

          {/* Clean physical card swatch grid */}
          <div className="grid grid-cols-4 gap-2 pt-0.5">
            {/* White Patch */}
            <div className="space-y-0.5 text-center">
              <div 
                className="h-8 rounded border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm"
                style={{ backgroundColor: cardData?.patches?.white?.measuredHex || '#FFFFFF' }}
              >
                100%
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                WHITE
              </div>
            </div>

            {/* Mid Gray Patch */}
            <div className="space-y-0.5 text-center">
              <div 
                className="h-8 rounded border border-slate-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: cardData?.patches?.neutralGray?.measuredHex || '#808080' }}
              >
                50%
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                GRAY
              </div>
            </div>

            {/* Black Patch */}
            <div className="space-y-0.5 text-center">
              <div 
                className="h-8 rounded border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm"
                style={{ backgroundColor: cardData?.patches?.black?.measuredHex || '#151515' }}
              >
                0%
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                BLACK
              </div>
            </div>

            {/* Primary Cyan */}
            <div className="space-y-0.5 text-center">
              <div 
                className="h-8 rounded border border-slate-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: cardData?.patches?.referenceHue?.measuredHex || '#00A2E8' }}
              >
                REF
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                CYAN
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
