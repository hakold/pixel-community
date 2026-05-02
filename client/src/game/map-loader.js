/**
 * 地图加载器
 * 从服务端 API 加载地图配置，兜底使用 public/data/ 静态文件
 */

function authHeaders() {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function fetchJSON(url) {
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.json();
}

/**
 * 加载 gameplay 全局配置（静态文件，无需认证）
 */
export async function loadGameplayConfig(jsonPath) {
  return fetchJSON(jsonPath);
}

/**
 * 加载单个地图配置（自动识别 API 包装 / 原始 JSON）
 */
export async function loadMapConfig(jsonPath) {
  const raw = await fetchJSON(jsonPath);
  // API 返回 { code, message, data } 包装，取 data
  if (raw && raw.data && (raw.mapId === undefined)) {
    return raw.data;
  }
  return raw;
}

/**
 * 根据 mapId 加载地图数据包
 */
export async function loadMapBundle({ mapId, gameplayConfig }) {
  const jsonPath = gameplayConfig.mapFiles[mapId];
  if (!jsonPath) throw new Error(`Map not registered: ${mapId}`);
  const mapConfig = await loadMapConfig(jsonPath);
  return { mapConfig };
}
