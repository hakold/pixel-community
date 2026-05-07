# Project Status

更新时间：2026-05-07

## 已做内容

- 项目现状已阅读并整理：
  - `GAME_FEATURES.md`
  - `BALANCE_DESIGN.md`
  - `server/config/*.json`
  - 地图配置与地图编辑器
  - 前端渲染与资源使用方式
- 已确认总体路线：
  - 先规划确认，再逐步执行
  - Excel 导表负责策划配置
  - 运行时继续消费 JSON
  - 地图 tile 数据继续用编辑器维护
  - 配置目录需要独立于 `client/` 和 `server/`
- 已识别当前关键缺口：
  - 配置结构存在，但没有 Excel 导表链路
  - 美术资源还没有 manifest 层，很多展示规则写死在代码里
  - 核心玩法缺少"恢复手段/商店/出售/使用"的闭环
- M1 当前已完成：
  - 已新增 `game-config/excel/` 下的 CSV 导表源案例
  - 已新增 `server/scripts/buildGameConfig.js`
  - 已生成 `game-config/generated/` 下的运行时 JSON
  - 服务端配置加载已切换为优先读取 `game-config/generated/`
  - 地图服务已切换为优先读取 `game-config/generated/maps/`
  - 已补第二批配置表：`skills / items / shops / recovery_actions`
  - 已新增 `quick-start/` 快速脚本目录
  - `ConfigManager` 已纳入 `items / shops / recoveryActions`
  - 已新增 `GET /api/meta/bootstrap` 作为静态配置读取入口
  - 已补 `ai/M1_CHECKLIST.md` 回归检查清单
  - 已补最小业务接口：
    - `GET /api/economy/shops`
    - `POST /api/economy/buy`
    - `POST /api/economy/sell`
    - `GET /api/recovery/list`
    - `POST /api/recovery/perform`
  - 背包接口已改为返回物品配置详情

## 当前内容

当前阶段：`M2 美术资源基线（已完成）` → `M3 核心玩法闭环（下一步）`

M2 已完成全部交付物：

- tile 渲染配置化 ✅ — `drawTile()` manifest 驱动，sprite 优先 + HARD_FALLBACK 保底
- 角色渲染配置化 ✅ — `drawActor()` manifest 驱动，sprite 优先 + procedural 保底
- 34 个 AI 生成 sprite 全部放入并关联 manifest
- `tile-manifest.json` 5 种 tile 全部配了 sprite
- `character-manifest.json` player_self + 3 个 NPC 配了 sprite
- `GET /api/meta/tile-manifest` + `GET /api/meta/character-manifest` 接口
- 完整美术规范 + 策划/美术配置操作指南（`CONFIG_GUIDE.md`）
- AI 素材生成清单（`asset_list.csv`）+ 协作指南（`ART_ASSETS.md`）
- 批量裁切脚本（`slice-sprites.ps1`）
- 名字标签 UI 调整（加大/加粗/上移/透明化）

已知限制：

- 所有 `building` tile 共用同一 sprite（无法按建筑子类型区分），需地图数据增加 buildingVariant 字段

## 未来规划

优先级从高到低：

1. `M1` 建立独立配置目录、Excel 模板、CSV 导表脚本、JSON 校验 ✅
2. `M2` 建立美术资源规范、资源清单、资源引用规则 🔄
3. `M3` 完成恢复闭环、商店、材料出售、道具使用
4. `M4` 批量扩展内容生产能力
5. `M5` 合成、任务、技能熟练度、更多地图
6. `M6` 战斗、装备、社交、房屋等长线系统

## 下一步建议

1. 继续 M2 剩余子任务（角色/NPC/建筑渲染配置化）
2. 或获取 sprite 资源后直接验证 sprite 渲染链路
3. 或推进 M3 核心玩法闭环
