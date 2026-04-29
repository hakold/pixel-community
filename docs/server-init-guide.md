# 《像素社区》后端项目 — 初始化与部署指南

## 一、项目目录结构

```
server/
├── .env                            # 环境变量（不提交 Git）
├── .env.example                    # 环境变量模板
├── package.json
├── config/                         # 游戏数据配置（JSON，支持热更新）
│   ├── game.json                   #   基础数值：初始属性/衰减/心情倍率/经验曲线
│   ├── education.json              #   教育系统：学前班→博士（7级）
│   ├── jobs.json                   #   打工系统：11种岗位
│   └── gathering.json              #   采集系统：挖矿/伐木/钓鱼
└── src/
    ├── server.js                   # 启动入口：初始化 DB → HTTP Server → WebSocket
    ├── app.js                      # Express 应用：中间件 → 路由 → 404 → 全局错误
    ├── config/
    │   ├── index.js                #   .env 环境变量统一加载
    │   ├── db.js                   #   MongoDB + Redis 连接管理
    │   └── gameConfig.js           #   游戏 JSON 配置加载 / 热更新 / 查询
    ├── models/
    │   ├── Player.js               #   玩家数据模型（属性/战斗/技能/背包/货币）
    │   └── ActionTask.js           #   行为任务模型（挂机/教育/打工/采集）
    ├── routes/
    │   ├── index.js                #   路由聚合入口（挂载全部子路由）
    │   ├── auth.js                 #   /api/auth/*  → authController
    │   ├── action.js               #   /api/action/* → actionController
    │   └── player.js               #   /api/player/* → playerController
    ├── controllers/
    │   ├── authController.js       #   认证：参数校验 → Service → 响应
    │   ├── actionController.js     #   行为：开始/查询/结算/取消
    │   └── playerController.js     #   玩家：信息/属性/背包/技能
    ├── services/
    │   ├── authService.js          #   认证逻辑：注册/登录/离线结算
    │   ├── actionService.js        #   行为逻辑：条件检查/开始/结算/离线
    │   └── attributeService.js     #   属性逻辑：衰减/心情倍率/升级/奖励
    ├── middleware/
    │   ├── auth.js                 #   JWT Bearer Token 认证
    │   └── errorHandler.js         #   全局错误处理 + AppError 异常类
    ├── ws/
    │   └── index.js                #   WebSocket 服务（心跳 + 消息路由）
    └── utils/
        └── response.js             #   统一响应格式 { code, message, data }
```

## 二、分层职责

| 层 | 职责 | 依赖 |
|----|------|------|
| **routes** | 仅绑定 HTTP method + path 到 controller | controllers |
| **controllers** | 解析请求参数 → 调用 service → 格式化响应 → `next(err)` | services |
| **services** | 纯业务逻辑（不含 req/res） | models, config |
| **models** | Mongoose Schema 定义 | MongoDB |
| **middleware** | 请求拦截：认证、错误处理 | — |
| **config** | 环境变量 / JSON 配置加载 | — |
| **utils** | 公共工具（统一响应格式等） | — |

错误流向：

```
Controller catch(err) → next(err) → errorHandler 中间件 → 统一 JSON 错误响应
```

## 三、环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.x | |
| MongoDB | ≥ 6.x | 主数据库 |
| Redis | ≥ 6.x | 缓存（后续阶段使用） |

## 四、启动步骤

### Windows

```bash
# 1. 安装 MongoDB（https://www.mongodb.com/try/download/community）
#    安装后服务自动启动

# 2. 安装 Redis（https://www.memurai.com 或 WSL 内安装）
#    Memurai 安装后服务自动启动

# 3. 启动后端
cd server
copy .env.example .env       # 复制配置（按需修改）
npm install
npm run dev                  # 开发模式，文件变更自动重启
```

### macOS

```bash
# 安装基础服务
brew install node
brew tap mongodb/brew && brew install mongodb-community
brew install redis

# 启动服务
brew services start mongodb-community
brew services start redis

# 启动后端
cd server
cp .env.example .env
npm install
npm run dev
```

### Linux (Ubuntu/Debian)

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 MongoDB + Redis
sudo apt install -y mongodb-org redis-server

# 启动服务
sudo systemctl start mongod
sudo systemctl start redis

# 启动后端
cd server
cp .env.example .env
npm install
npm run dev
```

成功输出：

```
[MongoDB] 连接成功
[Redis] 连接成功
[WebSocket] 服务已启动
════════════════════════════════════════
  《像素社区》后端服务
  HTTP:  http://localhost:3000
  WS:    ws://localhost:3000
════════════════════════════════════════
```

## 五、.env 示例

```env
# 服务端口
PORT=3000

# MongoDB 连接字符串
MONGODB_URI=mongodb://localhost:27017/pixel-community

# Redis 连接配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 密钥（生产环境务必修改为随机字符串）
JWT_SECRET=change-me-to-a-random-secret-string
JWT_EXPIRES_IN=7d

# WebSocket 心跳间隔 (ms)
WS_HEARTBEAT_INTERVAL=30000
```

## 六、接口速查

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `POST` | `/api/auth/register` | 注册+创角 |
| `POST` | `/api/auth/login` | 登录（含离线结算） |

### 需认证接口（Header: `Authorization: Bearer <token>`）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/auth/me` | 当前玩家信息 |
| `GET` | `/api/action/list` | 全部行为配置 |
| `POST` | `/api/action/start` | 开始行为任务 |
| `GET` | `/api/action/status` | 任务进度查询 |
| `POST` | `/api/action/collect` | 结算奖励 |
| `POST` | `/api/action/cancel` | 取消任务 |
| `GET` | `/api/player/profile` | 完整玩家数据 |
| `GET` | `/api/player/attributes` | 属性详情 |
| `GET` | `/api/player/inventory` | 背包 |
| `GET` | `/api/player/skills` | 技能 |

## 七、统一响应格式

```json
// 成功
{ "code": 0, "message": "ok", "data": { ... } }

// 失败
{ "code": -1, "message": "错误描述", "data": null }
```

## 八、错误码速查

| HTTP | errCode | 场景 |
|------|---------|------|
| 400 | -1 | 参数校验失败 / 业务条件不满足 |
| 401 | -1 | 未认证 / Token 过期 |
| 404 | -1 | 接口不存在 |
| 409 | -1 | 数据冲突（重复键） |
| 500 | -1 | 服务器内部错误 |
