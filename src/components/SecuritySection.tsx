import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Key, 
  Globe, 
  FileText, 
  Clock, 
  AlertTriangle,
  Fingerprint
} from 'lucide-react';

interface SecuritySectionProps {
  pgConfig: any;
  lang: 'ru' | 'en' | 'am';
}

export default function SecuritySection({ pgConfig, lang }: SecuritySectionProps) {
  // 1. IP White lists
  const [ipList, setIpList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('duneon_ip_whitelist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['192.168.1.1/24', '10.0.0.85', '127.0.0.1'];
  });
  const [newIp, setNewIp] = useState('');

  // 2. MFA status
  const [mfaEnabled, setMfaEnabled] = useState(() => {
    return localStorage.getItem('duneon_mfa_setup') === 'true';
  });

  // 3. User audit logs list
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('duneon_security_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'al-1', timestamp: new Date(Date.now() - 3200000).toLocaleString(), admin: pgConfig.user || 'postgres', op: 'CREATE TABLE', target: 'public.sales_logs', srcIp: '127.0.0.1', status: 'SUCCESS' },
      { id: 'al-2', timestamp: new Date(Date.now() - 7200000).toLocaleString(), admin: pgConfig.user || 'postgres', op: 'DELETE ROW', target: 'public.users [PK=18]', srcIp: '127.0.0.1', status: 'SUCCESS' },
      { id: 'al-3', timestamp: new Date(Date.now() - 15000000).toLocaleString(), admin: 'security_audit', op: 'ROLE PRIVILEGES MODIFY', target: 'sysadmin', srcIp: '172.16.8.2', status: 'DENIED' }
    ];
  });

  // Track state transfers to persistence
  useEffect(() => {
    try {
      localStorage.setItem('duneon_ip_whitelist', JSON.stringify(ipList));
      localStorage.setItem('duneon_mfa_setup', mfaEnabled ? 'true' : 'false');
      localStorage.setItem('duneon_security_audit_logs', JSON.stringify(auditLogs));
    } catch {}
  }, [ipList, mfaEnabled, auditLogs]);

  // Handle addition of IP whitelist configurations
  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    if (!ipList.includes(newIp.trim())) {
      setIpList(prev => [...prev, newIp.trim()]);
      
      // record action log
      const newAudit = {
        id: 'al-' + Date.now(),
        timestamp: new Date().toLocaleString(),
        admin: pgConfig.user || 'postgres',
        op: 'WHITE_LIST_IP_ADDED',
        target: newIp,
        srcIp: 'local_host',
        status: 'SUCCESS'
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }
    setNewIp('');
  };

  // Delete whitelist rule
  const handleDeleteIp = (ip: string) => {
    setIpList(prev => prev.filter(item => item !== ip));
    
    const newAudit = {
      id: 'al-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      admin: pgConfig.user || 'postgres',
      op: 'WHITE_LIST_IP_DELETED',
      target: ip,
      srcIp: 'local_host',
      status: 'SUCCESS'
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  // Toggle MFA
  const handleToggleMfa = () => {
    const nextState = !mfaEnabled;
    setMfaEnabled(nextState);
    
    const newAudit = {
      id: 'al-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      admin: pgConfig.user || 'postgres',
      op: nextState ? 'MFA_AUTH_ENABLED' : 'MFA_AUTH_DISABLED',
      target: pgConfig.user || 'postgres',
      srcIp: 'local_host',
      status: 'SUCCESS'
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#23252C] pb-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-[#E2E8F0] tracking-widest uppercase font-mono">
            {lang === 'ru' ? 'БЕЗОПАСНОСТЬ И КОНТРОЛЬ ДОСТУПА' : lang === 'am' ? 'ԱՆՎՏԱՆԳՈՒԹՅՈՒՆ ԵՎ ՀՍԿՈՒՄ' : 'SECURITY & AUDIT LOG CONTROLLER'}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-1 font-mono">
            {lang === 'ru' ? 'Двухфакторная защита (MFA), ограничения по диапазонам IP, логи действий администраторов' : 'Multi-factor authentication locks, administrator operation audit trails, IP whitelist rule blocks'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Security configuration modules */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* MFA Lock visual toggler */}
          <div className="border border-[#23252C] bg-[#0A0B0D] p-5 rounded-xl shadow-lg space-y-4">
            <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-pink-500 animate-pulse shrink-0" />
              {lang === 'ru' ? 'Двухфакторная Защита (MFA)' : '2-Factor Authentication'}
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
              {lang === 'ru' ? 'Использование Google Authenticator/TOTP токена перед записью критических DDL инструкций.' : 'Prompt for secure authentication tokens prior to performing major schema adjustments.'}
            </p>
            <div className="flex items-center justify-between bg-[#050506]/40 p-3 border border-[#23252C] rounded-lg">
              <span className="text-xs font-mono">{lang === 'ru' ? 'Защита TOTP/MFA:' : 'Authentication Status:'}</span>
              <button
                onClick={handleToggleMfa}
                className={`text-xs px-3 py-1 rounded-full font-bold cursor-pointer transition-all border ${
                  mfaEnabled 
                    ? 'bg-pink-500/10 border-pink-500/25 text-pink-400 font-bold' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}
              >
                {mfaEnabled ? (lang === 'ru' ? 'АКТИВНА' : 'LOCKED_ON') : (lang === 'ru' ? 'ВЫКЛЮЧЕНА' : 'DEACTIVATED')}
              </button>
            </div>
          </div>

          {/* IP whitelist manager */}
          <div className="border border-[#23252C] bg-[#0A0B0D] p-5 rounded-xl shadow-lg space-y-4">
            <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400 shrink-0" />
              {lang === 'ru' ? 'Ограничение по IP адресам' : 'IP Access Control rules'}
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
              {lang === 'ru' ? 'Разрешать туннельные вызовы в СУБД только со следующих IP-адресов или подсетей CIDR:' : 'Reject SSH connection handshakes originating from outside the following IP criteria:'}
            </p>

            <form onSubmit={handleAddIp} className="flex gap-2 font-mono">
              <input
                type="text"
                placeholder="e.g. 192.168.1.1"
                value={newIp}
                onChange={e => setNewIp(e.target.value)}
                className="flex-1 bg-[#050506] border border-[#23252C] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none"
              />
              <button 
                type="submit" 
                className="bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-lg text-white border border-[#23252C] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {ipList.map(ip => (
                <div key={ip} className="flex items-center justify-between p-2 rounded bg-[#050506]/55 border border-[#23252C]/30 text-xs font-mono text-zinc-300">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                    {ip}
                  </span>
                  <button 
                    onClick={() => handleDeleteIp(ip)}
                    className="text-red-400 hover:text-red-300 p-0.5 rounded cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Administration logs database and security matrix tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Log / Audit trails */}
          <div className="border border-[#23252C] bg-[#0A0B0D] rounded-xl overflow-hidden flex flex-col shadow-lg">
            <div className="px-4 py-3 bg-[#050506] text-[10px] font-bold tracking-widest text-[#E2E8F0] border-b border-[#23252C] uppercase flex items-center justify-between font-mono">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                {lang === 'ru' ? 'Журнал Аудита Действий Операторов (pg_audit)' : 'Administrator operation audit trail'}
              </span>
            </div>
            <div className="p-0 overflow-auto max-h-[350px]">
              <table className="w-full text-left text-xs font-mono select-text">
                <thead>
                  <tr className="bg-[#050506]/50 border-b border-[#23252C] text-gray-505 text-[9px] uppercase tracking-wider font-semibold">
                    <th className="px-3.5 py-2">{lang === 'ru' ? 'Время' : 'Timestamp'}</th>
                    <th className="px-3.5 py-2">{lang === 'ru' ? 'Админ/Пользователь' : 'Db_User'}</th>
                    <th className="px-3.5 py-2">{lang === 'ru' ? 'Действие' : 'Operation'}</th>
                    <th className="px-3.5 py-2">{lang === 'ru' ? 'Объект схемы' : 'Object Target'}</th>
                    <th className="px-3.5 py-2">SOURCE_IP</th>
                    <th className="px-3.5 py-2 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252C]/40 text-[11px]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#15171F]/40 transition-colors">
                      <td className="px-3.5 py-2.5 text-zinc-500 font-light text-[10px]">{log.timestamp}</td>
                      <td className="px-3.5 py-2.5 text-zinc-300 font-bold">{log.admin}</td>
                      <td className="px-3.5 py-2.5"><code className="bg-[#121319] px-1.5 py-0.5 rounded text-blue-400 font-mono text-[10px]">{log.op}</code></td>
                      <td className="px-3.5 py-2.5 text-zinc-400 truncate max-w-[124px]" title={log.target}>{log.target}</td>
                      <td className="px-3.5 py-2.5 text-zinc-550 text-[10px]">{log.srcIp}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          log.status === 'SUCCESS' 
                            ? 'bg-emerald-950/15 text-emerald-400 border border-emerald-950/30' 
                            : 'bg-red-950/15 text-red-500 border border-red-950/30 animate-pulse'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Privilege Access Matrix */}
          <div className="border border-[#23252C] bg-[#0A0B0D] rounded-xl overflow-hidden shadow-lg p-5 space-y-3 font-mono text-xs">
            <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2 pb-1 border-b border-[#23252C]/30">
              <UserCheck className="h-4 w-4 text-zinc-400" />
              {lang === 'ru' ? 'Матрица Ролевых Полномочий' : 'Access Control & Privileges Map'}
            </h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              {lang === 'ru' ? 'Активные разрешения для текущей сессии подключения к СУБД:' : 'Status of system administration access matrix rules:'}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pb-2">
              <div className="p-3.5 rounded bg-[#050506]/50 border border-[#23252C]/35">
                <div className="text-[9px] text-gray-500 uppercase">SUPERUSER</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">GRANTED_TRUE</div>
              </div>
              <div className="p-3.5 rounded bg-[#050506]/50 border border-[#23252C]/35">
                <div className="text-[9px] text-gray-500 uppercase">CREATEROLE</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">GRANTED_TRUE</div>
              </div>
              <div className="p-3.5 rounded bg-[#050506]/50 border border-[#23252C]/35">
                <div className="text-[9px] text-gray-500 uppercase">CREATEDB</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">GRANTED_TRUE</div>
              </div>
              <div className="p-3.5 rounded bg-[#050506]/50 border border-[#23252C]/35">
                <div className="text-[9px] text-gray-500 uppercase">REPLICATION</div>
                <div className="text-sm font-bold text-zinc-500 mt-1">NOT_SET</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
