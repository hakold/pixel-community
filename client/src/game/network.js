/**
 * WebSocket 网络管理器
 * 管理与服务器的实时连接：认证、房间、移动同步、聊天
 */
export function createNetworkManager({ url, token, onEvent }) {
  let ws = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_DELAY = 10000;

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts = 0;
      onEvent({ type: 'connected' });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onEvent(msg);
      } catch {
        // 忽略非 JSON 消息
      }
    };

    ws.onclose = () => {
      onEvent({ type: 'disconnected' });
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose 会紧随其后触发
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectAttempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function send(type, payload = {}) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.onclose = null;
      ws.close();
      ws = null;
    }
  }

  // 启动连接
  connect();

  return { send, disconnect };
}
