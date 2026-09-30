import React, { useState, useEffect } from 'react';
import { FieldTestRecord, OperatorProfile, EvidenceChainStep } from './types';
import { NavigationRail, ActiveTab } from './components/NavigationRail';
import { FieldCaptureScreen } from './pages/FieldCaptureScreen';
import { TestHistoryScreen } from './pages/TestHistoryScreen';
import { RecordsScreen } from './pages/RecordsScreen';
import { IntegrityCheckScreen } from './pages/IntegrityCheckScreen';
import { OperatorProfileScreen } from './pages/OperatorProfileScreen';
import { RecordDetailModal } from './components/RecordDetailModal';
import { 
  getAllRecords, 
  saveRecord, 
  deleteRecord, 
  clearAllRecords, 
  getOperatorProfile, 
  saveOperatorProfile,
  isDemoModeActive,
  setDemoModeActive
} from './services/storage';
import { SPECIMEN_PRESETS, renderSpecimenToDataUrl } from './services/specimenGenerator';
import { computeSha256FromDataUrl } from './services/hashing';
import { STANDARD_KIT_PROFILES } from './services/classification';
import { LoginScreen } from './components/LoginScreen';
import { AuthUser, getAuthSession, clearAuthSession } from './services/auth';

export function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(getAuthSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('capture');
  const [operator, setOperator] = useState<OperatorProfile>(getOperatorProfile());
  const [records, setRecords] = useState<FieldTestRecord[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoModeActive());
  const [viewingRecord, setViewingRecord] = useState<FieldTestRecord | null>(null);
  const [integrityTargetRecord, setIntegrityTargetRecord] = useState<FieldTestRecord | null>(null);

  // Load records from local storage on mount
  useEffect(() => {
    setRecords(getAllRecords(true));
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    const opProfile: OperatorProfile = {
      id: user.operatorId,
      name: user.displayName,
      badge: user.badgeNumber,
      role: user.role,
      unit: user.unit,
      station: user.station,
    };
    setOperator(opProfile);
  };

  const handleLogout = () => {
    clearAuthSession();
    setAuthUser(null);
  };

  const handleUpdateOperator = (newProfile: OperatorProfile) => {
    setOperator(newProfile);
    saveOperatorProfile(newProfile);
  };

  const handleToggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    setDemoModeActive(nextVal);
  };

  const handleRecordCreated = (newRecord: FieldTestRecord) => {
    setRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);
  };

  const handleDeleteRecord = (id: string) => {
    deleteRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleClearAllRecords = () => {
    if (window.confirm('Clear all logged field test records from local storage?')) {
      clearAllRecords();
      setRecords([]);
    }
  };

  const handleViewRecord = (record: FieldTestRecord) => {
    setViewingRecord(record);
  };

  const handleVerifyIntegrity = (record: FieldTestRecord) => {
    setIntegrityTargetRecord(record);
    setActiveTab('integrity');
  };

  // Seed sample demonstration records for SIH evaluators
  const handleLoadDemoRecords = async () => {
    const p1 = SPECIMEN_PRESETS[0]; // Marquis positive
    const p2 = SPECIMEN_PRESETS[1]; // Scott positive
    const p3 = SPECIMEN_PRESETS[2]; // Mecke negative

    const img1 = renderSpecimenToDataUrl(p1);
    const img2 = renderSpecimenToDataUrl(p2);
    const img3 = renderSpecimenToDataUrl(p3);

    const hash1 = await computeSha256FromDataUrl(img1);
    const hash2 = await computeSha256FromDataUrl(img2);
    const hash3 = await computeSha256FromDataUrl(img3);

    const chain1: EvidenceChainStep[] = [
      { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'High-resolution frame captured containing test pouch and reference card.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
      { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'COMPLETE', summary: 'Reference colour card detected', technicalDetail: 'Calibration card localized; patch contrast validated.', timestamp: new Date(Date.now() - 3600000 * 2 + 100).toISOString() },
      { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'COMPLETE', summary: 'Illumination normalized', technicalDetail: 'Lighting matrix calculated against white/gray/black reference standards.', timestamp: new Date(Date.now() - 3600000 * 2 + 200).toISOString() },
      { stepNumber: '04', title: 'REACTION ANALYSED', status: 'COMPLETE', summary: 'Purple / Violet Reaction', technicalDetail: 'Observed reaction chamber coloration: Purple / Violet (#541887).', timestamp: new Date(Date.now() - 3600000 * 2 + 300).toISOString() },
      { stepNumber: '05', title: 'RESULT RECORDED', status: 'COMPLETE', summary: 'POSITIVE', technicalDetail: 'Presumptive positive reaction detected. Does not replace laboratory confirmatory testing.', timestamp: new Date(Date.now() - 3600000 * 2 + 400).toISOString() },
      { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${hash1.slice(0, 14)}...`, technicalDetail: `Cryptographic SHA-256 fingerprint: ${hash1}`, timestamp: new Date(Date.now() - 3600000 * 2 + 500).toISOString() },
      { stepNumber: '07', title: 'DIGITAL RECORD SEALED', status: 'COMPLETE', summary: 'Tamper-evident record created', technicalDetail: 'Record locked into local audit trail.', timestamp: new Date(Date.now() - 3600000 * 2 + 600).toISOString() },
    ];

    const chain2: EvidenceChainStep[] = [
      { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'High-resolution frame captured containing test pouch and reference card.', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
      { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'COMPLETE', summary: 'Reference colour card detected', technicalDetail: 'Calibration card localized; patch contrast validated.', timestamp: new Date(Date.now() - 3600000 * 5 + 100).toISOString() },
      { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'COMPLETE', summary: 'Illumination normalized', technicalDetail: 'Lighting matrix calculated against white/gray/black reference standards.', timestamp: new Date(Date.now() - 3600000 * 5 + 200).toISOString() },
      { stepNumber: '04', title: 'REACTION ANALYSED', status: 'COMPLETE', summary: 'Cobalt Blue Reaction', technicalDetail: 'Observed reaction chamber coloration: Cobalt Blue (#0c6e8e).', timestamp: new Date(Date.now() - 3600000 * 5 + 300).toISOString() },
      { stepNumber: '05', title: 'RESULT RECORDED', status: 'COMPLETE', summary: 'POSITIVE', technicalDetail: 'Presumptive positive reaction detected. Does not replace laboratory confirmatory testing.', timestamp: new Date(Date.now() - 3600000 * 5 + 400).toISOString() },
      { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${hash2.slice(0, 14)}...`, technicalDetail: `Cryptographic SHA-256 fingerprint: ${hash2}`, timestamp: new Date(Date.now() - 3600000 * 5 + 500).toISOString() },
      { stepNumber: '07', title: 'DIGITAL RECORD SEALED', status: 'COMPLETE', summary: 'Tamper-evident record created', technicalDetail: 'Record locked into local audit trail.', timestamp: new Date(Date.now() - 3600000 * 5 + 600).toISOString() },
    ];

    const chain3: EvidenceChainStep[] = [
      { stepNumber: '01', title: 'IMAGE CAPTURED', status: 'COMPLETE', summary: 'Field photo acquired', technicalDetail: 'High-resolution frame captured containing test pouch and reference card.', timestamp: new Date(Date.now() - 3600000 * 18).toISOString() },
      { stepNumber: '02', title: 'REFERENCE VERIFIED', status: 'COMPLETE', summary: 'Reference colour card detected', technicalDetail: 'Calibration card localized; patch contrast validated.', timestamp: new Date(Date.now() - 3600000 * 18 + 100).toISOString() },
      { stepNumber: '03', title: 'CALIBRATION COMPLETED', status: 'COMPLETE', summary: 'Illumination normalized', technicalDetail: 'Lighting matrix calculated against white/gray/black reference standards.', timestamp: new Date(Date.now() - 3600000 * 18 + 200).toISOString() },
      { stepNumber: '04', title: 'REACTION ANALYSED', status: 'COMPLETE', summary: 'Clear / Pale Straw (Unreacted)', technicalDetail: 'No chromogenic shift observed. Reaction matches negative baseline.', timestamp: new Date(Date.now() - 3600000 * 18 + 300).toISOString() },
      { stepNumber: '05', title: 'RESULT RECORDED', status: 'COMPLETE', summary: 'NEGATIVE', technicalDetail: 'Presumptive negative result. Does not replace laboratory confirmatory testing.', timestamp: new Date(Date.now() - 3600000 * 18 + 400).toISOString() },
      { stepNumber: '06', title: 'IMAGE HASHED', status: 'COMPLETE', summary: `SHA-256: ${hash3.slice(0, 14)}...`, technicalDetail: `Cryptographic SHA-256 fingerprint: ${hash3}`, timestamp: new Date(Date.now() - 3600000 * 18 + 500).toISOString() },
      { stepNumber: '07', title: 'DIGITAL RECORD SEALED', status: 'COMPLETE', summary: 'Tamper-evident record created', technicalDetail: 'Record locked into local audit trail.', timestamp: new Date(Date.now() - 3600000 * 18 + 600).toISOString() },
    ];

    const demoRecords: FieldTestRecord[] = [
      {
        id: 'demo-rec-1',
        testId: 'FT-2026-894201',
        kitProfile: STANDARD_KIT_PROFILES['Marquis'],
        capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          accuracyMeters: 8,
          description: 'Sector 4 Checkpoint (GPS Acquired)',
          isAvailable: true
        },
        operator: {
          id: operator.id,
          name: operator.name,
          badge: operator.badge,
          role: operator.role
        },
        imageDataUrl: img1,
        imageQuality: 'ACCEPTABLE',
        referenceCard: {
          detected: true,
          statusText: 'Reference Colour Card Detected',
          lightingStatus: 'ACCEPTABLE',
          calibrationReady: true,
          patches: {
            white: { name: 'White', expectedHex: '#FFFFFF', measuredHex: '#FCFCF8', isCalibrated: true },
            neutralGray: { name: 'Gray', expectedHex: '#808080', measuredHex: '#7F8082', isCalibrated: true },
            black: { name: 'Black', expectedHex: '#191919', measuredHex: '#181819', isCalibrated: true },
            referenceHue: { name: 'Cyan', expectedHex: '#00A2E8', measuredHex: '#02A0E6', isCalibrated: true }
          }
        },
        reactionArea: {
          detected: true,
          observedColorName: 'Purple / Violet Reaction',
          rawHex: '#521882',
          calibratedHex: '#541887',
          statusText: 'Kit Reaction Chamber Identified'
        },
        classification: {
          outcome: 'POSITIVE',
          workflowState: 'ANALYSIS_COMPLETE',
          summary: 'Presumptive positive reaction detected. Characteristic purple/violet coloration matches configured Marquis standard.',
          targetSubstanceClass: STANDARD_KIT_PROFILES['Marquis'].targetCategory,
          isPresumptive: true,
          engine: 'Reference-Calibrated Reaction Analysis',
          evidenceChecklist: {
            referenceCardDetected: true,
            reactionAreaDetected: true,
            imageQualityAcceptable: true,
            digitalFingerprintGenerated: true
          }
        },
        integrity: {
          imageSha256: hash1,
          algorithm: 'SHA-256',
          status: 'TAMPER_EVIDENT_RECORD_SEALED',
          sealedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        evidenceChain: chain1,
        isDemoRecord: true
      },
      {
        id: 'demo-rec-2',
        testId: 'FT-2026-610314',
        kitProfile: STANDARD_KIT_PROFILES['Scott'],
        capturedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        location: {
          latitude: 28.6142,
          longitude: 77.2085,
          accuracyMeters: 12,
          description: 'Highway Patrol Post (GPS Acquired)',
          isAvailable: true
        },
        operator: {
          id: operator.id,
          name: operator.name,
          badge: operator.badge,
          role: operator.role
        },
        imageDataUrl: img2,
        imageQuality: 'ACCEPTABLE',
        referenceCard: {
          detected: true,
          statusText: 'Reference Colour Card Detected',
          lightingStatus: 'ACCEPTABLE',
          calibrationReady: true,
          patches: {
            white: { name: 'White', expectedHex: '#FFFFFF', measuredHex: '#FFFFFF', isCalibrated: true },
            neutralGray: { name: 'Gray', expectedHex: '#808080', measuredHex: '#808080', isCalibrated: true },
            black: { name: 'Black', expectedHex: '#191919', measuredHex: '#191919', isCalibrated: true },
            referenceHue: { name: 'Cyan', expectedHex: '#00A2E8', measuredHex: '#00A2E8', isCalibrated: true }
          }
        },
        reactionArea: {
          detected: true,
          observedColorName: 'Cobalt Blue Reaction',
          rawHex: '#0c6e8e',
          calibratedHex: '#0c6e8e',
          statusText: 'Kit Reaction Chamber Identified'
        },
        classification: {
          outcome: 'POSITIVE',
          workflowState: 'ANALYSIS_COMPLETE',
          summary: 'Presumptive positive reaction detected. Characteristic cobalt blue coloration matches configured Scott standard.',
          targetSubstanceClass: STANDARD_KIT_PROFILES['Scott'].targetCategory,
          isPresumptive: true,
          engine: 'Reference-Calibrated Reaction Analysis',
          evidenceChecklist: {
            referenceCardDetected: true,
            reactionAreaDetected: true,
            imageQualityAcceptable: true,
            digitalFingerprintGenerated: true
          }
        },
        integrity: {
          imageSha256: hash2,
          algorithm: 'SHA-256',
          status: 'TAMPER_EVIDENT_RECORD_SEALED',
          sealedAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        evidenceChain: chain2,
        isDemoRecord: true
      },
      {
        id: 'demo-rec-3',
        testId: 'FT-2026-302928',
        kitProfile: STANDARD_KIT_PROFILES['Mecke'],
        capturedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        location: {
          latitude: 28.6130,
          longitude: 77.2095,
          accuracyMeters: 15,
          description: 'Inspection Depot (Station Fixed)',
          isAvailable: true
        },
        operator: {
          id: operator.id,
          name: operator.name,
          badge: operator.badge,
          role: operator.role
        },
        imageDataUrl: img3,
        imageQuality: 'ACCEPTABLE',
        referenceCard: {
          detected: true,
          statusText: 'Reference Colour Card Detected',
          lightingStatus: 'ACCEPTABLE',
          calibrationReady: true,
          patches: {
            white: { name: 'White', expectedHex: '#FFFFFF', measuredHex: '#FCFCFC', isCalibrated: true },
            neutralGray: { name: 'Gray', expectedHex: '#808080', measuredHex: '#7F7F7F', isCalibrated: true },
            black: { name: 'Black', expectedHex: '#191919', measuredHex: '#181818', isCalibrated: true },
            referenceHue: { name: 'Cyan', expectedHex: '#00A2E8', measuredHex: '#02A0E7', isCalibrated: true }
          }
        },
        reactionArea: {
          detected: true,
          observedColorName: 'Clear / Pale Straw (Unreacted)',
          rawHex: '#faf6da',
          calibratedHex: '#faf6da',
          statusText: 'Kit Reaction Chamber Identified'
        },
        classification: {
          outcome: 'NEGATIVE',
          workflowState: 'ANALYSIS_COMPLETE',
          summary: 'No characteristic colour change detected. The reaction chamber remained unreacted, matching the negative baseline for Mecke reagent.',
          targetSubstanceClass: STANDARD_KIT_PROFILES['Mecke'].targetCategory,
          isPresumptive: true,
          engine: 'Reference-Calibrated Reaction Analysis',
          evidenceChecklist: {
            referenceCardDetected: true,
            reactionAreaDetected: true,
            imageQualityAcceptable: true,
            digitalFingerprintGenerated: true
          }
        },
        integrity: {
          imageSha256: hash3,
          algorithm: 'SHA-256',
          status: 'TAMPER_EVIDENT_RECORD_SEALED',
          sealedAt: new Date(Date.now() - 3600000 * 18).toISOString()
        },
        evidenceChain: chain3,
        isDemoRecord: true
      }
    ];

    demoRecords.forEach(r => saveRecord(r));
    setRecords(demoRecords);
    setIsDemoMode(true);
    setDemoModeActive(true);
  };

  // If operator is not authenticated, show dedicated login screen
  if (!authUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col lg:flex-row font-sans">
      {/* Navigation Rail / Sidebar */}
      <NavigationRail
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        operator={operator}
        authUser={authUser}
        onLogout={handleLogout}
        isDemoMode={isDemoMode}
        toggleDemoMode={handleToggleDemoMode}
        recordCount={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080b11] tech-grid">
        {/* Top Context Bar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2.5 bg-[#0a0e17] border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">FIELD TEST VERIFICATION CONSOLE</span>
            <span className="text-slate-600">/</span>
            <span className="text-sky-400 font-semibold uppercase">
              {activeTab === 'capture' && '01 FIELD TEST CAPTURE'}
              {activeTab === 'history' && '02 TEST HISTORY AUDIT LOG'}
              {activeTab === 'records' && '03 EVIDENCE DOSSIER ARCHIVE'}
              {activeTab === 'integrity' && '04 INTEGRITY CHECK (SHA-256)'}
              {activeTab === 'operator' && '05 OPERATOR IDENTIFICATION'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            {isDemoMode && (
              <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-300 font-bold">
                DEMONSTRATION MODE
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">OPERATOR:</span>
              <span className="text-slate-200 font-semibold">{operator.id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">SESSION:</span>
              <span className="text-emerald-400 font-semibold uppercase">
                {authUser.authProvider === 'phone' ? 'OTP VERIFIED' : 'GOOGLE AUTH'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 hover:border-rose-500/60 text-slate-400 hover:text-rose-400 transition"
              title="Sign Out / Switch Operator"
            >
              SIGN OUT
            </button>
          </div>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'capture' && (
            <FieldCaptureScreen
              operator={operator}
              onRecordCreated={handleRecordCreated}
              onViewRecord={handleViewRecord}
              isDemoMode={isDemoMode}
            />
          )}

          {activeTab === 'history' && (
            <TestHistoryScreen
              records={records}
              onViewRecord={handleViewRecord}
              onNavigateCapture={() => setActiveTab('capture')}
              onDeleteRecord={handleDeleteRecord}
              onClearAll={handleClearAllRecords}
              isDemoMode={isDemoMode}
              onLoadDemoRecords={handleLoadDemoRecords}
            />
          )}

          {activeTab === 'records' && (
            <RecordsScreen
              records={records}
              onViewRecord={handleViewRecord}
              onNavigateCapture={() => setActiveTab('capture')}
              onVerifyIntegrity={handleVerifyIntegrity}
            />
          )}

          {activeTab === 'integrity' && (
            <IntegrityCheckScreen
              records={records}
              initialRecord={integrityTargetRecord}
            />
          )}

          {activeTab === 'operator' && (
            <OperatorProfileScreen
              operator={operator}
              authUser={authUser}
              onLogout={handleLogout}
              onUpdateOperator={handleUpdateOperator}
              isDemoMode={isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
              recordCount={records.length}
            />
          )}
        </div>
      </main>

      {/* Full Modal Evidence Receipt */}
      {viewingRecord && (
        <RecordDetailModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onVerifyIntegrity={handleVerifyIntegrity}
        />
      )}
    </div>
  );
}

export default App;
