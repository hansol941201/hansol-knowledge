const { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage, screen, ipcMain, shell } = require('electron');
const path = require('path');

const SITE_URL = 'https://hansol941201.github.io/hansol-knowledge/';
// 배포된 사이트를 그대로 띄운다. 그래야 앱을 다시 받지 않아도 최신 코드가 적용되고,
// 팝업과 웹사이트가 같은 주소·같은 저장 공간·같은 Firebase 문서를 쓰게 된다.
// 인터넷이 안 되면 실행 파일에 들어 있는 사본으로 내려간다.
let usingBundledCopy = false;
let win;
let tray = null;
let quitting = false;

// 실행 파일을 여러 번 열어도 점(orb)이 겹쳐 뜨지 않도록 한 개만 돌게 한다.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showKnowledgeWindow());
}

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
  // 창을 닫아도 앱이 꺼지지 않고 점(orb)으로 접힌다. 트레이 메뉴의 "종료" 로만 완전히 끝난다.
  win.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    win.webContents.send('collapse-knowledge-window');
    setExpanded(false);
    win.show();
  });
  win.on('closed', () => { win = null; });
  loadKnowledgeWindow();
}

function showKnowledgeWindow() {
  if (!win || win.isDestroyed()) { createWindow(); return; }
  if (!win.isVisible()) win.show();
  setExpanded(true);
  win.webContents.send('open-knowledge-window');
  win.focus();
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'netform-logo.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('한솔 지식창');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '지식창 열기', click: showKnowledgeWindow },
    { label: '전체 지식 사이트 열기', click: () => shell.openExternal(SITE_URL) },
    { type: 'separator' },
    { label: '종료', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', showKnowledgeWindow);
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
  createTray();
  globalShortcut.register('Control+Alt+K', () => {
    if (!win || win.isDestroyed()) return createWindow();   // 창이 사라졌으면 다시 만든다
    win.webContents.send('toggle-knowledge-window');
  });
  ipcMain.on('set-expanded', (_event, expanded) => {
    setExpanded(Boolean(expanded));
    if (expanded && usingBundledCopy) loadKnowledgeWindow();   // 연결이 돌아오면 최신 사이트로 복귀
  });
  ipcMain.on('open-site', () => shell.openExternal('https://hansol941201.github.io/hansol-knowledge/'));
});
app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());
