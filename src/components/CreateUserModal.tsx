import React, { useState } from 'react';
import { X, AlertCircle, ShieldAlert } from 'lucide-react';
import { LangType, translations } from '../translations.js';

interface CreateUserModalProps {
  onClose: () => void;
  onCreate: (username: string, pass: string, isSuper: boolean) => Promise<void>;
  lang: LangType;
}

export default function CreateUserModal({ onClose, onCreate, lang }: CreateUserModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return setError(lang === 'ru' ? 'Пожалуйста, введите имя пользователя и пароль.' : lang === 'am' ? 'Խնդրում ենք մուտքագրել թե օգտանունը, և թե գաղտնաբառը:' : 'Please enter both username and password.');
    }

    setLoading(true);
    setError(null);
    try {
      await onCreate(username.trim(), password.trim(), isSuperuser);
    } catch (err: any) {
      setError(err.message || 'Failed to create PostgreSQL role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D11]/90 p-3 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md rounded border border-[#2D2F34] bg-[#0F1115] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2F34] px-4 py-2.5 bg-[#181A1F]">
          <div>
            <h3 className="text-xs font-bold text-white tracking-widest uppercase">
              {lang === 'ru' ? 'СОЗДАТЬ СИСТЕМНУЮ РОЛЬ' : lang === 'am' ? 'ՍՏԵՂԾԵԼ ՀԱՄԱԿԱՐԳԱՅԻՆ ԴԵՐ' : 'CREATE NEW ROLE'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
              {lang === 'ru' ? 'Настройка полномочий учетных записей внутри кластера СУБД' : lang === 'am' ? 'Արտոնությունների կարգավորում տվյալների բազայի կլաստերում' : 'Provision security credentials inside cluster'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/20 p-2.5 flex items-start gap-2 text-xs text-red-400 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>[PROVISION_FAILED]: {error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="pg-user-username" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 font-mono">
                {lang === 'ru' ? 'ИМЯ_РОЛИ' : lang === 'am' ? 'ԴԵՐԻ_ԱՆՈՒՆԸ' : 'ROLE NAME'}
              </label>
              <input
                id="pg-user-username"
                type="text"
                required
                placeholder="dev_user, read_only_worker..."
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2.5 py-1 text-xs text-white placeholder-gray-655 focus:border-blue-500 outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label htmlFor="pg-user-password" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 font-mono">
                {lang === 'ru' ? 'ПАРОЛЬ_РОЛИ' : lang === 'am' ? 'ԴԵՐԻ_ԳԱՂՏՆԱԲԱՌԸ' : 'ROLE PASSWORD'}
              </label>
              <input
                id="pg-user-password"
                type="text"
                required
                placeholder="Enter role security token"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2.5 py-1 text-xs text-white placeholder-gray-655 focus:border-blue-500 outline-none transition-colors font-mono"
              />
            </div>

            <div className="rounded border border-yellow-950/40 bg-yellow-950/10 p-3">
              <div className="flex items-start gap-2.5">
                <input
                   id="pg-user-superuser"
                  type="checkbox"
                  checked={isSuperuser}
                  onChange={(e) => setIsSuperuser(e.target.checked)}
                  className="h-3.5 w-3.5 mt-0.5 rounded border-[#2D2F34] text-yellow-500 bg-[#0F1115] accent-yellow-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="pg-user-superuser" className="text-[11px] font-bold text-yellow-500 cursor-pointer flex items-center gap-1 font-mono">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {lang === 'ru' ? 'НАЗНАЧИТЬ SUPERUSER' : lang === 'am' ? 'ԿԱՐԳԱԲԵՐԵԼ ՈՐՊԵՍ SUPERUSER' : 'AUTHORIZE SUPERUSER'}
                  </label>
                  <p className="text-[9.5px] text-gray-500 leading-normal font-mono">
                    {lang === 'ru' ? 'Предоставляет административные привилегии в СУБД, игнорируя стандартные ограничения прав доступа ACL.' : lang === 'am' ? 'Տրամադրում է տվյալների բազայի կառավարման լիարժեք արտոնություններ՝ շրջանցելով ստանդարտ ACL-ները:' : 'Grants global database administrative overrides bypassing standard schemas ACL.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#2D2F34] px-4 py-2.5 bg-[#181A1F]">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#2D2F34] bg-[#0F1115] px-3 py-1 font-mono text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-3 py-1 font-mono text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {loading ? (lang === 'ru' ? 'СОЗДАНИЕ...' : lang === 'am' ? 'ՍՏԵՂԾՈՒՄ...' : 'CREATING...') : (lang === 'ru' ? 'СОЗДАТЬ' : lang === 'am' ? 'ՍՏԵՂԾԵԼ' : 'CREATE_ROLE')}
          </button>
        </div>
      </div>
    </div>
  );
}
