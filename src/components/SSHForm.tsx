import React, { useState } from 'react';
import { SSHConfig } from '../types.js';
import { Key, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { LangType, translations } from '../translations.js';
import DuneonLogo from './DuneonLogo.js';

interface SSHFormProps {
  onSshSuccess: (config: SSHConfig, users: string[]) => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  logoType: 'default' | 'no_d' | 'no_logo' | 'no_text';
  setLogoType: (logo: 'default' | 'no_d' | 'no_logo' | 'no_text') => void;
}

export default function SSHForm({ onSshSuccess, lang, setLang, logoType, setLogoType }: SSHFormProps) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('root');
  const [authMethod, setAuthMethod] = useState<'password' | 'privateKey'>('password');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const sshConfig: SSHConfig = {
      host,
      port,
      username,
      authMethod,
      password: authMethod === 'password' ? password : undefined,
      privateKey: authMethod === 'privateKey' ? privateKey : undefined,
    };

    try {
      const response = await fetch('/api/postgres/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ssh: sshConfig }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'SSH Connection Failed');
      }

      onSshSuccess(sshConfig, data.users || ['postgres']);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error establishing SSH connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#050506] font-sans text-[#E2E8F0] relative overflow-hidden select-none">
      
      {/* Top Duneon Corporate Header */}
      <header className="w-full h-16 border-b border-[#131418] bg-[#050506]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <DuneonLogo className="h-6 md:h-7" logoType={logoType} />
        </div>
        
        <div className="flex items-center gap-4">
          {/* Languages Switcher aligned with corporate silver layout */}
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
        </div>
      </header>

      {/* Main hero background and connection portal */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-14 py-10 z-10 animate-fade-in">
        
        {/* Left side text matching website styling */}
        <div className="max-w-md text-left space-y-4 md:space-y-6">
          <span className="inline-block text-[10px] uppercase tracking-widest font-bold bg-[#16181C] text-neutral-300 border border-[#212328] px-2 py-1 rounded">
            DUNEON SYSTEM CONTROL
          </span>
          <h1 className="text-2xl md:text-[34px] font-bold tracking-tight text-white leading-tight font-sans">
            {t.brandTitle}
          </h1>
          <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-light">
            {t.brandSubtitle}
          </p>
          
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase">{t.protectedChannel}</span>
          </div>
        </div>

        {/* Right side connection form box */}
        <div className="w-full max-w-sm rounded-xl border border-[#23252C] bg-[#0A0B0D] p-6.5 shadow-2xl relative">
          <div className="mb-5">
            <h2 className="text-xs font-bold tracking-widest text-[#94A3B8] uppercase font-mono">{t.sshTitle}</h2>
            <p className="mt-1 text-[10px] text-gray-500 font-mono">
              {t.sshSub}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-900/50 bg-red-950/20 p-3 text-[11px] text-red-500 font-mono">
              <div className="font-bold mb-0.5 uppercase tracking-wider text-[9px] text-red-450">CONNECT_SESSION_FAILED:</div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label htmlFor="ssh-host" className="block text-[10px] uppercase tracking-wider text-gray-450 mb-1 font-mono">
                  {t.ipHost}
                </label>
                <input
                  id="ssh-host"
                  type="text"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full rounded border border-[#2D2F34] bg-[#050506] py-2 px-2.5 text-xs text-white placeholder-gray-700 outline-none font-mono"
                  placeholder="12.34.56.78"
                />
              </div>

              <div>
                <label htmlFor="ssh-port" className="block text-[10px] uppercase tracking-wider text-gray-455 mb-1 font-mono">
                  {t.port}
                </label>
                <input
                  id="ssh-port"
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  className="w-full rounded border border-[#2D2F34] bg-[#050506] py-2 px-2.5 text-xs text-white placeholder-gray-700 outline-none font-mono"
                  placeholder="22"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ssh-username" className="block text-[10px] uppercase tracking-wider text-gray-455 mb-1 font-mono">
                {t.sshUser}
              </label>
              <input
                id="ssh-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-[#2D2F34] bg-[#050506] py-2 px-2.5 text-xs text-white placeholder-gray-700 outline-none font-mono"
                placeholder="root"
              />
            </div>

            <div>
              <span className="block text-[10px] uppercase tracking-wider text-gray-455 mb-1.5 font-mono">
                {t.authMethod}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 text-[11px] transition-all cursor-pointer font-bold ${
                    authMethod === 'password'
                      ? 'bg-[#15171F] border border-[#3E4254] text-white font-mono'
                      : 'border border-[#23252C] bg-[#090A0C] text-gray-500 hover:text-white font-mono'
                  }`}
                >
                  <Key className="h-3 w-3" />
                  {t.password}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('privateKey')}
                  className={`flex items-center justify-center gap-1.5 rounded py-1.5 text-[11px] transition-all cursor-pointer font-bold ${
                    authMethod === 'privateKey'
                      ? 'bg-[#15171F] border border-[#3E4254] text-white font-mono'
                      : 'border border-[#23252C] bg-[#090A0C] text-gray-500 hover:text-white font-mono'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.sshKey}
                </button>
              </div>
            </div>

            {authMethod === 'password' ? (
              <div>
                <label htmlFor="ssh-password" className="block text-[10px] uppercase tracking-wider text-gray-455 mb-1 font-mono">
                  SSH {t.password}
                </label>
                <div className="relative">
                  <input
                    id="ssh-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded border border-[#2D2F34] bg-[#050506] py-2 pl-2.5 pr-8 text-xs text-white placeholder-gray-650 outline-none font-mono"
                    placeholder={t.pwdPlaceholder}
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
            ) : (
              <div>
                <label htmlFor="ssh-private-key" className="block text-[10px] uppercase tracking-wider text-gray-455 mb-1 font-mono">
                  {t.sshKey} (OpenSSH)
                </label>
                <textarea
                  id="ssh-private-key"
                  required
                  rows={4}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full rounded border border-[#2D2F34] bg-[#050506] p-2.5 font-mono text-[10px] text-gray-300 placeholder-[#475569] outline-none id-input resize-none leading-relaxed"
                  placeholder={t.keyPlaceholder}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white hover:bg-[#E2E8F0] active:scale-[0.99] disabled:opacity-50 transition-all text-black font-bold py-2.5 text-xs cursor-pointer shadow-lg font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                  {t.btnConnecting}
                </>
              ) : (
                <>
                  <span>{t.btnConnect}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-black" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
