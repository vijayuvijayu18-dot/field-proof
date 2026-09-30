import React, { useState, useMemo } from 'react';
import { FieldTestRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Search, 
  Eye, 
  Trash2, 
  Download, 
  Camera, 
  FileQuestion,
  Sparkles
} from 'lucide-react';

interface TestHistoryScreenProps {
  records: FieldTestRecord[];
  onViewRecord: (record: FieldTestRecord) => void;
  onNavigateCapture: () => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  isDemoMode: boolean;
  onLoadDemoRecords: () => void;
}

export const TestHistoryScreen: React.FC<TestHistoryScreenProps> = ({
  records,
  onViewRecord,
  onNavigateCapture,
  onDeleteRecord,
  onClearAll,
  onLoadDemoRecords
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState<string>('ALL');
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState<string>('ALL');

  // Distinct officers who have conducted tests
  const distinctOfficers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; badge?: string }>();
    records.forEach(r => {
      if (r.operator?.id) {
        map.set(r.operator.id, { id: r.operator.id, name: r.operator.name, badge: r.operator.badge });
      }
    });
    return Array.from(map.values());
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        rec.testId.toLowerCase().includes(q) ||
        rec.operator.name.toLowerCase().includes(q) ||
        rec.operator.id.toLowerCase().includes(q) ||
        rec.location.description.toLowerCase().includes(q) ||
        rec.kitProfile.displayName.toLowerCase().includes(q);

      const matchesOutcome = 
        selectedOutcomeFilter === 'ALL' ||
        (selectedOutcomeFilter === 'POSITIVE' && rec.classification.outcome === 'POSITIVE') ||
        (selectedOutcomeFilter === 'NEGATIVE' && rec.classification.outcome === 'NEGATIVE') ||
        (selectedOutcomeFilter === 'INCONCLUSIVE' && rec.classification.outcome === 'INCONCLUSIVE' && rec.classification.workflowState !== 'RECAPTURE_REQUIRED') ||
        (selectedOutcomeFilter === 'RECAPTURE_REQUIRED' && (rec.classification.workflowState === 'RECAPTURE_REQUIRED' || rec.classification.recaptureReason !== undefined));

      const matchesOfficer = 
        selectedOfficerFilter === 'ALL' ||
        rec.operator.id === selectedOfficerFilter;

      return matchesSearch && matchesOutcome && matchesOfficer;
    });
  }, [records, searchQuery, selectedOutcomeFilter, selectedOfficerFilter]);

  // Export CSV of history
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = ['Test ID', 'Date & Time', 'Kit Profile', 'Classification Outcome', 'Location', 'Operator ID', 'Image SHA-256', 'Status'];
    const rows = records.map(r => [
      r.testId,
      r.capturedAt,
      r.kitProfile.displayName,
      r.classification.outcome,
      `"${r.location.latitude}, ${r.location.longitude}"`,
      r.operator.id,
      r.integrity.imageSha256,
      r.integrity.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `field_test_log_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-100 uppercase">
              TEST HISTORY
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              AUDIT LOG ({records.length})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Searchable and verifiable log of completed colorimetric field drug tests.
          </p>
        </div>

        {records.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              EXPORT CSV
            </button>
            <button
              onClick={onClearAll}
              className="py-1.5 px-3 rounded bg-slate-900 border border-slate-800 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 text-xs font-mono flex items-center gap-1.5 transition"
              title="Clear Local Records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              CLEAR LOG
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#111726] border border-slate-800 rounded-md p-3 grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Test ID, kit, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-700/80 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        {/* Outcome Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedOutcomeFilter}
            onChange={(e) => setSelectedOutcomeFilter(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Outcomes</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEGATIVE">Negative</option>
            <option value="INCONCLUSIVE">Inconclusive</option>
            <option value="RECAPTURE_REQUIRED">Recapture Required</option>
          </select>
        </div>

        {/* Officer Filter */}
        <div className="sm:col-span-4">
          <select
            value={selectedOfficerFilter}
            onChange={(e) => setSelectedOfficerFilter(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="ALL">All Officers ({distinctOfficers.length})</option>
            {distinctOfficers.map(o => (
              <option key={o.id} value={o.id}>{o.name} ({o.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Records Table or Intentional Empty State */}
      {filteredRecords.length > 0 ? (
        <div className="bg-[#111726] border border-slate-800 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">TEST ID</th>
                  <th className="py-2.5 px-3">DATE & TIME</th>
                  <th className="py-2.5 px-3">KIT PROFILE</th>
                  <th className="py-2.5 px-3">RESULT</th>
                  <th className="py-2.5 px-3">LOCATION</th>
                  <th className="py-2.5 px-3">OPERATOR</th>
                  <th className="py-2.5 px-3">INTEGRITY</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/50 transition">
                    {/* Test ID & demo flag */}
                    <td className="py-3 px-3.5 font-bold text-sky-400">
                      <div className="flex items-center gap-1.5">
                        <span>{rec.testId}</span>
                        {rec.isDemoRecord && (
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(rec.capturedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Kit */}
                    <td className="py-3 px-3 text-slate-300 font-sans">
                      {rec.kitProfile.displayName}
                    </td>

                    {/* Outcome Badge */}
                    <td className="py-3 px-3">
                      <StatusBadge 
                        type="outcome" 
                        value={rec.classification.workflowState === 'RECAPTURE_REQUIRED' ? 'RECAPTURE_REQUIRED' : rec.classification.outcome} 
                        size="sm" 
                      />
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-slate-400 max-w-[140px] truncate" title={rec.location.description}>
                      {rec.location.latitude.toFixed(2)}°, {rec.location.longitude.toFixed(2)}°
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-3 text-slate-300">
                      <div className="font-semibold text-slate-200 truncate">{rec.operator.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rec.operator.id} {rec.operator.badge ? `• ${rec.operator.badge}` : ''}</div>
                    </td>

                    {/* Cryptographic Integrity status */}
                    <td className="py-3 px-3">
                      <StatusBadge type="integrity" value="SEALED" size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewRecord(rec)}
                          className="py-1 px-2.5 rounded bg-sky-950/70 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-[11px] font-mono font-medium flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3" />
                          VIEW RECORD
                        </button>
                        <button
                          onClick={() => onDeleteRecord(rec.id)}
                          className="p-1 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Smart Intentional Empty State */
        <div className="bg-[#111726] border border-slate-800 rounded-md p-10 text-center space-y-4 max-w-lg mx-auto my-6 font-sans">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileQuestion className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-bold font-mono text-slate-200">
              No field-test records yet.
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Completed field tests will appear here once captured and sealed with cryptographic integrity.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={onNavigateCapture}
              className="py-2 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Camera className="w-4 h-4" />
              START FIELD TEST
            </button>
            <button
              onClick={onLoadDemoRecords}
              className="py-2 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              LOAD DEMONSTRATION RECORDS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
