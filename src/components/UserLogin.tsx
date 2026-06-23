import React, { useState } from 'react';
import { SSHConfig, PgConfig } from '../types.js';
import { User, Key, Eye, EyeOff, Loader2, ArrowLeft, ChevronRight, Globe, Settings } from 'lucide-react';
import { LangType, translations } from '../translations.js';
import DuneonLogo from './DuneonLogo.js';
import SettingsModal from './SettingsModal.js';

interface UserLoginProps {
  sshConfig: SSHConfig;
  postgresUsers: string[];
  onBack: () => void;
  onLoginSuccess: (pgConfig: PgConfig, databases: string[]) => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  soundMuted: boolean;
  setSoundMuted: (b: boolean) => void;
}

export default function UserLogin({ 
  sshConfig, 
  postgresUsers, 
  onBack, 
  onLoginSuccess, 
  lang, 
  setLang,
  theme,
  setTheme,
  soundMuted,
  setSoundMuted
}: UserLoginProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>(postgresUsers[0] || 'postgres');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const pgConfig: PgConfig = {
      user: selectedUser,
      password: password || undefined,
      database: 'postgres', // default connecting database
    };

    try {
      const response = await fetch('/api/postgres/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ssh: sshConfig,
          pg: pgConfig,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Database session authentication failed');
      }

      onLoginSuccess(pgConfig, data.databases || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while connecting to PostgreSQL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050506] font-sans text-[#E2E8F0] relative overflow-hidden select-none">
      
      {/* Top Duneon Corporate Header */}
      <header className="w-full h-16 border-b border-[#131418] bg-[#050506]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <DuneonLogo className="h-6 md:h-7" />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Languages Switcher */}
          <div className="flex items-center gap-2 bg-[#0F1115]/50 border border-[#23252C] rounded-full px-2 py-1">
            <Globe className="h-3 w-3 text-gray-500" />
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'ru'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('am')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'am'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                AM
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex items-center justify-center h-8 w-8 bg-[#0F1115]/50 border border-[#23252C] hover:border-[#2F323B] rounded-full text-gray-400 hover:text-white transition-all cursor-pointer shadow-sm"
            title={lang === 'ru' ? 'Настройки системы' : 'System Settings'}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Connection selection */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14 py-10 z-10 animate-fade-in">
        
        {/* Left Info side */}
        <div className="max-w-md text-left space-y-4 md:space-y-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer font-sans font-semibold bg-[#111317] border border-[#212329] px-3 py-1.5 rounded-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.backToSsh}
          </button>
          
          <span className="inline-block text-[10px] uppercase tracking-widest font-bold bg-[#16181C] text-neutral-300 border border-[#212328] px-2 py-1 rounded">
            DUNEON ROLE GATEWAY
          </span>
          <h1 className="text-2xl md:text-[34px] font-bold tracking-tight text-white leading-tight font-sans">
            {t.pgTitle}
          </h1>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-light font-sans">
            {t.pgSub}
          </p>
        </div>

        {/* Right Auth Portal form */}
        <div className="w-full max-w-sm rounded-xl border border-[#23252C] bg-[#0A0B0D] p-6.5 shadow-2xl relative">
          <div className="mb-5">
            <h2 className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase font-mono">POSTGRESQL_ROLE_LOGBOOK</h2>
            <p className="mt-1 text-[10px] text-gray-500 font-mono">
              /usr/sbin/psql -h localhost -U role
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-900/50 bg-red-950/20 p-3 text-[11px] text-red-500 font-mono">
              <div className="font-bold mb-0.5 uppercase tracking-wider text-[9px] text-red-400 font-mono">PG_AUTH_FAILED:</div>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 text-xs font-sans">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-mono">
                {t.systemDbRoles} ({postgresUsers.length})
              </label>
              
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {postgresUsers.map((user) => (
                  <button
                    type="button"
                    key={user}
                    onClick={() => setSelectedUser(user)}
                    className={`flex w-full items-center justify-between rounded px-3 py-2 text-left transition-all cursor-pointer border ${
                      selectedUser === user
                        ? 'border-[#4A4E5E] bg-[#121419] text-white font-mono font-medium'
                        : 'border-[#23252C] bg-[#050506] text-gray-400 hover:border-gray-600 font-mono'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                      <span className="font-semibold text-xs font-mono">{user}</span>
                    </div>
                    {selectedUser === user && (
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="pg-password" className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-mono">
                {t.pgPwdForRole} "{selectedUser}"
              </label>
              <div className="relative">
                <input
                  id="pg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-[#2D2F34] bg-[#050506] py-2 pl-2.5 pr-8 text-xs text-white placeholder-gray-700 outline-none font-mono"
                  placeholder={t.pgPwdPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white hover:bg-[#E2E8F0] active:scale-[0.99] disabled:opacity-50 transition-all text-black font-bold py-2.5 text-xs cursor-pointer shadow-lg font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                  {t.btnPgConnecting}
                </>
              ) : (
                <>
                  <span>{t.btnPgConnect}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-black" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
        />
      )}
    </div>
  );
}
