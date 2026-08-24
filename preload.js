const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('knowledgeAPI', {
  onToggle: (callback) => ipcRenderer.on('toggle-knowledge-window', callback)
});
