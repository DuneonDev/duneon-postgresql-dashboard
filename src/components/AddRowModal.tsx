import React, { useState, useEffect } from 'react';
import { ColumnInfo } from '../types.js';
import { X, AlertCircle } from 'lucide-react';
import { LangType, translations } from '../translations.js';

interface AddRowModalProps {
  onClose: () => void;
  columns: ColumnInfo[];
  primaryKeys: string[];
  editingRow?: any; // If editing, pass the row object
  onSave: (rowData: any) => Promise<void>;
  lang: LangType;
}

export default function AddRowModal({ onClose, columns, primaryKeys, editingRow, onSave, lang }: AddRowModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    if (editingRow) {
      // Map existing values to form fields
      const initial: any = {};
      columns.forEach((col) => {
        let val = editingRow[col.column_name];
        if (val !== undefined) {
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          initial[col.column_name] = String(val);
        } else {
          initial[col.column_name] = '';
        }
      });
      setFormData(initial);
    } else {
      // Setup placeholders or default values
      const initial: any = {};
      columns.forEach((col) => {
        // We skip auto-increment fields like serial or automatic defaults
        if (col.column_default && col.column_default.includes('nextval')) {
          initial[col.column_name] = '';
        } else if (col.column_default === 'CURRENT_TIMESTAMP' || col.column_default?.includes('now()')) {
          initial[col.column_name] = ''; // Server will insert CURRENT_TIMESTAMP
        } else {
          initial[col.column_name] = '';
        }
      });
      setFormData(initial);
    }
  }, [columns, editingRow]);

  const handleInputChange = (colName: string, val: string) => {
    setFormData({
      ...formData,
      [colName]: val,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare row payload. Filter empty fields we don't want to save on insert
    const payload: any = {};
    columns.forEach((col) => {
      const val = formData[col.column_name];
      const isPk = primaryKeys.includes(col.column_name);

      // Skip undefined or empty columns when INSERTING to let defaults work
      if (!editingRow && val === '') {
        return;
      }

      // Convert values based on type
      if (val === '') {
        payload[col.column_name] = null;
      } else if (col.data_type === 'boolean') {
        payload[col.column_name] = val === 'true';
      } else if (col.data_type === 'ARRAY' || col.data_type.includes('[]') || col.data_type.startsWith('_')) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            payload[col.column_name] = parsed;
          } else {
            payload[col.column_name] = [val];
          }
        } catch {
          if (val.startsWith('{') && val.endsWith('}')) {
            payload[col.column_name] = val; // Let PostgreSQL parser handle standard brace array syntax
          } else {
            // Parse as comma separated list
            payload[col.column_name] = val.split(',').map(s => s.trim()).filter(s => s !== '');
          }
        }
      } else if (col.data_type.startsWith('integer') || col.data_type.startsWith('bigint') || col.data_type.startsWith('numeric')) {
        const num = Number(val);
        payload[col.column_name] = isNaN(num) ? val : num;
      } else if (col.data_type === 'jsonb' || col.data_type === 'json' || col.data_type.startsWith('json')) {
        try {
          const parsed = JSON.parse(val);
          payload[col.column_name] = JSON.stringify(parsed);
        } catch {
          // If JSON.parse fails, let's make it a valid JSON string literal (e.g., '"hello"')
          // so that PostgreSQL doesn't fail with "invalid input syntax for type json"
          payload[col.column_name] = JSON.stringify(val);
        }
      } else {
        payload[col.column_name] = val;
      }
    });

    try {
      await onSave(payload);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving row');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0D11]/90 p-3 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded border border-[#2D2F34] bg-[#0F1115] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2F34] px-4 py-2.5 bg-[#181A1F]">
          <div>
            <h3 className="text-xs font-bold text-white tracking-widest uppercase">
              {editingRow
                ? (lang === 'ru' ? 'РЕДАКТИРОВАТЬ СТРОКУ' : lang === 'am' ? 'ԽՄԲԱԳՐԵԼ ՏՈՂԸ' : 'EDIT ROW RECORD')
                : (lang === 'ru' ? 'ДОБАВИТЬ НОВУЮ СТРОКУ' : lang === 'am' ? 'ԱՎԵԼԱՑնել ՆՈՐ ՏՈՂ' : 'WRITE NEW RECORD')
              }
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
              {editingRow
                ? (lang === 'ru' ? 'Изменить поля записи в таблице в соответствии со схемой' : lang === 'am' ? 'Փոփոխել աղյուսակի տողի տվյալները սխեմային համապատասխան' : 'Modify schema compliance records')
                : (lang === 'ru' ? 'Заполните параметры строки или оставьте пустыми для автозаполнения СУБД' : lang === 'am' ? 'Լրացրեք տողի պարամետրերը կամ թողեք դատարկ՝ սերվերի նախնական արժեքներն օգտագործելու համար' : 'Populate parameters manually or let server defaults apply')
              }
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/20 p-2 flex items-start gap-2 text-xs text-red-400 font-mono">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>[TRANSACTION_ABORTED]: {error}</div>
            </div>
          )}

          <div className="space-y-3">
            {columns.map((col) => {
              const isPk = primaryKeys.includes(col.column_name);
              const isEditingPk = false;
              const hasDefault = col.column_default !== null;

              return (
                <div key={col.column_name} className="space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <label htmlFor={`edit-${col.column_name}`} className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {col.column_name} {col.is_nullable === 'NO' && <span className="text-red-500">*</span>}
                    </label>
                    <span className="text-[9px] text-gray-655 uppercase">
                      {col.data_type} {isPk && '[PK]'} {hasDefault && '[DEFAULT]'}
                    </span>
                  </div>

                  {col.data_type === 'boolean' ? (
                    <select
                      id={`edit-${col.column_name}`}
                      disabled={isEditingPk}
                      value={formData[col.column_name] || ''}
                      onChange={(e) => handleInputChange(col.column_name, e.target.value)}
                      className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2 py-1 text-xs text-white focus:border-blue-500 outline-none transition-colors font-mono cursor-pointer"
                    >
                      <option value="" className="bg-[#0F1115]">[ null ]</option>
                      <option value="true" className="bg-[#0F1115]">True</option>
                      <option value="false" className="bg-[#0F1115]">False</option>
                    </select>
                  ) : col.data_type === 'ARRAY' || col.data_type.includes('[]') || col.data_type.startsWith('_') ? (
                    <div className="space-y-1">
                      <input
                        id={`edit-${col.column_name}`}
                        disabled={isEditingPk}
                        type="text"
                        value={formData[col.column_name] || ''}
                        onChange={(e) => handleInputChange(col.column_name, e.target.value)}
                        className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2.5 py-1 text-xs text-white placeholder-gray-655 focus:border-blue-500 outline-none transition-colors font-mono"
                        placeholder={lang === 'ru' ? 'Например: ["яблоко", "банан"] или 1,2,3' : 'e.g. ["apple", "banana"] or 1,2,3'}
                      />
                      <span className="text-[9px] text-gray-500 block leading-normal">
                        {lang === 'ru'
                          ? 'Введите как JSON-массив ["значение"] или просто через запятую'
                          : 'Format as JSON array ["value"] or comma-separated list'}
                      </span>
                    </div>
                  ) : col.data_type === 'text' || col.data_type === 'jsonb' ? (
                    <textarea
                      id={`edit-${col.column_name}`}
                      disabled={isEditingPk}
                      rows={3}
                      value={formData[col.column_name] || ''}
                      onChange={(e) => handleInputChange(col.column_name, e.target.value)}
                      className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2.5 py-1.5 text-xs font-mono text-white placeholder-gray-655 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                      placeholder={col.data_type === 'jsonb' ? '{\n  "key": "value"\n}' : 'Enter text body...'}
                    />
                  ) : (
                    <input
                      id={`edit-${col.column_name}`}
                      disabled={isEditingPk}
                      type="text"
                      value={formData[col.column_name] || ''}
                      onChange={(e) => handleInputChange(col.column_name, e.target.value)}
                      className="w-full rounded border border-[#2D2F34] bg-[#0F1115] px-2.5 py-1 text-xs text-white placeholder-gray-655 focus:border-blue-500 outline-none transition-colors font-mono"
                      placeholder={hasDefault ? `DEFAULT: ${col.column_default}` : col.is_nullable === 'YES' ? 'NULL' : 'Enter value...'}
                    />
                  )}
                </div>
              );
            })}
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
            {loading ? (lang === 'ru' ? 'ЗАПИСЬ...' : lang === 'am' ? 'ԳՐԱՆՑՈՒՄ...' : 'WRITING...') : editingRow ? (lang === 'ru' ? 'ОБНОВИТЬ' : lang === 'am' ? 'ԹԱՐՄԱՑՆԵԼ' : 'UPDATE_RECORD') : (lang === 'ru' ? 'СОХРАНИТЬ' : lang === 'am' ? 'ՊԱՀՊԱՆԵԼ' : 'COMMIT_RECORD')}
          </button>
        </div>
      </div>
    </div>
  );
}
