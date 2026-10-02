import React, { useState, useMemo } from 'react';
import { FieldTestRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceChain } from '../components/EvidenceChain';
import { 
  FileText, 
  Eye, 
  ShieldCheck, 
  Camera, 
  Hash, 
  Tag
} from 'lucide-react';

interface RecordsScreenProps {
  records: FieldTestRecord[];
  onViewRecord: (record: FieldTestRecord) => void;
  onNavigateCapture: () => void;
  onVerifyIntegrity: (record: FieldTestRecord) => void;
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({
  records,
  onViewRecord,
  onNavigateCapture,
  onVerifyIntegrity
}) => {
  const distinctOfficers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    records.forEach(r => {
      if (r.operator?.id) {
        map.set(r.operator.id, { id: r.operator.id, name: r.operator.name });
      }
    });
    return Array.from(map.values());
  }, [records]);

  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<string>('ALL');

  const filteredRecords = useMemo(() => {
    if (selectedOfficerFilter === 'ALL') return records;
    return records.filter(r => r.operator.id === selectedOfficerFilter);
  }, [records, selectedOfficerFilter]);

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    records.length > 0 ? records[0].id : null
  );

  const selectedRecord = filteredRecords.find(r:FieldTestRecord) => r.id === selectedRecordId) || filteredRecords[0] || records[0];

  return (
    <div className="space-y-4 pb-16 lg:pb-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-100 uppercase">
              RECORDS & EVIDENCE DOSSIER
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-400">
              TAMPER-EVIDENT ARCHIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Digital evidence dossiers linking captured test photos, reference card calibration, and cryptographic hashes.
          </p>
        </div>

        <button
          onClick={onNavigateCapture}
          className="py-1.5 px-3.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow self-start sm:self-auto transition"
        >
          <Camera className="w-3.5 h-3.5" />
          NEW FIELD CAPTURE
        </button>
      </div>

      {records.length > 0 && selectedRecord ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Record Dossier Catalog List (4 Cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                RECORD DOSSIERS ({filteredRecords.length})
              </span>
            </div>

            {/* Officer Filter Dropdown */}
            <select
              value={selectedOfficerFilter}
              onChange={(e) => setSelectedOfficerFilter(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="ALL">All Officers ({distinctOfficers.length})</option>
              {distinctOfficers.map((o: {id: string; name: string }) => (
                <option key={o.id} value={o.id}>{o.name} ({o.id})</option>
              ))}
            </select>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredRecords.map((r:FieldTestRecord) => {
                const isSelected = r.id === selectedRecord.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecordId(r.id)}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      isSelected
                        ? 'bg-[#141b2b] border-sky-500/60 shadow-sm'
                        : 'bg-[#101522] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-200">
                        {r.testId}
                      </span>
                      <StatusBadge type="outcome" value={r.classification.outcome} size="sm" />
                    </div>

                    <div className="mt-1 text-xs text-slate-400 truncate">
                      {r.kitProfile.displayName}
                    </div>

                    <div className="mt-1 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                      <span className="truncate">👮 {r.operator.name}</span>
                      <span className="text-[10px] text-slate-500">{r.operator.id}</span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{new Date(r.capturedAt).toLocaleDateString()}</span>
                      <span className="text-emerald-400 font-semibold">SEALED</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Dossier Deep Inspection (8 Cols) */}
          <div className="lg:col-span-8 bg-[#111726] border border-slate-800 rounded-md p-5 space-y-5">
            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-mono text-slate-100">
                    {selectedRecord.testId}
                  </h3>
                  <StatusBadge type="outcome" value={selectedRecord.classification.outcome} />
                </div>
                <div className="text-xs text-slate-400 mt-1 font-sans">
                  {selectedRecord.kitProfile.displayName} ({selectedRecord.kitProfile.kitId}) • Captured {new Date(selectedRecord.capturedAt).toLocaleString()}
                </div>
                <div className="text-[11px] font-mono text-sky-400 mt-0.5">
                  👮 Tested by: {selectedRecord.operator.name} ({selectedRecord.operator.id}) • Badge: {selectedRecord.operator.badge}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewRecord(selectedRecord)}
                  className="py-1.5 px-3 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  EXPAND RECEIPT
                </button>
                <button
                  onClick={() => onVerifyIntegrity(selectedRecord)}
                  className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  VERIFY HASH
                </button>
              </div>
            </div>

            {/* Side-by-side Evidence & Reaction Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase">
                  CAPTURED FIELD IMAGE
                </div>
                <div className="aspect-video bg-black rounded border border-slate-700/80 overflow-hidden flex items-center justify-center">
                  <img
                    src={selectedRecord.imageDataUrl}
                    alt="Captured test"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase">
                  OBSERVED VISUAL REACTION
                </div>

                <div className="bg-[#0b0f19] border border-slate-800 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kit Reaction Area:</span>
                    <span className="text-slate-200 font-semibold">{selectedRecord.reactionArea.observedColorName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Calibrated Colour:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-100 font-mono font-bold">{selectedRecord.reactionArea.calibratedHex}</span>
                      <div
                        className="w-4 h-4 rounded border border-white/30"
                        style={{ backgroundColor: selectedRecord.reactionArea.calibratedHex }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Reference Colour Card:</span>
                    <span className={selectedRecord.referenceCard.detected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {selectedRecord.referenceCard.detected ? '✓ Detected' : '! Missing'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Image Quality:</span>
                    <span className="text-slate-200">{selectedRecord.imageQuality}</span>
                  </div>
                </div>

                {/* Operator & GPS Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">OPERATOR:</span>
                    <span className="text-slate-200 font-bold">{selectedRecord.operator.id}</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 p-2 rounded">
                    <span className="text-slate-400 block text-[10px]">LOCATION FIX:</span>
                    <span className="text-slate-200 font-bold">
                      {selectedRecord.location.latitude.toFixed(2)}°, {selectedRecord.location.longitude.toFixed(2)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Bar */}
            <div className="bg-[#0b0f19] border border-slate-800 rounded p-3 space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-sky-400" />
                  IMAGE SHA-256 DIGITAL FINGERPRINT
                </span>
                <span className="text-emerald-400 font-bold">TAMPER-EVIDENT RECORD</span>
              </div>
              <div className="text-slate-300 text-[11px] break-all select-all font-mono">
                {selectedRecord.integrity.imageSha256}
              </div>
            </div>

            {/* Digital Evidence Chain Component */}
            <div className="pt-2">
              <EvidenceChain
                steps={selectedRecord.evidenceChain}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#111726] border border-slate-800 rounded-md p-10 text-center space-y-3 max-w-md mx-auto my-8 font-sans">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold font-mono text-slate-200">
            NO EVIDENCE DOSSIERS AVAILABLE
          </h3>
          <p className="text-xs text-slate-400">
            Perform a field capture of an existing test kit with the reference colour card to generate a sealed tamper-evident dossier.
          </p>
          <button
            onClick={onNavigateCapture}
            className="py-2 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold transition"
          >
            START FIRST FIELD TEST
          </button>
        </div>
      )}
    </div>
  );
};
