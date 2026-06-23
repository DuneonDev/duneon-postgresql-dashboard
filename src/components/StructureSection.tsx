import React, { useState, useEffect, useCallback } from 'react';
import { 
  Network, 
  Layers, 
  RefreshCw, 
  Eye, 
  Zap, 
  Code, 
  Search, 
  Maximize2, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  SearchIcon,
  Filter
} from 'lucide-react';

interface StructureSectionProps {
  sshConfig: any;
  pgConfig: any;
  currentDb: string;
  lang: 'ru' | 'en' | 'am';
}

export default function StructureSection({ sshConfig, pgConfig, currentDb, lang }: StructureSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    indexes: any[];
    views: any[];
    triggers: any[];
    functions: any[];
  } | null>(null);

  // Filter conditions
  const [activeSubTab, setActiveSubTab] = useState<'indexes' | 'views' | 'triggers' | 'functions'>('indexes');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fetchStructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetPgConfig = { ...pgConfig, database: currentDb };
      const response = await fetch('/api/postgres/advanced-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig }),
      });
      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to fetch schema metadata structures');
      }
      setData({
        indexes: resData.indexes || [],
        views: resData.views || [],
        triggers: resData.triggers || [],
        functions: resData.functions || [],
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred during structure mapping fetch.');
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig, currentDb]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex items-center justify-between border-b border-[#23252C] pb-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-[#E2E8F0] tracking-widest uppercase font-mono">
            {lang === 'ru' ? 'СТРУКТУРНЫЕ ОБЪЕКТЫ СУБД' : lang === 'am' ? 'ՏՎՅԱԼՆԵՐԻ ԲԱԶԱՅԻ ՕԲՅԵԿՏՆԵՐ' : 'DB METADATA STRUCTURES'}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-1 font-mono">
            {lang === 'ru' ? 'Представления (Views), триггеры, индексы производительности и определяемые пользователем функции' : 'Indexes, Views, Triggers, Functions/Routines definitions'}
          </p>
        </div>
        <button
          onClick={fetchStructure}
          disabled={loading}
          className="rounded-full bg-[#15171F] hover:bg-[#1C1F2B] text-white border border-[#23252C] text-xs font-semibold py-1.5 px-4 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${loading ? 'animate-spin text-white' : ''}`} />
          <span>{lang === 'ru' ? 'Перечитать структуры' : 'Refresh objects'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-900/40 bg-red-950/15 text-xs text-red-500 font-mono">
          ⚠️ {lang === 'ru' ? 'Не удалось загрузить схему:' : 'Schema loader exception:'} {error}
        </div>
      )}

      {/* Sub tabs controls bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-[#0A0B0D] border border-[#23252C] rounded-xl p-1 text-xs select-none font-mono">
          <button
            onClick={() => { setActiveSubTab('indexes'); setSearchQuery(''); setExpandedIndex(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
              activeSubTab === 'indexes' ? 'bg-[#15171F] text-white font-bold border border-[#3E4254]' : 'text-gray-500 hover:text-white border border-transparent'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'Индексы' : 'Indexes'} ({data?.indexes?.length ?? 0})</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('views'); setSearchQuery(''); setExpandedIndex(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
              activeSubTab === 'views' ? 'bg-[#15171F] text-white font-bold border border-[#3E4254]' : 'text-gray-500 hover:text-white border border-transparent'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'Представления' : 'Views'} ({data?.views?.length ?? 0})</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('triggers'); setSearchQuery(''); setExpandedIndex(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
              activeSubTab === 'triggers' ? 'bg-[#15171F] text-white font-bold border border-[#3E4254]' : 'text-gray-500 hover:text-white border border-transparent'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'Триггеры' : 'Triggers'} ({data?.triggers?.length ?? 0})</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('functions'); setSearchQuery(''); setExpandedIndex(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
              activeSubTab === 'functions' ? 'bg-[#15171F] text-white font-bold border border-[#3E4254]' : 'text-gray-500 hover:text-white border border-transparent'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'Функции' : 'Proc & Func'} ({data?.functions?.length ?? 0})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'indexes' ? (lang === 'ru' ? 'Поиск индексов...' : 'Search indexes...') :
              activeSubTab === 'views' ? (lang === 'ru' ? 'Поиск представлений...' : 'Search views...') :
              activeSubTab === 'triggers' ? (lang === 'ru' ? 'Поиск триггеров...' : 'Search triggers...') : 
              (lang === 'ru' ? 'Поиск функций...' : 'Search functions...')
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#23252C] bg-[#0A0B0D] py-1.5 pl-9 pr-4 text-xs text-white placeholder-gray-600 focus:border-zinc-500 outline-none font-sans"
          />
        </div>
      </div>

      {/* Structured Content Area */}
      <div className="border border-[#23252C] bg-[#0A0B0D] rounded-xl overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2 font-mono text-xs">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
            <span>{lang === 'ru' ? 'Опрашиваем метаданные PostgreSQL...' : 'Querrying metadata catalogs...'}</span>
          </div>
        ) : (
          <div className="p-4 space-y-3.5">
            {/* INDEXES VIEW */}
            {activeSubTab === 'indexes' && (() => {
              const list = (data?.indexes || []).filter(idx => 
                idx.indexname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                idx.tablename.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (list.length === 0) return <div className="text-center py-16 text-zinc-650 text-xs font-mono">// NO INDEXES DETECTED</div>;

              return list.map((idxItem, idxIndex) => (
                <div key={idxIndex} className="p-3 bg-[#050506]/35 border border-[#1b1c22] rounded-lg space-y-2 select-text">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[8.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded">INDEX</span>
                      <span className="text-white font-semibold font-mono">{idxItem.indexname}</span>
                    </div>
                    <span className="text-zinc-500">{lang === 'ru' ? 'Таблица:' : 'Table:'} <strong className="text-zinc-300">{idxItem.tablename}</strong></span>
                  </div>
                  <div className="p-2 border border-[#23252C]/30 bg-[#050506]/65 rounded text-xs select-text font-mono text-zinc-400 whitespace-pre-wrap break-all leading-relaxed">
                    {idxItem.indexdef}
                  </div>
                </div>
              ));
            })()}

            {/* VIEWS VIEW */}
            {activeSubTab === 'views' && (() => {
              const list = (data?.views || []).filter(vw => 
                vw.viewname.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (list.length === 0) return <div className="text-center py-16 text-zinc-650 text-xs font-mono">// NO VIEWS DEFINED</div>;

              return list.map((vwItem, idxIndex) => (
                <div key={idxIndex} className="border border-[#1b1c22] rounded-lg overflow-hidden bg-[#050506]/35 font-mono text-xs select-text">
                  <button 
                    onClick={() => toggleExpand(idxIndex)}
                    className="w-full text-left px-3.5 py-3 flex items-center justify-between hover:bg-[#15171F]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[8.5px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded">VIEW</span>
                      <span className="text-[#E2E8F0] font-bold">{vwItem.viewname}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      {lang === 'ru' ? 'Исходный SQL' : 'View code'} 
                      {expandedIndex === idxIndex ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </span>
                  </button>
                  {expandedIndex === idxIndex && (
                    <div className="p-3.5 border-t border-[#1b1c22] bg-[#050506] text-zinc-400 leading-relaxed text-[11px] overflow-auto max-h-72 select-text whitespace-pre-wrap">
                      {vwItem.definition}
                    </div>
                  )}
                </div>
              ));
            })()}

            {/* TRIGGERS VIEW */}
            {activeSubTab === 'triggers' && (() => {
              const list = (data?.triggers || []).filter(tr => 
                tr.trigger_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tr.event_object_table.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (list.length === 0) return <div className="text-center py-16 text-zinc-650 text-xs font-mono">// NO DB TRIGGERS ENGAGED</div>;

              return (
                <div className="overflow-x-auto select-text font-mono text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#050506] text-gray-500 text-[9px] uppercase tracking-wider font-semibold border-b border-[#23252C]">
                        <th className="px-3.5 py-2.5">{lang === 'ru' ? 'Триггер' : 'Trigger'}</th>
                        <th className="px-3.5 py-2.5">{lang === 'ru' ? 'Таблица' : 'Table'}</th>
                        <th className="px-3.5 py-2.5">CONDITIONS</th>
                        <th className="px-3.5 py-2.5">TIMING</th>
                        <th className="px-3.5 py-2.5">DEFINITION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23252C]/40">
                      {list.map((trg, trgIdx) => (
                        <tr key={trgIdx} className="hover:bg-[#15171F]/40 transition-colors">
                          <td className="px-3.5 py-3 text-white font-bold">
                            <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1 py-0.5 rounded font-bold mr-1.5">TRG</span>
                            {trg.trigger_name}
                          </td>
                          <td className="px-3.5 py-3 text-zinc-400 font-semibold">{trg.event_object_table}</td>
                          <td className="px-3.5 py-3 text-pink-400 text-[10px]">{trg.event_manipulation || 'ANY'}</td>
                          <td className="px-3.5 py-3 text-zinc-500 text-[10px] uppercase font-bold">{trg.action_timing || 'AFTER EACH'}</td>
                          <td className="px-3.5 py-3 max-w-[200px] truncate text-zinc-500 text-[10px]" title={trg.action_statement}>
                            {trg.action_statement || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* FUNCTIONS VIEW */}
            {activeSubTab === 'functions' && (() => {
              const list = (data?.functions || []).filter(fn => 
                fn.routine_name.toLowerCase().includes(searchQuery.toLowerCase())
              );
              if (list.length === 0) return <div className="text-center py-16 text-zinc-650 text-xs font-mono">// NO PROCEDURES OR ROUTINES CREATED</div>;

              return list.map((fnItem, idxIndex) => (
                <div key={idxIndex} className="border border-[#1b1c22] rounded-lg overflow-hidden bg-[#050506]/35 font-mono text-xs select-text">
                  <button 
                    onClick={() => toggleExpand(idxIndex)}
                    className="w-full text-left px-3.5 py-3 flex items-center justify-between hover:bg-[#15171F]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[8.5px] font-bold bg-[#14231E]/40 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase">
                        {fnItem.routine_type || 'FUNCTION'}
                      </span>
                      <span className="text-[#E2E8F0] font-bold">{fnItem.routine_name}</span>
                      <span className="text-[9.5px] text-gray-500 font-light">({fnItem.data_type || 'void'})</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      {lang === 'ru' ? 'Код функции' : 'Routine Source'} 
                      {expandedIndex === idxIndex ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </span>
                  </button>
                  {expandedIndex === idxIndex && (
                    <div className="p-3.5 border-t border-[#1b1c22] bg-[#050506] text-zinc-400 leading-relaxed text-[11px] overflow-auto max-h-72 select-text whitespace-pre-wrap">
                      {fnItem.routine_definition || '// Code definition hidden or loaded inside built-in C binaries'}
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
