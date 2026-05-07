# M1 Regression Checklist

更新时间：2026-05-07

## 目标

确认 M1 的“导表 -> 生成 -> 运行时读取”链路稳定可用。

## 检查步骤

1. 重新导表

命令：

```powershell
node server/scripts/buildGameConfig.js
```

预期：

- 成功输出到 `game-config/generated/`
- 至少生成：
  - `game.json`
  - `study.json`
  - `work.json`
  - `mining.json`
  - `woodcut.json`
  - `fishing.json`
  - `skills.json`
  - `items.json`
  - `shops.json`
  - `recoveryActions.json`
  - `levelExp.json`

2. 检查服务端实际读取目录

预期：

- 当 `game-config/generated/` 文件齐全时，服务端优先读取这个目录
- 当生成目录文件不完整时，自动回退到 `server/config/`

3. 检查配置管理器加载状态

预期：

- `ConfigManager` 能加载：
  - `game`
  - `study`
  - `work`
  - `mining`
  - `woodcut`
  - `fishing`
  - `skills`
  - `items`
  - `shops`
  - `recoveryActions`
  - `levelExp`

4. 检查地图兼容

预期：

- `GET /api/maps`
- 地图编辑器读取
- 地图保存到 `game-config/generated/maps/`

5. 检查静态配置接口

接口：

- `GET /api/meta/bootstrap`

预期：

- 能返回：
  - `game`
  - `actions`
  - `skills`
  - `items`
  - `shops`
  - `recoveryActions`

6. 检查经济与恢复接口

接口：

- `GET /api/economy/shops`
- `POST /api/economy/buy`
- `POST /api/economy/sell`
- `GET /api/recovery/list`
- `POST /api/recovery/perform`

预期：

- 商店列表可返回条目和对应物品配置
- 购买会扣金币并增加背包
- 出售会扣背包并增加金币
- 恢复行为会按配置恢复属性

7. 检查原有行为接口

接口：

- `GET /api/action/list`
- `POST /api/action/start`
- `GET /api/action/status`
- `POST /api/action/collect`
- `POST /api/action/cancel`

预期：

- 仍使用新配置目录中的行为配置
- 返回结构不回归

8. 检查快速脚本

脚本：

- `quick-start/build-config.ps1`
- `quick-start/start-dev-infra.ps1`
- `quick-start/reset-dev-data.ps1`
- `quick-start/start-lan-server.ps1`

预期：

- `build-config.ps1` 可直接运行
- `reset-dev-data.ps1` 在未确认时不会直接清库
- `start-lan-server.ps1` 会以 `SERVER_HOST=0.0.0.0` 启动

## 当前已验证

- 导表脚本可运行
- `quick-start/build-config.ps1` 可运行
- `quick-start/integration-test.ps1` 可运行
- `resetDevData.js` 在未加 `--yes` 时会拦截
- `ConfigManager` 已能加载 `game-config/generated/`
- `GET /api/meta/bootstrap` smoke test 已通过
- 注册/登录联调已通过
- 购买/出售联调已通过
- 恢复行为联调已通过
- 背包详情返回联调已通过
