const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

// Set environment to production to serve pre-built client static bundle
process.env.NODE_ENV = 'production';

// Start the bundled Express server
try {
  require('./dist/server.cjs');
} catch (e) {
  console.error('Failed to start Duneon backup server:', e);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 1000,
    minHeight: 700,
    title: "Duneon Postgres SSH Dashboard",
    backgroundColor: '#050506',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Set the application launcher icon
    icon: path.join(__dirname, 'public/logo_no_text.svg'),
  });

  // Serve from the integrated Express corporate local service
  const serverUrl = 'http://localhost:3000';
  
  function checkServerReady() {
    http.get(serverUrl + '/api/health', (res) => {
      if (res.statusCode === 200) {
        mainWindow.loadURL(serverUrl);
      } else {
        setTimeout(checkServerReady, 150);
      }
    }).on('error', () => {
      setTimeout(checkServerReady, 150);
    });
  }

  checkServerReady();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
