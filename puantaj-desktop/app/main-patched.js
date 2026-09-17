const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { ensureData, writeData } = require('./data-store');

function storageDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  if (app.isPackaged) return path.dirname(process.execPath);
  return path.resolve(__dirname, '..');
}

function initialDataPath() {
  return path.join(__dirname, 'initial_data.json');
}

ipcMain.on('puantaj:load-sync', (event) => {
  try {
    event.returnValue = { ok: true, data: ensureData(storageDir(), initialDataPath()) };
  } catch (err) {
    event.returnValue = { ok: false, error: String(err && err.message || err) };
  }
});

ipcMain.on('puantaj:save-sync', (event, payload) => {
  try {
    const file = writeData(storageDir(), payload);
    event.returnValue = { ok: true, file };
  } catch (err) {
    event.returnValue = { ok: false, error: String(err && err.message || err) };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 920,
    minWidth: 980,
    minHeight: 650,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.webContents.on('did-finish-load', async () => {
    try {
      await win.webContents.insertCSS(`
        .salary-input{
          background:#fff3d6 !important;
          border-color:#e4b95f !important;
          box-shadow:inset 0 0 0 1px rgba(224,154,34,.08);
        }
        .salary-input:focus{
          background:#ffe8ad !important;
          border-color:#d99516 !important;
          box-shadow:0 0 0 2px rgba(217,149,22,.16);
          outline:none;
        }
      `);
      for (const file of ['desktop-patch.js','payroll-utils.js','salary-prime-patch.js']) {
        const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
        await win.webContents.executeJavaScript(source, true);
      }
    } catch (err) {
      console.error('Puantaj patch yüklenemedi:', err);
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
