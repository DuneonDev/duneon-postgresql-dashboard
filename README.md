# Duneon Postgres SSH Dashboard

An elegant, corporate, lightweight full-stack administration client designed to configure, monitor, and query remote PostgreSQL databases securely over standard SSH Port Forwarding tunnels. 

Built with **React (TypeScript), Tailwind CSS, Express, and Electron**.

---

## 🌎 Official Links & Support

- **Website**: [duneon.dev](https://duneon.dev)
- **Email Support**: [support+postgresqlsshdashboard@duneon.dev](mailto:support+postgresqlsshdashboard@duneon.dev)

---

## 🚀 Key Features

### 🔒 Secure Tunneling & Authentication
- **SSH Port Forwarding**: Automatic, seamless setup of local port forwarding loops to bridge external Postgres instances.
- **Flexible Auth**: Support for both Password and SSH Key-based (`id_rsa`) authentication.
- **Connection Diagnostics**: Instant pre-flight checks validating SSH handshake, port accessibility, and target database credentials.

### 🗄️ Database & Schema Management
- **Database Catalog Explorer**: Instantly list, create, switch, and delete remote databases with active role-termination safety.
- **SQL Console & History**: Interactive query terminal supporting multi-line PostgreSQL commands, execution history logs, runtime duration statistics, and full error diagnostics.
- **Schema Visualizer**: Side-by-side table lists, count counters, and active role configurations.

### 🖊️ Intuitive Table & Row Operations
- **Interactive Structured View**: View records in clean grid tables with custom pagination and real-time column matching searches.
- **Row Editor**: Elegant dialogs for creating or modifying rows.
- **Advanced JSON & Array Parsing**: Automated robust JSON stringification and parsing for complex fields (e.g. JSON/JSONB data types) to prevent database transaction aborts.
- **Graceful Bulk Delete**: Select columns, filter rows, and drop multiple records simultaneously (e.g., deleting 20+ selected rows at once) with a safe primary-key-based fallback.

### ⚙️ Table Structure Modifier
- **Column Operations**: Add new columns, alter column types, rename labels, or drop parameters on the fly.
- **Safe Type Alters**: Built-in default value safeguards. Drops existing default variables before structural type conversions to prevent strict PostgreSQL cast constraint failures (e.g. converting defaults for text arrays), dynamically attempting to restore valid defaults afterwards.
- **Database Relations**: Easily design and query key relationships.

### 📊 Real-time Monitoring & Security
- **Activity & PID Monitor**: Real-time listing of active client connection PIDs, host interfaces, query states, and terminal process termination signals.
- **Metrics Dashboard**: Clear visualizers for database sizes, table row storage, index vs sequential scan tracking, and database lock audits.
- **Durable Backup Hub**: Create complete PostgreSQL database backup snapshots and retrieve archived archives on the fly.
- **Security Checkpoints**: Visual controls for auditing login privileges.

### 🌐 System Settings & Desktop Portability
- **Native Localization**: Built-in multi-lingual interface supporting **English**, **Russian (Русский)**, and **Armenian (Հայերեն)** natively.
- **Desktop Application Wrapper**: Configured to run in any browser or packaged natively into a lightweight Linux desktop app via **Electron** builders.

---

## 🛠️ Installation & Local Run

### 1. Requirements
- **Node.js**: v18 or later
- **npm**: v9 or later

### 2. Standard Development Start
```bash
# Install dependencies
npm install

# Start the concurrent Vite development server
npm run dev
```

### 3. Production Compilation
```bash
# Build frontend + compile backend server into a unified module
npm run build

# Start the production Node Express backend
npm run start
```

---

## ⚖️ License

Proprietary software protected under **Duneon** Intellectual Property guidelines. Please refer to the [LICENSE](./LICENSE) file for exact Terms and Conditions.

*Note: Unauthorized duplication of Duneon corporate color palettes, branding interfaces, logos, or 1-to-1 layouts is strictly prohibited. Please re-brand and adapt elements before introducing forks.*
