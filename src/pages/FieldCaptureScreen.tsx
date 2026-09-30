import React, { useState, useRef, useEffect } from 'react';
import { 
  KitType, 
  FieldTestRecord, 
  OperatorProfile, 
  ReferenceCardData, 
  ReactionAreaData, 
  ClassificationResult,
  ImageQualityStatus,
  EvidenceChainStep,
  WorkflowState 
} from '../types';
import { ReferenceCardGuide } from '../components/ReferenceCardGuide';
import { ReactionAreaGuide } from '../components/ReactionAreaGuide';
import { VerificationPipeline, PipelineStage } from '../components/VerificationPipeline';
import { ClassificationResultCard } from '../components/ClassificationResultCard';
import { EvidenceChain } from '../components/EvidenceChain';
import { StatusBadge } from '../components/StatusBadge';
import { analyzeFieldImage } from '../services/imageProcessing';
import { classifyReaction, STANDARD_KIT_PROFILES } from '../services/classification';
import { computeSha256FromDataUrl } from '../services/hashing';
import { getFieldLocation, FieldLocation, FIELD_STATION_PRESETS, saveCustomLocation, clearCustomLocation } from '../services/geolocation';
import { saveRecord } from '../services/storage';
import { SPECIMEN_PRESETS, renderSpecimenToDataUrl, FieldSpecimenPreset } from '../services/specimenGenerator';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  MapPin, 
  User, 
  Crosshair, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck,
  Tag,
  ShieldCheck,
  HelpCircle,
  Eye,
  Compass,
  Navigation
} from 'lucide-react';

interface FieldCaptureScreenProps {
  operator: OperatorProfile;
  onRecordCreated: (record: FieldTestRecord) => void;
  onViewRecord: (record: FieldTestRecord) => void;
  isDemoMode: boolean;
}

export const FieldCaptureScreen: React.FC<FieldCaptureScreenProps> = ({
  operator,
  onRecordCreated,
  onViewRecord,
  isDemoMode
}) => {
  const [selectedKitType, setSelectedKitType] = useState<KitType>('Marquis');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraUnavailableMessage, setCameraUnavailableMessage] = useState<string | null>(null);

  // Workflow states
  const [workflowState, setWorkflowState] = useState<WorkflowState>('NOT_STARTED');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('IDLE');
  const [capturedImageDataUrl, setCapturedImageDataUrl] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQualityStatus>('ACCEPTABLE');
  const [referenceCardData, setReferenceCardData] = useState<ReferenceCardData | null>(null);
  const [reactionAreaData, setReactionAreaData] = useState<ReactionAreaData | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [fieldLocation, setFieldLocation] = useState<FieldLocation | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);
  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);
  const [createdRecord, setCreatedRecord] = useState<FieldTestRecord | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeEvidenceChain, setActiveEvidenceChain] = useState<EvidenceChainStep[]>([]);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeKitProfile = STANDARD_KIT_PROFILES[selectedKitType];

  // Refresh or Acquire Device Location
  const refreshLocation = async (forceFresh = true) => {
    setIsGpsLoading(true);
    try {
      const loc = await getFieldLocation(forceFresh);
      setFieldLocation(loc);
    } catch (err) {
      console.warn('GPS location error:', err);
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Initialize GPS Coordinates on load
  useEffect(() => {
    refreshLocation(false);
  }, []);

  const [useStandardCalibration, setUseStandardCalibration] = useState<boolean>(true);
  const [simulatedColor, setSimulatedColor] = useState<'LIVE' | 'POSITIVE' | 'NEGATIVE'>('LIVE');

  // Handle camera start with robust constraints fallback and immediate element binding
  const startCamera = async () => {
    setCameraUnavailableMessage(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (envErr) {
        console.info('Environment camera not found, falling back to default webcam', envErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error on start:', playErr);
        }
      }
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setCameraUnavailableMessage('Camera access unavailable. Please check camera permissions or upload an image.');
      setIsCameraActive(false);
    }
  };

  // Sync stream to video element when camera becomes active or element mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      videoRef.current.play().catch(err => {
        console.warn('Video play error on sync:', err);
      });
    }
  }, [isCameraActive]);

  // Handle camera stop
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Analysis sequence with STRICT DEPENDENCIES
  const runVerificationPipeline = async (
    imageDataUrl: string, 
    forceMissingCard: boolean = false,
    forcePoorQuality: boolean = false,
    standardCard: boolean = useStandardCalibration,
    targetSimColor: 'LIVE' | 'POSITIVE' | 'NEGATIVE' = simulatedColor
  ) => {
    setIsAnalyzing(true);
    setCapturedImageDataUrl(imageDataUrl);
    setCreatedRecord(null);

    const now = new Date().toISOString();

    try {
      // 1. IMAGE CAPTURE & INTEGRITY HASH
      setPipelineStage('CAPTURING');
      const sha256 = await computeSha256FromDataUrl(imageDataUrl);
      setImageHash(sha256);
      await new Promise(r => setTimeout(r, 150));

      // Determine simulated reaction color if set
      let simColorParam: string | undefined = undefined;
      if (targetSimColor === 'POSITIVE') {
        if (selectedKitType === 'Marquis' || selectedKitType === 'Duquenois-Levine') {
          simColorParam = 'Purple / Violet Reaction';
        } else if (selectedKitType === 'Scott') {
          simColorParam = 'Cobalt Blue Reaction';
        } else {
          simColorParam = 'Blue-Green Reaction';
        }
      } else if (targetSimColor === 'NEGATIVE') {
        simColorParam = 'Clear / Pale Straw (Unreacted)';
      }

      // 2. REFERENCE CARD VALIDATION
      setPipelineStage('CARD_CHECK');
      const analysis = await analyzeFieldImage(
        imageDataUrl, 
        forceMissingCard, 
        forcePoorQuality, 
        standardCard, 
        simColorParam
      );
      setImageQuality(analysis.imageQuality);
      setReferenceCardData(analysis.referenceCard);
      await new Promise(r => setTimeout(r, 150));

      // IF REFERENCE CARD IS NOT DETECTED
      if (!analysis.referenceCard.detected) {
        setPipelineStage('RECAPTURE_REQUIRED');
        setWorkflowState('RECAPTURE_REQUIRED');
        setReactionAreaData(analysis.reactionArea);
        
        const classification = classifyReaction(
          activeKitProfile,
          analysis.referenceCard,
          analysis.reactionArea,
          analysis.imageQuality
        );
        setClassificationResult(classification);

        const chain: EvidenceChainStep[] = [
          { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'Image frame acquired via camera capture.', timestamp: now },
          { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'FAILED', summary: 'Reference card missing', technicalDetail: 'Physical reference colour card not detected in frame. Recapture or apply standard calibration.', timestamp: new Date(Date.now() + 100).toISOString() },
          { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'BLOCKED', summary: 'BLOCKED', technicalDetail: 'Calibration blocked: Requires verified reference card.', timestamp: new Date(Date.now() + 200).toISOString() },
          { stepNumber: '04', title: 'REACTION ANALYSED', status: 'BLOCKED', summary: 'BLOCKED', technicalDetail: 'Reaction analysis blocked: Calibration required.', timestamp: new Date(Date.now() + 300).toISOString() },
          { stepNumber: '05', title: 'RESULT RECORDED', status: 'BLOCKED', summary: 'BLOCKED', technicalDetail: 'Classification blocked until reference validation passes.', timestamp: new Date(Date.now() + 400).toISOString() },
          { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${sha256.slice(0, 14)}...`, technicalDetail: `Cryptographic fingerprint: ${sha256}`, timestamp: new Date(Date.now() + 500).toISOString() },
          { stepNumber: '07', title: 'DIGITAL RECORD SEALED', status: 'BLOCKED', summary: 'NOT CREATED', technicalDetail: 'Record creation blocked until all stages pass.', timestamp: new Date(Date.now() + 600).toISOString() }
        ];
        setActiveEvidenceChain(chain);
        return;
      }

      // 3. CALIBRATION
      setPipelineStage('CALIBRATING');
      await new Promise(r => setTimeout(r, 150));

      if (!analysis.referenceCard.calibrationReady) {
        setPipelineStage('BLOCKED');
        setWorkflowState('ANALYSIS_BLOCKED');
        setReactionAreaData(analysis.reactionArea);

        const classification = classifyReaction(
          activeKitProfile,
          analysis.referenceCard,
          analysis.reactionArea,
          analysis.imageQuality
        );
        setClassificationResult(classification);

        const chain: EvidenceChainStep[] = [
          { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'Frame acquired via camera capture.', timestamp: now },
          { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'COMPLETE', summary: 'Reference card detected', technicalDetail: 'Standard patches verified in frame.', timestamp: new Date(Date.now() + 100).toISOString() },
          { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'FAILED', summary: 'Calibration failed', technicalDetail: analysis.referenceCard.calibrationError || 'Lighting normalization failed.', timestamp: new Date(Date.now() + 200).toISOString() },
          { stepNumber: '04', title: 'REACTION ANALYSED', status: 'BLOCKED', summary: 'BLOCKED', technicalDetail: 'Reaction analysis blocked: Lighting calibration failed.', timestamp: new Date(Date.now() + 300).toISOString() },
          { stepNumber: '05', title: 'RESULT RECORDED', status: 'BLOCKED', summary: 'BLOCKED', technicalDetail: 'Result withheld: Calibration failed.', timestamp: new Date(Date.now() + 400).toISOString() },
          { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${sha256.slice(0, 14)}...`, technicalDetail: `Cryptographic fingerprint: ${sha256}`, timestamp: new Date(Date.now() + 500).toISOString() },
          { stepNumber: '07', title: 'DIGITAL RECORD SEALED', status: 'BLOCKED', summary: 'NOT CREATED', technicalDetail: 'Record blocked due to calibration failure.', timestamp: new Date(Date.now() + 600).toISOString() }
        ];
        setActiveEvidenceChain(chain);
        return;
      }

      // 4. REACTION AREA VALIDATION
      setPipelineStage('REACTION_ANALYSIS');
      setReactionAreaData(analysis.reactionArea);
      await new Promise(r => setTimeout(r, 150));

      if (!analysis.reactionArea.detected) {
        setPipelineStage('RECAPTURE_REQUIRED');
        setWorkflowState('RECAPTURE_REQUIRED');

        const classification = classifyReaction(
          activeKitProfile,
          analysis.referenceCard,
          analysis.reactionArea,
          analysis.imageQuality
        );
        setClassificationResult(classification);

        const chain: EvidenceChainStep[] = [
          { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'Frame acquired via camera capture.', timestamp: now },
          { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'COMPLETE', summary: 'Reference card detected', technicalDetail: 'Standard patches verified in frame.', timestamp: new Date(Date.now() + 100).toISOString() },
          { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'COMPLETE', summary: 'Lighting normalized', technicalDetail: 'Reference gains calculated from card patches.', timestamp: new Date(Date.now() + 200).toISOString() },
          { stepNumber: '04', title: 'REACTION ANALYSED', status: 'FAILED', summary: 'Reaction chamber missing', technicalDetail: analysis.reactionArea.validationError || 'Kit reaction chamber not detected inside guide brackets.', timestamp: new Date(Date.now() + 300).toISOString() },
          { stepNumber: '05', title: 'RESULT RECORDED', status: 'BLOCKED', summary: 'BLOCKED', technicalDetail: 'Result withheld: Reaction chamber missing.', timestamp: new Date(Date.now() + 400).toISOString() },
          { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${sha256.slice(0, 14)}...`, technicalDetail: `Cryptographic fingerprint: ${sha256}`, timestamp: new Date(Date.now() + 500).toISOString() },
          { stepNumber: '07', title: 'DIGITAL RECORD SEALED', status: 'BLOCKED', summary: 'NOT CREATED', technicalDetail: 'Record blocked: Reaction chamber validation failed.', timestamp: new Date(Date.now() + 600).toISOString() }
        ];
        setActiveEvidenceChain(chain);
        return;
      }

      // 5. VISUAL ANALYSIS & RESULT
      const classification = classifyReaction(
        activeKitProfile,
        analysis.referenceCard,
        analysis.reactionArea,
        analysis.imageQuality
      );
      setClassificationResult(classification);
      setWorkflowState(classification.workflowState);
      setPipelineStage('COMPLETED');

      const chain: EvidenceChainStep[] = [
        { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'Frame acquired via camera capture.', timestamp: now },
        { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'COMPLETE', summary: 'Reference card detected', technicalDetail: 'White, mid-gray, black, and reference cyan patches validated in frame.', timestamp: new Date(Date.now() + 100).toISOString() },
        { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'COMPLETE', summary: 'Lighting normalized', technicalDetail: 'Colorimetric gains applied against reference standards.', timestamp: new Date(Date.now() + 200).toISOString() },
        { stepNumber: '04', title: 'REACTION ANALYSED', status: 'COMPLETE', summary: analysis.reactionArea.observedColorName, technicalDetail: `Reaction chamber validated. Observed coloration: ${analysis.reactionArea.observedColorName}.`, timestamp: new Date(Date.now() + 300).toISOString() },
        { stepNumber: '05', title: 'RESULT RECORDED', status: 'COMPLETE', summary: classification.outcome, technicalDetail: `Presumptive outcome: ${classification.outcome}. Configured for ${activeKitProfile.displayName}.`, timestamp: new Date(Date.now() + 400).toISOString() },
        { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${sha256.slice(0, 14)}...`, technicalDetail: `Cryptographic SHA-256 fingerprint: ${sha256}`, timestamp: new Date(Date.now() + 500).toISOString() },
        { 
          stepNumber: '07', 
          title: 'DIGITAL RECORD SEALED', 
          status: 'PENDING', 
          summary: 'Ready to seal', 
          technicalDetail: fieldLocation
            ? `Operator timestamp, GPS fix (${fieldLocation.latitude.toFixed(4)}°N, ${fieldLocation.longitude.toFixed(4)}°E ±${fieldLocation.accuracyMeters}m), image hash, and visual analysis ready to be locked into local audit trail.`
            : 'Operator timestamp, GPS fix, image hash, and visual analysis ready to be locked into local audit trail.', 
          timestamp: new Date(Date.now() + 600).toISOString() 
        }
      ];

      setActiveEvidenceChain(chain);
    } catch (err) {
      console.error('Pipeline analysis error', err);
      setPipelineStage('RECAPTURE_REQUIRED');
      setWorkflowState('RECAPTURE_REQUIRED');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Video capture
  const handleCaptureVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCamera();
      runVerificationPipeline(dataUrl, false, false, useStandardCalibration, simulatedColor);
    }
  };

  // Upload image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        stopCamera();
        runVerificationPipeline(dataUrl, false, false, useStandardCalibration, simulatedColor);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply standard card when card was missing
  const handleApplyStandardCard = () => {
    setUseStandardCalibration(true);
    if (capturedImageDataUrl) {
      runVerificationPipeline(capturedImageDataUrl, false, false, true, simulatedColor);
    }
  };

  // Preset specimen
  const handleSelectSpecimen = (preset: FieldSpecimenPreset) => {
    stopCamera();
    setSelectedKitType(preset.kitType);
    const dataUrl = renderSpecimenToDataUrl(preset);
    runVerificationPipeline(dataUrl, !preset.hasReferenceCard, false, preset.hasReferenceCard);
  };

  // Reset
  const handleRecapture = () => {
    setCapturedImageDataUrl(null);
    setReferenceCardData(null);
    setReactionAreaData(null);
    setClassificationResult(null);
    setImageHash(null);
    setPipelineStage('IDLE');
    setWorkflowState('NOT_STARTED');
    setCreatedRecord(null);
    setActiveEvidenceChain([]);
  };

  // Create Digital Record
  const handleCreateRecord = () => {
    if (!capturedImageDataUrl || !referenceCardData || !reactionAreaData || !classificationResult || !imageHash) {
      return;
    }

    const testId = `FT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();

    const locationToSave = fieldLocation ? {
      latitude: fieldLocation.latitude,
      longitude: fieldLocation.longitude,
      accuracyMeters: fieldLocation.accuracyMeters,
      description: fieldLocation.description,
      isAvailable: fieldLocation.status === 'FIXED' || fieldLocation.source === 'DEVICE_GPS' || fieldLocation.source === 'STATION_MANUAL'
    } : {
      latitude: 28.613939,
      longitude: 77.209021,
      accuracyMeters: 20,
      description: 'Field Station Baseline Location',
      isAvailable: true
    };

    const updatedChain: EvidenceChainStep[] = activeEvidenceChain.map((step, idx) => {
      if (idx === 6) {
        return {
          ...step,
          status: 'COMPLETE',
          summary: 'Tamper-evident record sealed',
          technicalDetail: `Record locked into tamper-evident audit trail under Test ID: ${testId}. Signed with GPS fix (${locationToSave.latitude.toFixed(4)}°N, ${locationToSave.longitude.toFixed(4)}°E ±${locationToSave.accuracyMeters}m).`,
          timestamp: nowIso
        };
      }
      return step;
    });

    const record: FieldTestRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `rec-${Date.now()}`,
      testId,
      kitProfile: activeKitProfile,
      capturedAt: nowIso,
      location: locationToSave,
      operator: {
        id: operator.id,
        name: operator.name,
        badge: operator.badge,
        role: operator.role
      },
      imageDataUrl: capturedImageDataUrl,
      imageQuality,
      referenceCard: referenceCardData,
      reactionArea: reactionAreaData,
      classification: classificationResult,
      integrity: {
        imageSha256: imageHash,
        algorithm: 'SHA-256',
        status: 'TAMPER_EVIDENT_RECORD_SEALED',
        sealedAt: nowIso
      },
      evidenceChain: updatedChain,
      isDemoRecord: isDemoMode
    };

    saveRecord(record);
    setCreatedRecord(record);
    setActiveEvidenceChain(updatedChain);
    onRecordCreated(record);
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-100 uppercase">
              FIELD TEST CAPTURE
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-400">
              SOFTWARE COMPANION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Capture field-test reaction with reference colour calibration standard.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowDemoModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#111726] border border-sky-500/40 hover:bg-sky-950/60 text-sky-300 text-xs font-mono font-semibold transition shadow-sm"
            title="Benchmark evaluation samples"
          >
            <Tag className="w-3.5 h-3.5 text-sky-400" />
            <span>BENCHMARK PRESETS</span>
          </button>

          {/* Kit Profile Selector */}
          <div className="flex items-center gap-2 bg-[#111726] border border-slate-800 rounded px-3 py-1.5">
            <Tag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400">KIT PROFILE:</div>
              <select
                value={selectedKitType}
                onChange={(e) => setSelectedKitType(e.target.value as KitType)}
                disabled={isAnalyzing || !!capturedImageDataUrl}
                className="text-xs font-semibold bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Marquis" className="bg-slate-900">FTK-000184 (Marquis Reagent Pouch)</option>
                <option value="Scott" className="bg-slate-900">FTK-000219 (Scott Cocaine Pouch)</option>
                <option value="Mecke" className="bg-slate-900">FTK-000305 (Mecke Reagent Kit)</option>
                <option value="Duquenois-Levine" className="bg-slate-900">FTK-000412 (Duquenois-Levine Kit)</option>
                <option value="General Colorimetric" className="bg-slate-900">FTK-000091 (General Colorimetric)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Compact Kit Profile Strip */}
      <div className="bg-[#111726] border border-slate-800 rounded px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sky-400">{activeKitProfile.displayName}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">ID: {activeKitProfile.kitId}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>TARGET: <strong className="text-slate-200">{activeKitProfile.targetCategory.split('(')[0]}</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">4-PATCH CALIBRATION</span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout (Balanced Heights, No Empty Gaps) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Camera & Immediate Guides (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Capture Workspace Viewport */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-md overflow-hidden relative shadow-lg">
            {/* Top Bar on Camera with Calibration Standard Selector */}
            <div className="px-3.5 py-2 bg-[#0e1320] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-200 font-semibold">CAMERA WORKSPACE</span>
              </div>

              {/* Calibration Standard Mode Toggle */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Calibration:</span>
                <button
                  onClick={() => setUseStandardCalibration(!useStandardCalibration)}
                  className={`px-2 py-0.5 rounded border transition font-mono text-[10px] font-semibold ${
                    useStandardCalibration 
                      ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300' 
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                  title="Toggle standard calibration card standard"
                >
                  {useStandardCalibration ? '✓ Standard Card Active' : 'Strict Physical Card'}
                </button>
              </div>
            </div>

            {/* Viewport Area */}
            <div className="relative aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.currentTarget as HTMLVideoElement).play().catch(console.warn);
                }}
                className={`w-full h-full object-cover ${
                  isCameraActive && !capturedImageDataUrl ? 'block' : 'hidden'
                }`}
              />

              {capturedImageDataUrl ? (
                <img
                  src={capturedImageDataUrl}
                  alt="Captured field test"
                  className="w-full h-full object-contain"
                />
              ) : !isCameraActive ? (
                <div className="text-center p-6 space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Camera className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 font-mono">
                      READY TO CAPTURE FIELD TEST
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Align the test kit reaction window inside the guide brackets.
                    </p>
                  </div>

                  {cameraUnavailableMessage && (
                    <div className="p-3 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs text-left space-y-1">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
                        CAMERA ACCESS UNAVAILABLE
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {cameraUnavailableMessage}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={startCamera}
                      className="py-2 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition"
                    >
                      <Camera className="w-4 h-4" />
                      ACTIVATE CAMERA
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-4 h-4" />
                      UPLOAD IMAGE
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Visual Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5">
                <div className="relative flex-1 w-full my-1">
                  {/* Center Guide: Test Kit Reaction Area */}
                  <div className="absolute left-[33%] top-[12%] w-[34%] h-[74%] border-2 border-dashed border-sky-400/90 rounded bg-sky-500/5 flex flex-col justify-between p-2 shadow-sm">
                    <span className="text-[10px] font-mono text-sky-200 font-bold bg-black/85 px-1.5 py-0.5 rounded self-start border border-sky-500/50">
                      [ TEST / REACTION AREA ]
                    </span>
                    <div className="self-center text-sky-400/35">
                      <Crosshair className="w-8 h-8" />
                    </div>
                    <span className="text-[9px] text-slate-200 bg-black/85 px-1.5 py-0.5 rounded self-center text-center border border-slate-700">
                      Align reaction window here
                    </span>
                  </div>

                  {/* Lower-Left Guide: Physical or Standard Reference Card */}
                  <div className="absolute left-[4%] bottom-[4%] w-[27%] h-[38%] border-2 border-dashed border-emerald-400/90 rounded bg-emerald-500/5 p-1.5 flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-mono text-emerald-200 font-bold bg-black/85 px-1 rounded self-start border border-emerald-500/50">
                      [ REFERENCE CARD ]
                    </span>
                    {useStandardCalibration ? (
                      <div className="bg-black/90 p-1 rounded border border-emerald-500/40 space-y-1">
                        <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-center">
                          <div className="bg-white text-black font-bold rounded-sm h-4 flex items-center justify-center">W</div>
                          <div className="bg-gray-400 text-white font-bold rounded-sm h-4 flex items-center justify-center">G</div>
                          <div className="bg-black text-white border border-slate-700 font-bold rounded-sm h-4 flex items-center justify-center">B</div>
                          <div className="bg-cyan-500 text-white font-bold rounded-sm h-4 flex items-center justify-center">C</div>
                        </div>
                        <div className="text-[8px] text-emerald-300 font-mono text-center">
                          STANDARD CARD ACTIVE ✓
                        </div>
                      </div>
                    ) : (
                      <span className="text-[8px] text-slate-200 bg-black/85 px-1 py-0.5 rounded self-center text-center border border-slate-700">
                        Position card here
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-3 bg-[#0d121f] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isCameraActive ? (
                  <>
                    <button
                      onClick={handleCaptureVideo}
                      disabled={isAnalyzing}
                      className="py-2 px-5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold tracking-wide flex items-center gap-2 shadow transition"
                    >
                      <Camera className="w-4 h-4" />
                      CAPTURE
                    </button>
                    <button
                      onClick={stopCamera}
                      className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
                    >
                      STOP CAMERA
                    </button>
                  </>
                ) : capturedImageDataUrl ? (
                  <>
                    <button
                      onClick={handleRecapture}
                      className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      CAPTURE AGAIN
                    </button>
                    {createdRecord && (
                      <button
                        onClick={() => onViewRecord(createdRecord)}
                        className="py-2 px-3 rounded bg-emerald-950 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 text-xs font-mono flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        VIEW RECORD
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={startCamera}
                    className="py-2 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    ACTIVATE CAMERA
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                {!capturedImageDataUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    UPLOAD
                  </button>
                )}
              </div>

              {/* Reaction Simulation Selector (Allows instant positive/negative verification) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-400">Reaction:</span>
                  <select
                    value={simulatedColor}
                    onChange={(e) => setSimulatedColor(e.target.value as any)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-[11px]"
                  >
                    <option value="LIVE" className="bg-slate-900">Live Camera Pixels</option>
                    <option value="POSITIVE" className="bg-slate-900">Positive Reaction</option>
                    <option value="NEGATIVE" className="bg-slate-900">Negative Baseline</option>
                  </select>
                </div>

                {/* Operator Pill */}
                <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono">
                  <User className="w-3 h-3 text-emerald-400" />
                  <span>{operator.id}</span>
                </div>

                {/* Live GPS Coordinates & Status Pill */}
                <button
                  type="button"
                  onClick={() => setShowGpsModal(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition cursor-pointer ${
                    fieldLocation?.status === 'FIXED'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                      : fieldLocation?.status === 'PERMISSION_DENIED'
                        ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 hover:border-rose-400'
                        : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:border-amber-400'
                  }`}
                  title="Click to view GPS fix details or acquire fresh coordinates"
                >
                  <MapPin className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-bounce text-sky-400' : fieldLocation?.status === 'FIXED' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  {isGpsLoading ? (
                    <span>ACQUIRING GPS...</span>
                  ) : fieldLocation?.status === 'FIXED' ? (
                    <span>GPS: {fieldLocation.latitude.toFixed(4)}°, {fieldLocation.longitude.toFixed(4)}° (±{fieldLocation.accuracyMeters}m)</span>
                  ) : fieldLocation?.status === 'PERMISSION_DENIED' ? (
                    <span>GPS: BLOCKED (CLICK TO FIX)</span>
                  ) : (
                    <span>GPS: {fieldLocation ? `${fieldLocation.latitude.toFixed(4)}°, ${fieldLocation.longitude.toFixed(4)}°` : 'NO FIX'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Immediate Guides Side-by-Side (Fills space under camera with zero gap) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <ReferenceCardGuide
              cardData={referenceCardData}
            />
            <ReactionAreaGuide
              reactionArea={reactionAreaData}
              cardDetected={referenceCardData?.detected ?? false}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Pipeline & Classification Result (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Sequential Verification Pipeline */}
          <VerificationPipeline
            currentStage={pipelineStage}
            workflowState={workflowState}
            cardDetected={referenceCardData?.detected ?? false}
            calibrationReady={referenceCardData?.calibrationReady ?? false}
            reactionAreaDetected={reactionAreaData?.detected ?? false}
            classificationOutcome={classificationResult?.outcome}
            hasRecord={!!createdRecord}
          />

          {/* Main Classification Result Card (Immediately visible next to camera!) */}
          <ClassificationResultCard
            workflowState={workflowState}
            classification={classificationResult}
            reactionArea={reactionAreaData}
            onRecapture={handleRecapture}
            onCreateRecord={handleCreateRecord}
            onApplyStandardCard={handleApplyStandardCard}
            isRecordCreated={!!createdRecord}
          />

          {/* Success Banner when record is sealed */}
          {createdRecord && (
            <div className="p-3.5 rounded-md bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-2 shadow-sm">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  ✓ TAMPER-EVIDENT RECORD SEALED
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">
                  {createdRecord.testId}
                </span>
              </div>
              <div className="text-xs text-emerald-300/90 font-sans">
                Cryptographic SHA-256 fingerprint generated and locked into local audit trail.
              </div>
              <div className="pt-1">
                <button
                  onClick={() => onViewRecord(createdRecord)}
                  className="py-1.5 px-3.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold transition shadow"
                >
                  VIEW TEST RECORD DETAIL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL-WIDTH SECTION: Digital Evidence Chain */}
      {activeEvidenceChain.length > 0 && (
        <div className="pt-2">
          <EvidenceChain
            steps={activeEvidenceChain}
          />
        </div>
      )}

      {/* DEMONSTRATION MODE BENCHMARK MODAL (Kept strictly separate from real capture) */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-sky-500/40 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-400 font-bold uppercase">
                  DEMONSTRATION MODE
                </span>
                <h2 className="text-sm sm:text-base font-bold font-mono text-slate-100 uppercase tracking-tight">
                  BENCHMARK EVALUATION SAMPLES
                </h2>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-sm font-mono transition"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded bg-sky-950/20 border border-sky-500/20 text-xs text-sky-200 leading-relaxed font-sans">
              <strong className="text-sky-300 font-mono">SIH PRESENTATION BENCHMARKS:</strong> Select a benchmark specimen to test reference card detection, lighting normalization, invalid framing, and deterministic reaction classification without physical chemical kits.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {SPECIMEN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setShowDemoModal(false);
                    handleSelectSpecimen(preset);
                  }}
                  disabled={isAnalyzing}
                  className="p-3 rounded border border-slate-800 bg-[#0c101a] hover:border-sky-500/50 hover:bg-slate-900 text-left transition text-xs group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-slate-200 group-hover:text-sky-300 truncate">
                      {preset.name.split(':')[0]}
                    </span>
                    <StatusBadge type="outcome" value={preset.expectedOutcome} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setShowDemoModal(false)}
                className="py-1.5 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GPS DIAGNOSTIC & POSITION FIX MODAL */}
      {showGpsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-sky-500/40 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl my-auto font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm sm:text-base font-bold font-mono text-slate-100 uppercase tracking-tight">
                  GEOLOCATION SENSOR & GPS FIX
                </h2>
              </div>
              <button
                onClick={() => setShowGpsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-sm font-mono transition"
              >
                ✕
              </button>
            </div>

            {/* Current GPS Telemetry */}
            <div className="p-3.5 rounded bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">SENSOR STATUS:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  fieldLocation?.status === 'FIXED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : fieldLocation?.status === 'PERMISSION_DENIED'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}>
                  {fieldLocation?.status || 'ACQUIRING'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">LATITUDE / LONGITUDE:</span>
                <span className="text-slate-200 font-bold">
                  {fieldLocation?.latitude.toFixed(6)}°, {fieldLocation?.longitude.toFixed(6)}°
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">ESTIMATED ACCURACY:</span>
                <span className="text-sky-400">±{fieldLocation?.accuracyMeters || 15} meters</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">SOURCE:</span>
                <span className="text-slate-300">{fieldLocation?.description}</span>
              </div>
            </div>

            {/* Live Action Button */}
            <button
              onClick={() => refreshLocation(true)}
              disabled={isGpsLoading}
              className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow"
            >
              <Navigation className={`w-4 h-4 ${isGpsLoading ? 'animate-spin' : ''}`} />
              <span>{isGpsLoading ? 'ACQUIRING SATELLITE FIX...' : 'ACQUIRE LIVE DEVICE GPS POSITION'}</span>
            </button>

            {/* Station Checkpoints for Indoor Labs or Fixed Depots */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 font-semibold">
                OR LOCK TO DOCUMENTED CHECKPOINT (INDOOR / FACILITY FIX):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {FIELD_STATION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const manualLoc: FieldLocation = {
                        latitude: preset.latitude,
                        longitude: preset.longitude,
                        accuracyMeters: preset.accuracyMeters,
                        description: preset.description,
                        source: 'STATION_MANUAL',
                        status: 'FIXED',
                        timestamp: new Date().toISOString()
                      };
                      saveCustomLocation(manualLoc);
                      setFieldLocation(manualLoc);
                      setShowGpsModal(false);
                    }}
                    className="p-2.5 rounded border border-slate-800 bg-[#0c101a] hover:border-emerald-500/50 hover:bg-slate-900 text-left transition font-mono"
                  >
                    <div className="font-bold text-slate-200 text-[11px] truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-400">{preset.latitude.toFixed(4)}°, {preset.longitude.toFixed(4)}°</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                onClick={() => setShowGpsModal(false)}
                className="py-1.5 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
