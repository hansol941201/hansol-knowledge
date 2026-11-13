const { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage, screen, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const SITE_URL = 'https://hansol941201.github.io/hansol-knowledge/';

// 「전체 지식 사이트 열기」를 누를 때마다 브라우저 탭이 늘어나지 않도록,
// 바탕화면 바로가기와 같은 Windows 실행기로 이미 열린 탭을 찾아 앞으로 가져온다.
// 실행기를 못 쓰면(다른 OS·파일 없음·오류) 예전처럼 기본 브라우저로 새로 연다.
const LAUNCHER_PATH = path.join(__dirname, 'tools', 'windows-launcher', 'open-hansol-knowledge.ps1');
let siteOpening = false;
function openSiteReusingTab() {
  if (process.platform !== 'win32') return shell.openExternal(SITE_URL);
  if (siteOpening) return;                       // 연달아 눌러도 한 번만 처리
  let script;
  try { script = fs.readFileSync(LAUNCHER_PATH, 'utf8').replace(/^﻿/, ''); }
  catch { return shell.openExternal(SITE_URL); }
  siteOpening = true;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  execFile('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-EncodedCommand', encoded],
    { windowsHide: true, timeout: 20000 },
    (error, stdout) => {
      siteOpening = false;
      // 실행기가 끝까지 돌았으면(찾았든 새로 열었든) 'result:' 줄을 남긴다. 없으면 여기서 연다.
      if (!/result:/.test(String(stdout || ''))) shell.openExternal(SITE_URL);
      else if (error) console.warn('launcher', error.message);
    });
}
// 배포된 사이트를 그대로 띄운다. 그래야 앱을 다시 받지 않아도 최신 코드가 적용되고,
// 팝업과 웹사이트가 같은 주소·같은 저장 공간·같은 Firebase 문서를 쓰게 된다.
// 인터넷이 안 되면 실행 파일에 들어 있는 사본으로 내려간다.
let usingBundledCopy = false;
let win;
let tray = null;
let quitting = false;
let reminderWin;
let reminderRows = [];

function updateReminders(rows) {
  if (JSON.stringify(rows) === JSON.stringify(reminderRows) && reminderWin && !reminderWin.isDestroyed()) return;
  reminderRows = rows;
  if (!rows.length) { if (reminderWin) reminderWin.hide(); return; }
  if (!reminderWin || reminderWin.isDestroyed()) {
    const area = screen.getPrimaryDisplay().workArea;
    reminderWin = new BrowserWindow({
      width: 330, height: Math.min(520, area.height - 28),
      x: area.x + area.width - 344, y: area.y + 14,
      frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false, show: false,
      webPreferences: { preload: path.join(__dirname, 'reminder-preload.js'), contextIsolation: true, nodeIntegration: false }
    });
    reminderWin.setAlwaysOnTop(true, 'screen-saver');
    reminderWin.webContents.on('did-finish-load', () => {
      reminderWin.webContents.send('reminder-rows', reminderRows);
      if (reminderRows.length) reminderWin.showInactive();
    });
    reminderWin.on('close', event => { if (!quitting) { event.preventDefault(); reminderWin.showInactive(); } });
    reminderWin.loadFile('reminder.html');
  } else {
    reminderWin.webContents.send('reminder-rows', reminderRows);
    reminderWin.showInactive();
  }
}

// 실행 파일을 여러 번 열어도 점(orb)이 겹쳐 뜨지 않도록 한 개만 돌게 한다.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showKnowledgeWindow());
}

function loadKnowledgeWindow() {
  usingBundledCopy = false;
  // 앱 안에는 서비스 워커가 없으므로(overlay=1 이면 등록하지 않는다) 여기서 직접
  // "저장본 쓰지 말라"고 알려 준다. 사이트를 고쳤는데 예전 화면이 남는 일을 막는다.
  win.loadURL(`${SITE_URL}?overlay=1`, { extraHeaders: 'pragma: no-cache\ncache-control: no-cache\n' })
    .catch(loadBundledCopy);
}
function loadBundledCopy() {
  if (usingBundledCopy || !win) return;
  usingBundledCopy = true;
  win.loadFile('index.html', { query: { overlay: '1' } });
}
function createWindow() {
  const area = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 80, height: 80,
    x: area.x + area.width - 94, y: area.y + area.height - 94,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, show: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
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
    { label: '전체 지식 사이트 열기', click: openSiteReusingTab },
    { type: 'separator' },
    { label: '종료', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', showKnowledgeWindow);
}

function setExpanded(expanded) {
  if (!win) return;
  const area = screen.getPrimaryDisplay().workArea;
  const width = expanded ? 360 : 80;
  const height = expanded ? 460 : 80;
  win.setBounds({ x: area.x + area.width - width - 14, y: area.y + area.height - height - 14, width, height }, true);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

app.whenReady().then(() => {
  ipcMain.on('todo-reminders', (event, rows) => {
    if (event.sender !== win?.webContents || !Array.isArray(rows)) return;
    updateReminders(rows.filter(row => row && typeof row.id === 'string' && typeof row.text === 'string' && typeof row.date === 'string'));
  });
  ipcMain.on('reminder-complete', (event, id) => {
    if (event.sender !== reminderWin?.webContents || typeof id !== 'string') return;
    win?.webContents.send('complete-todo-reminder', id);
  });
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
  ipcMain.on('open-site', () => openSiteReusingTab());
});
app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', (e) => e.preventDefault());
