const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Debug log function (lazily get userData path)
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try {
    const logFile = path.join(app.getPath('userData'), 'debug.log');
    fs.appendFileSync(logFile, line);
  } catch (e) {
    // Ignore if app not ready
  }
}

// Load .env from app directory (works for both dev and packaged)
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

// In packaged mode: always production. In dev: check NODE_ENV
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
log(`[INIT] isPackaged=${app.isPackaged}, isDev=${isDev}, resourcesPath=${app.isPackaged ? process.resourcesPath : __dirname}`);

if (isDev) {
  try {
    require('electron-reload')(path.join(__dirname, '..'), {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      ignored: /server|node_modules|web-frontend|frontend/
    });
  } catch (err) {
    console.warn('Live reload unavailable:', err);
  }
}

// Global references
let mainWindow;
let serverProcess;
let frontendProcess;

// Get server path based on whether app is packaged
function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server');
  }
  return path.join(__dirname, 'server');
}

// Get frontend path based on whether app is packaged
function getFrontendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend');
  }
  return path.join(__dirname, 'frontend', '.next', 'standalone', 'frontend');
}

// Start the backend server (Express API on port 3001)
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();

    log('[MAIN] Starting backend server from: ' + serverPath);

    const serverEnv = {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: '3001',
    };

    serverProcess = spawn('node', ['server.js'], {
      cwd: serverPath,
      env: serverEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString();
      log('[SERVER] ' + message);
      if (message.includes('running on') || message.includes('listening')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      log('[SERVER ERROR] ' + data.toString());
    });

    serverProcess.on('error', (err) => {
      log('[SERVER] Failed to start: ' + err.message);
      reject(err);
    });

    serverProcess.on('close', (code) => {
      log('[SERVER] Process exited with code: ' + code);
    });

    setTimeout(() => resolve(), 3000);
  });
}

// Start the frontend server (Next.js standalone on port 3000)
function startFrontend() {
  return new Promise((resolve, reject) => {
    const frontendPath = getFrontendPath();

    log('[MAIN] Starting frontend server from: ' + frontendPath);
    log('[MAIN] Frontend server.js exists: ' + fs.existsSync(path.join(frontendPath, 'server.js')));

    const frontendEnv = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3000',
      HOSTNAME: '127.0.0.1',
    };

    frontendProcess = spawn('node', ['server.js'], {
      cwd: frontendPath,
      env: frontendEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    frontendProcess.stdout.on('data', (data) => {
      const message = data.toString();
      log('[FRONTEND] ' + message);
      if (message.includes('Ready') || message.includes('listening') || message.includes('started')) {
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      log('[FRONTEND ERROR] ' + data.toString());
    });

    frontendProcess.on('error', (err) => {
      log('[FRONTEND] Failed to start: ' + err.message);
      reject(err);
    });

    frontendProcess.on('close', (code) => {
      log('[FRONTEND] Process exited with code: ' + code);
    });

    setTimeout(() => resolve(), 5000);
  });
}

// Stop the backend server
function stopServer() {
  if (serverProcess) {
    console.log('[MAIN] Stopping backend server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Stop the frontend server
function stopFrontend() {
  if (frontendProcess) {
    console.log('[MAIN] Stopping frontend server...');
    frontendProcess.kill();
    frontendProcess = null;
  }
}

// Create Electron window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      enableWebSQL: false,
      webSecurity: true
    }
  });

  const frontendUrl = 'http://127.0.0.1:3000';
  console.log('[MAIN] Loading frontend from:', frontendUrl);
  mainWindow.loadURL(frontendUrl);

  if (isDev) {
    // mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.includes('composio.dev') ||
      url.includes('google.com') ||
      url.includes('github.com') ||
      url.includes('isuiteassistant.com')
    ) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://') || url.includes('localhost') || url.includes('127.0.0.1')) {
      return;
    }
    if (
      url.includes('composio.dev') ||
      url.includes('google.com') ||
      url.includes('github.com')
    ) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });
}

// App lifecycle
app.on('ready', async () => {
  log('[MAIN] Electron app ready');

  try {
    // Start both servers in parallel
    log('[MAIN] Starting backend server...');
    const serverReady = startServer();

    // In dev: user runs `npm run dev` separately for frontend
    // In production: spawn the standalone Next.js server
    let frontendReady;
    if (!isDev) {
      log('[MAIN] Starting frontend server...');
      frontendReady = startFrontend();
    } else {
      log('[MAIN] Dev mode - skipping frontend spawn');
    }

    await serverReady;
    log('[MAIN] Backend server started');

    if (frontendReady) {
      await frontendReady;
      log('[MAIN] Frontend server started');
    }

    log('[MAIN] Creating window...');
    createWindow();
  } catch (err) {
    log('[MAIN] Failed to start: ' + err.message);
    createWindow();
  }
});

app.on('window-all-closed', () => {
  stopServer();
  stopFrontend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
  stopFrontend();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
