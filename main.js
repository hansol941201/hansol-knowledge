const { app, BrowserWindow, globalShortcut, screen } = require('electron');
const path = require('path');

let win;
function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 360, height: 460,
    x: area.x + area.width - 376, y: area.y + area.height - 476,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, show: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('Control+Alt+K', () => win.webContents.send('toggle-knowledge-window'));
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());
