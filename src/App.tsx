import { useState, useEffect } from 'react';
import SSHForm from './components/SSHForm.js';
import UserLogin from './components/UserLogin.js';
import Dashboard from './components/Dashboard.js';
import { SSHConfig, PgConfig } from './types.js';
import { LangType } from './translations.js';
import { uiSound } from './utils/audio.js';

export type PageState = 'ssh-connect' | 'postgres-login' | 'dashboard';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('duneon_theme') as 'light' | 'dark' | 'system' | null;
    return saved || 'dark';
  });

  const [soundMuted, setSoundMuted] = useState(() => {
    const stored = localStorage.getItem('duneon_audio_muted');
    const isMuted = stored === 'true';
    const savedVol = localStorage.getItem('duneon_audio_volume');
    const restoredVol = savedVol ? parseFloat(savedVol) : 0.08;
    uiSound.setVolume(isMuted ? 0 : restoredVol);
    return isMuted;
  });

  useEffect(() => {
    const root = document.documentElement;
    const apply = (currentTheme: 'light' | 'dark' | 'system') => {
      root.classList.remove('theme-light', 'theme-dark');
      if (currentTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isDark ? 'theme-dark' : 'theme-light');
      } else {
        root.classList.add(`theme-${currentTheme}`);
      }
    };

    apply(theme);
    localStorage.setItem('duneon_theme', theme);

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => apply('system');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);
  const [page, setPageState] = useState<PageState>(() => {
    try {
      const cacheStr = localStorage.getItem('duneon_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000) {
          if (cache.sshConfig && cache.pgConfig) {
            return 'dashboard';
          }
          if (cache.sshConfig) {
            return 'postgres-login';
          }
        } else {
          localStorage.removeItem('duneon_cache');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'ssh-connect';
  });

  const [sshConfig, setSshConfig] = useState<SSHConfig | null>(() => {
    try {
      const cacheStr = localStorage.getItem('duneon_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000 && cache.sshConfig) {
          return cache.sshConfig;
        }
      }
    } catch {}
    return null;
  });

  const [postgresUsers, setPostgresUsers] = useState<string[]>(() => {
    try {
      const cacheStr = localStorage.getItem('duneon_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000 && cache.postgresUsers) {
          return cache.postgresUsers;
        }
      }
    } catch {}
    return [];
  });

  const [pgConfig, setPgConfig] = useState<PgConfig | null>(() => {
    try {
      const cacheStr = localStorage.getItem('duneon_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000 && cache.pgConfig) {
          return cache.pgConfig;
        }
      }
    } catch {}
    return null;
  });

  const [databases, setDatabases] = useState<string[]>(() => {
    try {
      const cacheStr = localStorage.getItem('duneon_cache');
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        if (Date.now() - cache.timestamp < 24 * 60 * 60 * 1000 && cache.databases) {
          return cache.databases;
        }
      }
    } catch {}
    return [];
  });

  const [lang, setLang] = useState<LangType>(() => {
    const saved = localStorage.getItem('duneon_lang') as LangType | null;
    return (saved === 'ru' || saved === 'en' || saved === 'am') ? saved : 'ru';
  });

  const handleLangChange = (l: LangType) => {
    setLang(l);
    localStorage.setItem('duneon_lang', l);
  };

  const handleSshSuccess = (config: SSHConfig, users: string[]) => {
    setSshConfig(config);
    setPostgresUsers(users);
    setPageState('postgres-login');

    const cache = {
      sshConfig: config,
      postgresUsers: users,
      pgConfig: null,
      databases: [],
      timestamp: Date.now()
    };
    localStorage.setItem('duneon_cache', JSON.stringify(cache));
  };

  const handleLoginSuccess = (config: PgConfig, dbList: string[]) => {
    setPgConfig(config);
    setDatabases(dbList);
    setPageState('dashboard');

    const cache = {
      sshConfig: sshConfig,
      postgresUsers: postgresUsers,
      pgConfig: config,
      databases: dbList,
      timestamp: Date.now()
    };
    localStorage.setItem('duneon_cache', JSON.stringify(cache));
  };

  const handleBackToSSH = () => {
    setPageState('ssh-connect');
    localStorage.removeItem('duneon_cache');
  };

  const handleLogout = () => {
    setPgConfig(null);
    setDatabases([]);
    setPageState('postgres-login');

    const cache = {
      sshConfig: sshConfig,
      postgresUsers: postgresUsers,
      pgConfig: null,
      databases: [],
      timestamp: Date.now()
    };
    localStorage.setItem('duneon_cache', JSON.stringify(cache));
  };

  return (
    <div className="bg-[#050506] min-h-screen text-[#E2E8F0] selection:bg-neutral-800 selection:text-white font-sans transition-colors duration-250">
      {page === 'ssh-connect' && (
        <SSHForm 
          onSshSuccess={handleSshSuccess} 
          lang={lang} 
          setLang={handleLangChange} 
          theme={theme}
          setTheme={setTheme}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
        />
      )}
      
      {page === 'postgres-login' && sshConfig && (
        <UserLogin
          sshConfig={sshConfig}
          postgresUsers={postgresUsers}
          onBack={handleBackToSSH}
          onLoginSuccess={handleLoginSuccess}
          lang={lang}
          setLang={handleLangChange}
          theme={theme}
          setTheme={setTheme}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
        />
      )}

      {page === 'dashboard' && sshConfig && pgConfig && (
        <Dashboard
          sshConfig={sshConfig}
          initialPgConfig={pgConfig}
          initialDatabases={databases}
          onLogout={handleLogout}
          lang={lang}
          setLang={handleLangChange}
          theme={theme}
          setTheme={setTheme}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
        />
      )}
    </div>
  );
}
