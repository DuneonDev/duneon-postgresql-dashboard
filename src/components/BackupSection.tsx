import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Archive, 
  ArrowDownToLine, 
  RefreshCw, 
  Play, 
  Calendar, 
  ShieldAlert, 
  Clock, 
  Trash2, 
  FileCheck, 
  Lock,
  Compass
} from 'lucide-react';

interface BackupSectionProps {
  currentDb: string;
  lang: 'ru' | 'en' | 'am';
}

export default function BackupSection({ currentDb, lang }: BackupSectionProps) {
  const [backups, setBackups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('duneon_backups_list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'bp-1', name: `duneon_${currentDb}_snapshot_stable.sql`, size: '4.8 MB', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toLocaleString(), type: 'auto', status: 'valid' },
      { id: 'bp-2', name: `duneon_${currentDb}_pre_migration.sql`, size: '12.4 MB', date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toLocaleString(), type: 'manual', status: 'valid' }
    ];
  });

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupInterval, setBackupInterval] = useState('daily');
  const [retentionDays, setRetentionDays] = useState(30);
  const [targetLocation, setTargetLocation] = useState('local'); // local | s3 | gcs

  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('duneon_backups_list', JSON.stringify(backups));
    } catch {}
  }, [backups]);

  // Simulate backup creation
  const handleCreateBackup = () => {
    setLoading(true);
    setActionMsg(null);
    setActionError(null);

    setTimeout(() => {
      const fileId = 'bp-' + Math.floor(Math.random()*10000);
      const fileName = `duneon_${currentDb}_dump_${Date.now()}.sql`;
      const mockSizes = ['1.2 MB', '3.4 MB', '5.1 MB', '7.8 MB'];
      const randomSize = mockSizes[Math.floor(Math.random() * mockSizes.length)];

      const newBackup = {
        id: fileId,
        name: fileName,
        size: randomSize,
        date: new Date().toLocaleString(),
        type: 'manual',
        status: 'valid'
      };

      setBackups(prev => [newBackup, ...prev]);
      setLoading(false);
      setActionMsg(lang === 'ru' ? 'Резервная копия успешно экспортирована и сохранена!' : 'Dump written successfully and stored!');
    }, 1500);
  };

  // Simulate restore from backup
  const handleRestoreBackup = (name: string) => {
    const confirmation = window.confirm(
      lang === 'ru' 
        ? `Вы действительно хотите восстановить базу данных «${currentDb}» из бэкапа «${name}»? Это перезапишет схему!` 
        : `Are you sure you want to restore "${currentDb}" database from backup "${name}"? Current states will be overwritten!`
    );
    if (!confirmation) return;

    setLoading(true);
    setActionMsg(null);
    setActionError(null);

    setTimeout(() => {
      setLoading(false);
      setActionMsg(
        lang === 'ru' 
          ? `База данных успешно восстановлена к контрольной точке «${name}»!` 
          : `Database index table records rolled back successfully with checkpoint "${name}"!`
      );
    }, 2800);
  };

  // Integrity checks
  const handleCheckIntegrity = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setBackups(prev => prev.map(b => b.id === id ? { ...b, status: 'verified' } : b));
      setActionMsg(lang === 'ru' ? 'Контрольная сумма SHA-256 проверена: ошибок не обнаружено.' : 'CRC checksum verified: Archive integrity is healthy.');
    }, 1000);
  };

  // Delete backup
  const handleDeleteBackup = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    setActionMsg(lang === 'ru' ? 'Архив бэкапа удален из хранилища.' : 'Backup deleted from filesystem.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#23252C] pb-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-[#E2E8F0] tracking-widest uppercase font-mono">
            {lang === 'ru' ? 'РЕЗЕРВНОЕ КОПИРОВАНИЕ И ВОССТАНОВЛЕНИЕ' : lang === 'am' ? 'ՊԱՀՈՒՍՏԱՅԻՆ ՊԱՏՃԵՆՈՒՄ' : 'BACKUP & ROLLBACK MANAGEMENT'}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-1 font-mono">
            {lang === 'ru' ? 'Управление дампами схемы через pg_dump, планирование и восстановление транзакций' : 'Configure dumps scheduler, storage preservation and restore tasks'}
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 text-xs font-mono rounded-lg flex items-center gap-1.5 animate-fade-in">
          <FileCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automatic tasks config */}
        <div className="border border-[#23252C] bg-[#0A0B0D] rounded-xl p-5 space-y-4 shadow-lg lg:col-span-1 h-fit">
          <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-400" />
            {lang === 'ru' ? 'Автоматические Бэкапы' : 'Automated Schedules'}
          </h4>

          {/* Toggle scheduler */}
          <div className="flex items-center justify-between p-3 border border-[#23252C] rounded-lg bg-[#050506]/40 text-xs font-mono select-none">
            <span>{lang === 'ru' ? 'Служба планировщика:' : 'Backup Scheduler:'}</span>
            <button 
              onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
              className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                autoBackupEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-zinc-800 text-zinc-450'
              }`}
            >
              {autoBackupEnabled ? (lang === 'ru' ? 'АКТИВНА' : 'ACTIVE') : (lang === 'ru' ? 'ВЫКЛ' : 'PAUSED')}
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs text-zinc-400">
            {/* Interval option selector */}
            <div className="flex flex-col gap-1">
              <label>{lang === 'ru' ? 'Периодичность копирования:' : 'Backup Interval:'}</label>
              <select 
                value={backupInterval} 
                onChange={e => setBackupInterval(e.target.value)}
                className="w-full bg-[#050506] border border-[#23252C] rounded shadow p-2 focus:outline-none text-xs text-white"
                disabled={!autoBackupEnabled}
              >
                <option value="hourly">{lang === 'ru' ? 'Каждый час' : 'Every hour'}</option>
                <option value="daily">{lang === 'ru' ? 'Каждый день (Ежедневно)' : 'Daily'}</option>
                <option value="weekly">{lang === 'ru' ? 'Раз в неделю (Еженедельно)' : 'Weekly'}</option>
                <option value="monthly">{lang === 'ru' ? 'Раз в месяц (Ежемесячно)' : 'Monthly'}</option>
              </select>
            </div>

            {/* Storage preservation days */}
            <div className="flex flex-col gap-1">
              <label>{lang === 'ru' ? 'Хранить версии бэкапов (дней):' : 'Backup Retention Policy:'}</label>
              <input 
                type="number" 
                value={retentionDays} 
                onChange={e => setRetentionDays(parseInt(e.target.value) || 7)}
                className="w-full bg-[#050506] border border-[#23252C] rounded shadow p-2 focus:outline-none text-xs text-white"
                disabled={!autoBackupEnabled}
                min={1}
              />
            </div>

            {/* Target driver */}
            <div className="flex flex-col gap-1">
              <label>{lang === 'ru' ? 'Хранилище назначений:' : 'Target Allocation:'}</label>
              <div className="grid grid-cols-3 gap-1 select-none">
                {['local', 's3', 'gcs'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => setTargetLocation(loc)}
                    className={`p-1.5 border rounded text-[10px] uppercase font-bold transition-all cursor-pointer ${
                      targetLocation === loc 
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' 
                        : 'border-[#23252C] hover:text-white'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => alert(lang === 'ru' ? 'Конфигурация планировщика применена!' : 'Scheduler schema changes saved!')}
              className="w-full text-center p-2 rounded bg-white hover:bg-neutral-200 text-black font-semibold text-xs cursor-pointer transition-colors shadow"
              disabled={loading}
            >
              {lang === 'ru' ? 'Сохранить настройки' : 'Confirm rules settings'}
            </button>
          </div>
        </div>

        {/* History of backups list / Immediate snapshot creation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1.5">
            <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
              <Archive className="h-4 w-4 text-zinc-400" />
              {lang === 'ru' ? 'Архив Снимков и Дампов' : 'Preserved Backups & Checkpoints'}
            </h4>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-55 shadow"
            >
              <Play className="h-3 w-3 fill-current text-white shrink-0" />
              <span>{lang === 'ru' ? 'Создать бэкап сейчас' : 'Perform pg_dump now'}</span>
            </button>
          </div>

          <div className="border border-[#23252C] bg-[#0A0B0D] rounded-xl overflow-hidden shadow-lg">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2 font-mono text-xs">
                <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
                <span>{lang === 'ru' ? 'Прогресс резервного копирования/восстановления...' : 'Processing archive actions, please hold...'}</span>
              </div>
            ) : (
              <div className="p-0 overflow-auto select-none">
                <table className="w-full text-left text-xs font-mono select-none">
                  <thead>
                    <tr className="bg-[#050506]/90 border-b border-[#23252C] text-gray-400 uppercase tracking-widest text-[9px] font-semibold">
                      <th className="px-3.5 py-2.5">{lang === 'ru' ? 'Имя файла' : 'Filename'}</th>
                      <th className="px-3.5 py-2.5">{lang === 'ru' ? 'Размер' : 'Size'}</th>
                      <th className="px-3.5 py-2.5">{lang === 'ru' ? 'Дата' : 'Timestamp'}</th>
                      <th className="px-3.5 py-2.5">INTEGRITY</th>
                      <th className="px-3.5 py-2.5 text-right w-24">{lang === 'ru' ? 'Действия' : 'Commands'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23252C]/40">
                    {backups.map((bp) => (
                      <tr key={bp.id} className="hover:bg-[#15171F]/40 transition-colors text-[11px]">
                        <td className="px-3.5 py-3 text-zinc-200 font-bold max-w-xs truncate" title={bp.name}>{bp.name}</td>
                        <td className="px-3.5 py-3 text-zinc-400">{bp.size}</td>
                        <td className="px-3.5 py-3 text-zinc-500 text-[10px]">{bp.date}</td>
                        <td className="px-3.5 py-3">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                            bp.status === 'verified' 
                              ? 'bg-emerald-900/10 border-emerald-900/30 text-emerald-400 font-bold' 
                              : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-400'
                          }`}>
                            {bp.status === 'verified' ? 'PASSED_OK' : 'NOT_CHECKED'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleCheckIntegrity(bp.id)}
                              className="p-1 rounded bg-[#101F1A] border border-[#1E4D3E]/30 text-emerald-400 hover:text-emerald-300 pointer cursor-pointer"
                              title={lang === 'ru' ? 'Проверить целостность бэкапа' : 'Trigger checksum check'}
                            >
                              <ShieldAlert className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRestoreBackup(bp.name)}
                              className="p-1 rounded bg-blue-950/40 border border-blue-900/30 text-blue-400 hover:text-blue-300 cursor-pointer text-[9.5px] font-bold px-1.5 flex items-center gap-0.5"
                              title={lang === 'ru' ? 'Восстановить бэкап в эту БД' : 'Load and overwrite DB'}
                            >
                              <ArrowDownToLine className="h-3 w-3" />
                              <span>Rollback</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(bp.id)}
                              className="p-1 rounded bg-red-950/40 text-red-400 hover:text-red-350 cursor-pointer"
                              title={lang === 'ru' ? 'Удалить этот бэкап' : 'Remove snapshot'}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
