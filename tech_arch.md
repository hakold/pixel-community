# 技术架构设计（Tech Architecture）

## 一、总体架构

### 前端

* Vue3
* WebSocket客户端
* Canvas渲染（像素）

### 后端

* Node.js（推荐 NestJS 或 Express）
* WebSocket服务

### 数据层

* MongoDB（主数据）
* Redis（缓存 + 实时）

---

## 二、核心模块

### 1. 用户模块

* 登录
* 角色数据

### 2. 行为系统

* 挂机任务
* 离线结算

### 3. 地图系统

* 房间管理
* 玩家同步

### 4. 战斗系统

* 自动战斗计算
* 战报生成

### 5. 社交系统

* 聊天
* 好友

---

## 三、实时系统设计

### WebSocket结构

```text
Client <-> Gateway <-> Service
```

### 同步内容

* 玩家移动
* 动作状态
* 房间广播

---

### 同步策略

* 客户端先移动
* 服务端广播校正

---

## 四、数据库设计（MongoDB）

### 玩家表 player

```json
{
  "_id": "",
  "level": 1,
  "exp": 0,
  "attributes": {},
  "battleAttributes": {},
  "skills": [],
  "inventory": []
}
```

---

### 行为表 action_task

```json
{
  "playerId": "",
  "type": "work",
  "startTime": "",
  "duration": 3600
}
```

---

### 地图实例 map_instance

```json
{
  "mapId": "",
  "players": []
}
```

---

## 五、Redis用途

* 在线玩家缓存
* 房间数据
* 排行榜
* 临时战斗数据

---

## 六、配置系统

### 配置加载

* JSON文件
* 启动加载 + 热更新

---

## 七、部署

### 环境

* Node.js
* MongoDB
* Redis

### 步骤

1. 安装依赖
2. 配置.env
3. 启动服务
4. 构建前端

---
