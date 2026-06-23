import React, { useState } from 'react';
import { Plus, Trash2, X, AlertCircle, Link2 } from 'lucide-react';
import { LangType, translations } from '../translations.js';

interface ColumnField {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue: string;
  references?: string;
}

interface CreateTableModalProps {
  onClose: () => void;
  onCreate: (tableName: string, columns: ColumnField[]) => Promise<void>;
  lang: LangType;
  tables?: string[];
}

const POSTGRES_TYPES = [
  'SERIAL',
  'INTEGER',
  'BIGINT',
  'VARCHAR(50)',
  'VARCHAR(255)',
  'TEXT',
  'BOOLEAN',
  'TIMESTAMP',
  'DATE',
  'JSONB',
  'NUMERIC(10,2)',
  'INTEGER[]',
  'VARCHAR(255)[]',
  'TEXT[]',
  'BOOLEAN[]'
];

export default function CreateTableModal({ onClose, onCreate, lang, tables = [] }: CreateTableModalProps) {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnField[]>([
    { name: 'id', type: 'SERIAL', isNullable: false, isPrimaryKey: true, isUnique: false, defaultValue: '' },
    { name: 'created_at', type: 'TIMESTAMP', isNullable: false, isPrimaryKey: false, isUnique: false, defaultValue: 'CURRENT_TIMESTAMP' },
  ]);
  const [expandedRefIndex, setExpandedRefIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const toggleRefPanel = (index: number) => {
    setExpandedRefIndex(expandedRefIndex === index ? null : index);
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      { name: `column_${columns.length + 1}`, type: 'VARCHAR(255)', isNullable: true, isPrimaryKey: false, isUnique: false, defaultValue: '' },
    ]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, key: keyof ColumnField, value: any) => {
    const updated = [...columns];
    
    // If setting partition key (Primary Key), toggle nullable to false
    if (key === 'isPrimaryKey' && value === true) {
      updated[index].isNullable = false;
      // Untoggle primary keys elsewhere (Postgres supports multi-column PKs but for simple wizard single PK is easier and safer)
      updated.forEach((col, i) => {
        if (i !== index) col.isPrimaryKey = false;
      });
    }

    updated[index] = { ...updated[index], [key]: value };
    setColumns(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return setError(lang === 'ru' ? 'Имя таблицы не может быть пустым' : lang === 'am' ? 'Աղյուսակի անունը չի կարող դատարկ լինել' : 'Table name cannot be empty');
    if (columns.length === 0) return setError(lang === 'ru' ? 'Таблица должна иметь хотя бы один столбец' : lang === 'am' ? 'Աղյուսակը պետք է ունենա առնվազն մեկ սյունակ' : 'Table must contain at least one column');
    
    const duplicateNames = columns.map(c => c.name.toLowerCase()).some((val, i, arr) => arr.indexOf(val) !== i);
    if (duplicateNames) return setError(lang === 'ru' ? 'Обнаружены дубликаты имен столбцов' : lang === 'am' ? 'Հայտնաբերվել են սյունակների կրկնվող անուններ' : 'Duplicate column names detected');

    setLoading(true);
    setError(null);
    try {
      await onCreate(tableName.trim(), columns);
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D11]/90 p-3 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded border border-[#2D2F34] bg-[#0F1115] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2F34] px-4 py-2.5 bg-[#181A1F]">
          <div>
            <h3 className="text-xs font-bold text-white tracking-widest uppercase">{t.createTableTitle}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
              {lang === 'ru' ? 'Определите схему данных, типы столбцов и значения по умолчанию' : lang === 'am' ? 'Սահմանեք տվյալների սխեման, սյուների տիպերը և նախնական արժեքները' : 'Define schemas, column types and defaults'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/20 p-2.5 flex items-start gap-2 text-xs text-red-400 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>[SCHEMA_FAILED]: {error}</div>
            </div>
          )}

          <div>
            <label htmlFor="modal-table-name" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 font-mono">
              {lang === 'ru' ? 'ИМЯ_СВЯЗИ_RELATION_NAME' : lang === 'am' ? 'ԱՂՅՈՒՍԱԿԻ_ԱՆՈՒՆԸ' : 'RELATION_NAME'}
            </label>
            <input
              id="modal-table-name"
              type="text"
              required
              placeholder="users, orders, feedback..."
              value={tableName}
              onChange={(e) => setTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-3 py-1.5 text-xs text-white placeholder-gray-655 outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">
                {lang === 'ru' ? 'СТОЛБЦЫ' : lang === 'am' ? 'ՍՅՈՒՆԵՐ' : 'COLUMNS'} ({columns.length})
              </span>
              <button
                type="button"
                onClick={addColumn}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-mono"
              >
                <Plus className="h-3.5 w-3.5" />
                {t.addColumnBtn}
              </button>
            </div>

            <div className="border border-[#2D2F34] rounded overflow-hidden bg-[#121418] divide-y divide-[#2D2F34]/50">
              {/* Table header row */}
              <div className="grid grid-cols-12 gap-2 p-2 bg-[#181A1F] text-[9.5px] font-bold uppercase tracking-widest text-gray-500 font-mono">
                <div className="col-span-3">{t.columnNameHeader}</div>
                <div className="col-span-3">{t.columnTypeHeader}</div>
                <div className="col-span-2 text-center">DEFAULT</div>
                <div className="col-span-1 text-center">PK</div>
                <div className="col-span-2 text-center">NOT NULL</div>
                <div className="col-span-1 text-right">{t.deleteColHeader}</div>
              </div>

              {/* Items */}
              <div className="divide-y divide-[#2D2F34]/30 max-h-56 overflow-y-auto">
                {columns.map((col, index) => (
                  <div key={index} className="flex flex-col hover:bg-[#1E2025]/20">
                    <div className="grid grid-cols-12 gap-2 p-2 items-center font-mono text-xs">
                      
                      {/* Name */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          aria-label={`Column Name ${index + 1}`}
                          value={col.name}
                          onChange={(e) => updateColumn(index, 'name', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2 py-1 text-xs text-white placeholder-gray-655 outline-none focus:border-blue-500 font-mono"
                          placeholder="col_name"
                        />
                      </div>

                      {/* Type */}
                      <div className="col-span-3">
                        <select
                          aria-label={`Datatype ${index + 1}`}
                          value={col.type}
                          onChange={(e) => updateColumn(index, 'type', e.target.value)}
                          className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-1.5 py-1 text-xs text-slate-300 outline-none focus:border-blue-500 cursor-pointer font-mono"
                        >
                          {POSTGRES_TYPES.map(typeOpt => (
                            <option key={typeOpt} value={typeOpt} className="bg-[#0F1115]">{typeOpt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Default Value */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          aria-label={`Default Value ${index + 1}`}
                          value={col.defaultValue}
                          onChange={(e) => updateColumn(index, 'defaultValue', e.target.value)}
                          placeholder="'' or expression"
                          className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2 py-1 text-xs text-white placeholder-gray-700 outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* Primary Key Check */}
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          aria-label={`PK ${index + 1}`}
                          checked={col.isPrimaryKey}
                          onChange={(e) => updateColumn(index, 'isPrimaryKey', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-[#2D2F34] bg-[#0F1115] text-blue-500 accent-blue-500 cursor-pointer"
                        />
                      </div>

                      {/* Not Null Check */}
                      <div className="col-span-2 flex justify-center">
                        <input
                          type="checkbox"
                          aria-label={`Not Null ${index + 1}`}
                          disabled={col.isPrimaryKey}
                          checked={!col.isNullable} // Checked means NOT NULL, so isNullable is false
                          onChange={(e) => updateColumn(index, 'isNullable', !e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-[#2D2F34] bg-[#0F1115] text-blue-500 accent-blue-500 cursor-pointer disabled:opacity-30"
                        />
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggleRefPanel(index)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            col.references ? 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20' : 'text-gray-500 hover:text-white'
                          }`}
                          title="Link to another table (FOREIGN KEY)"
                          aria-label="Toggle link to another table"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer"
                          aria-label={`Remove Column ${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable References Foreign Key Panel */}
                    {expandedRefIndex === index && (
                      <div className="mx-2 mb-2 p-2.5 rounded border border-[#2D2F34] bg-[#0A0B0D] flex flex-wrap items-center gap-3 animate-fade-in text-xs font-mono">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {lang === 'ru' ? 'Связь с другой таблицей (Foreign Key):' : lang === 'am' ? 'Կապ մեկ այլ աղյուսակի հետ (Foreign Key)՝' : 'Link with other table (Foreign Key):'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-normal">REFERENCES</span>
                          <select
                            value={col.references ? col.references.split('(')[0] : ''}
                            onChange={(e) => {
                              const tbl = e.target.value;
                              if (!tbl) {
                                updateColumn(index, 'references', '');
                              } else {
                                updateColumn(index, 'references', `${tbl}(id)`);
                              }
                            }}
                            className="rounded border border-[#2D2F34] bg-[#0F1115] px-2 py-0.5 text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="">-- {lang === 'ru' ? 'Выберите таблицу' : 'Select table'} --</option>
                            {tables.map(tblName => (
                              <option key={tblName} value={tblName}>{tblName}</option>
                            ))}
                          </select>

                          {col.references && (
                            <>
                              <span>(</span>
                              <input
                                type="text"
                                value={col.references.substring(col.references.indexOf('(') + 1, col.references.indexOf(')')) || 'id'}
                                onChange={(e) => {
                                  const tbl = col.references!.split('(')[0];
                                  const field = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                  updateColumn(index, 'references', `${tbl}(${field})`);
                                }}
                                placeholder="id"
                                className="w-16 rounded border border-[#2D2F34] bg-[#0F1115] px-1.5 py-0.5 text-xs text-white outline-none font-mono text-center"
                              />
                              <span>)</span>
                            </>
                          )}
                        </div>

                        {col.references && (
                          <div className="text-[10px] text-blue-400 font-mono w-full">
                            → REFERENCES {col.references}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
            className="rounded bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-3 py-1 font-mono text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (lang === 'ru' ? 'СОЗДАНИЕ...' : lang === 'am' ? 'ՍՏԵՂԾՈՒՄ...' : 'BUILDING...') : t.createTableBtnSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
