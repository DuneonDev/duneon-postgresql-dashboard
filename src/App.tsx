import { useState } from 'react';
import SSHForm from './components/SSHForm.js';
import UserLogin from './components/UserLogin.js';
import Dashboard from './components/Dashboard.js';
import { SSHConfig, PgConfig } from './types.js';
import { LangType } from './translations.js';

export type PageState = 'ssh-connect' | 'postgres-login' | 'dashboard';
export type LogoType = 'default' | 'no_d' | 'no_logo' | 'no_text';

export default function App() {
  const [page, setPageState] = useState<PageState>('ssh-connect');
  const [sshConfig, setSshConfig] = useState<SSHConfig | null>(null);
  const [postgresUsers, setPostgresUsers] = useState<string[]>([]);
  const [pgConfig, setPgConfig] = useState<PgConfig | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [lang, setLang] = useState<LangType>(() => {
    const saved = localStorage.getItem('duneon_lang') as LangType | null;
    return (saved === 'ru' || saved === 'en' || saved === 'am') ? saved : 'ru';
  });
  const [logoType, setLogoType] = useState<LogoType>(() => {
    const saved = localStorage.getItem('duneon_logo') as LogoType | null;
    return (saved === 'default' || saved === 'no_d' || saved === 'no_logo' || saved === 'no_text') ? saved : 'default';
  });

  const handleLangChange = (l: LangType) => {
    setLang(l);
    localStorage.setItem('duneon_lang', l);
  };

  const handleLogoChange = (logo: LogoType) => {
    setLogoType(logo);
    localStorage.setItem('duneon_logo', logo);
  };

  const handleSshSuccess = (config: SSHConfig, users: string[]) => {
    setSshConfig(config);
    setPostgresUsers(users);
    setPageState('postgres-login');
  };

  const handleLoginSuccess = (config: PgConfig, dbList: string[]) => {
    setPgConfig(config);
    setDatabases(dbList);
    setPageState('dashboard');
  };

  const handleBackToSSH = () => {
    setPageState('ssh-connect');
  };

  const handleLogout = () => {
    setPgConfig(null);
    setDatabases([]);
    setPageState('postgres-login');
  };

  return (
    <div className="bg-[#050506] min-h-screen text-[#E2E8F0] selection:bg-neutral-800 selection:text-white font-sans">
      {page === 'ssh-connect' && (
        <SSHForm 
          onSshSuccess={handleSshSuccess} 
          lang={lang} 
          setLang={handleLangChange} 
          logoType={logoType}
          setLogoType={handleLogoChange}
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
          logoType={logoType}
          setLogoType={handleLogoChange}
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
          logoType={logoType}
          setLogoType={handleLogoChange}
        />
      )}
    </div>
  );
}
