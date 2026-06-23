import React, { useState } from 'react';
import { uiSound } from '../utils/audio.js';
import { LangType, translations } from '../translations.js';
import { X, Volume2, VolumeX, Sun, Moon, Laptop, Globe, Check } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  soundMuted: boolean;
  setSoundMuted: (b: boolean) => void;
}

export default function SettingsModal({
  onClose,
  lang,
  setLang,
  theme,
  setTheme,
  soundMuted,
  setSoundMuted
}: SettingsModalProps) {
  const t = translations[lang];

  // Temp state to preview volume
  const [volLevel, setVolLevel] = useState(() => {
    return Math.round(uiSound.getVolume() * 100);
  });

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolLevel(val);
    const floatVal = val / 100;
    uiSound.setVolume(floatVal);
    
    // Play test click for auditory feedback (throttle slightly or just play on adjust)
    if (val > 0) {
      setSoundMuted(false);
      localStorage.setItem('duneon_audio_muted', 'false');
      uiSound.click();
    } else {
      setSoundMuted(true);
      localStorage.setItem('duneon_audio_muted', 'true');
    }
    localStorage.setItem('duneon_audio_volume', String(floatVal));
  };

  const handleToggleMute = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    localStorage.setItem('duneon_audio_muted', String(nextMuted));
    if (nextMuted) {
      uiSound.setVolume(0);
    } else {
      const savedVol = localStorage.getItem('duneon_audio_volume');
      const restoredVol = savedVol ? parseFloat(savedVol) : 0.08;
      uiSound.setVolume(restoredVol);
      setVolLevel(Math.round(restoredVol * 100));
      uiSound.click();
    }
  };

  const handleThemeChange = (selectedTheme: 'light' | 'dark' | 'system') => {
    setTheme(selectedTheme);
    uiSound.click();
  };

  const handleLangSelect = (selectedLang: LangType) => {
    setLang(selectedLang);
    uiSound.click();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div 
        className="w-full max-w-md rounded-2xl border border-[#23252C] bg-[#0A0B0D] p-6 shadow-2xl relative overflow-hidden text-[#E2E8F0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Grid Pattern Accent */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23252C]/70 pb-4 mb-5">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#94A3B8] uppercase font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.settingsTitle}
            </h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              {t.settingsDesc}
            </p>
          </div>
          <button 
            onClick={() => { uiSound.click(); onClose(); }}
            className="text-gray-400 hover:text-white hover:bg-white/5 p-1.5 rounded-full transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 text-xs">
          
          {/* Theme Setup Option */}
          <div className="space-y-2.5">
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold">
              {t.themeLabel}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Dark Theme Button */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                  theme === 'dark'
                    ? 'border-emerald-500/50 bg-[#121E19]/30 text-white'
                    : 'border-[#23252C] bg-[#0F1115]/40 text-gray-400 hover:border-[#2F323B] hover:text-white'
                }`}
              >
                <Moon className={`h-4.5 w-4.5 ${theme === 'dark' ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span className="text-[10px] font-medium tracking-wide">{t.themeDark}</span>
                {theme === 'dark' && (
                  <span className="absolute top-1.5 right-1.5 text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>

              {/* Light Theme Button */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                  theme === 'light'
                    ? 'border-emerald-500/50 bg-[#121E19]/30 text-white'
                    : 'border-[#23252C] bg-[#0F1115]/40 text-gray-400 hover:border-[#2F323B] hover:text-white'
                }`}
              >
                <Sun className={`h-4.5 w-4.5 ${theme === 'light' ? 'text-amber-500' : 'text-gray-400'}`} />
                <span className="text-[10px] font-medium tracking-wide">{t.themeLight}</span>
                {theme === 'light' && (
                  <span className="absolute top-1.5 right-1.5 text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>

              {/* System Preference Button */}
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer text-center relative ${
                  theme === 'system'
                    ? 'border-emerald-500/50 bg-[#121E19]/30 text-white'
                    : 'border-[#23252C] bg-[#0F1115]/40 text-gray-400 hover:border-[#2F323B] hover:text-white'
                }`}
              >
                <Laptop className="h-4.5 w-4.5 text-gray-400" />
                <span className="text-[10px] font-medium tracking-wide">{t.themeSystem}</span>
                {theme === 'system' && (
                  <span className="absolute top-1.5 right-1.5 text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sound Slider Option */}
          <div className="space-y-3.5 border-t border-[#23252C]/70 pt-4.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold">
                {t.soundLabel}
              </label>

              {/* Mute Pill Toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold font-mono transition-all cursor-pointer border ${
                  soundMuted
                    ? 'bg-red-950/15 border-red-900/40 text-red-400'
                    : 'bg-emerald-950/15 border-emerald-900/40 text-emerald-400'
                }`}
              >
                {soundMuted ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>{t.soundMuted.toUpperCase()}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{t.soundEnabled.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>

            {/* Slider with Volume level */}
            <div className={`p-3.5 rounded-xl border border-[#23252C]/60 bg-[#07080A]/80 flex items-center gap-4 transition-opacity ${
              soundMuted ? 'opacity-40' : 'opacity-100'
            }`}>
              <span className="text-gray-400">
                {soundMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
              </span>
              
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                  <span>{t.soundVolume}</span>
                  <span className="text-emerald-400 font-semibold">{soundMuted ? 0 : volLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundMuted ? 0 : volLevel}
                  onChange={handleVolumeChange}
                  disabled={soundMuted}
                  className="w-full h-1 bg-[#1A1C23] border border-transparent rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none focus:ring-0 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-emerald-500 [&::-moz-range-thumb]:border-0"
                />
              </div>
            </div>
          </div>

          {/* Language Switch */}
          <div className="space-y-2.5 border-t border-[#23252C]/70 pt-4.5">
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold">
              {t.langLabel}
            </label>
            <div className="flex items-center gap-2 bg-[#0F1115]/50 border border-[#23252C] rounded-xl p-2.5">
              <Globe className="h-3.5 w-3.5 text-gray-505 shrink-0" />
              <div className="flex-1 grid grid-cols-3 gap-2 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => handleLangSelect('ru')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                    lang === 'ru'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Русский (RU)
                </button>
                <button
                  type="button"
                  onClick={() => handleLangSelect('en')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                    lang === 'en'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => handleLangSelect('am')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                    lang === 'am'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Հայերեն (AM)
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Actions Button */}
        <div className="mt-7 flex justify-end">
          <button
            onClick={() => { uiSound.success(); onClose(); }}
            className="w-full flex items-center justify-center border border-[#10B981] bg-[#10B981] hover:bg-emerald-600 rounded-full px-5 py-2.5 text-[#0A0B0D] hover:text-white transition-all cursor-pointer font-bold font-sans tracking-wide shadow-lg shadow-emerald-500/10 text-[11px]"
          >
            {t.saveSettings}
          </button>
        </div>

      </div>
    </div>
  );
}
