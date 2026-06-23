export type LangType = 'ru' | 'en' | 'am';

export interface TranslationDictionary {
  brandTitle: string;
  brandSubtitle: string;
  protectedChannel: string;
  sshTitle: string;
  sshSub: string;
  ipHost: string;
  port: string;
  sshUser: string;
  authMethod: string;
  password: string;
  sshKey: string;
  pwdPlaceholder: string;
  keyPlaceholder: string;
  btnConnect: string;
  btnConnecting: string;
  contactBtn: string;
  backToSsh: string;
  pgTitle: string;
  pgSub: string;
  systemDbRoles: string;
  pgPwdForRole: string;
  pgPwdPlaceholder: string;
  btnPgConnect: string;
  btnPgConnecting: string;

  // Dashboard
  activeDb: string;
  userRole: string;
  logoutBtn: string;
  tablesList: string;
  createTableBtn: string;
  noTables: string;
  refreshBtn: string;
  searchPlaceholder: string;
  addRowBtn: string;
  editSchemaBtn: string;
  deleteTableBtn: string;
  createDbBtn: string;
  createDbPlaceholder: string;

  // Tabs
  tabData: string;
  tabSchema: string;
  tabTerminal: string;
  tabUsers: string;
  tabEr: string;

  // Modal Common
  cancel: string;
  save: string;
  confirm: string;
  delete: string;
  actions: string;

  // Confirm Modal
  confirmTitle: string;
  confirmMsgDeleteTable: string;
  confirmMsgDeleteRow: string;

  // SQL Console
  sqlConsoleTitle: string;
  sqlConsoleSub: string;
  btnRunQuery: string;
  queryExecuting: string;
  queryResults: string;
  rowsCount: string;
  emptyResults: string;

  // Schema Editor / Edit Table
  editTableTitle: string;
  tableName: string;
  addColumnBtn: string;
  columnsConfig: string;
  columnNameHeader: string;
  columnTypeHeader: string;
  nullableHeader: string;
  defaultHeader: string;
  deleteColHeader: string;
  noteAlterWarning: string;
  btnApplyChanges: string;
  saving: string;

  // Create Table Modal
  createTableTitle: string;
  createTableBtnSubmit: string;

  // Extra Notifications & Messages / Header Metadata
  msgRowUpdatedSuccess: string;
  msgRowCreatedSuccess: string;
  msgConfirmDeleteRowTitle: string;
  msgConfirmDeleteRowMsg: string;
  msgDeleteUserTitle: string;
  msgDeleteUserMsg: string;
  msgUserCreatedSuccess: string;
  msgUserDeletedSuccess: string;
  cantDeleteRowNoPk: string;
  bulkDeleteSelected: string;
  msgConfirmDeleteMultipleRowsTitle: string;
  msgConfirmDeleteMultipleRowsMsg: string;
  tunnelPortForward: string;
  dbDeletedSuccess: string;
  dbCreatedSuccess: string;
  sqlQuerySuccess: string;
  confirmDeleteTableTitle: string;
  confirmDeleteTableMsg: string;
  exportCsv: string;
  exportJson: string;
  queryHistory: string;
  clearHistory: string;
  emptyHistory: string;
  settingsTitle: string;
  settingsDesc: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  soundLabel: string;
  soundVolume: string;
  soundMuted: string;
  soundEnabled: string;
  langLabel: string;
  saveSettings: string;
}

export const translations: Record<LangType, TranslationDictionary> = {
  ru: {
    brandTitle: "Технологическая экосистема СУБД для максимальной эффективности",
    brandSubtitle: "Duneon создает высокопроизводительные системные решения: от операционных систем до специализированного ПО для администрирования критически важных баз данных. Настройте защищенный SSH-туннель для безопасного администрирования.",
    protectedChannel: "КАНАЛ ЗАЩИЩЕН ШИФРОВАНИЕМ",
    sshTitle: "SSH_TUNNEL_INTERFACE",
    sshSub: "/usr/bin/ssh-ssh-agent -i key -c aes128-gcm",
    ipHost: "IP Хост сервера",
    port: "Порт",
    sshUser: "Имя SSH Пользователя",
    authMethod: "Способ авторизации",
    password: "Пароль",
    sshKey: "SSH-Ключ",
    pwdPlaceholder: "Пароль доступа",
    keyPlaceholder: "-----BEGIN OPENSSH PRIVATE KEY-----",
    btnConnect: "ЗАПУСТИТЬ ТУННЕЛЬ",
    btnConnecting: "УСТАНОВКА_SSH_СОЕДИНЕНИЯ...",
    contactBtn: "Связаться",
    backToSsh: "НАЗАД К SSH",
    pgTitle: "Выберите учетную запись СУБД для управления кластером",
    pgSub: "Авторизованный SSH-туннель успешно запущен. Теперь выберите необходимую роль базы данных и введите пароль для входа в PostgreSQL сессионную среду управления.",
    systemDbRoles: "СИСТЕМНЫЕ РОЛИ БД",
    pgPwdForRole: "Пароль для роли",
    pgPwdPlaceholder: "Пароль БД (или оставьте пустым)",
    btnPgConnect: "ПОДКЛЮЧИТЬСЯ К POSTGRESQL",
    btnPgConnecting: "АВТОРИЗАЦИЯ_СЕССИИ_БД...",

    activeDb: "Активная база данных",
    userRole: "Пользователь",
    logoutBtn: "Выйти из системы",
    tablesList: "Список таблиц",
    createTableBtn: "СОЗДАТЬ ТАБЛИЦУ",
    noTables: "Нет доступных таблиц",
    refreshBtn: "Обновить",
    searchPlaceholder: "Поиск по содержимому...",
    addRowBtn: "ДОБАВИТЬ СТРОКУ",
    editSchemaBtn: "РЕДАКТИРОВАТЬ СХЕМУ",
    deleteTableBtn: "УДАЛИТЬ ТАБЛИЦУ",
    createDbBtn: "Создать БД",
    createDbPlaceholder: "Имя новой БД",

    tabData: "Данные",
    tabSchema: "Схема и связи",
    tabTerminal: "SQL Терминал",
    tabUsers: "Права / Пользователи",
    tabEr: "ER Диаграмма",

    cancel: "ОТМЕНА",
    save: "СОХРАНИТЬ",
    confirm: "ПОДТВЕРДИТЬ",
    delete: "УДАЛИТЬ",
    actions: "Действия",

    confirmTitle: "Вы уверены?",
    confirmMsgDeleteTable: "Это действие необратимо удалит таблицу и все ее данные.",
    confirmMsgDeleteRow: "Удалить выбранную строку из базы данных?",

    sqlConsoleTitle: "SQL-КОНСОЛЬ УПРАВЛЕНИЯ",
    sqlConsoleSub: "Выполнение произвольных SQL-запросов напрямую в СУБД через туннелированную среду",
    btnRunQuery: "ВЫПОЛНИТЬ ЗАПРОС",
    queryExecuting: "Выполнение запроса...",
    queryResults: "Результаты запроса",
    rowsCount: "Затронуто строк",
    emptyResults: "Запрос выполнен успешно, таблица результатов пуста.",

    editTableTitle: "РЕДАКТИРОВАНИЕ СХЕМЫ ТАБЛИЦЫ",
    tableName: "Имя таблицы (Relation)",
    addColumnBtn: "ДОБАВИТЬ СТОЛБЕЦ",
    columnsConfig: "Конструктор столбцов (Columns config)",
    columnNameHeader: "Колонка",
    columnTypeHeader: "Тип данных",
    nullableHeader: "NULLABLE",
    defaultHeader: "DEFAULT",
    deleteColHeader: "Уд.",
    noteAlterWarning: "* Примечание: При изменении типа данных СУБД автоматически попытается преобразовать старые данные с ключевым словом USING. Если данные несовместимы, СУБД вернет ошибку.",
    btnApplyChanges: "ПРИМЕНИТЬ ИЗМЕНЕНИЯ",
    saving: "СОХРАНЕНИЕ...",

    createTableTitle: "СОЗДАТЬ НОВУЮ ТАБЛИЦУ",
    createTableBtnSubmit: "СОЗДАТЬ ТАБЛИЦУ",

    msgRowUpdatedSuccess: "Строка успешно обновлена!",
    msgRowCreatedSuccess: "Строка успешно добавлена!",
    msgConfirmDeleteRowTitle: "Удаление записи",
    msgConfirmDeleteRowMsg: "Вы уверены, что хотите окончательно удалить эту строку из таблицы?",
    msgDeleteUserTitle: "Удаление роли",
    msgDeleteUserMsg: "Вы уверены, что хотите удалить эту учетную запись из СУБД?",
    msgUserCreatedSuccess: "Роль успешно создана!",
    msgUserDeletedSuccess: "Роль успешно удалена.",
    cantDeleteRowNoPk: "Невозможно удалить строку: отсутствует первичный ключ (PRIMARY KEY)",
    bulkDeleteSelected: "Удалить выбранные",
    msgConfirmDeleteMultipleRowsTitle: "Удаление нескольких записей",
    msgConfirmDeleteMultipleRowsMsg: "Вы уверены, что хотите окончательно удалить выбранные строки ({count} шт.)?",
    tunnelPortForward: "ПОРТ_ФОРВАРДИНГ",
    dbDeletedSuccess: "База данных успешно удалена.",
    dbCreatedSuccess: "База данных успешно создана.",
    sqlQuerySuccess: "SQL Запрос выполнен успешно!",
    confirmDeleteTableTitle: "Удаление таблицы",
    confirmDeleteTableMsg: "Вы действительно хотите удалить эту таблицу и все связанные с ней данные без возможности восстановления?",
    exportCsv: "Экспорт в CSV",
    exportJson: "Экспорт в JSON",
    queryHistory: "История запросов",
    clearHistory: "Очистить историю",
    emptyHistory: "История пуста",
    settingsTitle: "Настройки системы",
    settingsDesc: "Управление аудиосимволами, громкостью и визуальной схемой интерфейса.",
    themeLabel: "Цветовая схема",
    themeLight: "Светлая тема",
    themeDark: "Темная тема",
    themeSystem: "Системные настройки",
    soundLabel: "Звуковые эффекты",
    soundVolume: "Громкость звуков",
    soundMuted: "Выключить звук",
    soundEnabled: "Включить звук",
    langLabel: "Язык интерфейса",
    saveSettings: "ПРИМЕНИТЬ НАСТРОЙКИ"
  },
  en: {
    brandTitle: "DBMS Technology Ecosystem for Maximum Efficiency",
    brandSubtitle: "Duneon creates high-performance system solutions: from operating systems to specialized software for administering mission-critical databases. Configure an authorized SSH tunnel for secure administration.",
    protectedChannel: "ENCRYPTED SECURE CHANNEL",
    sshTitle: "SSH_TUNNEL_INTERFACE",
    sshSub: "/usr/bin/ssh-ssh-agent -i key -c aes128-gcm",
    ipHost: "Server Host IP",
    port: "Port",
    sshUser: "SSH Username",
    authMethod: "Auth Method",
    password: "Password",
    sshKey: "SSH Key",
    pwdPlaceholder: "Access Password",
    keyPlaceholder: "-----BEGIN OPENSSH PRIVATE KEY-----",
    btnConnect: "LAUNCH SSH TUNNEL",
    btnConnecting: "ESTABLISHING_SSH_CONNECTION...",
    contactBtn: "Contact Us",
    backToSsh: "BACK TO SSH",
    pgTitle: "Choose DBMS Role to Manage Cluster",
    pgSub: "Authorized SSH tunnel established. Now choose your target database role and enter the password to initialize PostgreSQL cluster session.",
    systemDbRoles: "DATABASE SYSTEM ROLES",
    pgPwdForRole: "Password for Role",
    pgPwdPlaceholder: "Database Password (or leave blank)",
    btnPgConnect: "CONNECT TO POSTGRESQL",
    btnPgConnecting: "AUTHORIZING_DATABASE_SESSION...",

    activeDb: "Active Database",
    userRole: "User Role",
    logoutBtn: "Log Out System",
    tablesList: "Tables Schema",
    createTableBtn: "CREATE TABLE",
    noTables: "No tables available",
    refreshBtn: "Refresh",
    searchPlaceholder: "Search table content...",
    addRowBtn: "ADD ROW",
    editSchemaBtn: "EDIT SCHEMA",
    deleteTableBtn: "DROP TABLE",
    createDbBtn: "Create DB",
    createDbPlaceholder: "New DB Name",

    tabData: "Grid Data",
    tabSchema: "Schema & Constraints",
    tabTerminal: "SQL Terminal",
    tabUsers: "Privileges / Roles",
    tabEr: "ER Diagram",

    cancel: "CANCEL",
    save: "SAVE CHANGES",
    confirm: "CONFIRM ACTION",
    delete: "DELETE",
    actions: "Actions",

    confirmTitle: "Are you sure?",
    confirmMsgDeleteTable: "This action is irreversible and will permanently delete the table and all associated records.",
    confirmMsgDeleteRow: "Do you want to delete this row from the active relation database?",

    sqlConsoleTitle: "SQL CONTROL CONSOLE",
    sqlConsoleSub: "Execute raw transactional SQL operations directly in DBMS through secure tunnel context",
    btnRunQuery: "EXECUTE COMMAND",
    queryExecuting: "Query running...",
    queryResults: "Query Console Output",
    rowsCount: "Rows affected",
    emptyResults: "Query successfully executed, returned empty dataset.",

    editTableTitle: "EDIT TABLE SCHEMATIC",
    tableName: "Relation Table Name",
    addColumnBtn: "ADD COLUMN",
    columnsConfig: "Columns Builder Blueprint",
    columnNameHeader: "Column Identifier",
    columnTypeHeader: "Data Type",
    nullableHeader: "NULLABLE",
    defaultHeader: "DEFAULT",
    deleteColHeader: "Del",
    noteAlterWarning: "* Note: Altering data types automatically triggers database type casting using USING command block. If current row data is incompatible, database will rollback operations.",
    btnApplyChanges: "APPLY SCHEMA CHANGES",
    saving: "SAVING SCHEMA...",

    createTableTitle: "CREATE NEW SQL RELATION",
    createTableBtnSubmit: "CREATE TABLE",

    msgRowUpdatedSuccess: "Row updated successfully!",
    msgRowCreatedSuccess: "Row created successfully!",
    msgConfirmDeleteRowTitle: "Delete Record",
    msgConfirmDeleteRowMsg: "Are you sure you want to permanently delete this row?",
    msgDeleteUserTitle: "Delete Role",
    msgDeleteUserMsg: "Are you sure you want to delete this PostgreSQL role account?",
    msgUserCreatedSuccess: "Role created successfully!",
    msgUserDeletedSuccess: "Role successfully deleted.",
    cantDeleteRowNoPk: "Cannot delete row: no PRIMARY KEY found",
    bulkDeleteSelected: "Delete Selected",
    msgConfirmDeleteMultipleRowsTitle: "Delete Multiple Records",
    msgConfirmDeleteMultipleRowsMsg: "Are you sure you want to permanently delete {count} selected rows?",
    tunnelPortForward: "PORT_FORWARDING",
    dbDeletedSuccess: "Database deleted successfully.",
    dbCreatedSuccess: "Database created successfully.",
    sqlQuerySuccess: "SQL query executed successfully!",
    confirmDeleteTableTitle: "Delete Table",
    confirmDeleteTableMsg: "Are you sure you want to permanently delete this table and all its data? This cannot be undone.",
    exportCsv: "Export to CSV",
    exportJson: "Export to JSON",
    queryHistory: "Query History",
    clearHistory: "Clear History",
    emptyHistory: "No query history",
    settingsTitle: "System Settings",
    settingsDesc: "Configure system audio chimes, volume levels, and visual interface themes.",
    themeLabel: "Color Theme",
    themeLight: "Light Theme",
    themeDark: "Dark Theme",
    themeSystem: "System Preference",
    soundLabel: "Audio Chimes",
    soundVolume: "Sound Volume",
    soundMuted: "Muted",
    soundEnabled: "Enabled",
    langLabel: "Interface Language",
    saveSettings: "APPLY SETTINGS"
  },
  am: {
    brandTitle: "ՏՀԿԷ տեխնոլոգիական էկոհամակարգ առավելագույն արդյունավետության համար",
    brandSubtitle: "Duneon-ը ստեղծում է բարձր արտադրողականությամբ համակարգային լուծումներ. օպերացիոն համակարգերից մինչև հատուկ ծրագրակազմ՝ կարևորագույն տվյալների բազաների կառավարման համար: Կարգավորեք պաշտպանված SSH թունելը անվտանգ ադմինիստրացիայի համար:",
    protectedChannel: "ԱԼԻՔԸ ՊԱՇՏՊԱՆՎԱԾ Է ԿՈԴԱՎՈՐՄԱՄԲ",
    sshTitle: "SSH_TUNNEL_INTERFACE",
    sshSub: "/usr/bin/ssh-ssh-agent -i key -c aes128-gcm",
    ipHost: "Սերվերի IP Հասցե",
    port: "Պորտ",
    sshUser: "SSH Օգտատեր",
    authMethod: "Ավտորիզացիայի եղանակ",
    password: "Գաղտնաբառ",
    sshKey: "SSH Բանալի",
    pwdPlaceholder: "Մուտքի գաղտնաբառ",
    keyPlaceholder: "-----BEGIN OPENSSH PRIVATE KEY-----",
    btnConnect: "ՄԻԱՑՆԵԼ ԹՈՒՆԵԼԸ",
    btnConnecting: "SSH_ՄԻԱՑՄԱՆ_ՀԱՍՏԱՏՈՒՄ...",
    contactBtn: "Կապնվել",
    backToSsh: "ՀԵՏ ԴԵՊԻ SSH",
    pgTitle: "Ընտրեք ՏՀԿԷ հաշիվը կլաստերը կառավարելու համար",
    pgSub: "Լիազորված SSH թունելը հաջողությամբ գործարկվել է: Այժմ ընտրեք տվյալների բազայի ցանկալի դերը և մուտքագրեք գաղտնաբառը՝ PostgreSQL նստաշրջանը սկսելու համար:",
    systemDbRoles: "ՏՎՅԱԼՆԵՐԻ ԲԱԶԱՅԻ ՀԱՄԱԿԱՐԳԱՅԻՆ ԴԵՐԵՐ",
    pgPwdForRole: "Գաղտնաբառը դերի համար",
    pgPwdPlaceholder: "Բազայի Գաղտնաբառ (կամ թողնել դատարկ)",
    btnPgConnect: "ՄԻԱՆԱԼ POSTGRESQL-ԻՆ",
    btnPgConnecting: "ԲԱԶԱՅԻ_ՆՍՏԱՇՐՋԱՆԻ_ԼԻԱԶՈՐՈՒՄ...",

    activeDb: "Ակտիվ Տվյալների Բազա",
    userRole: "Օգտատիրոջ Դեր",
    logoutBtn: "Դուրս գալ համակարգից",
    tablesList: "Աղյուսակների ցանկ",
    createTableBtn: "ՍՏԵՂԾԵԼ ԱՂՅՈՒՍԱԿ",
    noTables: "Հասանելի աղյուսակներ չկան",
    refreshBtn: "Թարմացնել",
    searchPlaceholder: "Որոնել բովանդակությունը...",
    addRowBtn: "ԱՎԵԼԱՑՆԵԼ ՏՈՂ",
    editSchemaBtn: "ԽՄԲԱԳՐԵԼ ՍԽԵՄԱՆ",
    deleteTableBtn: "ՋՆՋԵԼ ԱՂՅՈՒՍԱԿԸ",
    createDbBtn: "Ստեղծել ԲԱԶԱ",
    createDbPlaceholder: "Նոր ԲԱԶԱ-յի անունը",

    tabData: "Տվյալներ",
    tabSchema: "Սխեմա և Կապեր",
    tabTerminal: "SQL Տերմինալ",
    tabUsers: "Արտոնություններ / Օգտատերեր",
    tabEr: "ER Դիագրամ",

    cancel: "ՉԵՂԱՐԿԵԼ",
    save: "ՊԱՀՊԱՆԵԼ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ",
    confirm: "ՀԱՍՏԱՏԵԼ",
    delete: "ՋՆՋԵԼ",
    actions: "Գործողություններ",

    confirmTitle: "Համոզվա՞ծ եք։",
    confirmMsgDeleteTable: "Այս գործողությունը անդառնալի է և ընդմիշտ կջնջի աղյուսակը և դրա ողջ պարունակությունը:",
    confirmMsgDeleteRow: "Ջնջե՞լ ընտրված տողը տվյալների բազայից:",

    sqlConsoleTitle: "SQL ԿԱՌԱՎԱՐՄԱՆ ՎԱՀԱՆԱԿ",
    sqlConsoleSub: "Կատարել կամայական SQL հրամաններ անմիջապես ՏՀԿԷ-ում անվտանգ թունելային միջավայրով",
    btnRunQuery: "ԿԱՏԱՐԵԼ ՀԱՐՑՈՒՄԸ",
    queryExecuting: "Հարցումը կատարվում է...",
    queryResults: "Հարցման արդյունքները",
    rowsCount: "Ազդեցության տակ ընկած տողեր",
    emptyResults: "Հարցումը հաջողությամբ կատարվել է, արդյունքների աղյուսակը դատարկ է:",

    editTableTitle: "ԱՂՅՈՒՍԱԿԻ ՍԽԵՄԱՅԻ ԽՄԲԱԳՐՈՒՄ",
    tableName: "Աղյուսակի անունը (Relation)",
    addColumnBtn: "ԱՎԵԼԱՑՆԵԼ ՍՅՈՒՆ",
    columnsConfig: "Սյուների հատկորոշիչ (Columns config)",
    columnNameHeader: "Սյունակ",
    columnTypeHeader: "Տվյալների տիպ",
    nullableHeader: "NULLABLE",
    defaultHeader: "DEFAULT",
    deleteColHeader: "Ջնջ",
    noteAlterWarning: "* Նշում. Տվյալների տիպը փոխելիս համակարգը ավտոմատ կերպով կփորձի փոխակերպել տվյալները USING հրամանով: Անհամատեղելիության դեպքում համակարգը կվերադարձնի սխալ:",
    btnApplyChanges: "ԿԻՐԱՌԵԼ ՓՈՓՈԽՈՒԹՅՈՒՆՆԵՐԸ",
    saving: "ՊԱՀՊԱՆՎՈՒՄ Է...",

    createTableTitle: "ՍՏԵՂԾԵԼ ՆՈՐ ԱՂՅՈՒՍԱԿ",
    createTableBtnSubmit: "ՍՏԵՂԾԵԼ ԱՂՅՈՒՍԱԿ",

    msgRowUpdatedSuccess: "Տողը հաջողությամբ թարմացվել է:",
    msgRowCreatedSuccess: "Տողը հաջողությամբ ավելացվել է:",
    msgConfirmDeleteRowTitle: "Գրառման ջնջում",
    msgConfirmDeleteRowMsg: "Համոզվա՞ծ եք, որ ցանկանում եք ընդմիշտ ջնջել այս տողը աղյուսակից:",
    msgDeleteUserTitle: "Դերի ջնջում",
    msgDeleteUserMsg: "Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս PostgreSQL դերը համակարգից:",
    msgUserCreatedSuccess: "Դերը հաջողությամբ ստեղծվել է:",
    msgUserDeletedSuccess: "Դերը հաջողությամբ ջնջվել է:",
    cantDeleteRowNoPk: "Հնարավոր չէ ջնջել տողը. առաջնային բանալին (PRIMARY KEY) բացակայում է:",
    bulkDeleteSelected: "Ջնջել ընտրվածները",
    msgConfirmDeleteMultipleRowsTitle: "Բազմակի գրառումների ջնջում",
    msgConfirmDeleteMultipleRowsMsg: "Համոզվա՞ծ եք, որ ցանկանում եք ընդմիշտ ջնջել {count} ընտրված տողերը:",
    tunnelPortForward: "ՊՈՐՏԻ_ՓՈԽԱՆՑՈՒՄ",
    dbDeletedSuccess: "Տվյալների բազան հաջողությամբ ջնջվել է:",
    dbCreatedSuccess: "Տվյալների բազան հաջողությամբ ստեղծվել է:",
    sqlQuerySuccess: "SQL հարցումը հաջողությամբ կատարվել է:",
    confirmDeleteTableTitle: "Աղյուսակի ջնջում",
    confirmDeleteTableMsg: "Համոզվա՞ծ եք, որ ցանկանում եք ընդմիշտ ջնջել այս աղյուսակը և դրա ողջ պարունակությունը: Այս գործողությունը անդառնալի է:",
    exportCsv: "Արտահանել CSV",
    exportJson: "Արտահանել JSON",
    queryHistory: "Հարցումների պատմություն",
    clearHistory: "Մաքրել պատմությունը",
    emptyHistory: "Պատմությունը դատարկ է",
    settingsTitle: "Համակարգի Կարգավորումներ",
    settingsDesc: "Կարգավորեք համակարգի ձայնային ազդանշանները, ձայնի մակարդակը և գունային թեմաները:",
    themeLabel: "Գունային թեմա",
    themeLight: "Լուսավոր",
    themeDark: "Մութ",
    themeSystem: "Համակարգային",
    soundLabel: "Ձայնային ազդանշաններ",
    soundVolume: "Ձայնի բարձրություն",
    soundMuted: "Անձայն",
    soundEnabled: "Միացված է",
    langLabel: "Ինտերֆեյսի լեզու",
    saveSettings: "ԿԻՐԱՌԵԼ"
  }
};
