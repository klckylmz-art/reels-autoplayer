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
    title: 'Hayal Kahvesi Puantaj',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.webContents.on('did-finish-load', async () => {
    try {
      for (const file of ['desktop-patch.js','payroll-utils.js','salary-prime-patch.js','group-utils.js','groups-patch.js']) {
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
