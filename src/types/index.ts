export type KitType = 'Marquis' | 'Scott' | 'Duquenois-Levine' | 'Mecke' | 'General Colorimetric';

export type ClassificationOutcome = 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';

export type ImageQualityStatus = 'ACCEPTABLE' | 'DEGRADED_LIGHTING' | 'RECAPTURE_REQUIRED';

export type ReferenceCardStatus = 'WAITING' | 'DETECTED' | 'NOT_DETECTED';

export type WorkflowState = 
  | 'NOT_STARTED' 
  | 'RECAPTURE_REQUIRED' 
  | 'ANALYSIS_BLOCKED' 
  | 'INCONCLUSIVE' 
  | 'ANALYSIS_COMPLETE';

export interface KitProfile {
  kitId: string; // e.g. FTK-000184
  kitType: KitType;
  displayName: string;
  targetCategory: string;
  referenceCardRequirement: string;
  reactionAreaDefinition: string;
  classificationCriteriaSource: 'Standard Field Criteria' | 'Configured demonstration criteria';
  expectedPositiveReaction: string;
  expectedNegativeReaction: string;
}

export interface PatchColor {
  name: string;
  expectedHex: string;
  measuredHex: string;
  isCalibrated: boolean;
}

export interface ReferenceCardData {
  detected: boolean;
  statusText: string;
  lightingStatus: ImageQualityStatus;
  calibrationReady: boolean;
  calibrationError?: string;
  patches: {
    white: PatchColor;
    neutralGray: PatchColor;
    black: PatchColor;
    referenceHue: PatchColor;
  };
}

export interface ReactionAreaData {
  detected: boolean;
  observedColorName: string;
  rawHex: string;
  calibratedHex: string;
  statusText: string;
  validationError?: string;
}

export interface ClassificationResult {
  outcome: ClassificationOutcome;
  workflowState: WorkflowState;
  summary: string;
  targetSubstanceClass: string;
  recaptureReason?: string;
  blockedReason?: string;
  isPresumptive: true;
  engine: string;
  evidenceChecklist: {
    referenceCardDetected: boolean;
    calibrationSuccessful?: boolean;
    reactionAreaDetected: boolean;
    imageQualityAcceptable: boolean;
    digitalFingerprintGenerated: boolean;
  };
}

export interface EvidenceChainStep {
  stepNumber: string; // "01", "02", etc.
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'BLOCKED';
  summary: string;
  technicalDetail: string;
  timestamp?: string;
}

export interface FieldTestRecord {
  id: string; // Internal UUID
  testId: string; // Human readable FT-XXXXXXXX
  kitProfile: KitProfile;
  capturedAt: string; // ISO
  location: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    description: string;
    isAvailable: boolean;
  };
  operator: {
    id: string;
    name: string;
    badge: string;
    role: string;
  };
  imageDataUrl: string;
  imageQuality: ImageQualityStatus;
  referenceCard: ReferenceCardData;
  reactionArea: ReactionAreaData;
  classification: ClassificationResult;
  integrity: {
    imageSha256: string;
    algorithm: 'SHA-256';
    status: 'TAMPER_EVIDENT_RECORD_SEALED';
    sealedAt: string;
  };
  evidenceChain: EvidenceChainStep[];
  isDemoRecord: boolean;
}

export interface OperatorProfile {
  id: string;
  name: string;
  badge: string;
  role: string;
  unit?: string;
  station: string;
}
