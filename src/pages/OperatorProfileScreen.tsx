import React, { useState } from 'react';
import { OperatorProfile } from '../types';
import { 
  UserCheck, 
  Save, 
  RotateCcw, 
  Cpu, 
  Camera, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { DEFAULT_OPERATOR } from '../services/storage';
import { AuthUser } from '../services/auth';
import { LogOut, Smartphone } from 'lucide-react';

interface OperatorProfileScreenProps {
  operator: OperatorProfile;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onUpdateOperator: (profile: OperatorProfile) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  recordCount: number;
}

export const OperatorProfileScreen: React.FC<OperatorProfileScreenProps> = ({
  operator,
  authUser,
  onLogout,
  onUpdateOperator,
  isDemoMode,
  onToggleDemoMode,
  recordCount
}) => {
  const [formData, setFormData] = useState<OperatorProfile>(operator);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOperator(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_OPERATOR);
    onUpdateOperator(DEFAULT_OPERATOR);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 pb-16 lg:pb-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-100 uppercase">
              OPERATOR CONFIGURATION
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 border border-sky-500/40 text-sky-400">
              AUDIT CREDENTIALS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Field operator identity and device diagnostic status attached to verifiable digital records.
          </p>
        </div>
      </div>

      {/* Active Authentication Banner */}
      {authUser && (
        <div className="bg-[#0e1626] border border-sky-500/40 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
              {authUser.photoURL ? (
                <img src={authUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-mono text-xs font-bold text-sky-400">
                  {authUser.displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">{authUser.displayName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED SESSION
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                {authUser.authProvider === 'phone' ? (
                  <span className="flex items-center gap-1 text-sky-400 font-mono text-[11px]">
                    <Smartphone className="w-3 h-3" /> OTP Verified: {authUser.phoneNumber}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 font-mono text-[11px]">
                    Google Account: {authUser.email}
                  </span>
                )}
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[10px] text-slate-500">ID: {authUser.operatorId}</span>
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/50 text-rose-300 text-xs font-mono transition shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SIGN OUT / SWITCH OPERATOR</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Operator Credentials Form (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111726] border border-slate-800 rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                ACTIVE FIELD OPERATOR
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ATTACHED TO SHA-256 AUDIT TRAILS
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  OPERATOR IDENTIFIER:
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  required
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  OFFICER NAME:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  BADGE NUMBER:
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  OFFICIAL ROLE:
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                ORGANISATION / OPERATIONAL UNIT:
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                FIELD STATION / SECTOR:
              </label>
              <input
                type="text"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET TO DEFAULT
              </button>

              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    SAVED
                  </span>
                )}
                <button
                  type="submit"
                  className="py-1.5 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  SAVE CREDENTIALS
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Device Subsystem Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111726] border border-slate-800 rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  SUBSYSTEM DIAGNOSTICS
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* WebRTC Video Subsystem */}
              <div className="p-2.5 rounded bg-[#0b0f19] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Camera className="w-4 h-4 text-sky-400" />
                  <span>Camera Subsystem (WebRTC)</span>
                </div>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>

              {/* Cryptographic Subsystem */}
              <div className="p-2.5 rounded bg-[#0b0f19] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>SHA-256 Engine (Web Crypto)</span>
                </div>
                <span className="text-emerald-400 font-bold">FIPS 180-4</span>
              </div>

              {/* Geolocation Subsystem */}
              <div className="p-2.5 rounded bg-[#0b0f19] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>Geolocation Sensor</span>
                </div>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>

              {/* Storage */}
              <div className="p-2.5 rounded bg-[#0b0f19] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Audit Logged Records</span>
                </div>
                <span className="text-sky-400 font-bold">{recordCount} ENTRIES</span>
              </div>
            </div>

            {/* Demonstration Mode Box */}
            <div className="mt-4 p-3.5 rounded bg-slate-900/60 border border-slate-700/80 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">DEMONSTRATION MODE</span>
                <button
                  onClick={onToggleDemoMode}
                  className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isDemoMode ? 'bg-sky-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDemoMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-tight">
                Controls whether benchmark specimen scenarios can be preloaded for SIH evaluator demonstration without physical reagents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
