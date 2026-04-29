# 阶段一：接口使用文档

## 基础信息

- 基础路径: `http://localhost:3000/api`
- 请求格式: `application/json`
- 认证方式: JWT Bearer Token（登录/注册后返回）
- 响应格式: 统一 JSON

## 通用响应格式

```json
{
  "code": 0,        // 0=成功, 其他=错误码
  "message": "ok",  // 提示信息
  "data": null      // 业务数据
}
```

---

## 1. 用户注册 + 创建角色

创建账号并同时创建游戏角色。

```
POST /api/auth/register
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名，3-20位 |
| password | string | 是 | 密码，至少6位 |
| characterName | string | 是 | 角色名，1-12位 |
| gender | string | 是 | 性别: `male` / `female` |

### 请求示例

```json
{
  "username": "pixel_fan",
  "password": "abc123456",
  "characterName": "像素小王子",
  "gender": "male"
}
```

### 成功响应 (201)

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "player": {
      "_id": "6655a1b2c3d4e5f6a7b8c9d0",
      "username": "pixel_fan",
      "characterName": "像素小王子",
      "gender": "male",
      "level": 1,
      "exp": 0,
      "attributes": {
        "energy": 100,
        "mood": 100,
        "hunger": 100,
        "health": 100,
        "cleanliness": 100,
        "strength": 5,
        "intelligence": 5,
        "charm": 5
      },
      "battleAttributes": {
        "attack": 10,
        "defense": 10,
        "speed": 10,
        "dodge": 5,
        "hp": 100,
        "maxHp": 100
      },
      "skills": [],
      "inventory": [],
      "currency": {
        "gold": 0,
        "points": 0,
        "achievement": 0
      },
      "createdAt": "2024-05-27T10:00:00.000Z",
      "updatedAt": "2024-05-27T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 错误响应

| HTTP状态 | message | 说明 |
|-----------|---------|------|
| 400 | 用户名已被注册 | 用户名重复 |
| 400 | 角色名已被使用 | 角色名重复 |
| 400 | 请填写完整的注册信息 | 参数缺失 |

---

## 2. 用户登录

```
POST /api/auth/login
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

### 请求示例

```json
{
  "username": "pixel_fan",
  "password": "abc123456"
}
```

### 成功响应 (200)

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "player": { /* 同注册返回的 player 结构 */ },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 错误响应

| HTTP状态 | message | 说明 |
|-----------|---------|------|
| 401 | 用户名或密码错误 | 认证失败 |

---

## 3. 获取当前玩家信息

需要登录后携带 Token 访问。

```
GET /api/auth/me
Authorization: Bearer <token>
```

### 成功响应 (200)

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "player": { /* player 结构 */ }
  }
}
```

---

## 前端联调说明

### API 封装（已实现）

```javascript
// client/src/api/auth.js

import { register, login, getProfile } from '@/api/auth';

// 注册
const { player, token } = await register({
  username: 'test',
  password: '123456',
  characterName: '角色',
  gender: 'male',
});

// 登录
const { player, token } = await login({
  username: 'test',
  password: '123456',
});

// 获取信息
const { player } = await getProfile();
```

### Token 存储

登录/注册成功后，Token 和玩家信息自动存入 `localStorage`:

```javascript
localStorage.getItem('token');   // JWT Token
localStorage.getItem('player');  // JSON 字符串
```

### 请求头

所有需要认证的请求自动携带 Authorization 头（通过 axios 拦截器实现）。
