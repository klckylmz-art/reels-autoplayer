const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('puantajAPI', {
  loadData() {
    const result = ipcRenderer.sendSync('puantaj:load-sync');
    if (!result || !result.ok) throw new Error(result?.error || 'Veri okunamadı');
    return result.data;
  },
  saveData(payload) {
    return ipcRenderer.sendSync('puantaj:save-sync', payload);
  }
});
