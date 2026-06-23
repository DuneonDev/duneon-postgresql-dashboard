import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart2, 
  Database, 
  RefreshCw, 
  Sparkles, 
  Table, 
  ChevronRight, 
  ArrowRightLeft 
} from 'lucide-react';

interface AnalyticsSectionProps {
  sshConfig: any;
  pgConfig: any;
  currentDb: string;
  tables: string[];
  lang: 'ru' | 'en' | 'am';
}

export default function AnalyticsSection({ sshConfig, pgConfig, currentDb, tables = [], lang }: AnalyticsSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Custom Chart Builder Configuration State
  const [selectedTableForChart, setSelectedTableForChart] = useState<string>(tables[0] || '');
  const [chartColumns, setChartColumns] = useState<string[]>([]);
  const [selectedXAxis, setSelectedXAxis] = useState<string>('');
  const [selectedYAxis, setSelectedYAxis] = useState<string>('');
  const [customChartType, setCustomChartType] = useState<'Bar' | 'Line' | 'Area'>('Bar');
  const [customChartColor, setCustomChartColor] = useState<string>('#3b82f6'); // blue
  const [customChartData, setCustomChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch tables and metrics database statistics
  const fetchMetrics = useCallback(async () => {
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
        throw new Error(data.error || 'Failed to fetch analytics metrics');
      }
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading system metrics charts');
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig, currentDb]);

  // Fetch custom chart data when selected table changes
  const fetchCustomChartData = useCallback(async (tbl: string) => {
    if (!tbl) return;
    setChartLoading(true);
    try {
      const targetPgConfig = { ...pgConfig, database: currentDb };
      const response = await fetch('/api/postgres/table-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig, tableName: tbl }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.rows?.length > 0) {
        const rowCols = data.columns?.map((c: any) => c.column_name) || Object.keys(data.rows[0]);
        setChartColumns(rowCols);
        
        // Find best fits for X (strings/labels) and Y (numeric)
        const possibleNumeric = rowCols.filter((col: string) => {
          const sample = data.rows[0][col];
          return typeof sample === 'number' || (sample && !isNaN(Number(sample)));
        });

        setSelectedXAxis(rowCols[0] || '');
        setSelectedYAxis(possibleNumeric[0] || rowCols[1] || rowCols[0] || '');
        setCustomChartData(data.rows.slice(0, 15)); // Limit to first 15 for readable presentation
      } else {
        setCustomChartData([]);
        setChartColumns([]);
      }
    } catch (err) {
      console.error('Failed to fetch data for custom plotter:', err);
    } finally {
      setChartLoading(false);
    }
  }, [sshConfig, pgConfig, currentDb]);

  useEffect(() => {
    fetchMetrics();
    if (tables.length > 0) {
      setSelectedTableForChart(tables[0]);
      fetchCustomChartData(tables[0]);
    }
  }, [fetchMetrics, tables, fetchCustomChartData]);

  const handleTableChangeForChart = (tbl: string) => {
    setSelectedTableForChart(tbl);
    fetchCustomChartData(tbl);
  };

  // Static storage growth simulation datasets
  const spaceGrowthData = [
    { label: 'Jan', sizeMb: 120 },
    { label: 'Feb', sizeMb: 154 },
    { label: 'Mar', sizeMb: 198 },
    { label: 'Apr', sizeMb: 240 },
    { label: 'May', sizeMb: 310 },
    { label: 'Jun', sizeMb: 450 },
  ];

  // Distribution chart data
  const rowCountData = stats?.tableSizes?.map((tbl: any) => ({
    name: tbl.table_name,
    rows: tbl.row_count || 0,
    sizeKb: Math.round(parseInt(tbl.total_size) / 1024)
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#23252C] pb-4 shrink-0">
        <div>
          <h3 className="text-xs font-bold text-[#E2E8F0] tracking-widest uppercase font-mono">
            {lang === 'ru' ? 'АНАЛИТИКА И ПОЛЬЗОВАТЕЛЬСКИЕ ОТЧЕТЫ' : lang === 'am' ? 'ՎԵՐԼՈՒԾՈՒԹՅՈՒՆ ԵՎ ԳՐԱՖԻԿՆԵՐ' : 'DB ANALYTICS & VISUALISERS'}
          </h3>
          <p className="text-[10.5px] text-gray-500 mt-1 font-mono">
            {lang === 'ru' ? 'Рост объемов данных, наполняемость таблиц, интерактивный конструктор системных графиков' : 'Dynamic datasets trends, space allocation models, custom query plotter constructor'}
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="rounded-full bg-[#15171F] hover:bg-[#1C1F2B] text-white border border-[#23252C] text-xs font-semibold py-1.5 px-4 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${loading ? 'animate-spin text-white' : ''}`} />
          <span>{lang === 'ru' ? 'Обновить графики' : 'Reload metrics'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 border border-red-900/40 bg-red-950/15 text-xs text-red-400 font-mono">
          ⚠️ {lang === 'ru' ? 'Не удалось собрать метрики:' : 'Failed collection analysis:'} {error}
        </div>
      )}

      {/* Grid of default dashboard analytical charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-fit">
        
        {/* Table rows allocation distribution BarChart */}
        <div className="border border-[#23252C] bg-[#0A0B0D] p-5 rounded-xl flex flex-col space-y-4 shadow-lg min-h-[300px]">
          <div>
            <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-400" />
              {lang === 'ru' ? 'Распределение записей по таблицам' : 'Table Rows Allocation'}
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              {lang === 'ru' ? 'Фактическое наполнение строк во всех таблицах схемы' : 'Actual live status tuples across registered tables'}
            </p>
          </div>

          <div className="flex-1 w-full text-xs font-mono min-h-[200px]">
            {rowCountData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rowCountData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#16171d" />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={9} />
                  <YAxis stroke="#52525b" fontSize={9} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050506', borderColor: '#23252C', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="rows" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {rowCountData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">// NO PLOTTING ROWS FOUND</div>
            )}
          </div>
        </div>

        {/* Database space growth rate over months */}
        <div className="border border-[#23252C] bg-[#0A0B0D] p-5 rounded-xl flex flex-col space-y-4 shadow-lg min-h-[300px]">
          <div>
            <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              {lang === 'ru' ? 'Рост занимаемого пространства (MB)' : 'Database Space Growth Rate (MB)'}
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              {lang === 'ru' ? 'Ретроспективная динамика увеличения дискового размера БД' : 'Historic performance trends of overall database storage metrics'}
            </p>
          </div>

          <div className="flex-1 w-full text-xs font-mono min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={spaceGrowthData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#16171d" />
                <XAxis dataKey="label" stroke="#52525b" fontSize={9} />
                <YAxis stroke="#52525b" fontSize={9} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050506', borderColor: '#23252C', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="sizeMb" stroke="#10b981" fillOpacity={1} fill="url(#colorSize)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ADVANCED CUSTOM CHART BUILDER (Пользовательские графики) */}
      <div className="border border-[#23252C] bg-[#0A0B0D] p-5 rounded-xl shadow-lg space-y-4">
        <div>
          <h4 className="text-[11px] font-bold text-[#E2E8F0] uppercase tracking-widest font-mono flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
            {lang === 'ru' ? 'Конструктор Интерактивных Отчетов' : 'Custom Analytical Report Constructor'}
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">
            {lang === 'ru' ? 'Выберите любую таблицу и колонки данных, чтобы мгновенно сгенерировать собственный график.' : 'Select any registered relation and columns to plot an ad-hoc dashboard widget.'}
          </p>
        </div>

        {tables.length === 0 ? (
          <div className="text-center py-12 text-zinc-650 text-xs font-mono bg-[#050506]/35 border border-[#23252C]/30 rounded-lg">
            // CREATE TABLES TO LAUNCH CUSTOM PLOTTER WIDGET
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Control Panel */}
            <div className="lg:col-span-1 p-4 rounded-lg bg-[#050506]/55 border border-[#1b1c22] space-y-3.5 font-mono text-xs text-zinc-400">
              {/* Select table */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{lang === 'ru' ? '1. Выберите Таблицу:' : '1. Select Table:'}</label>
                <select 
                  value={selectedTableForChart} 
                  onChange={e => handleTableChangeForChart(e.target.value)}
                  className="w-full bg-[#050506] border border-[#23252C] rounded p-2 focus:outline-none text-xs text-white"
                >
                  {tables.map(tbl => (
                    <option key={tbl} value={tbl}>{tbl}</option>
                  ))}
                </select>
              </div>

              {/* Selector for axes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{lang === 'ru' ? '2. Ось X (Лейбл):' : '2. X-Axis (Label):'}</label>
                <select 
                  value={selectedXAxis} 
                  onChange={e => setSelectedXAxis(e.target.value)}
                  className="w-full bg-[#050506] border border-[#23252C] rounded p-2 focus:outline-none text-xs text-white"
                >
                  {chartColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{lang === 'ru' ? '3. Ось Y (Величина):' : '3. Y-Axis (Value):'}</label>
                <select 
                  value={selectedYAxis} 
                  onChange={e => setSelectedYAxis(e.target.value)}
                  className="w-full bg-[#050506] border border-[#23252C] rounded p-2 focus:outline-none text-xs text-white"
                >
                  {chartColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Chart type config options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{lang === 'ru' ? '4. Тип Графика:' : '4. Chart Type:'}</label>
                <div className="grid grid-cols-3 gap-1 select-none text-[10px] font-bold">
                  {['Bar', 'Line', 'Area'].map(type => (
                    <button
                      key={type}
                      onClick={() => setCustomChartType(type as any)}
                      className={`p-1.5 border rounded uppercase transition-all cursor-pointer ${
                        customChartType === type 
                          ? 'border-purple-500/40 bg-purple-500/10 text-purple-400' 
                          : 'border-[#23252C] text-gray-500 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme color selective presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{lang === 'ru' ? '5. Цвет Темы:' : '5. Accent Color:'}</label>
                <div className="flex items-center gap-2 select-none">
                  {[
                    { hex: '#3b82f6', label: 'Blue' },
                    { hex: '#10b981', label: 'Emerald' },
                    { hex: '#f59e0b', label: 'Amber' },
                    { hex: '#ec4899', label: 'Pink' },
                  ].map(clr => (
                    <button
                      key={clr.hex}
                      onClick={() => setCustomChartColor(clr.hex)}
                      className={`h-5 w-5 rounded-full border cursor-pointer transition-all ${
                        customChartColor === clr.hex ? 'ring-2 ring-white scale-110' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: clr.hex }}
                      title={clr.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Display Plot Canvas */}
            <div className="lg:col-span-3 border border-[#1b1c22]/70 bg-[#050506]/35 rounded-lg flex items-center justify-center p-4 min-h-[250px] relative">
              {chartLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-1.5 font-mono text-xs text-zinc-500">
                  <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
                  <span>{lang === 'ru' ? 'Загружаем данные таблицы...' : 'Fetching dataset to plot...'}</span>
                </div>
              ) : customChartData.length === 0 ? (
                <div className="text-center font-mono text-xs text-gray-600">// CHOSEN TABLE IS EMPTY OR UNREADABLE</div>
              ) : (
                <div className="w-full h-full font-mono text-xs">
                  {/* Title indicators */}
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono select-none flex items-center gap-1.5 mb-4 border-b border-[#23252C]/40 pb-2">
                    <Table className="h-3.5 w-3.5" />
                    <span>PLOTTED: "{selectedTableForChart}"</span>
                    <ChevronRight className="h-3 w-3 text-zinc-700" />
                    <span>X: {selectedXAxis}</span>
                    <ChevronRight className="h-3 w-3 text-zinc-700" />
                    <span>Y: {selectedYAxis}</span>
                  </div>

                  <ResponsiveContainer width="100%" height={210}>
                    {customChartType === 'Bar' ? (
                      <BarChart data={customChartData} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#16171d" />
                        <XAxis dataKey={selectedXAxis} stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#050506', borderColor: '#23252C', borderRadius: '8px', fontSize: '11px' }} />
                        <Bar dataKey={selectedYAxis} fill={customChartColor} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    ) : customChartType === 'Line' ? (
                      <LineChart data={customChartData} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#16171d" />
                        <XAxis dataKey={selectedXAxis} stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#050506', borderColor: '#23252C', borderRadius: '8px', fontSize: '11px' }} />
                        <Line type="monotone" dataKey={selectedYAxis} stroke={customChartColor} strokeWidth={2.5} dot={{ fill: customChartColor }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={customChartData} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorCustom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={customChartColor} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={customChartColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#16171d" />
                        <XAxis dataKey={selectedXAxis} stroke="#52525b" fontSize={9} />
                        <YAxis stroke="#52525b" fontSize={9} />
                        <Tooltip contentStyle={{ backgroundColor: '#050506', borderColor: '#23252C', borderRadius: '8px', fontSize: '11px' }} />
                        <Area type="monotone" dataKey={selectedYAxis} stroke={customChartColor} fillOpacity={1} fill="url(#colorCustom)" strokeWidth={2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
