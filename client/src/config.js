/**
 * 客户端配置
 *
 * 所有环境相关的 URL 从此处统一读取，不硬编码到业务模块。
 * 开发时通过 Vite 的 import.meta.env 读取 client/.env 中的 VITE_* 变量。
 * 生产部署时，Vite 在 build 阶段将这些值编译为静态常量。
 */

/** 后端 HTTP 地址（开发: http://localhost:3000） */
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

/** HTTP API 前缀（dev 模式走 Vite proxy，prod 直连） */
export const API_BASE_URL = import.meta.env.DEV ? '/api' : `${SERVER_URL}/api`;

/** WebSocket 地址（自动从 HTTP 地址推导 ws/wss 协议） */
export const WS_URL = (() => {
  const url = new URL(SERVER_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  // dev 模式直连后端端口，不走 Vite proxy（proxy 只代理 /api 和 /ws 路径）
  return `${url.origin}`;
})();
