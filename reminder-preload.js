const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('reminderAPI', {
  onRows: callback => ipcRenderer.on('reminder-rows', (_event, rows) => callback(rows)),
  complete: id => ipcRenderer.send('reminder-complete', id)
});
