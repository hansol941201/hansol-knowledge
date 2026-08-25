const { app, BrowserWindow, globalShortcut, screen, ipcMain, shell } = require('electron');
const path = require('path');

const SITE_URL = 'https://hansol941201.github.io/hansol-knowledge/';
// 배포된 사이트를 그대로 띄운다. 그래야 앱을 다시 받지 않아도 최신 코드가 적용되고,
// 팝업과 웹사이트가 같은 주소·같은 저장 공간·같은 Firebase 문서를 쓰게 된다.
// 인터넷이 안 되면 실행 파일에 들어 있는 사본으로 내려간다.
let usingBundledCopy = false;
let win;

function loadKnowledgeWindow() {
  usingBundledCopy = false;
  win.loadURL(`${SITE_URL}?overlay=1`).catch(loadBundledCopy);
}
function loadBundledCopy() {
  if (usingBundledCopy || !win) return;
  usingBundledCopy = true;
  win.loadFile('index.html', { query: { overlay: '1' } });
}
function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 56, height: 56,
    x: area.x + area.width - 70, y: area.y + area.height - 70,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, show: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.webContents.on('did-fail-load', (_event, _code, _desc, _url, isMainFrame) => { if (isMainFrame) loadBundledCopy(); });
  loadKnowledgeWindow();
}

function setExpanded(expanded) {
  if (!win) return;
  const area = screen.getPrimaryDisplay().workArea;
  const width = expanded ? 360 : 56;
  const height = expanded ? 460 : 56;
  win.setBounds({ x: area.x + area.width - width - 14, y: area.y + area.height - height - 14, width, height }, true);
  win.setAlwaysOnTop(true, 'screen-saver');
}

app.whenReady().then(() => {
  createWindow();
  globalShortcut.register('Control+Alt+K', () => win.webContents.send('toggle-knowledge-window'));
  ipcMain.on('set-expanded', (_event, expanded) => {
    setExpanded(Boolean(expanded));
    if (expanded && usingBundledCopy) loadKnowledgeWindow();   // 연결이 돌아오면 최신 사이트로 복귀
  });
  ipcMain.on('open-site', () => shell.openExternal('https://hansol941201.github.io/hansol-knowledge/'));
});
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());
