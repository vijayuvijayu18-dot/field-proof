import React, { useState, useRef, useEffect } from 'react';
import { FieldTestRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { computeSha256FromDataUrl } from '../services/hashing';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  Hash, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RotateCw, 
  FileSearch,
  ArrowRight
} from 'lucide-react';

interface IntegrityCheckScreenProps {
  records: FieldTestRecord[];
  initialRecord?: FieldTestRecord | null;
}

export const IntegrityCheckScreen: React.FC<IntegrityCheckScreenProps> = ({
  records,
  initialRecord = null
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    initialRecord ? initialRecord.id : (records.length > 0 ? records[0].id : '')
  );

  const [customImageFile, setCustomImageFile] = useState<string | null>(null);
  const [customExpectedHash, setCustomExpectedHash] = useState<string>('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    calculatedHash: string;
    expectedHash: string;
    isMatch: boolean;
    testId: string;
    timestamp: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When initialRecord changes or selection changes
  useEffect(() => {
    if (initialRecord) {
      setSelectedRecordId(initialRecord.id);
      setCustomImageFile(null);
      setVerificationResult(null);
    }
  }, [initialRecord]);

  const activeRecord = records.find(r => r.id === selectedRecordId);

  // Handle custom image upload
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomImageFile(dataUrl);
      setSelectedRecordId(''); // deselect catalog
      setVerificationResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Run integrity verification
  const handleCalculateAndVerify = async () => {
    setIsVerifying(true);
    try {
      let imageDataUrl = '';
      let targetExpectedHash = '';
      let testIdLabel = '';

      if (customImageFile) {
        imageDataUrl = customImageFile;
        targetExpectedHash = customExpectedHash.trim().toLowerCase();
        testIdLabel = 'MANUAL_IMAGE_UPLOAD';
      } else if (activeRecord) {
        imageDataUrl = activeRecord.imageDataUrl;
        targetExpectedHash = activeRecord.integrity.imageSha256.trim().toLowerCase();
        testIdLabel = activeRecord.testId;
      }

      if (!imageDataUrl) {
        setIsVerifying(false);
        return;
      }

      // Live Web Crypto SHA-256 computation
      const calculated = await computeSha256FromDataUrl(imageDataUrl);
      const isMatch = targetExpectedHash ? calculated.toLowerCase() === targetExpectedHash : false;

      setVerificationResult({
        tested: true,
        calculatedHash: calculated,
        expectedHash: targetExpectedHash,
        isMatch,
        testId: testIdLabel,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Integrity check calculation failed', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-100 uppercase">
              CRYPTOGRAPHIC INTEGRITY CHECK
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              SHA-256 VALIDATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify whether a field test image matches its stored digital cryptographic fingerprint.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Verification Controls & Input Selection (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#111726] border border-slate-800 rounded-md p-4 space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-sky-400" />
              1. SELECT TEST RECORD OR UPLOAD IMAGE
            </div>

            {/* Mode A: Select Stored Record */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                OPTION A: CHOOSE EXISTING RECORD FROM LOG
              </label>
              {records.length > 0 ? (
                <select
                  value={selectedRecordId}
                  onChange={(e) => {
                    setSelectedRecordId(e.target.value);
                    setCustomImageFile(null);
                    setVerificationResult(null);
                  }}
                  className="w-full bg-[#0b0f19] border border-slate-700/80 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.testId} — {r.kitProfile.displayName} ({r.classification.outcome}) — {new Date(r.capturedAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
                  No local records logged yet. Use Option B to upload an image directly.
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-500 text-xs font-mono">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span>OR</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Mode B: Upload Image & Custom Hash */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                OPTION B: UPLOAD ARBITRARY IMAGE FOR HASH VERIFICATION
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadImage}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {customImageFile ? 'REPLACE UPLOADED FILE' : 'CHOOSE IMAGE FILE'}
                </button>
                {customImageFile && (
                  <span className="text-[11px] font-mono text-emerald-400">
                    Image loaded in memory
                  </span>
                )}
              </div>

              {customImageFile && (
                <div className="pt-2 space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">
                    EXPECTED SHA-256 HASH (OPTIONAL FOR COMPARISON):
                  </label>
                  <input
                    type="text"
                    placeholder="Paste 64-character hex hash to compare..."
                    value={customExpectedHash}
                    onChange={(e) => setCustomExpectedHash(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700/80 rounded p-2 text-xs font-mono text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}
            </div>

            {/* Image Preview Thumbnail */}
            {(activeRecord || customImageFile) && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                  SELECTED IMAGE BUFFER:
                </div>
                <div className="flex items-center gap-3 bg-[#0b0f19] p-2 rounded border border-slate-800">
                  <img
                    src={customImageFile || activeRecord?.imageDataUrl}
                    alt="Target buffer"
                    className="w-16 h-12 object-cover rounded bg-black border border-slate-700"
                  />
                  <div className="text-xs font-mono truncate">
                    <div className="font-bold text-slate-200">
                      {customImageFile ? 'MANUAL SENSOR UPLOAD' : activeRecord?.testId}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {customImageFile ? 'Ready for SHA-256 digest' : `${activeRecord?.kitProfile.displayName}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handleCalculateAndVerify}
                disabled={isVerifying || (!activeRecord && !customImageFile)}
                className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Hash className="w-4 h-4" />
                {isVerifying ? 'COMPUTING LIVE SHA-256 DIGEST...' : 'CALCULATE HASH & VERIFY INTEGRITY'}
              </button>
            </div>
          </div>

          {/* Legal / Forensic Scope Notice */}
          <div className="bg-[#111726] border border-slate-800 rounded-md p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono font-semibold">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              WHAT CRYPTOGRAPHIC INTEGRITY PROVES
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              "Integrity verification checks whether the digital image matches the stored hash down to the exact byte. It proves that the image file has not been compressed, edited, retouched, or substituted since the field record was logged."
            </p>
            <div className="text-[10px] text-amber-400 font-mono pt-1">
              LIMITATION: Cryptographic hashing does not certify or verify the chemical composition or scientific validity of the test. Confirmatory testing requires laboratory analysis.
            </div>
          </div>
        </div>

        {/* Right Column: Verification Results & Hash Matcher (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#111726] border border-slate-800 rounded-md p-4 space-y-4">
            <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              2. INTEGRITY VERIFICATION RESULT
            </div>

            {verificationResult ? (
              <div className="space-y-4">
                {/* Result Status Banner */}
                {verificationResult.isMatch ? (
                  <div className="p-3.5 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 space-y-1">
                    <div className="flex items-center gap-2 font-mono font-bold text-sm text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ✓ INTEGRITY VERIFIED
                    </div>
                    <div className="text-xs text-emerald-300/90 font-sans">
                      The live calculated SHA-256 digest exactly matches the stored cryptographic record. Digital evidence has remained intact and untampered.
                    </div>
                  </div>
                ) : verificationResult.expectedHash ? (
                  <div className="p-3.5 rounded bg-rose-950/40 border border-rose-500/50 text-rose-200 space-y-1">
                    <div className="flex items-center gap-2 font-mono font-bold text-sm text-rose-300">
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                      ! INTEGRITY MISMATCH
                    </div>
                    <div className="text-xs text-rose-300/90 font-sans">
                      The current image does not match the stored digital fingerprint. Even a 1-pixel alteration or JPEG re-compression changes the SHA-256 digest completely.
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded bg-sky-950/40 border border-sky-500/40 text-sky-200 space-y-1">
                    <div className="flex items-center gap-2 font-mono font-bold text-sm text-sky-300">
                      <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                      DIGEST COMPUTED
                    </div>
                    <div className="text-xs text-sky-300/90 font-sans">
                      SHA-256 fingerprint generated successfully for uploaded image.
                    </div>
                  </div>
                )}

                {/* Live Calculated Hash Box */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="text-slate-400 text-[11px] flex items-center justify-between">
                    <span>LIVE CALCULATED SHA-256 (64 HEX CHARACTERS):</span>
                    <span className="text-sky-400">FIPS 180-4</span>
                  </div>
                  <div className="p-2.5 rounded bg-[#090d16] border border-slate-700 text-sky-300 break-all select-all font-mono text-[11px]">
                    {verificationResult.calculatedHash}
                  </div>
                </div>

                {/* Stored / Expected Hash Box */}
                {verificationResult.expectedHash && (
                  <div className="space-y-1 font-mono text-xs">
                    <div className="text-slate-400 text-[11px]">
                      STORED / EXPECTED RECORD HASH:
                    </div>
                    <div className={`p-2.5 rounded bg-[#090d16] border break-all select-all font-mono text-[11px] ${
                      verificationResult.isMatch 
                        ? 'border-emerald-500/40 text-emerald-300' 
                        : 'border-rose-500/40 text-rose-300'
                    }`}>
                      {verificationResult.expectedHash}
                    </div>
                  </div>
                )}

                {/* Meta details */}
                <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-2">
                  <div>
                    <span>Audit Target:</span>
                    <div className="text-slate-200 font-bold">{verificationResult.testId}</div>
                  </div>
                  <div>
                    <span>Checked At:</span>
                    <div className="text-slate-200 font-bold">{new Date(verificationResult.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Hash className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-xs font-mono text-slate-400">
                  AWAITING VERIFICATION TRIGGER
                </div>
                <p className="text-[11px] text-slate-500 font-sans max-w-xs mx-auto">
                  Select a test record from the catalog on the left and click "Calculate Hash & Verify Integrity".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
