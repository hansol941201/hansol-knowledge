const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('knowledgeAPI', {
  onToggle: (callback) => ipcRenderer.on('toggle-knowledge-window', callback),
  onOpen: (callback) => ipcRenderer.on('open-knowledge-window', callback),
  onCollapse: (callback) => ipcRenderer.on('collapse-knowledge-window', callback),
  setExpanded: (expanded) => ipcRenderer.send('set-expanded', expanded),
  openSite: () => ipcRenderer.send('open-site'),
  updateReminders: rows => ipcRenderer.send('todo-reminders', rows),
  onCompleteReminder: callback => ipcRenderer.on('complete-todo-reminder', (_event, id) => callback(id))
});
