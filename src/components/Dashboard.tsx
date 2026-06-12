import React, { useState, useEffect, useCallback } from 'react';
import { SSHConfig, PgConfig, ColumnInfo } from '../types.js';
import CreateTableModal from './CreateTableModal.js';
import AddRowModal from './AddRowModal.js';
import CreateUserModal from './CreateUserModal.js';
import EditTableModal from './EditTableModal.js';
import { LangType, translations } from '../translations.js';
import DuneonLogo from './DuneonLogo.js';
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
  Globe
} from 'lucide-react';

interface DashboardProps {
  sshConfig: SSHConfig;
  initialPgConfig: PgConfig;
  initialDatabases: string[];
  onLogout: () => void;
  lang: LangType;
  setLang: (l: LangType) => void;
  logoType: 'default' | 'no_d' | 'no_logo' | 'no_text';
  setLogoType: (logo: 'default' | 'no_d' | 'no_logo' | 'no_text') => void;
}

export default function Dashboard({ sshConfig, initialPgConfig, initialDatabases, onLogout, lang, setLang, logoType, setLogoType }: DashboardProps) {
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
  const [activeTab, setActiveTab ] = useState<'data' | 'schema' | 'query' | 'users'>('data');
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
  const [editingRow, setEditingRow] = useState<any | null>(null);

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
  const fetchTables = useCallback(async (db: string, overridePgConfig?: PgConfig) => {
    setLoading(true);
    setError(null);
    setCurrentTable(null);
    setColumns([]);
    setRows([]);

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
      setTables(data.tables || []);
      if (data.tables && data.tables.length > 0) {
        setCurrentTable(data.tables[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while loading tables list');
    } finally {
      setLoading(false);
    }
  }, [sshConfig, pgConfig]);

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
    await fetchTables(db, updatedPgConfig);
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

    setSuccessMsg((lang === 'ru' ? 'Схема таблицы ' : lang === 'am' ? 'Աղյուսակի սխեման ' : 'Table schema for ') + `"${currentTable}"` + (lang === 'ru' ? ' успешно изменена!' : lang === 'am' ? ' հաջողությամբ փոփոխվեց:' : ' successfully updated!'));
    
    // Update tables list and selection
    const index = tables.indexOf(currentTable);
    const updatedTables = [...tables];
    if (newTableNameStr !== currentTable) {
      if (index !== -1) {
        updatedTables[index] = newTableNameStr;
      }
      updatedTables.sort();
      setTables(updatedTables);
      setCurrentTable(newTableNameStr);
    } else {
      // Just refetch same table definition and content
      await fetchTables(currentDb);
      await fetchTableContent(currentTable, currentDb);
    }

    setShowEditTable(false);
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
      if (runningQuery.toLowerCase().includes('create') || runningQuery.toLowerCase().includes('drop') || runningQuery.toLowerCase().includes('alter')) {
        await fetchTables(currentDb);
      }
    } catch (err: any) {
      setError(err.message || 'SQL Parser Syntactical Error');
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
            <DuneonLogo className="h-6 md:h-7" logoType={logoType} />
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
          <div className="p-3 border-t border-[#131418] bg-[#0A0B0D]/50 grid grid-cols-2 gap-2 text-xs shrink-0 font-sans font-semibold">
            <button
              onClick={() => setActiveTab('query')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1.2 cursor-pointer ${
                activeTab === 'query'
                  ? 'border-[#3E4254] bg-[#15171F] text-white font-bold'
                  : 'border-[#23252C] bg-[#050506] text-gray-500 hover:text-white'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span className="text-[10px] tracking-wide">SQL_TERMINAL</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1.2 cursor-pointer ${
                activeTab === 'users'
                  ? 'border-[#3E4254] bg-[#15171F] text-white font-bold'
                  : 'border-[#23252C] bg-[#050506] text-gray-500 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[10px] tracking-wide">ROLES_MGR</span>
            </button>
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
                {currentTable ? currentTable : 'UNSPECIFIED_STAGE'}
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
                <div className="flex-1 border border-[#23252C] rounded-xl overflow-hidden bg-[#0A0B0D] flex flex-col min-h-0">
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
                    <div>PG_STREAM_LIMIT_150</div>
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
              <div className="flex flex-col h-full space-y-4 font-sans animate-fade-in">
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
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-[#23252C] text-gray-400 font-semibold font-sans">
                              {Object.keys(customQueryResult.rows[0]).map((key) => (
                                <th key={key} className="pb-2 px-2 font-semibold uppercase tracking-wider text-[10px] text-gray-500">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#23252C]/50 font-mono">
                            {customQueryResult.rows.map((r: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[#15171F]/30">
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
    </div>
  );
}
