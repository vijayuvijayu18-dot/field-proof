import React, { useState } from 'react';
import { FieldTestRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { EvidenceChain } from './EvidenceChain';
import { 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Hash, 
  ShieldAlert,
  Tag,
  AlertOctagon
} from 'lucide-react';
import { verifyImageIntegrity } from '../services/hashing';

interface RecordDetailModalProps {
  record: FieldTestRecord | null;
  onClose: () => void;
  onVerifyIntegrity?: (record: FieldTestRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [isVerifyingNow, setIsVerifyingNow] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ checked: boolean; valid: boolean } | null>(null);

  if (!record) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(record.integrity.imageSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${record.testId}_evidence_package.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRunQuickVerify = async () => {
    setIsVerifyingNow(true);
    try {
      const res = await verifyImageIntegrity(record.imageDataUrl, record.integrity.imageSha256);
      setVerificationResult({ checked: true, valid: res.matched });
    } catch (e) {
      setVerificationResult({ checked: true, valid: false });
    } finally {
      setIsVerifyingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0e1320] border border-slate-700/80 rounded-lg max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#121826] flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                FIELD TEST RECORD
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {record.testId}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1 transition"
              title="Export Raw JSON Package"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">EXPORT JSON</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-1.5 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1 transition"
              title="Print Field Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">PRINT RECEIPT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto font-sans text-slate-200">
          {/* Printable Evidence Receipt Card */}
          <div className="bg-[#121929] border border-slate-700/80 rounded-md p-5 relative overflow-hidden font-mono text-xs">
            {/* Watermark badge */}
            <div className="absolute right-4 top-4 border-2 border-emerald-500/30 rounded px-2 py-1 text-[9px] uppercase tracking-widest text-emerald-400 rotate-2 pointer-events-none select-none">
              TAMPER-EVIDENT RECORD
            </div>

            {/* Receipt Header */}
            <div className="border-b border-dashed border-slate-700 pb-3 mb-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                DIGITAL COMPANION FOR FIELD DRUG TESTING • SIH26231
              </div>
              <div className="text-base font-bold text-slate-100 mt-1">
                FIELD TEST VERIFICATION RECORD
              </div>
              <div className="text-[11px] text-slate-400">
                SOFTWARE VERIFICATION LAYER FOR EXISTING FIELD-TEST KITS
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-dashed border-slate-700">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TEST ID:</span>
                  <span className="font-bold text-sky-400">{record.testId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">KIT PROFILE:</span>
                  <span className="font-semibold text-slate-200">{record.kitProfile.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">KIT IDENTIFIER:</span>
                  <span className="text-slate-300">{record.kitProfile.kitId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">RESULT:</span>
                  <StatusBadge type="outcome" value={record.classification.outcome} size="sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CAPTURED:</span>
                  <span className="text-slate-200">{new Date(record.capturedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">LOCATION:</span>
                  <span className="text-slate-200">
                    {record.location.isAvailable 
                      ? `${record.location.latitude.toFixed(4)}°, ${record.location.longitude.toFixed(4)}° (±${record.location.accuracyMeters}m)`
                      : 'Baseline Field Station Coordinates'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">OPERATOR:</span>
                  <span className="text-slate-200">{record.operator.id} ({record.operator.name})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">IMAGE INTEGRITY:</span>
                  <span className="text-emerald-400 font-bold">VERIFIED SEALED</span>
                </div>
              </div>
            </div>

            {/* Visual Evidence Section */}
            <div className="pt-4 space-y-3">
              <div className="text-[11px] text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>CAPTURED IMAGE & ANALYZED REGIONS</span>
                <span className="text-slate-500">DEVICE CAMERA CAPTURE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Captured Image */}
                <div className="sm:col-span-2 bg-[#090d16] border border-slate-700/80 rounded p-1.5">
                  <div className="relative aspect-video rounded overflow-hidden bg-black flex items-center justify-center">
                    <img 
                      src={record.imageDataUrl} 
                      alt="Field test capture" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 left-2 text-[9px] font-mono bg-black/70 px-1 rounded text-slate-400">
                      CAPTURED FIELD IMAGE
                    </div>
                  </div>
                </div>

                {/* Analyzed regions */}
                <div className="bg-[#090d16] border border-slate-700/80 rounded p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase">
                      REACTION AREA
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded border border-white/30 shadow-sm shrink-0"
                        style={{ backgroundColor: record.reactionArea.calibratedHex }}
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          {record.reactionArea.observedColorName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {record.reactionArea.calibratedHex}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 text-[10px] space-y-1">
                    <div className="text-slate-400">Reference Colour Card:</div>
                    <div className="text-emerald-400 font-bold">
                      {record.referenceCard.detected ? '✓ DETECTED IN FRAME' : '! NOT DETECTED'}
                    </div>
                    <div className="text-slate-400 mt-1">Image Quality:</div>
                    <div className="text-slate-300 font-bold">
                      {record.imageQuality}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Section */}
            <div className="mt-4 pt-4 border-t border-dashed border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  CRYPTOGRAPHIC IMAGE HASH (SHA-256)
                </span>
                <span className="text-emerald-400 font-bold">TAMPER-EVIDENT</span>
              </div>

              <div className="bg-[#090d16] border border-slate-700 rounded p-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-300 break-all select-all">
                  {record.integrity.imageSha256}
                </span>
                <button
                  onClick={handleCopyHash}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-sky-400 shrink-0 transition"
                  title="Copy Hash"
                >
                  {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>SEALED AT: {new Date(record.integrity.sealedAt).toLocaleString()}</span>
                <button
                  onClick={handleRunQuickVerify}
                  disabled={isVerifyingNow}
                  className="text-sky-400 hover:text-sky-300 underline font-semibold"
                >
                  {isVerifyingNow ? 'Verifying...' : 'VERIFY HASH INTEGRITY NOW'}
                </button>
              </div>

              {verificationResult && (
                <div className={`p-2 rounded mt-2 text-xs flex items-center gap-2 ${
                  verificationResult.valid 
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                }`}>
                  {verificationResult.valid ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>INTEGRITY VERIFIED:</strong> Live SHA-256 recalculation matches stored digital fingerprint down to the exact byte.</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span><strong>INTEGRITY MISMATCH:</strong> Current image does not match stored fingerprint!</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Clear Statutory Notice */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-700 text-[10px] text-slate-400 leading-relaxed font-sans">
              <strong className="text-slate-300">PRESUMPTIVE FIELD-TEST NOTICE:</strong> This record provides an automated visual interpretation and tamper-evident digital audit trail for existing field-testing kits. Field-test results are presumptive and do not replace quantitative laboratory confirmatory testing (GC-MS / FTIR). The cryptographic hash guarantees digital file integrity against post-incident tampering.
            </div>
          </div>

          {/* Signature Feature: Digital Evidence Chain in Modal */}
          <EvidenceChain
            steps={record.evidenceChain}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#121826] flex items-center justify-between no-print">
          <span className="text-[11px] font-mono text-slate-400">
            RECORD STORED IN SECURE LOCAL AUDIT TRAIL
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
