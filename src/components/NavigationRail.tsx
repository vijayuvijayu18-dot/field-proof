import React from 'react';
import { Camera, ListFilter, FileText, ShieldCheck, UserCheck, Activity, CheckCircle2, LogOut, Smartphone } from 'lucide-react';
import { OperatorProfile } from '../types';
import { AuthUser } from '../services/auth';

export type ActiveTab = 'capture' | 'history' | 'records' | 'integrity' | 'operator';

interface NavigationRailProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  operator: OperatorProfile;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  recordCount: number;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  setActiveTab,
  operator,
  authUser,
  onLogout,
  isDemoMode,
  toggleDemoMode,
  recordCount
}) => {
  const navItems = [
    { id: 'capture' as ActiveTab, num: '01', label: 'Field Capture', icon: Camera },
    { id: 'history' as ActiveTab, num: '02', label: 'Test History', icon: ListFilter, count: recordCount },
    { id: 'records' as ActiveTab, num: '03', label: 'Records', icon: FileText },
    { id: 'integrity' as ActiveTab, num: '04', label: 'Integrity Check', icon: ShieldCheck },
    { id: 'operator' as ActiveTab, num: '05', label: 'Operator', icon: UserCheck },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-[#0c101a] shrink-0 min-h-screen">
        {/* Console Branding */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 font-mono font-bold text-sm shadow-inner">
              FC
            </div>
            <div>
              <div className="text-xs font-mono font-extrabold tracking-wider text-slate-100 uppercase">
                FIELD TEST
              </div>
              <div className="text-[10px] font-mono tracking-widest text-sky-400 uppercase -mt-0.5">
                VERIFICATION CONSOLE
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              SYSTEM READY
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              SIH26231
            </span>
          </div>
        </div>

        {/* Demo Mode Toggle in Sidebar */}
        <div className="px-4 py-2.5 bg-slate-900/30 border-b border-slate-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-mono font-semibold text-slate-300">
                DEMO MODE
              </span>
            </div>
            <button
              onClick={toggleDemoMode}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoMode ? 'bg-sky-600' : 'bg-slate-700'
              }`}
              title="Toggle evaluation specimen presets"
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {isDemoMode && (
            <div className="text-[9px] font-mono text-sky-400/90 mt-1">
              Specimen simulation active
            </div>
          )}
        </div>

        {/* Navigation Menu Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-left transition-colors duration-150 ${
                  isActive
                    ? 'bg-sky-950/50 border border-sky-500/40 text-sky-200'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-mono font-bold ${isActive ? 'text-sky-400' : 'text-slate-600'}`}>
                    {item.num}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium font-sans">
                    {item.label}
                  </span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Operator Footer Status */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-slate-300 shrink-0 overflow-hidden">
                {authUser?.photoURL ? (
                  <img src={authUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  operator.name ? operator.name.slice(0, 2).toUpperCase() : 'OP'
                )}
              </div>
              <div className="truncate">
                <div className="text-xs font-medium text-slate-200 truncate">
                  {operator.name}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1">
                  {authUser?.authProvider === 'phone' ? (
                    <span className="flex items-center gap-0.5 text-sky-400">
                      <Smartphone className="w-2.5 h-2.5" /> OTP
                    </span>
                  ) : authUser?.authProvider === 'google' ? (
                    <span className="text-rose-400 font-bold">Google</span>
                  ) : null}
                  <span>• {operator.id}</span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out / Switch Operator"
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition shrink-0 ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>INTEGRITY: SHA-256</span>
            <span className="text-emerald-400 font-semibold">ACTIVE</span>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0c101a] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 font-mono font-bold text-xs">
            FC
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100">
              FIELD TEST CONSOLE
            </span>
            <span className="block text-[9px] font-mono text-sky-400 -mt-0.5">
              SIH26231 COMPANION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={toggleDemoMode}
            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
              isDemoMode 
                ? 'bg-sky-950 border-sky-500 text-sky-300' 
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            DEMO: {isDemoMode ? 'ON' : 'OFF'}
          </button>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c101a] border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded transition ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-mono mt-0.5 font-medium">
                {item.num}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
