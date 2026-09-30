import React, { useState } from 'react';
import { 
  AuthUser, 
  getRegisteredOfficers, 
  registerOfficerAccount, 
  loginRegisteredOfficer, 
  RegisteredOfficerAccount 
} from '../services/auth';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  UserCheck, 
  Building2, 
  Eye, 
  EyeOff, 
  BadgeCheck,
  Smartphone,
  Mail
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register' | 'switch'>('login');
  
  // Registration Form States
  const [regName, setRegName] = useState<string>('Inspector Vijay Kumar');
  const [regIdentifier, setRegIdentifier] = useState<string>('vijay@ncb.gov.in');
  const [regBadge, setRegBadge] = useState<string>('NCB-KA-7049');
  const [regAgency, setRegAgency] = useState<string>('Narcotics Control Bureau (NCB)');
  const [regStation, setRegStation] = useState<string>('Central Inspection Depot Sector 4');
  const [regRole, setRegRole] = useState<string>('Lead Narcotics Verification Officer');
  const [regPassword, setRegPassword] = useState<string>('password123');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState<string>('vijay@ncb.gov.in');
  const [loginPassword, setLoginPassword] = useState<string>('password123');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const registeredOfficers = getRegisteredOfficers();

  // Handle Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const user = registerOfficerAccount({
        name: regName,
        emailOrPhone: regIdentifier,
        badge: regBadge,
        agency: regAgency,
        station: regStation,
        role: regRole,
        password: regPassword
      } as any);

      setSuccessMessage(`Officer account registered successfully! Assigned Operator ID: ${user.operatorId}`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check the entered details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const user = loginRegisteredOfficer(loginIdentifier, loginPassword);
      setSuccessMessage(`Welcome back, ${user.displayName}! Entering verification console...`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials or register first.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Switch / 1-Click Login for an already registered officer
  const handleQuickLogin = (officer: RegisteredOfficerAccount) => {
    setLoginIdentifier(officer.emailOrPhone);
    setLoginPassword(officer.password);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const user = loginRegisteredOfficer(officer.emailOrPhone, officer.password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060910] text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-sky-500 selection:text-white font-sans tech-grid">
      <div className="w-full max-w-lg space-y-4">
        {/* Government Badge Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-500/40 text-sky-400 text-[11px] font-mono font-medium shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>MINISTRY OF HOME AFFAIRS • SIH26231</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
            FIELD TEST CONSOLE
          </h1>
          <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
            Authorized Officer Identity Verification & Cryptographic Record Attribution
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#0b101c] border border-slate-800 rounded-lg shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Method Selection Tabs */}
          <div className="flex border-b border-slate-800 text-xs font-mono">
            <button
              onClick={() => { setActiveMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition ${
                activeMode === 'login'
                  ? 'border-sky-500 text-sky-400 bg-sky-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>OFFICER LOGIN</span>
            </button>

            <button
              onClick={() => { setActiveMode('register'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition ${
                activeMode === 'register'
                  ? 'border-sky-500 text-sky-400 bg-sky-950/20 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>REGISTER FIRST</span>
            </button>

            <button
              onClick={() => { setActiveMode('switch'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`py-3 px-3.5 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeMode === 'switch'
                  ? 'border-sky-500 text-sky-400 bg-sky-950/20 font-bold'
                  : 'border-transparent text-amber-400 hover:text-amber-300 hover:bg-slate-900/40'
              }`}
              title="View all registered officers"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OFFICERS ({registeredOfficers.length})</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="p-3 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2 animate-fade-in font-sans">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2 animate-fade-in font-sans">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            {/* TAB 1: LOGIN WITH REGISTERED CREDENTIALS */}
            {activeMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5 font-sans">
                <div className="text-center space-y-1 pb-1">
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                    OFFICER SIGN IN
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sign in with your registered email, mobile number, or officer ID.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    REGISTERED EMAIL OR MOBILE NUMBER:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. vijay@ncb.gov.in or 6362132703"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-slate-300 uppercase">
                      SECURITY PASSWORD:
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your security password"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-3 py-2 pr-10 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-sky-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>VERIFYING CREDENTIALS...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>LOGIN & ENTER CONSOLE</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-xs font-sans text-slate-400 flex items-center justify-center gap-1.5">
                  <span>Haven't registered your officer profile yet?</span>
                  <button
                    type="button"
                    onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                    className="text-sky-400 hover:text-sky-300 font-semibold underline"
                  >
                    Register First
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER NEW OFFICER */}
            {activeMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3 font-sans">
                <div className="text-center space-y-1 pb-1">
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                    OFFICER REGISTRATION FORM
                  </h3>
                  <p className="text-xs text-slate-400">
                    Register your officer profile. All tests conducted will be attributed to your identity.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      OFFICER FULL NAME:
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Inspector Vijay Kumar"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      OFFICIAL EMAIL OR MOBILE:
                    </label>
                    <input
                      type="text"
                      value={regIdentifier}
                      onChange={(e) => setRegIdentifier(e.target.value)}
                      placeholder="e.g. vijay@ncb.gov.in"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      BADGE / SERVICE NUMBER:
                    </label>
                    <input
                      type="text"
                      value={regBadge}
                      onChange={(e) => setRegBadge(e.target.value)}
                      placeholder="e.g. NCB-KA-7049"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      AGENCY / UNIT:
                    </label>
                    <input
                      type="text"
                      value={regAgency}
                      onChange={(e) => setRegAgency(e.target.value)}
                      placeholder="e.g. Narcotics Control Bureau"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      ASSIGNED OUTPOST / STATION:
                    </label>
                    <input
                      type="text"
                      value={regStation}
                      onChange={(e) => setRegStation(e.target.value)}
                      placeholder="e.g. Central Depot Sector 4"
                      required
                      className="w-full bg-[#080c14] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      CREATE SECURITY PASSWORD:
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 4 characters"
                        required
                        className="w-full bg-[#080c14] border border-slate-700 rounded px-2.5 py-1.5 pr-8 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-600/20 mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>CREATING OFFICER RECORD...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>REGISTER OFFICER & ENTER CONSOLE</span>
                    </>
                  )}
                </button>

                <div className="pt-1 text-center text-xs font-sans text-slate-400 flex items-center justify-center gap-1.5">
                  <span>Already registered?</span>
                  <button
                    type="button"
                    onClick={() => { setActiveMode('login'); setErrorMessage(null); }}
                    className="text-sky-400 hover:text-sky-300 font-semibold underline"
                  >
                    Sign In Here
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: REGISTERED OFFICERS LIST & QUICK SWITCH */}
            {activeMode === 'switch' && (
              <div className="space-y-3 font-sans">
                <div className="text-xs text-slate-400 font-mono">
                  Select any registered officer to login instantly and test multi-officer attribution:
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {registeredOfficers.map((officer) => (
                    <button
                      key={officer.id}
                      onClick={() => handleQuickLogin(officer)}
                      disabled={isSubmitting}
                      className="w-full text-left p-3 rounded border border-slate-800 bg-[#080c14] hover:border-sky-500/50 hover:bg-slate-900 transition flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold font-mono text-slate-200 group-hover:text-sky-300 flex items-center gap-1.5">
                          <span>{officer.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 text-sky-400">
                            {officer.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {officer.role} • {officer.unit}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                          <span>Badge: {officer.badge}</span>
                          <span>• Identifier: {officer.emailOrPhone}</span>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                    className="w-full py-2 px-3 rounded border border-dashed border-slate-700 hover:border-sky-500 text-xs font-mono text-slate-400 hover:text-sky-300 flex items-center justify-center gap-2 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Register Another New Officer</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Security Notice */}
          <div className="px-5 py-3 border-t border-slate-800 bg-[#0a0e18] flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              SESSION ENCRYPTED (SHA-256)
            </span>
            <span>SIH26231 • MULTI-OFFICER AUDIT</span>
          </div>
        </div>

        {/* Informational pill */}
        <div className="text-center text-[11px] font-mono text-slate-500">
          All test captures, timestamps, and hashes are cryptographically signed by the active registered operator.
        </div>
      </div>
    </div>
  );
};
