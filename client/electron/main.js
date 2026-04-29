/**
 * Electron 主进程
 * 创建浏览器窗口并加载 Vue3 应用
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 判断是否为开发模式
const isDev = !app.isPackaged;

/**
 * 创建主窗口
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    title: '像素社区',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5173');
    // 自动打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    // 窗口关闭时的清理逻辑
  });
}

// Electron 就绪后创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS: 点击图标重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
