const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');

let win;
function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 56, height: 56,
    x: area.x + area.width - 70, y: area.y + area.height - 70,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, show: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile('index.html', { query: { overlay: '1' } });
}

function setExpanded(expanded) {
  if (!win) return;
  const area = screen.getPrimaryDisplay().workArea;
  const width = expanded ? 360 : 56;
  const height = expanded ? 460 : 56;
  win.setBounds({ x: area.x + area.width - width - 14, y: area.y + area.height - height - 14, width, height }, true);
  win.setAlwaysOnTop(true, 'floating');
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('Control+Alt+K', () => win.webContents.send('toggle-knowledge-window'));
  ipcMain.on('set-expanded', (_event, expanded) => setExpanded(Boolean(expanded)));
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());
