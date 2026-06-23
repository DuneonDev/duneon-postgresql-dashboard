import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Link2, 
  RefreshCw, 
  Search, 
  Eye, 
  Layers, 
  Info, 
  InfoIcon, 
  ExternalLink,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ArrowRight
} from 'lucide-react';
import { translations } from '../translations';

interface SchemaExplorerProps {
  sshConfig: any;
  pgConfig: any;
  currentDb: string;
  lang: 'ru' | 'en' | 'am';
}

export default function SchemaExplorer({ sshConfig, pgConfig, currentDb, lang }: SchemaExplorerProps) {
  const t = translations[lang] || translations['en'];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaData, setSchemaData] = useState<{ tables: any[]; relations: any[] } | null>(null);
  
  // Interactive options
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<{ table: string; column: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCoords, setLineCoords] = useState<Record<string, any>>({});

  // Fetch schema explorer metadata
  const fetchSchemaInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetPgConfig = { ...pgConfig, database: currentDb };
      const response = await fetch('/api/postgres/schema-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch database schema explorer');
      }
      setSchemaData({
        tables: data.tables || [],
        relations: data.relations || []
      });
    } catch (err: any) {
      console.error('Error fetching schema metadata:', err);
      setError(err.message || 'Could not parse schema constraints structure');
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig, currentDb]);

  // Read positions to draw connection links
  const updatePositions = useCallback(() => {
    if (!containerRef.current || !schemaData) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const coords: Record<string, any> = {};

    schemaData.tables.forEach(table => {
      // Get table element position
      const tableEl = document.getElementById(`er-table-${table.name}`);
      if (tableEl) {
        const rect = tableEl.getBoundingClientRect();
        coords[table.name] = {
          x: (rect.left - containerRect.left) / zoomLevel + (rect.width / zoomLevel) / 2,
          y: (rect.top - containerRect.top) / zoomLevel + (rect.height / zoomLevel) / 2,
          left: (rect.left - containerRect.left) / zoomLevel,
          right: (rect.right - containerRect.left) / zoomLevel,
          top: (rect.top - containerRect.top) / zoomLevel,
          bottom: (rect.bottom - containerRect.top) / zoomLevel,
          width: rect.width / zoomLevel,
          height: rect.height / zoomLevel
        };
      }

      // Get precise position of each column for column-to-column linkage
      table.columns.forEach((col: any) => {
        const colEl = document.getElementById(`er-col-${table.name}-${col.column_name}`);
        if (colEl) {
          const rect = colEl.getBoundingClientRect();
          coords[`${table.name}.${col.column_name}`] = {
            x: (rect.left - containerRect.left) / zoomLevel + (rect.width / zoomLevel) / 2,
            y: (rect.top - containerRect.top) / zoomLevel + (rect.height / zoomLevel) / 2,
            left: (rect.left - containerRect.left) / zoomLevel,
            right: (rect.right - containerRect.left) / zoomLevel,
            top: (rect.top - containerRect.top) / zoomLevel,
            bottom: (rect.bottom - containerRect.top) / zoomLevel,
            width: rect.width / zoomLevel,
            height: rect.height / zoomLevel
          };
        }
      });
    });

    setLineCoords(coords);
  }, [schemaData, zoomLevel]);

  // Fetch diagrams on DB change or mount
  useEffect(() => {
    fetchSchemaInfo();
  }, [fetchSchemaInfo]);

  // Recalculate coordinates if schema changes or on zoom
  useEffect(() => {
    if (!loading && schemaData) {
      const timer = setTimeout(updatePositions, 350);
      return () => clearTimeout(timer);
    }
  }, [loading, schemaData, updatePositions, searchQuery, selectedTable, zoomLevel]);

  // Listen to window resizes
  useEffect(() => {
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  // Highlight helper: Determine if table/connector should be highlighted
  const isRelationHighlighted = (relation: any) => {
    const isSourceHovered = hoveredCol && hoveredCol.table === relation.source_table && hoveredCol.column === relation.source_column;
    const isTargetHovered = hoveredCol && hoveredCol.table === relation.target_table && hoveredCol.column === relation.target_column;
    
    // Check if the current hovered table matches source or target
    const isSourceTableHovered = hoveredTable === relation.source_table || hoveredTable === relation.target_table;
    
    // Check if selected table matches
    const isSelected = selectedTable === relation.source_table || selectedTable === relation.target_table;

    if (hoveredCol) {
      return isSourceHovered || isTargetHovered;
    }

    if (hoveredTable) {
      return relation.source_table === hoveredTable || relation.target_table === hoveredTable;
    }

    if (selectedTable) {
      return isSelected;
    }

    return true; // Simple default
  };

  const getFilteredTables = () => {
    if (!schemaData) return [];
    if (!searchQuery.trim()) return schemaData.tables;
    const q = searchQuery.toLowerCase();
    return schemaData.tables.filter(table => {
      const matchesTableName = table.name.toLowerCase().includes(q);
      const matchesColumnName = table.columns.some((c: any) => c.column_name.toLowerCase().includes(q));
      return matchesTableName || matchesColumnName;
    });
  };

  const filteredTables = getFilteredTables();

  // Draw smooth curves connecting ports
  const drawConnectorPath = (relation: any) => {
    const srcKey = `${relation.source_table}.${relation.source_column}`;
    const tgtKey = `${relation.target_table}.${relation.target_column}`;

    const srcColCoord = lineCoords[srcKey];
    const tgtColCoord = lineCoords[tgtKey];

    const srcTableCoord = lineCoords[relation.source_table];
    const tgtTableCoord = lineCoords[relation.target_table];

    // If we have precise column coordinates, use them! Otherwise fall back to overall table coordinates.
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    if (srcColCoord && tgtColCoord) {
      // Connect right side of source column to left side of target column, or left-to-right depending on relative side position
      if (srcColCoord.x < tgtColCoord.x) {
        startX = srcColCoord.right;
        startY = srcColCoord.y;
        endX = tgtColCoord.left;
        endY = tgtColCoord.y;
      } else {
        startX = srcColCoord.left;
        startY = srcColCoord.y;
        endX = tgtColCoord.right;
        endY = tgtColCoord.y;
      }
    } else if (srcTableCoord && tgtTableCoord) {
      // Fallback: connect table centers
      startX = srcTableCoord.x;
      startY = srcTableCoord.y;
      endX = tgtTableCoord.x;
      endY = tgtTableCoord.y;
    } else {
      return null;
    }

    // Bezier control offset based on horizontal distance
    const dx = Math.abs(endX - startX);
    const controlOffset = Math.min(120, dx * 0.6);
    const cx1 = startX + controlOffset * (endX > startX ? 1 : -1);
    const cx2 = endX - controlOffset * (endX > startX ? 1 : -1);

    const pathString = `M ${startX} ${startY} C ${cx1} ${startY}, ${cx2} ${endY}, ${endX} ${endY}`;
    return { pathString, startX, startY, endX, endY };
  };

  // Status counters
  const totalTablesCount = schemaData?.tables?.length || 0;
  const totalRelationsCount = schemaData?.relations?.length || 0;

  return (
    <div className="flex flex-col h-full space-y-4 font-sans animate-fade-in text-white">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0A0B0D] border border-[#23252C] p-4 rounded-xl shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
              {lang === 'ru' ? 'ER Схема и Связи Базы Данных' : lang === 'am' ? 'Տվյալների Բազայի ER Սխեմա և Կապեր' : 'Interactive ER Database Visualizer'}
            </h3>
          </div>
          <p className="text-[10.5px] text-gray-500 font-mono">
            {lang === 'ru' 
              ? 'Исследуйте внешние ключи и древовидные связи вашей реляционной СУБД.'
              : lang === 'am'
              ? 'Բացահայտեք արտաքին բանալիներն ու աղյուսակային փոխհարաբերությունները:'
              : 'Graph representation with custom SVG connector paths derived from live Postgres schemas.'}
          </p>
        </div>

        {/* Toolbar & stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#050506] border border-[#1f2129] rounded-lg text-[10px] font-mono text-zinc-450">
            <span>TABLES: <strong className="text-indigo-400">{totalTablesCount}</strong></span>
            <span className="text-gray-700">|</span>
            <span>RELATIONS: <strong className="text-turquoise-400 text-teal-400">{totalRelationsCount}</strong></span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="h-3 w-3 text-gray-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ru' ? 'Поиск...' : lang === 'am' ? 'Որոնել...' : 'Search tables...'}
              className="bg-[#050506] border border-[#23252C] pl-8 pr-3 py-1.2 hover:border-[#3E4254] focus:outline-none focus:border-indigo-500 rounded-full text-[11px] text-zinc-200 placeholder-zinc-500 transition-all font-mono w-44"
            />
          </div>

          {/* Zoom Level UI Control */}
          <div className="flex items-center border border-[#23252C] bg-[#050506] rounded-full px-1 py-0.5">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.1))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-[9px] font-mono font-bold px-1.5 text-zinc-300 min-w-10 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchSchemaInfo}
            disabled={loading}
            className="flex items-center gap-1.5 border border-[#23252C] hover:border-zinc-500 bg-[#0A0B0D] hover:bg-[#15171F] disabled:opacity-40 text-gray-400 hover:text-white rounded-full p-2 text-xs transition-all cursor-pointer h-7 w-7 justify-center"
            title="Refresh schema layout"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#23252C] rounded-xl bg-[#0A0B0D] space-y-4">
          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
          <p className="text-zinc-500 text-xs font-mono">// READING FOREIGN KEYS AND KEY COLUMNS FOR SCHEMAS...</p>
        </div>
      ) : error ? (
        <div className="p-6 border border-rose-950/40 bg-rose-950/10 text-rose-400 rounded-xl font-mono text-xs leading-relaxed">
          <p className="font-bold">Error loading database structure:</p>
          <p className="mt-2 text-zinc-400">{error}</p>
          <button
            onClick={fetchSchemaInfo}
            className="mt-4 px-3.5 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      ) : schemaData && schemaData.tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-[#23252C] rounded-xl bg-[#0A0B0D] text-zinc-500 font-mono text-xs">
          <Info className="h-8 w-8 text-zinc-650 mb-2" />
          <p>{lang === 'ru' ? 'В этой базе данных нет пользовательских таблиц.' : lang === 'am' ? 'Այս տվյալների բազայում չկան աղյուսակներ:' : 'Your database contains no table entities to map.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-start">
          {/* Main Workspace (Takes 3 columns) */}
          <div className="xl:col-span-3 flex flex-col space-y-3">
            {/* Legend / Hover advice banner */}
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-450 bg-[#0A0B0D]/30 border border-[#23252C]/30 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Primary Key (PK)</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Foreign Key (FK)</span>
                <span className="text-zinc-600">|</span>
                <span className="text-indigo-400 font-bold">💡 Tip:</span>
                <span>Hover over columns to spotlight relationships! Click a table card to focus it.</span>
              </div>
              {(hoveredTable || selectedTable || hoveredCol) && (
                <button
                  onClick={() => {
                    setHoveredTable(null);
                    setSelectedTable(null);
                    setHoveredCol(null);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-450 font-bold cursor-pointer"
                >
                  Clear Spotlight
                </button>
              )}
            </div>

            {/* Interactive Graph Box */}
            <div 
              ref={containerRef}
              className="relative border border-[#23252C] rounded-xl bg-[#050506] overflow-auto select-none min-h-[460px] max-h-[620px] p-6 scrollbar-thin"
              style={{
                backgroundImage: 'radial-gradient(#151720 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* SVG Overlay representing references */}
              {schemaData && lineCoords && Object.keys(lineCoords).length > 0 && (
                <svg 
                  className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                >
                  <defs>
                    <marker
                      id="arrow-classic"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#14B8A6" />
                    </marker>
                    <marker
                      id="arrow-classic-highlight"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
                    </marker>
                    <marker
                      id="arrow-classic-dim"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1E202B" />
                    </marker>
                  </defs>

                  {/* Draw Connector segments */}
                  {schemaData.relations.map((rel, index) => {
                    const result = drawConnectorPath(rel);
                    if (!result) return null;
                    const { pathString, startX, startY, endX, endY } = result;

                    // Compute dynamic attributes
                    const isHigh = isRelationHighlighted(rel);
                    
                    // If some selection exists, but this isn't highlighted, we dim it!
                    const isAnySelectionActive = !!hoveredCol || !!hoveredTable || !!selectedTable;
                    const isDimmed = isAnySelectionActive && !isHigh;

                    let strokeColor = '#14B8A6'; // standard teal
                    let strokeWidth = 1.35;
                    let markerId = 'arrow-classic';

                    if (isHigh && isAnySelectionActive) {
                      strokeColor = '#6366F1'; // shining indigo
                      strokeWidth = 2.5;
                      markerId = 'arrow-classic-highlight';
                    } else if (isDimmed) {
                      strokeColor = '#1e212f'; // dark midnight grey 
                      strokeWidth = 0.8;
                      markerId = 'arrow-classic-dim';
                    }

                    return (
                      <g key={index}>
                        {/* Background glowing line highlight */}
                        {isHigh && isAnySelectionActive && (
                          <path
                            d={pathString}
                            fill="none"
                            stroke="#6366F1"
                            strokeWidth="6"
                            strokeLinecap="round"
                            opacity="0.15"
                            className="animate-pulse"
                          />
                        )}

                        <path
                          d={pathString}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          markerEnd={`url(#${markerId})`}
                          className="transition-all duration-300"
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Flex Grid workspace holding the Table Entities */}
              <div 
                className="relative z-10 flex flex-wrap gap-8 items-start select-text"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
              >
                {filteredTables.map((table) => {
                  const isTableFocused = selectedTable === table.name;
                  const isTableHovered = hoveredTable === table.name;

                  // Find if table is reference helper
                  const isAnySelectionActive = !!hoveredCol || !!hoveredTable || !!selectedTable;
                  
                  // Check if this table has ANY active relations highlighted
                  const isRelatedToSelection = () => {
                    if (!isAnySelectionActive) return true;
                    if (selectedTable === table.name) return true;
                    if (hoveredTable === table.name) return true;
                    if (hoveredCol && hoveredCol.table === table.name) return true;

                    // Query search relations
                    return schemaData.relations.some(rel => {
                      if (!isRelationHighlighted(rel)) return false;
                      return rel.source_table === table.name || rel.target_table === table.name;
                    });
                  };

                  const isDimmed = isAnySelectionActive && !isRelatedToSelection();

                  return (
                    <div
                      id={`er-table-${table.name}`}
                      key={table.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(prev => prev === table.name ? null : table.name);
                      }}
                      onMouseEnter={() => setHoveredTable(table.name)}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`w-64 border rounded-xl overflow-hidden shadow-2xl bg-[#0A0B0D]/95 transition-all duration-300 cursor-pointer ${
                        isTableFocused 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 translate-y-[-1px]' 
                          : isTableHovered
                          ? 'border-zinc-500 scale-[1.01]'
                          : 'border-[#1b1c22]'
                      } ${isDimmed ? 'opacity-[0.22] blur-[0.25px]' : 'opacity-100'}`}
                    >
                      {/* Table Header block */}
                      <div className={`px-3 py-2.5 flex items-center justify-between border-b transition-colors duration-200 ${
                        isTableFocused ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-[#050506]/90 border-[#1f2129]'
                      }`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Table className={`h-4 w-4 shrink-0 transition-colors ${isTableFocused ? 'text-indigo-400' : 'text-zinc-400'}`} />
                          <span className={`text-[12px] font-bold font-mono tracking-wide truncate ${isTableFocused ? 'text-white' : 'text-[#E2E8F0]'}`}>
                            {table.name}
                          </span>
                        </div>
                        <span className="text-[8.5px] font-mono text-zinc-500 font-semibold bg-[#12131a] px-1.5 py-0.5 rounded border border-[#23252C]">
                          {table.columns.length} cols
                        </span>
                      </div>

                      {/* Columns container */}
                      <div className="py-1 divide-y divide-[#15171f]/60 max-h-56 overflow-y-auto scrollbar-none">
                        {table.columns.map((col: any) => {
                          const isPk = col.is_pk;
                          const isFk = col.is_fk;
                          
                          // Check if column is currently selected/hovered
                          const isColHighlighted = hoveredCol && hoveredCol.table === table.name && hoveredCol.column === col.column_name;

                          return (
                            <div
                              id={`er-col-${table.name}-${col.column_name}`}
                              key={col.column_name}
                              onMouseEnter={() => setHoveredCol({ table: table.name, column: col.column_name })}
                              onMouseLeave={() => setHoveredCol(null)}
                              className={`px-3 py-1.5 flex items-center justify-between gap-1 text-[11px] font-mono transition-colors ${
                                isColHighlighted ? 'bg-indigo-950/35 text-white' : 'hover:bg-[#15171F]/50 text-gray-300'
                              }`}
                            >
                              {/* Left details: Column title */}
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                {isPk && (
                                  <Key className="h-3 w-3 text-amber-500 shrink-0 select-none animate-pulse" title="Primary Key" />
                                )}
                                {isFk && (
                                  <Link2 className="h-3 w-3 text-teal-400 shrink-0 select-none" title="Foreign Key Dependency" />
                                )}
                                {!isPk && !isFk && (
                                  <span className="w-1.5 text-zinc-650 shrink-0 select-none">•</span>
                                )}
                                <span className={`truncate font-mono font-medium ${isPk ? 'text-amber-350 text-amber-200' : isFk ? 'text-teal-300' : ''}`}>
                                  {col.column_name}
                                </span>
                              </div>

                              {/* Right details: Data type */}
                              <span className="text-[9.5px] text-zinc-500 capitalize select-none tracking-normal truncate pl-2 max-w-[95px]" title={col.data_type}>
                                {col.data_type.replace('character varying', 'varchar').replace('timestamp without time zone', 'timestamp')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Panel containing relations lists (Takes 1 column) */}
          <div className="xl:col-span-1 flex flex-col space-y-4">
            {/* Relationship List panel */}
            <div className="border border-[#23252C] rounded-xl bg-[#0A0B0D] shadow-md flex flex-col overflow-hidden max-h-[640px]">
              <div className="px-4 py-3 bg-[#050506] border-b border-[#23252C] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wide font-mono">
                    {lang === 'ru' ? 'Связи Таблиц' : lang === 'am' ? 'Աղյուսակների Կապեր' : 'Foreign Constraints'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#14151e] border border-[#23252C] px-1.5 py-0.5 rounded text-[#14B8A6]">
                  {totalRelationsCount} links
                </span>
              </div>

              <div className="p-3 overflow-y-auto space-y-2 scrollbar-thin flex-1 min-h-[300px]">
                {totalRelationsCount === 0 ? (
                  <div className="text-center py-10 text-zinc-650 text-xs font-mono">
                    {lang === 'ru' 
                      ? '// Внешние ключи не обнаружены.'
                      : lang === 'am'
                      ? '// Արտաքին բանալիներ չեն հայտնաբերվել:'
                      : '// No foreign key maps detected in schema metadata.'}
                  </div>
                ) : (
                  schemaData.relations.map((rel: any, idx: number) => {
                    const isRelated = isRelationHighlighted(rel);
                    const isAnySelected = !!hoveredCol || !!hoveredTable || !!selectedTable;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredCol({ table: rel.source_table, column: rel.source_column })}
                        onMouseLeave={() => setHoveredCol(null)}
                        className={`group border p-2.5 rounded-lg transition-all duration-200 cursor-default flex flex-col space-y-1.5 text-xs font-mono ${
                          isRelated && isAnySelected
                            ? 'border-indigo-500 bg-indigo-950/10'
                            : isAnySelected
                            ? 'border-zinc-950 bg-black/10 opacity-30 blur-[0.2px]'
                            : 'border-[#1b1c22] bg-[#050506]/35 hover:bg-[#15171F]/50 hover:border-zinc-650'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                          <span className="truncate max-w-[130px]" title={rel.constraint_name}>
                            {rel.constraint_name}
                          </span>
                          <span className="text-teal-400 font-bold shrink-0">FK LINK</span>
                        </div>

                        {/* Mapping source ➔ target */}
                        <div className="flex flex-col space-y-1 p-1.5 bg-[#050506]/60 rounded-md border border-[#1b1c22]">
                          {/* Source */}
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-zinc-400 truncate max-w-[100px]">{rel.source_table}</span>
                            <span className="text-teal-300 font-mono text-[9px] bg-teal-950/35 px-1 py-0.2 rounded font-bold">{rel.source_column}</span>
                          </div>

                          {/* Direction arrow */}
                          <div className="flex items-center justify-center py-0.5 text-zinc-600">
                            <ArrowRight className="h-3 w-3 transform rotate-90 xl:rotate-0" />
                          </div>

                          {/* Target */}
                          <div className="flex items-center justify-between text-[10.5px]">
                            <span className="text-zinc-400 truncate max-w-[100px]">{rel.target_table}</span>
                            <span className="text-amber-400 font-mono text-[9px] bg-amber-950/35 px-1 py-0.2 rounded font-bold">{rel.target_column}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick guide card */}
            <div className="border border-[#23252C] rounded-xl bg-[#0A0B0D]/80 p-4 space-y-3 shadow-md text-xs font-mono">
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                <InfoIcon className="h-4 w-4 text-indigo-400" />
                <span>SCHEMA SCHEMA INFO</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                {lang === 'ru'
                  ? 'Связи строятся на основе ограничений FOREIGN KEY. Схема обновляется автоматически при выполнении запросов CREATE, DROP или ALTER.'
                  : lang === 'am'
                  ? 'Կապերը կառուցվում են FOREIGN KEY սահմանափակումների հիման վրա: Սխեման թարմանում է ավտոմատ կերպով:'
                  : 'Links are calculated dynamically on table load using system schema catalog analysis. Modify tables via custom raw queries to update constraints live.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
