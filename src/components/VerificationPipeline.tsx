import React from 'react';
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';
import { WorkflowState } from '../types';

export type PipelineStage = 'IDLE' | 'CAPTURING' | 'CARD_CHECK' | 'CALIBRATING' | 'REACTION_ANALYSIS' | 'HASHING' | 'COMPLETED' | 'RECAPTURE_REQUIRED' | 'BLOCKED';

interface VerificationPipelineProps {
  currentStage: PipelineStage;
  workflowState: WorkflowState;
  cardDetected?: boolean;
  calibrationReady?: boolean;
  reactionAreaDetected?: boolean;
  classificationOutcome?: 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';
  hasRecord?: boolean;
}

export const VerificationPipeline: React.FC<VerificationPipelineProps> = ({
  currentStage,
  workflowState,
  cardDetected = true,
  calibrationReady = true,
  reactionAreaDetected = true,
  classificationOutcome,
  hasRecord = false
}) => {
  const isNotStarted = workflowState === 'NOT_STARTED' || currentStage === 'IDLE';

  // Strict dependencies
  const isImageCaptured = !isNotStarted;
  const isCardCheckInProgress = currentStage === 'CARD_CHECK';
  const isCalibratingInProgress = currentStage === 'CALIBRATING';
  const isReactionAnalysisInProgress = currentStage === 'REACTION_ANALYSIS';

  // Step 2: Reference card
  let cardStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' = 'WAITING';
  let cardSummary = 'Pending check';
  if (!isNotStarted) {
    if (isCardCheckInProgress) {
      cardStatus = 'IN_PROGRESS';
      cardSummary = 'Locating card';
    } else if (cardDetected) {
      cardStatus = 'COMPLETE';
      cardSummary = 'Detected';
    } else {
      cardStatus = 'FAILED';
      cardSummary = 'Not detected';
    }
  }

  // Step 3: Calibration
  let calStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'BLOCKED' = 'WAITING';
  let calSummary = 'Pending';
  if (isNotStarted || isCardCheckInProgress) {
    calStatus = 'WAITING';
    calSummary = 'Pending';
  } else if (!cardDetected) {
    calStatus = 'BLOCKED';
    calSummary = 'Unavailable';
  } else if (isCalibratingInProgress) {
    calStatus = 'IN_PROGRESS';
    calSummary = 'Normalizing';
  } else if (calibrationReady) {
    calStatus = 'COMPLETE';
    calSummary = 'Normalized';
  } else {
    calStatus = 'FAILED';
    calSummary = 'Failed';
  }

  // Step 4: Reaction Area
  let rxStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'BLOCKED' = 'WAITING';
  let rxSummary = 'Pending';
  if (isNotStarted || isCardCheckInProgress || isCalibratingInProgress) {
    rxStatus = 'WAITING';
    rxSummary = 'Pending';
  } else if (!cardDetected || !calibrationReady) {
    rxStatus = 'BLOCKED';
    rxSummary = 'Unavailable';
  } else if (isReactionAnalysisInProgress) {
    rxStatus = 'IN_PROGRESS';
    rxSummary = 'Locating chamber';
  } else if (reactionAreaDetected) {
    rxStatus = 'COMPLETE';
    rxSummary = 'Identified';
  } else {
    rxStatus = 'FAILED';
    rxSummary = 'Not detected';
  }

  // Step 5: Visual Analysis
  let vaStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'BLOCKED' = 'WAITING';
  let vaSummary = 'Pending';
  if (isNotStarted || isCardCheckInProgress || isCalibratingInProgress || isReactionAnalysisInProgress) {
    vaStatus = 'WAITING';
    vaSummary = 'Pending';
  } else if (!cardDetected || !calibrationReady || !reactionAreaDetected) {
    vaStatus = 'BLOCKED';
    vaSummary = 'BLOCKED';
  } else if (workflowState === 'ANALYSIS_COMPLETE' || workflowState === 'INCONCLUSIVE') {
    vaStatus = 'COMPLETE';
    vaSummary = 'Completed';
  } else {
    vaStatus = 'BLOCKED';
    vaSummary = 'BLOCKED';
  }

  // Step 6: Classification
  let clsStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'BLOCKED' = 'WAITING';
  let clsSummary = 'Pending';
  if (isNotStarted || isCardCheckInProgress || isCalibratingInProgress || isReactionAnalysisInProgress) {
    clsStatus = 'WAITING';
    clsSummary = 'Pending';
  } else if (!cardDetected || !calibrationReady || !reactionAreaDetected) {
    clsStatus = 'BLOCKED';
    clsSummary = 'BLOCKED';
  } else if (workflowState === 'ANALYSIS_COMPLETE') {
    clsStatus = 'COMPLETE';
    clsSummary = classificationOutcome || 'Classified';
  } else if (workflowState === 'INCONCLUSIVE') {
    clsStatus = 'FAILED';
    clsSummary = 'Inconclusive';
  } else {
    clsStatus = 'BLOCKED';
    clsSummary = 'BLOCKED';
  }

  // Step 7: Digital Record
  let recStatus: 'WAITING' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED' = 'WAITING';
  let recSummary = 'Pending';
  if (isNotStarted) {
    recStatus = 'WAITING';
    recSummary = 'Pending';
  } else if (hasRecord) {
    recStatus = 'COMPLETE';
    recSummary = 'Record sealed';
  } else if (workflowState === 'ANALYSIS_COMPLETE') {
    recStatus = 'IN_PROGRESS';
    recSummary = 'Ready to seal';
  } else {
    recStatus = 'BLOCKED';
    recSummary = 'NOT CREATED';
  }

  const steps = [
    {
      num: '01',
      title: 'IMAGE CAPTURE',
      status: isImageCaptured ? 'COMPLETE' : 'WAITING',
      summary: isImageCaptured ? 'Captured' : 'Pending'
    },
    {
      num: '02',
      title: 'REFERENCE CARD',
      status: cardStatus,
      summary: cardSummary
    },
    {
      num: '03',
      title: 'CALIBRATION',
      status: calStatus,
      summary: calSummary
    },
    {
      num: '04',
      title: 'REACTION AREA',
      status: rxStatus,
      summary: rxSummary
    },
    {
      num: '05',
      title: 'VISUAL ANALYSIS',
      status: vaStatus,
      summary: vaSummary
    },
    {
      num: '06',
      title: 'CLASSIFICATION',
      status: clsStatus,
      summary: clsSummary
    },
    {
      num: '07',
      title: 'DIGITAL RECORD',
      status: recStatus,
      summary: recSummary
    }
  ];

  return (
    <div className="bg-[#111726] border border-slate-800 rounded-md p-4 space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          VERIFICATION PIPELINE
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          STRICT WORKFLOW SEQUENCE
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        {steps.map((st) => {
          const isComplete = st.status === 'COMPLETE';
          const isInProgress = st.status === 'IN_PROGRESS';
          const isFailed = st.status === 'FAILED';
          const isBlocked = st.status === 'BLOCKED';

          return (
            <div 
              key={st.num}
              className={`p-2.5 rounded border text-left transition-all ${
                isComplete
                  ? 'bg-slate-900/70 border-slate-800'
                  : isInProgress
                    ? 'bg-sky-950/30 border-sky-500/50'
                    : isFailed
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isBlocked
                        ? 'bg-slate-950/30 border-slate-800/40 opacity-50'
                        : 'bg-slate-900/20 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {st.num}
                </span>
                <div>
                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {isInProgress && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                  {isFailed && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                  {isBlocked && <span className="text-xs font-mono font-bold text-slate-500 select-none">—</span>}
                  {!isComplete && !isInProgress && !isFailed && !isBlocked && <Clock className="w-3.5 h-3.5 text-slate-600" />}
                </div>
              </div>

              <div className={`text-xs font-semibold mt-1 truncate ${isBlocked ? 'text-slate-500' : 'text-slate-200'}`}>
                {st.title}
              </div>
              <div className={`text-[11px] mt-0.5 truncate font-mono ${
                isBlocked 
                  ? 'text-slate-500 uppercase' 
                  : isFailed 
                    ? 'text-rose-400 font-sans' 
                    : 'text-slate-400 font-sans'
              }`}>
                {st.summary}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
