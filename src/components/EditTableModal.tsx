import React, { useState } from 'react';
import { Plus, Trash2, X, AlertCircle, Link2 } from 'lucide-react';
import { ColumnInfo } from '../types';
import { LangType, translations } from '../translations';

interface ColumnField {
  originalName: string; // empty if it is a newly added column
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: string;
  isNew?: boolean;
  references?: string;
}

interface EditTableModalProps {
  tableName: string;
  columnsList: ColumnInfo[];
  onClose: () => void;
  onAlter: (newTableName: string, operations: any[]) => Promise<void>;
  lang: LangType;
  tables?: string[];
}

const POSTGRES_TYPES = [
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

export default function EditTableModal({ tableName, columnsList, onClose, onAlter, lang, tables = [] }: EditTableModalProps) {
  const [newTableName, setNewTableName] = useState(tableName);
  const t = translations[lang];
  
  // Format the existing columns into our state structure
  const initialFields: ColumnField[] = columnsList.map(col => {
    // Map database type string to common user-friendly choices
    let mappedType = col.data_type.toUpperCase();
    if (mappedType === 'CHARACTER VARYING') {
      mappedType = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR(255)';
    } else if (mappedType === 'TIMESTAMP WITHOUT TIME ZONE' || mappedType === 'TIMESTAMP WITH TIME ZONE') {
      mappedType = 'TIMESTAMP';
    }

    // Clean default values. Postgres defaults look like: 'somevalue'::character varying or nextval(...) etc.
    let cleanDefault = col.column_default || '';
    if (cleanDefault.startsWith("'") && cleanDefault.includes("'::")) {
      const match = cleanDefault.match(/'([^']*)'/);
      if (match) cleanDefault = match[1];
    }

    return {
      originalName: col.column_name,
      name: col.column_name,
      type: mappedType,
      isNullable: col.is_nullable === 'YES',
      defaultValue: cleanDefault,
      references: col.references || '',
    };
  });

  const [fields, setFields] = useState<ColumnField[]>(initialFields);
  const [expandedRefIndex, setExpandedRefIndex] = useState<number | null>(null);
  const [deletedColumnNames, setDeletedColumnNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRefPanel = (index: number) => {
    setExpandedRefIndex(expandedRefIndex === index ? null : index);
  };

  const addColumn = () => {
    setFields([
      ...fields,
      {
        originalName: '',
        name: `new_column_${fields.length + 1}`,
        type: 'VARCHAR(255)',
        isNullable: true,
        defaultValue: '',
        isNew: true,
        references: '',
      },
    ]);
  };

  const removeColumn = (index: number) => {
    const target = fields[index];
    if (!target.isNew) {
      // If it exists in DB, track it for deletion
      setDeletedColumnNames([...deletedColumnNames, target.originalName]);
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof ColumnField, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return setError(lang === 'ru' ? 'Имя таблицы не может быть пустым' : 'Table name cannot be empty');
    if (fields.length === 0) return setError(lang === 'ru' ? 'Таблица должна содержать хотя бы одну колонку' : 'Table must have at least one column');
    
    const duplicateNames = fields.map(c => c.name.toLowerCase()).some((val, i, arr) => arr.indexOf(val) !== i);
    if (duplicateNames) return setError(lang === 'ru' ? 'Обнаружены дубликаты имен колонок' : 'Duplicate column names detected');

    setLoading(true);
    setError(null);

    // Build lists of modifications
    const operations: any[] = [];

    // 1. Column drops
    deletedColumnNames.forEach(colName => {
      operations.push({
        type: 'drop',
        columnName: colName,
      });
    });

    // 2. Adds and Modifies
    fields.forEach(field => {
      if (field.isNew) {
        operations.push({
          type: 'add',
          columnName: field.name,
          columnType: field.type,
          isNullable: field.isNullable,
          defaultValue: field.defaultValue,
          references: field.references,
        });
      } else {
        // Compute changes compared to its initial state
        const originalField = initialFields.find(x => x.originalName === field.originalName);
        if (originalField) {
          const nameChanged = field.name !== originalField.name;
          const typeChanged = field.type !== originalField.type;
          const nullableChanged = field.isNullable !== originalField.isNullable;
          const defaultChanged = field.defaultValue !== originalField.defaultValue;
          const referencesChanged = (field.references || '') !== (originalField.references || '');

          if (nameChanged || typeChanged || nullableChanged || defaultChanged || referencesChanged) {
            operations.push({
              type: 'modify',
              oldColumnName: originalField.name,
              newColumnName: field.name,
              newType: field.type,
              newIsNullable: field.isNullable,
              newDefaultValue: field.defaultValue,
              references: field.references,
              typeChanged,
              nullableChanged,
              defaultChanged,
              referencesChanged,
            });
          }
        }
      }
    });

    try {
      await onAlter(newTableName.trim(), operations);
    } catch (err: any) {
      setError(err.message || 'Error occurred while altering tables');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-lg border border-[#23252C] bg-[#0A0B0D] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-sans text-gray-255">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23252C] px-5 py-3.5 bg-[#000000]/30">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#E2E8F0] tracking-wider uppercase bg-[#16181C] border border-[#23252C] px-1.5 py-0.5 rounded">
                DUNEON Schema Editor
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mt-1">
              {t.editTableTitle}: <span className="text-white font-mono">{tableName}</span>
            </h3>
          </div>
          <button onClick={onClose} className="p-1 px-2 rounded-md hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/20 p-2.5 flex items-start gap-2 text-xs text-red-400 font-sans">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
              <div>
                <strong className="font-mono text-red-400">[ALTER_FAILED]: </strong>
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="alter-table-name" className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                {t.tableName}
              </label>
              <input
                id="alter-table-name"
                type="text"
                required
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="w-full rounded border border-[#2D2F34] bg-[#050506] px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-gray-500 font-mono"
              />
            </div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={addColumn}
                className="flex items-center gap-1 text-[11px] font-bold bg-[#1A1C22] text-[#E2E8F0] hover:text-white hover:bg-[#252831] border border-[#2D2F34] px-3.5 py-2 rounded-full transition-all cursor-pointer shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 font-bold" />
                {t.addColumnBtn}
              </button>
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              {t.columnsConfig}
            </span>

            <div className="border border-[#23252C] rounded-md overflow-hidden bg-[#050506]">
              <div className="grid grid-cols-12 gap-2.5 p-2 px-3 bg-[#0A0B0D] border-b border-[#23252C] text-[9.5px] font-semibold uppercase tracking-wider text-gray-400 font-sans">
                <div className="col-span-4">{t.columnNameHeader}</div>
                <div className="col-span-3">{t.columnTypeHeader}</div>
                <div className="col-span-2 text-center text-[10px]">NOT NULL</div>
                <div className="col-span-2">{t.defaultHeader}</div>
                <div className="col-span-1 text-right">{t.deleteColHeader}</div>
              </div>

              <div className="divide-y divide-[#23252C] max-h-72 overflow-y-auto">
                {fields.map((col, index) => (
                  <div key={index} className="flex flex-col hover:bg-[#151820]/25">
                    <div className="grid grid-cols-12 gap-2.5 p-2 px-3 items-center font-mono text-xs">
                      
                      {/* Name */}
                      <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                        {col.isNew ? (
                          <span className="text-[8px] px-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded shrink-0">NEW</span>
                        ) : (
                          <span className="text-[8px] px-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded shrink-0">SQL</span>
                        )}
                        <input
                          type="text"
                          required
                          aria-label={`Column Name ${index + 1}`}
                          value={col.name}
                          onChange={(e) => updateField(index, 'name', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          className="w-full rounded border border-[#2D2F34] bg-[#050506] px-2 py-1 text-xs text-white outline-none focus:border-gray-500 font-mono"
                          placeholder="col_name"
                        />
                      </div>

                      {/* Type select */}
                      <div className="col-span-3">
                        <select
                          aria-label={`Type select ${index + 1}`}
                          value={col.type}
                          onChange={(e) => updateField(index, 'type', e.target.value)}
                          className="w-full rounded border border-[#2D2F34] bg-[#050506] px-2 py-1 text-xs text-gray-300 outline-none focus:border-gray-500 cursor-pointer font-mono"
                        >
                          {POSTGRES_TYPES.map(tOption => (
                            <option key={tOption} value={tOption} className="bg-[#050506]">{tOption}</option>
                          ))}
                        </select>
                      </div>

                      {/* Not Null */}
                      <div className="col-span-2 flex justify-center">
                        <input
                          type="checkbox"
                          aria-label={`Not Null checkbox ${index + 1}`}
                          checked={!col.isNullable} // Checked means NOT NULL, so isNullable is false
                          onChange={(e) => updateField(index, 'isNullable', !e.target.checked)}
                          className="h-4 w-4 rounded border-[#2D2F34] bg-[#050506] text-white accent-white cursor-pointer"
                        />
                      </div>

                      {/* Default value */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          aria-label={`Default value ${index + 1}`}
                          value={col.defaultValue}
                          onChange={(e) => updateField(index, 'defaultValue', e.target.value)}
                          placeholder="'' or NULL"
                          className="w-full rounded border border-[#2D2F34] bg-[#050506] px-2 py-1 text-xs text-gray-350 outline-none focus:border-gray-500 font-mono"
                        />
                      </div>

                      {/* Drop column action */}
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
                          className="p-1 rounded text-red-400 hover:bg-red-500/15 cursor-pointer transition-colors"
                          aria-label={`Delete button ${index + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable References Foreign Key Panel */}
                    {expandedRefIndex === index && (
                      <div className="mx-3 mb-2.5 p-2.5 rounded border border-[#2D2F34] bg-[#0A0B0D] flex flex-wrap items-center gap-3 animate-fade-in text-xs font-mono">
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
                                updateField(index, 'references', '');
                              } else {
                                updateField(index, 'references', `${tbl}(id)`);
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
                                  updateField(index, 'references', `${tbl}(${field})`);
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
            
            <p className="text-[10px] text-gray-450 mt-2 font-sans leading-relaxed">
              {t.noteAlterWarning}
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3.5 border-t border-[#23252C] px-5 py-4 bg-[#0A0B0D]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#2D2F34] bg-[#050506] px-4.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 px-5 py-1.5 text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            {loading ? t.saving : t.btnApplyChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
