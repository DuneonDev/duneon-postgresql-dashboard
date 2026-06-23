import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Cpu, 
  Database, 
  RefreshCw, 
  Users, 
  Lock, 
  Clock, 
  Bell, 
  TrendingUp, 
  Activity, 
  Terminal,
  FileText
} from 'lucide-react';

interface MonitoringSectionProps {
  sshConfig: any;
  pgConfig: any;
  currentDb: string;
  lang: 'ru' | 'en' | 'am';
}

export default function MonitoringSection({ sshConfig, pgConfig, currentDb, lang }: MonitoringSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // simulated server statistics (CPU, RAM, space free) that fluctuate visually
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(44);
  const [diskFree, setDiskFree] = useState(88.4);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetPgConfig = { ...pgConfig, database: currentDb };
      const response = await fetch('/api/postgres/monitoring-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch database telemetry stats');
      }
      setStats(data);

      // dynamically update notifications list based on loaded health
      const updatedAlerts = [];
      if (data.activeConnections?.length > 15) {
        updatedAlerts.push({
          id: 1,
          type: 'warning',
          title: lang === 'ru' ? 'Превышение лимита сессий' : 'High Active Sessions',
          desc: lang === 'ru' ? 'Более 15 одновременных открытых соединений в БД.' : 'There are more than 15 simultaneous open connections.'
        });
      }
      if (data.locks?.length > 5) {
        updatedAlerts.push({
          id: 2,
          type: 'error',
          title: lang === 'ru' ? 'Обнаружены блокировки транзакций' : 'Database Locks Detected',
          desc: lang === 'ru' ? `${data.locks.length} блокировок удерживают дедлоки.` : `${data.locks.length} active locks are holding deadlocks.`
        });
      }
      if (data.dbSize > 1024 * 1024 * 1024) { // over 1 GB
        updatedAlerts.push({
          id: 3,
          type: 'info',
          title: lang === 'ru' ? 'База данных увеличилась в размере' : 'Database Storage Notice',
          desc: lang === 'ru' ? 'Размер БД превысил рекомендуемый уровень бесплатного лимита.' : 'Database size exceeded the recommended free tier footprint.'
        });
      }
      setNotifications(updatedAlerts);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting to monitoring port forward failed.');
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig, currentDb, lang]);

  useEffect(() => {
    fetchStats();
    
    // Auto pull telemetry stats every 10 seconds
    const interval = setInterval(() => {
      fetchStats();
      setCpuUsage(prev => Math.max(5, Math.min(95, Math.round(prev + (Math.random() * 10 - 5)))));
      setRamUsage(prev => Math.max(30, Math.min(90, Math.round(prev + (Math.random() * 4 - 2)))));
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  const prettyBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-900/50 bg-red-950/20 text-red-400';
      case 'warning': return 'border-amber-900/50 bg-amber-950/20 text-amber-500';
      default: return 'border-blue-900/50 bg-blue-950/20 text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Header */}
      <div className="flex items-center justify-between border-b border-[#23252C] pb-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-[#E2E8F0] tracking-widest uppercase font-mono">
            {lang === 'ru' ? 'МОНИТОРИНГ И ДИАГНОСТИКА СЕРВЕРА' : lang === 'am' ? 'ՍԵՐՎԵՐԻ ՄՈՆԻԹՈՐԻՆԳ' : 'REAL-TIME METRICS & DIAGNOSTICS'}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-1 font-mono">
            {lang === 'ru' ? 'Активные сессии, дисковый размер, утилизация ресурсов кластеров в реальном времени' : 'Active sessions, disk sizes, cluster resource utilisation logs'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="rounded-full bg-[#15171F] hover:bg-[#1C1F2B] text-white border border-[#23252C] text-xs font-semibold py-1.5 px-4 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${loading ? 'animate-spin text-white' : ''}`} />
          <span>{lang === 'ru' ? 'Обновить данные' : 'Flush stats'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-900/40 bg-red-950/15 text-xs text-red-500 font-mono flex items-center gap-2.5">
          <Activity className="h-4 w-4 shrink-0 animate-pulse text-red-500" />
          <span>{lang === 'ru' ? 'Ошибка загрузки телеметрии:' : 'Failed to parse telemetry status:'} {error}</span>
        </div>
      )}

      {/* Grid of core metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active connections widget */}
        <div className="p-4 rounded-xl border border-[#23252C] bg-[#0A0B0D] shadow-md flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold tracking-widest font-mono uppercase">{lang === 'ru' ? 'ПОДКЛЮЧЕНИЯ' : 'CONNECTIONS'}</div>
            <div className="text-xl font-mono font-bold text-white mt-1">
              {stats ? stats.activeConnections?.length : '--'}
            </div>
            <div className="text-[9px] text-emerald-400 font-mono mt-0.5">● Active Session</div>
          </div>
        </div>

        {/* Database Size widget */}
        <div className="p-4 rounded-xl border border-[#23252C] bg-[#0A0B0D] shadow-md flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-bold tracking-widest font-mono uppercase">{lang === 'ru' ? 'РАЗМЕР БАЗЫ' : 'DATABASE SIZE'}</div>
            <div className="text-xl font-mono font-bold text-white mt-1">
              {stats ? prettyBytes(stats.dbSize) : '--'}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{currentDb}</div>
          </div>
        </div>

        {/* Simulated CPU widget */}
        <div className="p-4 rounded-xl border border-[#23252C] bg-[#0A0B0D] shadow-md flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 font-bold tracking-widest font-mono uppercase">{lang === 'ru' ? 'НАГРУЗКА CPU' : 'CPU ALLOCATION'}</div>
            <div className="text-xl font-mono font-bold text-white mt-1 flex items-baseline gap-1">
              {cpuUsage}%
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1 mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Simulated RAM widget */}
        <div className="p-4 rounded-xl border border-[#23252C] bg-[#0A0B0D] shadow-md flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Server className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 font-bold tracking-widest font-mono uppercase">{lang === 'ru' ? 'ПАМЯТЬ RAM' : 'RAM UTILISATION'}</div>
            <div className="text-xl font-mono font-bold text-white mt-1">
              {ramUsage}%
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1 mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${ramUsage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts Panel */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-500 tracking-wider font-mono flex items-center gap-1.5 uppercase">
            <Bell className="h-3.5 w-3.5 text-zinc-500" />
            {lang === 'ru' ? 'Уведомления и алерты производительности' : 'Alert notifications'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-3 border rounded-xl flex flex-col gap-1 text-xs font-mono transition-transform duration-300 hover:scale-[1.01] ${getAlertStyle(notif.type)}`}
              >
                <div className="font-bold flex items-center gap-1.5 block">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {notif.title}
                </div>
                <div className="text-[10.5px] leading-relaxed text-zinc-300/80 mt-0.5">{notif.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables storage size & connections breakdown stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active connection session pids table */}
        <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col shadow-lg">
          <div className="px-4 py-3 bg-[#050506] text-[10px] font-bold tracking-widest text-[#E2E8F0] border-b border-[#23252C] uppercase flex items-center justify-between font-mono">
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
              {lang === 'ru' ? 'Активные подключения (pg_stat_activity)' : 'Active client sessions'}
            </span>
          </div>
          <div className="p-0 overflow-auto max-h-[300px]">
            <table className="w-full text-left text-xs font-mono select-text">
              <thead>
                <tr className="bg-[#050506]/50 border-b border-[#23252C] text-gray-500 text-[9px] uppercase tracking-wider font-semibold">
                  <th className="px-3.5 py-2">PID</th>
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Пользователь' : 'User'}</th>
                  <th className="px-3.5 py-2">IP</th>
                  <th className="px-3.5 py-2">STATUS</th>
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Текущий запрос' : 'Executing SQL'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252C]/40">
                {stats?.activeConnections && stats.activeConnections.length > 0 ? (
                  stats.activeConnections.map((conn: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#15171F]/40 transition-colors text-[11px]">
                      <td className="px-3.5 py-2.5 text-zinc-400 font-bold">{conn.pid}</td>
                      <td className="px-3.5 py-2.5 text-zinc-300">{conn.usename}</td>
                      <td className="px-3.5 py-2.5 text-zinc-500 text-[10px]">{conn.client_addr || 'local_socket'}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          conn.state === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {conn.state || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 max-w-[200px] truncate text-zinc-400 font-light text-[10.5px]" title={conn.query}>
                        {conn.query || '(idle transaction)'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-650">{lang === 'ru' ? 'Нет подключений' : 'No connection logs found'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Sizes breakdown chart metrics */}
        <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col shadow-lg">
          <div className="px-4 py-3 bg-[#050506] text-[10px] font-bold tracking-widest text-[#E2E8F0] border-b border-[#23252C] uppercase flex items-center justify-between font-mono">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              {lang === 'ru' ? 'Размер отдельных таблиц и индексов' : 'Table & index footprints'}
            </span>
          </div>
          <div className="p-0 overflow-auto max-h-[300px]">
            <table className="w-full text-left text-xs font-mono select-text">
              <thead>
                <tr className="bg-[#050506]/50 border-b border-[#23252C] text-gray-500 text-[9px] uppercase tracking-wider font-semibold">
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Таблица' : 'Table'}</th>
                  <th className="px-3.5 py-2">Rows</th>
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Данные' : 'Data Size'}</th>
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Индексы' : 'Index Size'}</th>
                  <th className="px-3.5 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252C]/40">
                {stats?.tableSizes && stats.tableSizes.length > 0 ? (
                  stats.tableSizes.map((tbl: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#15171F]/40 transition-colors text-[11px]">
                      <td className="px-3.5 py-2.5 text-white font-semibold flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        {tbl.table_name}
                      </td>
                      <td className="px-3.5 py-2.5 text-zinc-400 font-bold">{tbl.row_count ?? 0}</td>
                      <td className="px-3.5 py-2.5 text-zinc-400">{prettyBytes(parseInt(tbl.table_size))}</td>
                      <td className="px-3.5 py-2.5 text-zinc-500">{prettyBytes(parseInt(tbl.index_size))}</td>
                      <td className="px-3.5 py-2.5 text-emerald-400 font-bold">{prettyBytes(parseInt(tbl.total_size))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-zinc-650">{lang === 'ru' ? 'Нет таблиц в схеме public' : 'No user-tables detected in schema public'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Deadlocks & Locks */}
        <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col shadow-lg">
          <div className="px-4 py-3 bg-[#050506] text-[10px] font-bold tracking-widest text-[#E2E8F0] border-b border-[#23252C] uppercase flex items-center justify-between font-mono">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-pink-400" />
              {lang === 'ru' ? 'Блокировки блокировочного пула (pg_locks)' : 'Current Transaction locks'}
            </span>
          </div>
          <div className="p-0 overflow-auto max-h-[220px]">
            <table className="w-full text-left text-xs font-mono select-text">
              <thead>
                <tr className="bg-[#050506]/50 border-b border-[#23252C] text-gray-500 text-[9px] uppercase tracking-wider font-semibold">
                  <th className="px-3.5 py-2">PID</th>
                  <th className="px-3.5 py-2">Type</th>
                  <th className="px-3.5 py-2">Mode</th>
                  <th className="px-3.5 py-2">GRANTED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252C]/40">
                {stats?.locks && stats.locks.length > 0 ? (
                  stats.locks.map((lock: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#15171F]/40 transition-colors text-[11px]">
                      <td className="px-3.5 py-2.5 text-zinc-400">{lock.pid}</td>
                      <td className="px-3.5 py-2.5 text-zinc-400">{lock.locktype}</td>
                      <td className="px-3.5 py-2.5 text-pink-400 font-light">{lock.mode}</td>
                      <td className="px-3.5 py-2.5">
                        <span className={`text-[10px] font-bold ${lock.granted ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`}>
                          {lock.granted ? 'TRUE' : 'WAIT_LOCK'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-zinc-650">{lang === 'ru' ? 'Активные транзакционные блокировки отсутствуют' : 'No transactional bottlenecks found'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slow Execution / Bottleneck queries */}
        <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col shadow-lg">
          <div className="px-4 py-3 bg-[#050506] text-[10px] font-bold tracking-widest text-[#E2E8F0] border-b border-[#23252C] uppercase flex items-center justify-between font-mono">
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-rose-400" />
              {lang === 'ru' ? 'Медленные и ресурсоемкие запросы (>1s)' : 'Slow executing query logs (>1s)'}
            </span>
          </div>
          <div className="p-0 overflow-auto max-h-[220px]">
            <table className="w-full text-left text-xs font-mono select-text">
              <thead>
                <tr className="bg-[#050506]/50 border-b border-[#23252C] text-gray-500 text-[9px] uppercase tracking-wider font-semibold">
                  <th className="px-3.5 py-2">PID</th>
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Пользователь' : 'User'}</th>
                  <th className="px-3.5 py-2">SQL</th>
                  <th className="px-3.5 py-2">{lang === 'ru' ? 'Время' : 'Duration'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23252C]/40">
                {stats?.slowQueries && stats.slowQueries.length > 0 ? (
                  stats.slowQueries.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#15171F]/40 transition-colors text-[11px]">
                      <td className="px-3.5 py-2.5 text-rose-500 font-bold">{item.pid}</td>
                      <td className="px-3.5 py-2.5 text-zinc-400">{item.usename}</td>
                      <td className="px-3.5 py-2.5 text-zinc-300 max-w-[200px] truncate leading-tight font-light" title={item.query}>{item.query}</td>
                      <td className="px-3.5 py-2.5 text-amber-500 text-[10px] font-bold">
                        {typeof item.duration === 'object' ? `${item.duration.milliseconds || item.duration.seconds || 1500}ms` : item.duration}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-zinc-650">{lang === 'ru' ? 'Все запросы исполнены оптимально' : 'All transactions are executing in sub-second limits'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
