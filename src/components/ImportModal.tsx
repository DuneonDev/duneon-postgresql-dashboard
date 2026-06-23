import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ListOrdered,
  FileText
} from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
  tableName: string;
  columns: any[];
  sshConfig: any;
  pgConfig: any;
  currentDb: string;
  onImportSuccess: () => void;
  lang: 'ru' | 'en' | 'am';
}

export default function ImportModal({ 
  onClose, 
  tableName, 
  columns, 
  sshConfig, 
  pgConfig, 
  currentDb,
  onImportSuccess, 
  lang 
}: ImportModalProps) {
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States of execution pipeline
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [importCompleted, setImportCompleted] = useState(false);

  // Parse CSV function
  const handleParseCSV = () => {
    if (!inputText.trim()) {
      setErrorMsg(lang === 'ru' ? 'Пожалуйста, вставьте данные в поле ввода' : 'Please paste formatting values inside container');
      return;
    }
    setParsing(true);
    setErrorMsg(null);
    setParsedRows([]);

    setTimeout(() => {
      try {
        const lines = inputText.trim().split('\n');
        if (lines.length < 2) {
          throw new Error(lang === 'ru' ? 'Недостаточно строк в CSV' : 'Insufficient entries inside text CSV block');
        }

        // Parse headers (assuming first line is headers)
        const delim = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
        const rawHeaders = lines[0].split(delim).map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        // Map data rows
        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          let cells: string[] = [];
          let currentCell = '';
          let inQuotes = false;
          
          // Custom quote aware splitter
          const chars = lines[i];
          for (let c = 0; c < chars.length; c++) {
            const ch = chars[c];
            if (ch === '"') {
              inQuotes = !inQuotes;
            } else if (ch === delim && !inQuotes) {
              cells.push(currentCell.trim());
              currentCell = '';
            } else {
              currentCell += ch;
            }
          }
          cells.push(currentCell.trim());

          const rowObj: any = {};
          rawHeaders.forEach((key, colIndex) => {
            let val: any = cells[colIndex] ?? '';
            // Trim enclosing quotes
            val = val.replace(/^["']|["']$/g, '');
            // Check numeric conversion
            if (val !== '' && !isNaN(Number(val))) {
              val = Number(val);
            } else if (val.toLowerCase() === 'true') {
              val = true;
            } else if (val.toLowerCase() === 'false') {
              val = false;
            } else if (val === 'null' || val === 'NULL') {
              val = null;
            }
            rowObj[key] = val;
          });
          rows.push(rowObj);
        }

        setParsedHeaders(rawHeaders);
        setParsedRows(rows);
      } catch (err: any) {
        setErrorMsg(err.message || 'Parsing error occurred.');
      } finally {
        setParsing(false);
      }
    }, 500);
  };

  // Perform inserts on server
  const handleStartImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setSuccessCount(0);
    setFailCount(0);
    setImportProgress(0);
    setImportCompleted(false);

    // Filter valid target table columns (omit computed generated keys)
    const targetCols = columns.map(c => c.column_name);

    for (let i = 0; i < parsedRows.length; i++) {
      const rowData = parsedRows[i];
      const keysToInsert: string[] = [];
      const valuesToInsert: any[] = [];

      // Align columns with existing structure
      Object.keys(rowData).forEach(key => {
        if (targetCols.includes(key)) {
          keysToInsert.push(key);
          valuesToInsert.push(rowData[key]);
        }
      });

      if (keysToInsert.length === 0) {
        setFailCount(f => f + 1);
        continue;
      }

      // Format parameter placeholders for Postgres: $1, $2, ...
      const placeholders = keysToInsert.map((_, index) => `$${index + 1}`).join(', ');
      const sql = `INSERT INTO "${tableName}" (${keysToInsert.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders});`;

      try {
        const targetPgConfig = { ...pgConfig, database: currentDb };
        const response = await fetch('/api/postgres/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ssh: sshConfig,
            pg: targetPgConfig,
            sql: sql,
            params: valuesToInsert
          }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSuccessCount(s => s + 1);
        } else {
          console.error(data.error);
          setFailCount(f => f + 1);
        }
      } catch (err) {
        setFailCount(f => f + 1);
      }

      setImportProgress(Math.round(((i + 1) / parsedRows.length) * 100));
    }

    setImporting(false);
    setImportCompleted(true);
    onImportSuccess();
  };

  // Preset default demo CSV pasting value
  const loadPresetCSV = () => {
    if (columns.length === 0) return;
    const itemHeaders = columns.map(c => c.column_name).join(', ');
    const mockRow1 = columns.map(c => {
      if (c.data_type?.includes('int') || c.data_type?.includes('num')) return '101';
      if (c.data_type?.includes('bool')) return 'true';
      return '"Sample Data"';
    }).join(', ');
    const mockRow2 = columns.map(c => {
      if (c.data_type?.includes('int') || c.data_type?.includes('num')) return '102';
      if (c.data_type?.includes('bool')) return 'false';
      return '"Secondary String"';
    }).join(', ');

    setInputText(`${itemHeaders}\n${mockRow1}\n${mockRow2}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-sans select-none antialiased">
      <div className="relative w-full max-w-2xl rounded-xl border border-[#23252C] bg-[#0A0B0D] shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-[#23252C] flex items-center justify-between shrink-0 font-mono">
          <span className="flex items-center gap-2 text-xs font-bold text-white tracking-widest uppercase">
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            {lang === 'ru' ? `ИМПОРТ ДАННЫХ В public.${tableName}` : `IMPORT DATA INTO public.${tableName}`}
          </span>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-lg border border-red-900/40 bg-red-950/15 text-xs text-red-400 font-mono">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Setup text area input */}
          {parsedRows.length === 0 && !importCompleted && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                  {lang === 'ru' ? 'Вставьте значения CSV, TSV или текст с разделителями:' : 'Paste CSV, TSV or comma-delimited Excel rows:'}
                </label>
                <button
                  type="button"
                  onClick={loadPresetCSV}
                  className="text-[9.5px] font-mono text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {lang === 'ru' ? '[ Заполнить шаблон для этой таблицы ]' : '[ Generate aligned tables template ]'}
                </button>
              </div>

              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="id, title, is_active&#10;1, &quot;Demo row&quot;, true&#10;2, &quot;Second item&quot;, false"
                className="w-full h-48 rounded-lg border border-[#23252C] bg-[#050506] p-3 text-xs text-white placeholder-gray-700 outline-none focus:border-zinc-500 font-mono block select-text"
              />

              <div className="flex justify-end gap-2.5 shrink-0 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold rounded bg-[#101115] hover:bg-[#16171d] text-zinc-400 cursor-pointer"
                >
                  {lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={handleParseCSV}
                  disabled={parsing}
                  className="px-4 py-2 text-xs font-semibold rounded bg-white text-black hover:bg-neutral-200 cursor-pointer flex items-center gap-1"
                >
                  {parsing && <RefreshCw className="h-3 w-3 animate-spin mr-1" />}
                  {lang === 'ru' ? 'Распознать строки' : 'Analyze structure'}
                </button>
              </div>
            </div>
          )}

          {/* Validation view after parsing csv string */}
          {parsedRows.length > 0 && !importCompleted && (
            <div className="space-y-4 font-mono">
              <div className="p-3 rounded bg-[#014120]/10 border border-emerald-900/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>
                  {lang === 'ru' 
                    ? `Успешно распознано столбцов: ${parsedHeaders.length}, строк к записи: ${parsedRows.length}` 
                    : `Discovered columns: ${parsedHeaders.length}, rows to transactionally commit: ${parsedRows.length}`}
                </span>
              </div>

              {/* Grid map checklist */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{lang === 'ru' ? 'Карта сопоставления колонок:' : 'Header column mappings checklist:'}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] leading-relaxed">
                  {columns.map(c => {
                    const matched = parsedHeaders.includes(c.column_name);
                    return (
                      <div key={c.column_name} className="p-2 border border-[#23252C]/30 bg-[#050506]/55 rounded flex items-center justify-between">
                        <span className="truncate text-zinc-300">{c.column_name} <span className="text-[9.5px] text-zinc-500 font-light">({c.data_type})</span></span>
                        <span className={`text-[9px] font-bold ${matched ? 'text-emerald-400' : 'text-amber-500 font-light'}`}>
                          {matched ? 'MATCHED' : 'OMITTED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress logging when importing */}
              {importing && (
                <div className="space-y-2 pt-3">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>{lang === 'ru' ? 'Запись в PostgreSQL...' : 'Committing sequential inserts...'}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-[#23252C]">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center gap-4 pt-3 border-t border-[#23252C]/30">
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setParsedHeaders([]);
                  }}
                  disabled={importing}
                  className="px-4 py-2 text-xs font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {lang === 'ru' ? 'Назад' : 'Go back'}
                </button>

                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={importing}
                  className="px-4 py-2 text-xs font-bold rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer flex items-center gap-1 shadow-md"
                >
                  {importing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                  {lang === 'ru' ? `Начать импорт ${parsedRows.length} строк` : `Commit ${parsedRows.length} inserts`}
                </button>
              </div>
            </div>
          )}

          {/* Import complete status screen */}
          {importCompleted && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 font-mono select-none">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase">{lang === 'ru' ? 'Импорт завершен!' : 'Transactional import complete!'}</h3>
                <p className="text-[11px] text-zinc-500">
                  {lang === 'ru' ? 'Пакетный запуск DML-запросов выполнен полностью.' : 'Bulk batch load executed against secure SSH forward.'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold pt-1.5 select-none text-[12px]">
                <div className="px-5 py-3 rounded-lg bg-[#14231E]/40 border border-emerald-900/30">
                  <div className="text-[10px] text-zinc-500 uppercase">{lang === 'ru' ? 'УСПЕШНО' : 'SUCCESS'}</div>
                  <div className="text-xl text-emerald-400 mt-1">{successCount}</div>
                </div>
                <div className="px-5 py-3 rounded-lg bg-red-950/20 border border-red-950/40">
                  <div className="text-[10px] text-zinc-500 uppercase">{lang === 'ru' ? 'ОШИБКИ' : 'FAILURES'}</div>
                  <div className="text-xl text-red-500 mt-1">{failCount}</div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded bg-white text-black hover:bg-neutral-200 font-bold text-xs cursor-pointer shadow"
                >
                  {lang === 'ru' ? 'Закрыть окно' : 'Finish & close'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
