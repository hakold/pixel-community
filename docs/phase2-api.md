# 阶段二：行为系统 + 属性系统 API 文档

## 新增接口

### 1. 获取行为配置列表

获取所有教育/打工/采集的配置信息。

```
GET /api/action/list
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "data": {
    "education": [
      {
        "id": "preschool",
        "name": "学前班",
        "stage": 1,
        "requirements": { "level": 1, "gold": 100, "intelligence": 1 },
        "duration": 600,
        "rewards": { "exp": 50, "attributes": { "intelligence": 2, "charm": 1 } },
        "energyCost": 15
      }
    ],
    "jobs": [ /* ... */ ],
    "gathering": [ /* ... */ ]
  }
}
```

---

### 2. 开始行为任务

```
POST /api/action/start
Authorization: Bearer <token>

{
  "actionType": "work",
  "actionId": "delivery"
}
```

支持的 actionType：`education` | `work` | `gathering`

响应 (201)：

```json
{
  "code": 0,
  "message": "开始外卖配送员",
  "data": {
    "task": {
      "_id": "...",
      "actionType": "work",
      "actionId": "delivery",
      "startTime": "2024-05-27T10:30:00.000Z",
      "duration": 300,
      "status": "active"
    },
    "player": { /* 更新后的玩家数据 */ }
  }
}
```

错误场景：

| 错误信息 | 原因 |
|---------|------|
| 已有进行中的任务，请先结算 | 不能同时进行多个任务 |
| 精力不足，请休息后再来 | 能量低于行为消耗 |
| 需要等级 X（当前 Y） | 等级不足 |
| 需要金币 X（当前 Y） | 金钱不足 |
| 需要先完成前置学业: preschool | 学历前置条件不满足 |

---

### 3. 查询任务状态

```
GET /api/action/status
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "data": {
    "hasTask": true,
    "task": {
      "id": "...",
      "actionType": "work",
      "actionId": "delivery",
      "actionName": "外卖配送员",
      "startTime": "2024-05-27T10:30:00.000Z",
      "duration": 300,
      "elapsed": 150,
      "remaining": 150,
      "progress": 0.5,
      "isComplete": false
    }
  }
}
```

无任务时 `hasTask: false`，`task: null`。

---

### 4. 结算任务（领取奖励）

必须在任务时间结束后调用。

```
POST /api/action/collect
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "message": "结算成功",
  "data": {
    "actionType": "work",
    "actionId": "delivery",
    "actionName": "外卖配送员",
    "elapsedSeconds": 320,
    "moodLevel": "normal",
    "moodMultiplier": 1.0,
    "rewards": {
      "expGained": 18,
      "goldGained": 40,
      "attrGains": {},
      "itemsGained": [],
      "leveledUp": false,
      "newLevel": 3
    },
    "player": { /* 更新后的玩家数据 */ }
  }
}
```

心情倍率对奖励的影响：

| 心情 | 倍率 |
|------|------|
| 极差 | 0.8x |
| 差 | 0.9x |
| 普通 | 1.0x |
| 好 | 1.1x |
| 极好 | 1.2x |

---

### 5. 取消任务

```
POST /api/action/cancel
Authorization: Bearer <token>
```

没有奖励，直接取消。

---

### 6. 玩家完整信息

```
GET /api/player/profile
Authorization: Bearer <token>
```

返回玩家数据 + 当前任务状态。

---

### 7. 属性详情

```
GET /api/player/attributes
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "data": {
    "attributes": {
      "energy": 75,
      "mood": 88,
      "hunger": 65,
      "health": 100,
      "cleanliness": 90,
      "strength": 7,
      "intelligence": 10,
      "charm": 6
    },
    "battleAttributes": {
      "attack": 12,
      "defense": 12,
      "speed": 11,
      "dodge": 5,
      "hp": 105,
      "maxHp": 105
    },
    "level": 3,
    "exp": 250,
    "expToNext": 337,
    "expCurrent": 100,
    "moodLevel": "good",
    "moodMultiplier": 1.1,
    "currency": { "gold": 350, "points": 0, "achievement": 0 }
  }
}
```

---

### 8. 背包列表

```
GET /api/player/inventory
Authorization: Bearer <token>
```

---

### 9. 技能列表

```
GET /api/player/skills
Authorization: Bearer <token>
```

---

## 离线挂机结算

登录时会自动触发离线结算：
- 计算离线期间属性衰减（精力/饥饿/清洁/心情/健康）
- 如果有进行中的任务，按完成周期结算奖励
- 最多结算 100 个周期（防止溢出）

登录响应 `offlineResult` 字段示例：

```json
{
  "offlineMinutes": 30,
  "elapsedSeconds": 1800,
  "completedCycles": 3,
  "rewards": {
    "expGained": 120,
    "goldGained": 150,
    "attrGains": { "strength": 2 },
    "itemsGained": [{"itemId": "copper_ore", "count": 1}],
    "leveledUp": false,
    "newLevel": 5
  }
}
```

---

## 属性衰减说明

| 属性 | 衰减速度 (/分钟) | 最低值 |
|------|-----------------|--------|
| 精力 | 0.2 | 0 |
| 饥饿 | 0.15 | 0 |
| 清洁 | 0.1 | 0 |
| 心情 | 0.05 | 0 |
| 健康 | 饥饿为0时0.3/min | 0 |

---

## 教育系统学历链

```
学前班 → 小学 → 中学 → 高中 → 大学 → 研究生 → 博士
 (1)     (2)    (3)    (4)    (5)    (6)     (7)
```

每完成一个学历阶段：
- 解锁对应等级的打工岗位
- 获得属性加成（主要是智力和魅力）
- 记录为技能 `edu_<stage>`

## 采集系统

三种采集类型各有多个等级：

| 类型 | 初级 | 中级 | 高级 |
|------|------|------|------|
| 挖矿 | 铜矿(Lv1) | 铁矿(Lv5) / 金矿(Lv15) | 钻石(Lv30) |
| 伐木 | 松木(Lv1) | 橡木(Lv8) | 黑檀(Lv20) |
| 钓鱼 | 河钓(Lv1) | 湖钓(Lv10) | 海钓(Lv25) |

采集掉落使用权重随机，每项物品独立计算概率（weight: 0-100）。
