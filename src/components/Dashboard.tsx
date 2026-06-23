import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SSHConfig, PgConfig, ColumnInfo } from '../types.js';
import CreateTableModal from './CreateTableModal.js';
import AddRowModal from './AddRowModal.js';
import CreateUserModal from './CreateUserModal.js';
import EditTableModal from './EditTableModal.js';
import ImportModal from './ImportModal.js';
import SchemaExplorer from './SchemaExplorer.js';
import { LangType, translations } from '../translations.js';
import DuneonLogo from './DuneonLogo.js';
import { uiSound } from '../utils/audio.js';
import SettingsModal from './SettingsModal.js';

// New system consoles imports
import MonitoringSection from './MonitoringSection.js';
import StructureSection from './StructureSection.js';
import BackupSection from './BackupSection.js';
import SecuritySection from './SecuritySection.js';
import AnalyticsSection from './AnalyticsSection.js';

import {
  Database,
  Table as TableIcon,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Terminal,
  Users,
  LogOut,
  Play,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  XCircle,
  Hash,
  Search,
  Check,
  Server,
  Globe,
  Download,
  ChevronDown,
  History,
  Layers,
  Star,
  Copy,
  Activity,
  ShieldAlert,
  Lock,
  UserCheck,
  Eye,
  Zap,
  Code,
  TrendingUp,
  Archive,
  ArrowDownToLine,
  Volume2,
  VolumeX
} from 'lucide-react';

interface DashboardProps {
  sshConfig: SSHConfig;
  initialPgConfig: PgConfig;
  initialDatabases: string[];
  onLogout: () => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  soundMuted: boolean;
  setSoundMuted: (b: boolean) => void;
}

export default function Dashboard({ 
  sshConfig, 
  initialPgConfig, 
  initialDatabases, 
  onLogout, 
  lang, 
  setLang,
  theme,
  setTheme,
  soundMuted,
  setSoundMuted
}: DashboardProps) {
  const t = translations[lang];

  // Navigation & Config
  const [databases, setDatabases] = useState<string[]>(initialDatabases);
  const [currentDb, setCurrentDb] = useState<string>(initialPgConfig.database);
  const [pgConfig, setPgConfig] = useState<PgConfig>(initialPgConfig);
  
  // Tables state
  const [tables, setTables] = useState<string[]>([]);
  const [currentTable, setCurrentTable] = useState<string | null>(null);
  
  // Active table content state
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Active workspace tab
  const [activeTab, setActiveTab ] = useState<'data' | 'schema' | 'query' | 'users' | 'er' | 'monitoring' | 'backup' | 'analytics' | 'security' | 'structure'>('data');
  const [runningQuery, setRunningQuery] = useState('SELECT * FROM pg_catalog.pg_tables LIMIT 10;');
  const [customQueryResult, setCustomQueryResult] = useState<any>(null);

  // Users management state
  const [postgresUsersList, setPostgresUsersList] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New item creators state
  const [newDbName, setNewDbName] = useState('');
  const [showCreateDb, setShowCreateDb] = useState(false);

  // Modals visibility
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [showEditTable, setShowEditTable ] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const [showSettings, setShowSettings] = useState(false);

  const [queryHistoryList, setQueryHistoryList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('duneon_query_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToHistory = (sql: string, success: boolean, rowCount?: number, errorMsg?: string) => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      sql,
      timestamp: Date.now(),
      success,
      db: currentDb,
      rowCount,
      error: errorMsg
    };
    setQueryHistoryList(prev => {
      const updated = [newItem, ...prev].slice(0, 50);
      try {
        localStorage.setItem('duneon_query_history', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setQueryHistoryList([]);
    try {
      localStorage.removeItem('duneon_query_history');
    } catch {}
  };

  const [historySearch, setHistorySearch] = useState('');
  const [historyDbFilter, setHistoryDbFilter] = useState<'all' | 'current'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [historyStarredOnly, setHistoryStarredOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleStarQuery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueryHistoryList(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, pinned: !item.pinned } : item);
      try {
        localStorage.setItem('duneon_query_history', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const copyQueryText = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
      uiSound.click(); // play subtle sound on copy success
    });
  };

  // --- SUBTLE SOUNDS EFFECTS EFFECT WORKFLOWS ---
  const isFirstMountRef = React.useRef(true);
  const lastSoundTimeRef = React.useRef(0);

  const playInteractionSound = useCallback(() => {
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 60) {
      uiSound.click();
      lastSoundTimeRef.current = now;
    }
  }, []);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    playInteractionSound();
  }, [activeTab, playInteractionSound]);

  useEffect(() => {
    if (isFirstMountRef.current) return;
    playInteractionSound();
  }, [currentTable, playInteractionSound]);

  useEffect(() => {
    if (isFirstMountRef.current) return;
    if (successMsg) {
      // Don't double trigger if it is custom query execution success, since we play a custom chime there.
      if (successMsg === t.sqlQuerySuccess) return;
      uiSound.success();
    }
  }, [successMsg, t.sqlQuerySuccess]);

  useEffect(() => {
    if (isFirstMountRef.current) return;
    if (error) {
      uiSound.error();
    }
  }, [error]);

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueryHistoryList(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('duneon_query_history', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  // Custom non-blocking confirm dialog state to prevent sandboxed iframe issues
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const askConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmConfig(null);
      }
    });
  };

  // 1. Fetch tables for active database
  const fetchTables = useCallback(async (db: string, forceSelectTable?: string | null, overridePgConfig?: PgConfig) => {
    setLoading(true);
    setError(null);

    const targetPgConfig = overridePgConfig || { ...pgConfig, database: db };
    
    try {
      const response = await fetch('/api/postgres/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to locate tables list');
      }
      const fetchedTables = data.tables || [];
      setTables(fetchedTables);

      // Determine which table to select: prefer forceSelectTable if valid, then currentTable if still exists, then the first table
      let tableToSelect: string | null = null;
      if (forceSelectTable) {
        const found = fetchedTables.find(t => t.toLowerCase() === forceSelectTable.toLowerCase());
        tableToSelect = found || forceSelectTable;
      } else if (currentTable) {
        const found = fetchedTables.find(t => t.toLowerCase() === currentTable.toLowerCase());
        if (found) {
          tableToSelect = found;
        } else if (fetchedTables.length > 0) {
          tableToSelect = fetchedTables[0];
        }
      } else if (fetchedTables.length > 0) {
        tableToSelect = fetchedTables[0];
      }

      setCurrentTable(tableToSelect);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading tables list');
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig, currentTable]);

  // 2. Fetch columns & content for selected table
  const fetchTableContent = useCallback(async (tableName: string, db: string, overridePgConfig?: PgConfig) => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    const targetPgConfig = overridePgConfig || { ...pgConfig, database: db };

    try {
      const response = await fetch('/api/postgres/table-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig, tableName }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to populate table values');
      }
      setColumns(data.columns || []);
      setPrimaryKeys(data.primaryKeys || []);
      setRows(data.rows || []);
      setSelectedRows([]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || `Error occurred while receiving "${tableName}" relations`);
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig]);

  // 3. Fetch Postgres Users list for Roles Manager tab
  const fetchPostgresUsers = useCallback(async (db: string, overridePgConfig?: PgConfig) => {
    const targetPgConfig = overridePgConfig || { ...pgConfig, database: db };
    try {
      const response = await fetch('/api/postgres/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: targetPgConfig }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPostgresUsersList(data.roles || []);
      }
    } catch (err) {
      console.error('Error fetching cluster users:', err);
    }
  }, [sshConfig, pgConfig]);

  // Initial loading routine
  useEffect(() => {
    if (currentDb) {
      fetchTables(currentDb);
      fetchPostgresUsers(currentDb);
    }
  }, [currentDb]);

  // Automatically fetch table content when selected table changes
  useEffect(() => {
    setSearchQuery('');
    if (currentTable && currentDb) {
      fetchTableContent(currentTable, currentDb);
    }
  }, [currentTable, currentDb]);

  // --- ACTIONS ---

  // Handle Switching database
  const handleDatabaseChange = async (db: string) => {
    const updatedPgConfig = { ...pgConfig, database: db };
    setPgConfig(updatedPgConfig);
    setCurrentDb(db);
    setTables([]);
    setCurrentTable(null);
    setColumns([]);
    setRows([]);
    setSuccessMsg((lang === 'ru' ? 'Переключено на базу данных: ' : lang === 'am' ? 'Անցում կատարվեց տվյալների բազային. ' : 'Switched to database: ') + db);
    await fetchTables(db, null, updatedPgConfig);
    await fetchPostgresUsers(db, updatedPgConfig);
  };

  // Create Database
  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/postgres/database/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: pgConfig, dbName: newDbName.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create Postgres database');
      }

      setSuccessMsg(t.dbCreatedSuccess);
      const updatedDbs = [...databases, newDbName.trim()].sort();
      setDatabases(updatedDbs);
      setNewDbName('');
      setShowCreateDb(false);
      
      // Auto switch
      await handleDatabaseChange(newDbName.trim());
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating database');
    } finally {
      setLoading(false);
    }
  };

  // Delete Database
  const handleDeleteDatabase = async (db: string) => {
    if (db === 'postgres' || db === 'template1') return;
    askConfirm(
      lang === 'ru' ? 'Удаление базы данных' : lang === 'am' ? 'Տվյալների բազայի ջնջում' : 'Drop Database',
      lang === 'ru'
        ? `Вы уверены, что хотите окончательно удалить базу данных "${db}"? Все таблицы и данные в ней будут безвозвратно удалены!`
        : lang === 'am'
        ? `Համոզվա՞ծ եք, որ ցանկանում եք ընդմիշտ ջնջել "${db}" տվյալների բազան: Բոլոր աղյուսակները և տվյալները կջնջվեն անդառնալիորեն:`
        : `Are you sure you want to permanently drop database "${db}"? This will physically clean all relational tables!`,
      async () => {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
          const response = await fetch('/api/postgres/database/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssh: sshConfig, pg: pgConfig, dbName: db }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to drop database');
          }

          setSuccessMsg(t.dbDeletedSuccess);
          const updatedDbs = databases.filter((d) => d !== db);
          setDatabases(updatedDbs);
          
          // Switch to default 'postgres' database
          await handleDatabaseChange('postgres');
        } catch (err: any) {
          setError(err.message || 'Error occurred while dropping database');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Create Table
  const handleCreateTable = async (tableNameStr: string, columnsDefList: any[]) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/postgres/table/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssh: sshConfig,
          pg: pgConfig,
          tableName: tableNameStr,
          columns: columnsDefList,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create specified relation table');
      }

      setSuccessMsg((lang === 'ru' ? 'Таблица ' : lang === 'am' ? 'Աղյուսակը ' : 'Table ') + `"${tableNameStr}"` + (lang === 'ru' ? ' успешно создана!' : lang === 'am' ? ' հաջողությամբ ստեղծվեց:' : ' successfully created!'));
      const updatedTables = [...tables, tableNameStr].sort();
      setTables(updatedTables);
      setCurrentTable(tableNameStr);
      setShowCreateTable(false);
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating relation table');
    } finally {
      setLoading(false);
    }
  };

  const handleAlterTable = async (newTableNameStr: string, operations: any[]) => {
    setError(null);
    setSuccessMsg(null);
    if (!currentTable) return;

    try {
      const response = await fetch('/api/postgres/table/alter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssh: sshConfig,
          pg: pgConfig,
          tableName: currentTable,
          newTableName: newTableNameStr,
          operations,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply schema operations to table');
      }

      // Close the modal immediately so it does not adapt to modified state values during fetch
      setShowEditTable(false);

      setSuccessMsg((lang === 'ru' ? 'Схема таблицы ' : lang === 'am' ? 'Աղյուսակի սխեման ' : 'Table schema for ') + `"${currentTable}"` + (lang === 'ru' ? ' успешно изменена!' : lang === 'am' ? ' հաջողությամբ փոփոխվեց:' : ' successfully updated!'));
      
      // Just refetch same table definition and content, making sure we preserve the altered table
      await fetchTables(currentDb, newTableNameStr);
      await fetchTableContent(newTableNameStr, currentDb);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while altering tables');
      // Pass error back up to show in EditTableModal as well
      throw err;
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    askConfirm(
      t.confirmDeleteTableTitle,
      lang === 'ru'
        ? `Вы действительно хотите удалить ТАБЛИЦУ "${tableName}" и все её данные? Это действие необратимо!`
        : lang === 'am'
        ? `Իսկապե՞ս ցանկանում եք ջնջել "${tableName}" ԱՂՅՈՒՍԱԿԸ և դրա ողջ տվյալները: Այս գործողությունը անդառնալի է:`
        : `Are you sure you want to permanently drop relation table "${tableName}" and release all associated blocks?`,
      async () => {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
          const response = await fetch('/api/postgres/table/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ssh: sshConfig, pg: pgConfig, tableName }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to drop specified table');
          }

          setSuccessMsg((lang === 'ru' ? 'Таблица ' : lang === 'am' ? 'Աղյուսակը ' : 'Table ') + `"${tableName}"` + (lang === 'ru' ? ' успешно удалена.' : lang === 'am' ? ' հաջողությամբ ջնջվեց:' : ' dropped.'));
          const updatedTables = tables.filter(t => t !== tableName);
          setTables(updatedTables);
          if (currentTable === tableName) {
            setCurrentTable(updatedTables[0] || null);
          }
        } catch (err: any) {
          setError(err.message || 'Error occurred while dropping table');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // --- ROW OPERATIONS ---
  const handleSaveRow = async (rowData: any) => {
    if (!currentTable) return;
    setError(null);
    setSuccessMsg(null);

    const isUpdate = !!editingRow;
    const url = isUpdate ? '/api/postgres/row/update' : '/api/postgres/row/create';

    const firstPk = primaryKeys[0] || 'id'; // default match if pk missing (best-guess)
    const pkValue = editingRow ? editingRow[firstPk] : undefined;

    const payload = {
      ssh: sshConfig,
      pg: pgConfig,
      tableName: currentTable,
      rowData,
      primaryKeyName: isUpdate ? firstPk : undefined,
      primaryKeyValue: isUpdate ? pkValue : undefined,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to save or modify cell values');
    }

    setSuccessMsg(isUpdate ? t.msgRowUpdatedSuccess : t.msgRowCreatedSuccess);
    await fetchTableContent(currentTable, currentDb);
    setEditingRow(null);
    setShowAddRow(false);
  };

  const handleDeleteRow = async (row: any) => {
    if (!currentTable) return;
    if (primaryKeys.length === 0) {
      setError(t.cantDeleteRowNoPk);
      return;
    }

    askConfirm(
      t.msgConfirmDeleteRowTitle,
      t.msgConfirmDeleteRowMsg,
      async () => {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const firstPk = primaryKeys[0];
        const pkValue = row[firstPk];

        try {
          const response = await fetch('/api/postgres/row/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ssh: sshConfig,
              pg: pgConfig,
              tableName: currentTable,
              primaryKeyName: firstPk,
              primaryKeyValue: pkValue,
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete row record');
          }

          setSuccessMsg(t.msgRowUpdatedSuccess);
          await fetchTableContent(currentTable, currentDb);
        } catch (err: any) {
          setError(err.message || 'Error occurred while dropping record');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteSelectedRows = async () => {
    if (!currentTable) return;
    if (primaryKeys.length === 0) {
      setError(t.cantDeleteRowNoPk);
      return;
    }
    if (selectedRows.length === 0) return;

    const firstPk = primaryKeys[0];
    const pkValues = selectedRows.map(row => row[firstPk]);

    askConfirm(
      t.msgConfirmDeleteMultipleRowsTitle,
      t.msgConfirmDeleteMultipleRowsMsg.replace('{count}', selectedRows.length.toString()),
      async () => {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
          const response = await fetch('/api/postgres/rows/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ssh: sshConfig,
              pg: pgConfig,
              tableName: currentTable,
              primaryKeyName: firstPk,
              primaryKeyValues: pkValues,
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete row records');
          }

          setSuccessMsg(t.msgRowUpdatedSuccess);
          setSelectedRows([]);
          await fetchTableContent(currentTable, currentDb);
        } catch (err: any) {
          setError(err.message || 'Error occurred while dropping records');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleExportCSV = () => {
    if (!filteredRows || filteredRows.length === 0) return;

    // Get column names
    const headers = columns.map(col => col.column_name);

    // Escape and convert rows
    const csvRows = [
      // Headers row
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      // Values rows
      ...filteredRows.map(row => {
        return headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) {
            return '""';
          }
          if (typeof val === 'object') {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable || 'table'}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  const handleExportExcel = () => {
    if (!filteredRows || filteredRows.length === 0) return;
    
    // Create Excel XML format
    const headers = columns.map(col => col.column_name);
    let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:schemas" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sheet1"><Table>';
    
    // Header row
    xml += '<Row>';
    headers.forEach(h => {
      xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
    });
    xml += '</Row>';
    
    // Data rows
    filteredRows.forEach(row => {
      xml += '<Row>';
      headers.forEach(h => {
        const val = row[h];
        if (val === null || val === undefined) {
          xml += '<Cell><Data ss:Type="String"></Data></Cell>';
          return;
        }
        const valStr = String(val);
        const type = typeof val === 'number' ? 'Number' : 'String';
        xml += `<Cell><Data ss:Type="${type}">${valStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
      });
      xml += '</Row>';
    });
    
    xml += '</Table></Worksheet></Workbook>';
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable || 'table'}_export_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
    setSuccessMsg(lang === 'ru' ? 'Данные экспортированы в формате MS Excel!' : 'File exported in MS Excel XML Workbook format!');
  };

  const handleExportJSON = () => {
    if (!filteredRows || filteredRows.length === 0) return;

    const jsonContent = JSON.stringify(filteredRows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable || 'table'}_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportDropdown(false);
  };

  // --- RAW QUERY OPERATIONS ---
  const handleExecuteCustomQuery = async () => {
    if (!runningQuery.trim()) return;
    setLoading(true);
    setError(null);
    setCustomQueryResult(null);

    try {
      const response = await fetch('/api/postgres/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssh: sshConfig, pg: pgConfig, sql: runningQuery }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete custom SQL queries');
      }
      setCustomQueryResult(data);
      setSuccessMsg(t.sqlQuerySuccess);
      uiSound.queryComplete();

      const rCount = data.rowCount ?? data.rows?.length ?? 0;
      saveToHistory(runningQuery, true, rCount);

      if (runningQuery.toLowerCase().includes('create') || runningQuery.toLowerCase().includes('drop') || runningQuery.toLowerCase().includes('alter')) {
        await fetchTables(currentDb, currentTable);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'SQL Parser Syntactical Error';
      setError(errorMsg);
      saveToHistory(runningQuery, false, undefined, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- POSTGRES USER ROLES ACTIONS ---
  const handleCreateUser = async (usernameStr: string, passwordStr: string, isSuper: boolean) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/postgres/role/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssh: sshConfig,
          pg: pgConfig,
          newRoleName: usernameStr,
          newRolePassword: passwordStr,
          isSuperuser: isSuper,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create Postgres role');
      }

      setSuccessMsg(t.msgUserCreatedSuccess);
      await fetchPostgresUsers(currentDb);
      setShowCreateUser(false);
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating system role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete: string) => {
    if (userToDelete === pgConfig.user || userToDelete === 'postgres') return;

    askConfirm(
      t.msgDeleteUserTitle,
      t.msgDeleteUserMsg,
      async () => {
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
          const response = await fetch('/api/postgres/role/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ssh: sshConfig,
              pg: pgConfig,
              roleName: userToDelete,
            }),
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to delete role');
          }

          setSuccessMsg(t.msgUserDeletedSuccess);
          await fetchPostgresUsers(currentDb);
        } catch (err: any) {
          setError(err.message || 'Error occurred while dropping role');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Filtrate table rows strictly client-side
  const filteredRows = rows.filter((r) => {
    if (!searchQuery) return true;
    return Object.values(r).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-screen w-full bg-[#050506] text-[#E2E8F0] font-sans overflow-hidden select-none">
      
      {/* Top Duneon Corporate Header */}
      <header className="w-full h-16 border-b border-[#131418] bg-[#050506]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-6">
          {/* Duneon Logo */}
          <div className="flex items-center gap-2">
            <DuneonLogo className="h-6 md:h-7" />
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest bg-[#15171F] px-2 py-0.5 border border-[#23252C] rounded uppercase">TNL_PORT_FORWARD</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-400">
              <span className="text-emerald-400 font-bold">{sshConfig.username}@{sshConfig.host}:{sshConfig.port}</span>
              <span className="text-zinc-600">⇌</span>
              <span className="text-zinc-300 font-semibold">localhost:5432</span>
            </div>
          </div>
        </div>
        
        {/* Languages Switcher & Session State controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0F1115]/50 border border-[#23252C] rounded-full px-2.5 py-1">
            <Globe className="h-3 w-3 text-gray-500" />
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'ru'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('am')}
                className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                  lang === 'am'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                AM
              </button>
            </div>
          </div>

          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => { uiSound.click(); setShowSettings(true); }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F1115]/50 hover:bg-[#15171F] border border-[#23252C] hover:border-[#2F323B] rounded-full text-slate-400 hover:text-white text-[11px] font-bold font-sans transition-all cursor-pointer shadow-sm"
            title={lang === 'ru' ? 'Настройки системы (звуки, язык, тема)' : 'System Settings (chimes, language, theme)'}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'НАСТРОЙКИ' : 'SETTINGS'}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F1215] hover:bg-[#2C181C] text-red-400 hover:text-red-300 border border-red-950/60 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{t.logoutBtn}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar holding Catalogues and Relations */}
        <aside className="w-72 shrink-0 border-r border-[#131418] flex flex-col bg-[#050506] h-full overflow-hidden">
          
          {/* Dynamic Database Selector */}
          <div className="p-4 border-b border-[#131418] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="db-select" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">
                {t.activeDb} ({databases.length})
              </label>
              <button
                onClick={() => setShowCreateDb(!showCreateDb)}
                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                title={t.createDbBtn}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showCreateDb && (
              <form onSubmit={handleCreateDatabase} className="flex gap-1.5 bg-[#0A0B0D] p-2 rounded-lg border border-[#23252C] animate-fade-in mb-2">
                <input
                  type="text"
                  value={newDbName}
                  required
                  onChange={(e) => setNewDbName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder={t.createDbPlaceholder}
                  className="flex-1 bg-[#050506] border-none px-2.5 py-1 text-xs text-white placeholder-gray-600 outline-none font-mono"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-neutral-200 text-black px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                >
                  OK
                </button>
              </form>
            )}

            <div className="flex items-center gap-1.5">
              <select
                id="db-select"
                value={currentDb}
                onChange={(e) => handleDatabaseChange(e.target.value)}
                className="flex-1 min-w-0 rounded border border-[#23252C] bg-[#0A0B0D] px-2.5 py-2 text-xs text-[#E2E8F0] font-sans font-semibold cursor-pointer outline-none focus:border-neutral-500 font-mono"
              >
                {databases.map((db) => (
                  <option key={db} value={db} className="bg-[#0A0B0D]">
                    db_{db}
                  </option>
                ))}
              </select>
              {currentDb !== 'postgres' && currentDb !== 'template1' && (
                <button
                  onClick={() => handleDeleteDatabase(currentDb)}
                  type="button"
                  className="p-2 bg-[#1A0C0E]/50 text-red-400 hover:text-red-300 border border-red-950/60 rounded transition-all shrink-0 cursor-pointer"
                  title="Drop Selected DB"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Table Relations Selector */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 text-gray-500 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                {t.tablesList} ({tables.length})
              </span>
              <button
                onClick={() => setShowCreateTable(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-white hover:text-neutral-350 bg-[#15171F] border border-[#23252C] px-2 py-1 rounded-full uppercase transition-all shrink-0"
              >
                <Plus className="h-2.5 w-2.5" />
                {t.createTableBtn}
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto flex-1 pr-1">
              {tables.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-gray-500 border border-dashed border-[#23252C] rounded-lg bg-[#0A0B0D]/20">
                  {t.noTables}
                </div>
              ) : (
                tables.map((tbl) => (
                  <div
                    key={tbl}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all border ${
                      currentTable === tbl
                        ? 'bg-[#15171F] border-[#3E4254] text-white font-semibold'
                        : 'border-transparent bg-transparent text-gray-400 hover:bg-[#0A0B0D] hover:text-[#E2E8F0]'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setCurrentTable(tbl);
                        setActiveTab('data');
                      }}
                      className="flex-1 flex items-center gap-2 text-left truncate cursor-pointer font-mono"
                    >
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${currentTable === tbl ? 'text-white bg-zinc-700' : 'text-gray-500 bg-zinc-900/50'}`}>REL</span>
                      <span className="truncate">{tbl}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTable(tbl)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300 transition-all rounded"
                      title={t.deleteTableBtn}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Tab control options */}
          <div className="p-3 border-t border-[#131418] bg-[#0A0B0D]/50 flex flex-col gap-2 shrink-0 font-sans font-semibold">
            <span className="text-[9.5px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
              {lang === 'ru' ? 'ИНСТРУМЕНТЫ И УПРАВЛЕНИЕ' : 'TOOLS & CONSOLES'}
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              <button
                onClick={() => { setActiveTab('query'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'query'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm animate-pulseReady'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Terminal className="h-3 w-3 shrink-0" />
                <span className="truncate">Terminal</span>
              </button>

              <button
                onClick={() => { setActiveTab('er'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'er'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3 shrink-0" />
                <span className="truncate">ER Graph</span>
              </button>

              <button
                onClick={() => { setActiveTab('structure'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'structure'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">{lang === 'ru' ? 'Объекты' : 'Objects'}</span>
              </button>

              <button
                onClick={() => { setActiveTab('monitoring'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'monitoring'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="h-3 w-3 shrink-0 text-blue-400" />
                <span className="truncate">{lang === 'ru' ? 'Телеметрия' : 'Metrics'}</span>
              </button>

              <button
                onClick={() => { setActiveTab('backup'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'backup'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Archive className="h-3 w-3 shrink-0 text-amber-500" />
                <span className="truncate">{lang === 'ru' ? 'Бэкапы' : 'Backups'}</span>
              </button>

              <button
                onClick={() => { setActiveTab('analytics'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'analytics'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <TrendingUp className="h-3 w-3 shrink-0 text-emerald-400" />
                <span className="truncate">Analytics</span>
              </button>

              <button
                onClick={() => { setActiveTab('security'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'security'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Lock className="h-3 w-3 shrink-0 text-pink-400" />
                <span className="truncate">Security</span>
              </button>

              <button
                onClick={() => { setActiveTab('users'); setCurrentTable(''); }}
                className={`flex items-center gap-1.5 p-1.5 rounded border transition-all cursor-pointer font-mono font-bold ${
                  activeTab === 'users'
                    ? 'border-[#3E4254] bg-[#15171F] text-white font-bold shadow-sm'
                    : 'border-[#23252C] bg-[#050506] text-gray-400 hover:text-white'
                }`}
              >
                <Users className="h-3 w-3 shrink-0 text-indigo-400" />
                <span className="truncate">Roles</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Workspace Display Grid */}
        <main className="flex-1 flex flex-col h-full bg-[#050506] overflow-hidden">
          
          {/* Notifications */}
          {error && (
            <div className="m-3 m-b-0 rounded-lg border border-red-900/50 bg-red-950/20 px-3.5 py-2.5 text-xs text-red-500 flex items-center justify-between shrink-0 font-mono">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span>[DUNEON_EXCEPTION]: {error}</span>
              </span>
              <button onClick={() => setError(null)} className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer px-1 py-0.5 rounded">
                CLOSE
              </button>
            </div>
          )}

          {successMsg && (
            <div className="m-3 m-b-0 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3.5 py-2.5 text-xs text-emerald-400 flex items-center justify-between shrink-0 font-mono">
              <span className="flex items-center gap-2 font-mono">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>[SUCCESS]: {successMsg}</span>
              </span>
              <button onClick={() => setSuccessMsg(null)} className="text-gray-400 hover:text-white font-mono text-xs cursor-pointer px-1">
                OK
              </button>
            </div>
          )}

          {/* Subheader and workspace tabs selection */}
          <div className="px-5 py-3 border-b border-[#131418] bg-[#0A0B0D]/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-mono">
              <div className="text-xs text-gray-600">public.</div>
              <h2 className="text-xs font-bold text-white tracking-widest uppercase font-mono">
                {activeTab === 'er' ? 'DB_SCHEMA_GRAPH' : 
                 activeTab === 'query' ? 'SQL_QUERY_CONSOLE' :
                 activeTab === 'users' ? 'ROLES_MANAGER' :
                 activeTab === 'monitoring' ? 'STATUS_MONITORING' :
                 activeTab === 'structure' ? 'DB_OBJECTS_STRUCTURE' :
                 activeTab === 'backup' ? 'BACKUPS_AND_RECOVERY' :
                 activeTab === 'security' ? 'SECURITY_AUDITING' :
                 activeTab === 'analytics' ? 'METRICS_AND_ANALYTICS' :
                 currentTable ? currentTable : 'UNSPECIFIED_STAGE'}
              </h2>
            </div>

            {currentTable && (
              <div className="flex items-center gap-1 bg-[#0A0B0D] rounded-full p-0.5 border border-[#23252C] text-xs shrink-0 select-none">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] transition-all font-semibold font-sans cursor-pointer ${
                    activeTab === 'data' ? 'bg-[#15171F] border border-[#3E4254]/50 text-white shadow-sm' : 'border border-transparent text-gray-500 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  {t.tabData}
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] transition-all font-semibold font-sans cursor-pointer ${
                    activeTab === 'schema' ? 'bg-[#15171F] border border-[#3E4254]/50 text-white shadow-sm' : 'border border-transparent text-gray-500 hover:text-white'
                  }`}
                >
                  <Settings className="h-3 w-3" />
                  {t.tabSchema}
                </button>
              </div>
            )}
          </div>

          {/* Tab Views */}
          <div className="flex-1 overflow-auto p-5 min-h-0">
            
            {activeTab === 'data' && currentTable && (
              <div className="flex flex-col h-full space-y-4">
                {/* Search & Actions Bar */}
                <div className="flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full border border-[#23252C] bg-[#0A0B0D] py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-600 outline-none focus:border-neutral-500 font-sans"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-500 hover:text-white font-mono bg-[#16181C] px-1.5 py-0.5 rounded"
                      >
                        RESET
                      </button>
                    )}
                  </div>

                   <div className="flex items-center gap-2 shrink-0">
                     <button
                       onClick={() => fetchTableContent(currentTable, currentDb)}
                       className="flex items-center justify-center border border-[#23252C] bg-[#0A0B0D] hover:bg-[#15171F] rounded-full p-1.5 text-gray-400 hover:text-white transition-all cursor-pointer h-8 w-8"
                       title={t.refreshBtn}
                     >
                       <RefreshCw className="h-4 w-4" />
                     </button>

                     {/* Export Dropdown */}
                     <div className="relative">
                       <button
                         onClick={() => setShowExportDropdown(!showExportDropdown)}
                         disabled={filteredRows.length === 0}
                         className="flex items-center gap-1.5 border border-[#23252C] bg-[#0A0B0D] hover:bg-[#15171F] disabled:opacity-40 disabled:cursor-not-allowed rounded-full px-3.5 py-1.5 text-gray-400 hover:text-white transition-all cursor-pointer h-8 text-[11px] font-bold"
                         title="Export displayed records"
                       >
                         <Download className="h-3.5 w-3.5" />
                         <span>EXPORT</span>
                         <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
                       </button>

                       {showExportDropdown && (
                         <>
                           {/* Invisible backdrop to close dropdown */}
                           <div 
                             className="fixed inset-0 z-40 cursor-default" 
                             onClick={() => setShowExportDropdown(false)} 
                           />
                           <div className="absolute right-0 mt-1 w-36 rounded-md border border-[#23252C] bg-[#0A0B0D] shadow-xl z-50 overflow-hidden py-1">
                             <button
                               onClick={handleExportCSV}
                               className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-gray-350 hover:text-white hover:bg-[#15171F] transition-colors cursor-pointer"
                             >
                               <FileSpreadsheet className="h-3.5 w-3.5 text-[#107C41]" />
                               <span>{t.exportCsv}</span>
                             </button>
                             <button
                               onClick={handleExportExcel}
                                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-gray-350 hover:text-white hover:bg-[#15171F] transition-colors cursor-pointer"
                              >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Excel Workbook</span>
                              </button>
                              <button
                                onClick={handleExportJSON}
                                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-gray-350 hover:text-white hover:bg-[#15171F] transition-colors cursor-pointer"
                              >
                                <span className="text-[10px] text-amber-500 font-mono font-bold w-3.5 text-center">{'{ }'}</span>
                                <span>{t.exportJson}</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Import CSV/Excel button trigger */}
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-1.5 border border-[#23252C] bg-[#0A0B0D] hover:bg-[#15171F] rounded-full px-3.5 py-1.5 text-gray-400 hover:text-white transition-all cursor-pointer h-8 text-[11px] font-bold"
                        title="Import CSV/Excel data into this table"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                        <span>IMPORT</span>
                      </button>

                      {selectedRows.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedRows}
                          className="flex items-center gap-1.5 border border-red-950/60 bg-red-950/20 hover:bg-red-950/40 rounded-full px-3.5 py-1.5 text-red-400 hover:text-red-300 transition-all cursor-pointer h-8 text-[11px] font-bold animate-fade-in"
                          title="Delete selected rows"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          <span>{t.bulkDeleteSelected} ({selectedRows.length})</span>
                        </button>
                      )}



                     <button
                       onClick={() => {
                         setEditingRow(null);
                         setShowAddRow(true);
                       }}
                       className="flex items-center gap-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-[11px] font-bold px-3.5 py-1.5 cursor-pointer h-8 shadow-md"
                     >
                       <Plus className="h-3.5 w-3.5 text-black" />
                       {t.addRowBtn}
                     </button>
                   </div>
                </div>

                {/* Data Grid Table representation */}
                <div className="flex-1 border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col min-h-0 relative">
                  
                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#060708]/85 backdrop-blur-[1px]"
                      >
                        {/* Scanning Laser Animation */}
                        <motion.div
                          initial={{ left: '-100%' }}
                          animate={{ left: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                          className="absolute top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/80 to-transparent w-full"
                        />
                        
                        <div className="flex flex-col items-center">
                          {/* Beautiful spinning database loader */}
                          <div className="relative flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                              className="h-11 w-11 rounded-full border-2 border-dashed border-amber-500/20 border-t-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                            />
                            <Database className="h-4.5 w-4.5 text-amber-500 absolute" />
                          </div>

                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="mt-4 text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase"
                          >
                            {lang === 'ru' ? 'ЗАГРУЗКА ДАННЫХ...' : lang === 'am' ? 'ԲԵՌՆՎՈՒՄ Է...' : 'LOADING DATA CONTENT...'}
                          </motion.div>
                          
                          <p className="text-[10px] text-gray-500 mt-1.5 font-mono">
                            {lang === 'ru' ? 'Синхронизация через SSH туннель...' : lang === 'am' ? 'Սինխրոնացում SSH թունելով...' : 'Syncing over secure SSH tunnel...'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="overflow-auto flex-1 h-full">
                    {filteredRows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-500">
                        <Hash className="h-8 w-8 text-[#2D2F34] mb-2" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">NO_DATA_FOUND</div>
                        <p className="text-[11px] text-gray-600 mt-1 max-w-xs">{t.emptyResults}</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#050506] border-b border-[#23252C] text-gray-400 uppercase tracking-wider text-[10px] font-semibold sticky top-0 z-15">
                            {primaryKeys.length > 0 && (
                              <th className="px-3 py-2.5 text-center w-10 border-r border-[#23252C]/40">
                                <input
                                  type="checkbox"
                                  checked={filteredRows.length > 0 && selectedRows.length === filteredRows.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRows([...filteredRows]);
                                    } else {
                                      setSelectedRows([]);
                                    }
                                  }}
                                  className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-purple-500 cursor-pointer h-3.5 w-3.5"
                                />
                              </th>
                            )}
                            {columns.map((col) => (
                              <th key={col.column_name} className="px-3.5 py-2.5 font-semibold whitespace-nowrap border-r border-[#23252C]/40">
                                <span className="flex items-center gap-1 font-mono font-bold">
                                  {col.column_name}
                                  {primaryKeys.includes(col.column_name) && (
                                    <span className="text-[8px] bg-[#1C1713] text-amber-500 border border-amber-900/40 px-1 py-0.5 rounded font-mono font-bold">PK</span>
                                  )}
                                </span>
                              </th>
                            ))}
                            <th className="px-3.5 py-2.5 text-right font-bold w-14 sticky right-0 bg-[#050506]">{t.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#23252C] bg-[#0A0B0D]">
                          {filteredRows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-[#15171F]/40 group transition-all">
                              {primaryKeys.length > 0 && (
                                <td className="px-3 py-2 text-center w-10 border-r border-[#23252C]/30">
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.some(sr => sr[primaryKeys[0]] === row[primaryKeys[0]])}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRows(prev => [...prev, row]);
                                      } else {
                                        setSelectedRows(prev => prev.filter(sr => sr[primaryKeys[0]] !== row[primaryKeys[0]]));
                                      }
                                    }}
                                    className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-purple-500 cursor-pointer h-3.5 w-3.5"
                                  />
                                </td>
                              )}
                              {columns.map((col) => {
                                const val = row[col.column_name];
                                return (
                                  <td key={col.column_name} className="px-3.5 py-2 font-mono text-gray-300 max-w-xs truncate border-r border-[#23252C]/30 text-[11px]" title={String(val)}>
                                    {val === null ? (
                                      <span className="text-gray-600 italic font-medium">null</span>
                                    ) : typeof val === 'object' ? (
                                      JSON.stringify(val)
                                    ) : typeof val === 'boolean' ? (
                                      val ? (
                                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5 text-[10px]"><Check className="h-3 w-3" />True</span>
                                      ) : (
                                        <span className="text-zinc-500 font-semibold text-[10px]">False</span>
                                      )
                                    ) : (
                                      String(val)
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3.5 py-2 text-right sticky right-0 bg-[#0A0B0D] group-hover:bg-[#15171F] transition-all flex justify-end gap-1.5 w-14 border-l border-[#23252C]/40 pb-2">
                                <button
                                  onClick={() => {
                                    setEditingRow(row);
                                    setShowAddRow(true);
                                  }}
                                  className="p-1 rounded text-[#E2E8F0] hover:text-white hover:bg-zinc-800 cursor-pointer"
                                  title="Edit Cell"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRow(row)}
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/20 cursor-pointer"
                                  title="Drop Record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="px-4 py-2 bg-[#050506]/80 border-t border-[#23252C] flex items-center justify-between text-[10px] text-gray-500 font-medium font-mono shrink-0">
                    <div>{t.rowsCount}: {filteredRows.length} OF {rows.length}</div>
                    <div>PG_STREAM_ALL</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schema' && currentTable && (
              <div className="space-y-4 font-sans animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-widest font-mono">STRUCTURE DEFINITIONS</h3>
                    <p className="text-[10.5px] text-gray-500 mt-1 font-mono">Data attributes, types, rules and structures</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditTable(true)}
                      className="flex items-center gap-1.5 text-[11px] text-white hover:bg-neutral-200 hover:text-black border border-[#23252C] bg-[#0A0B0D] px-3.5 py-1.8 rounded-full cursor-pointer transition-all font-semibold shadow-sm"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {t.editSchemaBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(currentTable)}
                      className="flex items-center gap-1.5 text-[11px] text-red-450 hover:bg-red-950/20 border border-red-950/50 bg-[#1A0C0E]/30 px-3.5 py-1.8 rounded-full cursor-pointer transition-all font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.deleteTableBtn}
                    </button>
                  </div>
                </div>

                <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#050506] border-b border-[#23252C] text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3 font-mono">COLUMN_NAME</th>
                        <th className="px-4 py-3 font-mono">DATA_TYPE</th>
                        <th className="px-4 py-3 font-mono font-bold">NOT_NULL</th>
                        <th className="px-4 py-3 font-mono">DEFAULT_VAL</th>
                        <th className="px-4 py-3 text-right pr-5 font-mono">KEY_CONSTRAINT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23252C] font-mono text-gray-300 text-[11px]">
                      {columns.map((col) => {
                        const isPk = primaryKeys.includes(col.column_name);
                        return (
                          <tr key={col.column_name} className="hover:bg-[#15171F]/30 transition-colors">
                            <td className="px-4 py-2.5 font-bold text-white font-mono">{col.column_name}</td>
                            <td className="px-4 py-2.5 text-sky-450 font-mono">{col.data_type}</td>
                            <td className="px-4 py-2.5">
                              {col.is_nullable === 'NO' ? (
                                <span className="text-amber-500 font-bold bg-[#1C1713] px-1.5 py-0.5 rounded border border-amber-950/30 text-[9.5px]">YES</span>
                              ) : (
                                <span className="text-gray-500">NO</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">{col.column_default || <span className="text-zinc-700 italic">-</span>}</td>
                            <td className="px-4 py-2.5 text-right pr-5">
                              {isPk ? (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                  PRIMARY_KEY
                                </span>
                              ) : (
                                <span className="text-zinc-700">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'query' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full animate-fade-in font-sans">
                {/* Left/Main Column: query input and execution outputs */}
                <div className="lg:col-span-3 flex flex-col space-y-4 h-full">
                  <div>
                    <h3 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-widest font-mono">{t.sqlConsoleTitle}</h3>
                    <p className="text-[10.5px] text-gray-500 mt-1 font-mono">{t.sqlConsoleSub}</p>
                  </div>

                  <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col shrink-0 shadow-lg">
                    <textarea
                      value={runningQuery}
                      onChange={(e) => setRunningQuery(e.target.value)}
                      rows={5}
                      className="w-full bg-[#050506]/40 border-none p-3.5 font-mono text-xs text-slate-205 placeholder-gray-650 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                      placeholder="SELECT * FROM users LIMIT 10;"
                    />
                    <div className="px-4 py-2.5 bg-[#050506] border-t border-[#23252C] flex items-center justify-between">
                      <div className="text-[10.5px] text-gray-500 font-mono">
                        CONNECTED_CLUSTER: <span className="text-white font-bold">{currentDb}</span>
                      </div>
                      <button
                        onClick={handleExecuteCustomQuery}
                        className="rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[11px] py-1.5 px-4 flex items-center gap-1.5 transition-all cursor-pointer shadow"
                      >
                        <Play className="h-3.5 w-3.5 fill-black text-black" />
                        <span>{t.btnRunQuery}</span>
                      </button>
                    </div>
                  </div>

                  {/* Print terminal results block */}
                  <div className="flex-1 border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] max-h-[350px] overflow-auto flex flex-col">
                    <div className="px-4 py-2 bg-[#050506] text-[9.5px] font-bold tracking-widest text-gray-500 border-b border-[#23252C] uppercase flex items-center justify-between font-mono">
                      <span>{t.queryResults}</span>
                      {customQueryResult && (
                        <span className="text-emerald-400 font-bold bg-[#14231E]/30 px-2 py-0.5 rounded">
                          ROWCOUNT_AFFECTED: {customQueryResult.rowCount ?? customQueryResult.rows?.length ?? 0}
                        </span>
                      )}
                    </div>

                    <div className="p-4 overflow-auto font-mono text-xs leading-5 flex-1 select-text">
                      {customQueryResult ? (
                        customQueryResult.rows && customQueryResult.rows.length > 0 ? (
                          <table className="w-full text-left text-[11px] border-collapse animate-fade-in">
                            <thead>
                              <tr className="border-b border-[#23252C] text-gray-400 font-semibold font-sans">
                                {Object.keys(customQueryResult.rows[0]).map((key) => (
                                  <th key={key} className="pb-2 px-2 font-semibold uppercase tracking-wider text-[10px] text-gray-500">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#23252C]/50 font-mono">
                              {customQueryResult.rows.map((r: any, idx: number) => (
                                <tr key={idx} className="hover:bg-[#15171F]/30 border-b border-[#23252C]/30">
                                  {Object.values(r).map((v: any, vidx) => (
                                    <td key={vidx} className="py-1.5 px-2 text-zinc-300 font-mono">
                                      {v === null ? <span className="text-gray-600 italic">null</span> : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-emerald-400 py-1 font-mono text-[11px] flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{t.emptyResults}</span>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-10 text-gray-600 font-mono text-[10.5px]">
                          // ENTER SQL COMMAND ABOVE AND CLICK EXECUTE TO PROPAGATE BYTES_STREAM
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Query History Sidebar */}
                <div className="lg:col-span-1 border border-[#23252C] rounded-xl bg-[#0A0B0D] flex flex-col overflow-hidden max-h-[500px] lg:max-h-full h-full shadow-lg">
                  <div className="px-4 py-3 bg-[#050506] border-b border-[#23252C] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-zinc-400" />
                      <span className="text-xs font-bold text-[#E2E8F0] tracking-wide uppercase font-mono">{t.queryHistory}</span>
                    </div>
                    {queryHistoryList.length > 0 && (
                      <button
                        onClick={clearHistory}
                        className="text-[9.5px] font-bold text-rose-500 hover:text-rose-450 transition-colors uppercase cursor-pointer"
                      >
                        {t.clearHistory}
                      </button>
                    )}
                  </div>

                  {/* Filters Toolbar */}
                  <div className="p-3 bg-[#07080A] border-b border-[#1b1c22]/80 space-y-2.5 shrink-0 select-none">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-500" />
                      <input
                        type="text"
                        placeholder={lang === 'ru' ? 'Поиск в истории...' : lang === 'am' ? 'Որոնել պատմության մեջ...' : 'Search query history...'}
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="w-full bg-[#050506] border border-[#23252C] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition-all"
                      />
                      {historySearch && (
                        <button 
                          onClick={() => setHistorySearch('')}
                          className="absolute right-2 top-2 text-zinc-500 hover:text-white font-bold text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter Buttons & Star Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                      {/* Database Scope */}
                      <button
                        onClick={() => setHistoryDbFilter(prev => prev === 'all' ? 'current' : 'all')}
                        className={`px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                          historyDbFilter === 'current' 
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold' 
                            : 'bg-[#15171F]/45 border border-[#1b1c22] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span>{lang === 'ru' ? 'Текущая БД' : lang === 'am' ? 'Ընթացիկ ՏԲ' : 'Current DB'}</span>
                      </button>

                      {/* Success / Error filter toggler */}
                      <div className="flex items-center gap-1 border border-[#1b1c22] bg-[#050506] rounded p-0.5">
                        <button
                          onClick={() => setHistoryStatusFilter('all')}
                          className={`px-1.5 py-0.5 rounded text-[9px] transition-all cursor-pointer ${
                            historyStatusFilter === 'all' ? 'bg-[#23252C] text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          ALL
                        </button>
                        <button
                          onClick={() => setHistoryStatusFilter('success')}
                          className={`px-1.5 py-0.5 rounded text-[9px] transition-all cursor-pointer ${
                            historyStatusFilter === 'success' ? 'bg-[#23252C] text-emerald-400 font-bold' : 'text-zinc-500 hover:text-emerald-500'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setHistoryStatusFilter('error')}
                          className={`px-1.5 py-0.5 rounded text-[9px] transition-all cursor-pointer ${
                            historyStatusFilter === 'error' ? 'bg-[#23252C] text-rose-500 font-bold' : 'text-zinc-500 hover:text-rose-500'
                          }`}
                        >
                          ERR
                        </button>
                      </div>

                      {/* Star Button */}
                      <button
                        onClick={() => setHistoryStarredOnly(prev => !prev)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          historyStarredOnly 
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
                            : 'bg-[#15171F]/45 border-[#1b1c22] text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={lang === 'ru' ? 'Показать избранные' : 'Show starred queries'}
                      >
                        <Star className={`h-3 w-3 ${historyStarredOnly ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 overflow-y-auto flex-1 space-y-2.5 scrollbar-thin">
                    {(() => {
                      const filteredHistory = queryHistoryList.filter(item => {
                        const matchesSearch = !historySearch || item.sql.toLowerCase().includes(historySearch.toLowerCase());
                        const matchesDb = historyDbFilter === 'all' || item.db === currentDb;
                        const matchesStatus = historyStatusFilter === 'all' || 
                          (historyStatusFilter === 'success' && item.success) || 
                          (historyStatusFilter === 'error' && !item.success);
                        const matchesStar = !historyStarredOnly || !!item.pinned;
                        return matchesSearch && matchesDb && matchesStatus && matchesStar;
                      });

                      if (filteredHistory.length === 0) {
                        return (
                          <div className="text-center py-12 text-zinc-650 text-xs font-mono">
                            {historySearch || historyDbFilter === 'current' || historyStatusFilter !== 'all' || historyStarredOnly
                              ? (lang === 'ru' ? '// ЗАПРОСЫ НЕ НАЙДЕНЫ' : lang === 'am' ? '// ՉԳՏՆՎԵՑԻՆ' : '// NO QUERIES MATCH FILTERS')
                              : t.emptyHistory}
                          </div>
                        );
                      }

                      return filteredHistory.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setRunningQuery(item.sql)}
                          className="group border border-[#1b1c22] hover:border-[#3E4254] bg-[#050506]/35 hover:bg-[#15171F]/40 p-2.5 rounded-lg cursor-pointer transition-all duration-200 flex flex-col space-y-2 overflow-hidden relative text-left"
                          title={lang === 'ru' ? 'Кликните, чтобы вставить запрос в консоль' : 'Click to load query into console'}
                        >
                          {/* Top row status and operations */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${item.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className={item.success ? "text-emerald-400 font-bold" : "text-rose-500 font-bold"}>
                                {item.success ? "SUCCESS" : "ERROR"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {/* Star button */}
                              <button
                                onClick={(e) => toggleStarQuery(item.id, e)}
                                className={`p-0.5 rounded text-gray-500 hover:text-amber-400 transition-colors ${item.pinned ? 'text-amber-400' : ''}`}
                                title={lang === 'ru' ? 'Добавить в избранное' : 'Add to favorites'}
                              >
                                <Star className={`h-3 w-3 ${item.pinned ? 'fill-current text-amber-400' : ''}`} />
                              </button>

                              {/* Copy button */}
                              <button
                                onClick={(e) => copyQueryText(item.sql, item.id, e)}
                                className={`p-0.5 rounded transition-all ${copiedId === item.id ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}
                                title={lang === 'ru' ? 'Скопировать SQL' : 'Copy SQL code'}
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>

                              {/* Individual Delete Item button */}
                              <button
                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                className="p-0.5 rounded text-gray-500 hover:text-rose-500 transition-colors"
                                title={lang === 'ru' ? 'Удалить из истории' : 'Delete from history'}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Code content block */}
                          <div className="text-[11px] font-mono whitespace-pre-wrap break-all line-clamp-3 text-slate-300 group-hover:text-white transition-colors antialiased bg-[#050506]/60 p-1.5 rounded max-h-24 overflow-y-auto scrollbar-none border border-[#15171F]">
                            {item.sql}
                          </div>

                          {/* Error block (if present) */}
                          {item.error && (
                            <div className="text-[9.5px] font-mono text-rose-400 bg-rose-950/20 px-1.5 py-1 rounded border border-rose-950/30 line-clamp-2" title={item.error}>
                              ⚠️ {item.error}
                            </div>
                          )}

                          {/* Footer with database & statistics */}
                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 border-t border-[#1b1c22]/50 pt-1.5">
                            <span className="bg-[#121318] px-1 py-0.5 rounded text-zinc-400 text-[8.5px]">DB: {item.db}</span>
                            <div className="flex items-center gap-2">
                              <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                              {item.success && item.rowCount !== undefined && (
                                <span className="bg-emerald-950/20 text-emerald-500 px-1 py-0.5 rounded text-[8.5px]">rows: {item.rowCount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-4 font-sans animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#E2E8F0] uppercase tracking-widest font-mono">POSTGRES SYSTEM ROLES</h3>
                    <p className="text-[10.5px] text-gray-500 mt-1 font-mono">Cluster access roles and authorization configurations</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(true)}
                    className="rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-[11px] py-1.5 px-4 flex items-center gap-1.5 transition-all cursor-pointer font-sans"
                  >
                    <Plus className="h-3.5 w-3.5 text-black" />
                    <span>CREATE_ROLE</span>
                  </button>
                </div>

                <div className="border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] divide-y divide-[#23252C]/70">
                  {postgresUsersList.map((user) => (
                    <div key={user} className="flex items-center justify-between p-4 hover:bg-[#15171F]/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-[#050506] rounded-full border border-[#23252C] flex items-center justify-center text-gray-400">
                          <Users className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">{user}</div>
                          <div className="text-[10px] text-gray-500 font-sans mt-0.5">PostgreSQL System Config Cluster User</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={user === pgConfig.user || user === 'postgres'}
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 rounded text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-20 cursor-pointer"
                        title={user === pgConfig.user ? 'Active Login Session' : 'Drop PostgreSQL Role'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'monitoring' && (
              <MonitoringSection 
                sshConfig={sshConfig}
                pgConfig={pgConfig}
                currentDb={currentDb}
                lang={lang}
              />
            )}

            {activeTab === 'structure' && (
              <StructureSection 
                sshConfig={sshConfig}
                pgConfig={pgConfig}
                currentDb={currentDb}
                lang={lang}
              />
            )}

            {activeTab === 'backup' && (
              <BackupSection 
                currentDb={currentDb}
                lang={lang}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySection 
                pgConfig={pgConfig}
                lang={lang}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsSection 
                sshConfig={sshConfig}
                pgConfig={pgConfig}
                currentDb={currentDb}
                tables={tables}
                lang={lang}
              />
            )}

            {activeTab === 'er' && (
              <SchemaExplorer 
                sshConfig={sshConfig}
                pgConfig={pgConfig}
                currentDb={currentDb}
                lang={lang}
              />
            )}

            {!currentTable && activeTab === 'data' && (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <TableIcon className="h-10 w-10 text-zinc-600 mb-3" />
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">NO RELATION SELECTION</h2>
                <p className="text-[11px] text-gray-500 max-w-xs mt-1.5 leading-normal">
                  Please select an active table from the left directory tree, or launch queries in the terminal to create structures.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showCreateTable && (
        <CreateTableModal
          onClose={() => setShowCreateTable(false)}
          onCreate={handleCreateTable}
          lang={lang}
          tables={tables}
        />
      )}

      {showAddRow && (
        <AddRowModal
          onClose={() => {
            setShowAddRow(false);
            setEditingRow(null);
          }}
          columns={columns}
          primaryKeys={primaryKeys}
          editingRow={editingRow}
          onSave={handleSaveRow}
          lang={lang}
        />
      )}

      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onCreate={handleCreateUser}
          lang={lang}
        />
      )}

      {showEditTable && currentTable && (
        <EditTableModal
          tableName={currentTable}
          columnsList={columns}
          onClose={() => setShowEditTable(false)}
          onAlter={handleAlterTable}
          lang={lang}
          tables={tables}
        />
      )}

      {showImportModal && currentTable && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          tableName={currentTable}
          columns={columns}
          sshConfig={sshConfig}
          pgConfig={pgConfig}
          currentDb={currentDb}
          onImportSuccess={() => {
            fetchTableContent(currentTable, currentDb);
          }}
          lang={lang}
        />
      )}

      {/* Custom Non-blocking Confirm Modal Overlay */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0A0B0D] border border-[#23252C] w-full max-w-sm rounded-xl shadow-2xl p-5 select-none font-sans">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-950/40 text-red-400 rounded-full shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-sans">{confirmConfig.title}</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans">{confirmConfig.message}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmConfig(null)}
                className="px-4 py-1.8 bg-[#050506] hover:bg-[#15171F] text-gray-400 hover:text-white rounded-full border border-[#23252C] text-xs transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmConfig.onConfirm}
                className="px-5 py-1.8 bg-red-650 hover:bg-red-500 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
        />
      )}
    </div>
  );
}
