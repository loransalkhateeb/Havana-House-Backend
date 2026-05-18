const { app, BrowserWindow } = require('electron');
const path = require('path');
const config = require('./src/config');
const backendApp = require('./src/app');
const prisma = require('./src/config/db');

let mainWindow;
let server;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, load from the React dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // In production, load the built React app
    mainWindow.loadFile(path.join(__dirname, 'public', 'frontend', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Start the Express backend
  server = backendApp.listen(config.port, () => {
    console.log(`Server running on port ${config.port} inside Electron`);
    createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await prisma.$disconnect();
    if (server) server.close();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
