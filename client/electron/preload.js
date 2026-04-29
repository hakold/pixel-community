/**
 * Electron 预加载脚本
 * 在渲染进程中使用 contextBridge 暴露安全的 API
 */
const { contextBridge } = require('electron');

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用版本
  getVersion: () => process.env.npm_package_version || '1.0.0',
  // 是否为开发模式
  isDev: !require('electron').app.isPackaged,
});
