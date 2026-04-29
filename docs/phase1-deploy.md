# 阶段一：部署文档

## 环境要求

| 组件 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 18.x | JavaScript 运行时 |
| MongoDB | 6.x | 主数据库 |
| Redis | 6.x | 缓存服务 |
| npm | 9.x | 包管理器 |

## 环境安装

### Windows

```bash
# 1. 安装 Node.js (包含 npm)
# 下载地址: https://nodejs.org

# 2. 安装 MongoDB
# 下载地址: https://www.mongodb.com/try/download/community

# 3. 安装 Redis (使用 Memurai 或 WSL)
# Memurai 下载: https://www.memurai.com
# 或通过 WSL: sudo apt install redis-server
```

### macOS

```bash
brew install node
brew tap mongodb/brew && brew install mongodb-community
brew install redis
```

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo apt install -y mongodb-org redis-server
```

---

## 启动步骤

### 1. 启动基础服务

```bash
# 启动 MongoDB
# Windows: 服务自动启动
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 启动 Redis
# Windows (Memurai): 服务自动启动
# macOS: brew services start redis
# Linux: sudo systemctl start redis
```

### 2. 配置后端环境变量

```bash
cd server
# 复制配置模板
cp .env.example .env
# 根据实际环境修改 .env 中的配置：
#   - MONGODB_URI: MongoDB 连接地址
#   - REDIS_HOST / REDIS_PORT: Redis 连接信息
#   - JWT_SECRET: JWT 加密密钥（生产环境务必修改）
```

### 3. 启动后端服务

```bash
cd server
npm install        # 安装依赖（首次运行）
npm run dev        # 开发模式（文件变更自动重启）
# 或
npm start          # 生产模式
```

成功启动后输出：

```
════════════════════════════════════════
  《像素社区》后端服务
  HTTP:  http://localhost:3000
  WS:    ws://localhost:3000
════════════════════════════════════════
```

### 4. 启动前端客户端

```bash
cd client
npm install        # 安装依赖（首次运行）
npm run dev        # 启动 Vite 开发服务器（浏览器访问）
# 或
npm run electron:dev  # 启动 Electron 桌面客户端
```

---

## 验证服务

### 健康检查

```bash
curl http://localhost:3000/api/health
```

预期返回：

```json
{"code":0,"message":"ok","data":{"uptime":12.5}}
```

### 注册测试

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test01",
    "password": "123456",
    "characterName": "测试角色",
    "gender": "male"
  }'
```

### 登录测试

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test01",
    "password": "123456"
  }'
```

### 获取个人信息

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <你的token>"
```

---

## 目录结构

```
pixcelgame/
├── server/                    # 后端服务
│   ├── .env                   # 环境变量（不提交到 Git）
│   ├── .env.example           # 环境变量模板
│   ├── package.json
│   ├── config/
│   │   └── game.json          # 游戏数值配置
│   └── src/
│       ├── server.js          # 启动入口
│       ├── app.js             # Express 配置
│       ├── config/
│       │   ├── index.js       # 环境变量加载
│       │   ├── db.js          # 数据库连接管理
│       │   └── gameConfig.js  # 游戏配置加载器
│       ├── models/
│       │   └── Player.js      # 玩家数据模型
│       ├── routes/
│       │   └── auth.js        # 认证路由
│       ├── middleware/
│       │   └── auth.js        # JWT 认证中间件
│       ├── services/
│       │   └── authService.js # 认证业务逻辑
│       ├── ws/
│       │   └── index.js       # WebSocket 服务
│       └── utils/
│           └── response.js    # 统一响应格式
├── client/                    # 前端客户端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── electron/
│   │   ├── main.js            # Electron 主进程
│   │   └── preload.js         # 预加载脚本
│   └── src/
│       ├── main.js            # Vue 入口
│       ├── App.vue            # 根组件
│       ├── router/
│       │   └── index.js       # 路由配置
│       ├── views/
│       │   ├── Login.vue      # 登录页
│       │   └── Register.vue   # 注册+创角页
│       ├── api/
│       │   └── auth.js        # API 封装
│       └── stores/
│           └── user.js        # 用户状态管理
└── docs/
    └── phase1-deploy.md       # 本文档
```
