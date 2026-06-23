# Duneon Postgres SSH Dashboard

An elegant, corporate, lightweight full-stack administration client designed to configure, monitor, and query remote PostgreSQL databases securely over standard SSH Port Forwarding tunnels. 

Built with **React (TypeScript), Tailwind CSS, Express, and Electron**.

---

## 🌎 Official Links & Support

- **Website / Сайт**: [duneon.dev](https://duneon.dev)
- **Email Support / Поддержка**: [support+postgresqlsshdashboard@duneon.dev](mailto:support+postgresqlsshdashboard@duneon.dev)

---

## 🚀 Key Features / Ключевые Возможности

- **Secure Port Forwarding**: Automatic local forwarding loops created safely behind-the-scenes.
- **Database Management**: Create/delete databases instantly with robust termination precautions.
- **User Management**: Rapid creation/deletion of system roles and superuser configurations.
- **Table Operations**: Dynamic full SQL generator, interactive base tables viewer, alter structures, and rows editor.
- **Interactive Terminal**: Run custom complex multi-line PostgreSQL statements with clean structural data and error diagnostics.
- **Localization**: Multi-language support (RU, EN, AM) built natively.
- **No-Browser Desktop Packaging**: Fully integrated with Electron to compile into a lightweight native desktop binary with launcher icons.

---

## 🛠️ Installation & Local Run / Запуск и Установка

### 1. Requirements / Требования
- **Node.js**: v18 or later
- **npm**: v9 or later

### 2. Standard Development Start / Запуск в режиме разработки
```bash
# Install dependencies / Установка зависимостей
npm install

# Live Hot Reload dev loop / Запуск сервера разработки
npm run dev
```

### 3. Production Compilation / Сборка для Веб-сервера (Production)
```bash
# Build frontend + bundle server into a unified module
npm run build

# Start the Node Express backend loop
npm run start
```

---

## 📦 Building Native Linux Desktop Installer `.deb` / Сборка Десктоп-версии `.deb`

The workspace is configured to compile the entire React frontend and Node SSH client into a standalone, desktop application wrapper (Electron) with an indicator menu icon. 

To create the `.deb` installer for your Ubuntu, Debian, or Linux systems:

```bash
# Install dependencies if not already installed
npm install

# Compile application and assemble the production Debian installer
npm run build:desktop
```

Once completed successfully, your ready-to-use `.deb` installer containing autostart launchers and app-menus icons will be located in:
📂 **`/dist-desktop/`**

You can install it directly by double-clicking or through terminal:
```bash
sudo dpkg -i dist-desktop/postgresql-ssh-tunnels-dashboard_1.0.0_amd64.deb
sudo apt-get install -f
```

---

## ⚖️ License / Лицензия

Proprietary software licensed by **Duneon**. Please refer to the [LICENSE](./LICENSE) file for conditions. 
*Note: Any direct copy, unmodified color themes, or 1-to-1 cloning of Duneon's branding layouts and corporate graphics is strictly prohibited under intellectual property laws. Please rename, re-brand, and adjust styles as described in the License if deploying a fork.*
