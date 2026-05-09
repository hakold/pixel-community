# Session Summary — M2 美术资源基线

日期：2026-05-07 ~ 2026-05-08

## 完成内容

M2 美术资源基线已交付。核心目标"资源配置化 + 模块化"已达成。

## 补充更新：M2 蓝图主城验收版（2026-05-08）

在美术资源基线之上，当前会话继续推进了 M2 的新验收口径：**主城蓝图图可直接进入并完成最小可玩链路**。

### 新增内容

- 新增主城蓝图地图模式：
  - 背景图直出
  - 隐藏逻辑网格
  - POI 入口标记
  - 蓝图地图点击移动
- 选定并接入蓝图图：
  - 原图：`pic_resource/ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png`
  - 运行时图：`client/public/assets/maps/city-main-blueprint.png`
- 新增主城地图：
  - `game-config/generated/maps/city_blueprint.json`
- 新增首批室内图：
  - `school_interior`
  - `restaurant_interior`
  - `mine_interior`
  - `fishing_pier`
  - `hospital_interior`
  - `convenience_store_interior`
- 前端默认起始地图切到 `city_blueprint`

### 当前可验收链路

1. 进入主城蓝图
2. 点击道路区域移动
3. 走到学校 / 餐馆 / 矿洞 / 钓鱼点 / 医院 / 便利店入口
4. 自动传送进室内图
5. 学校 / 餐馆 / 矿洞 / 钓鱼点室内可以触发对应行为区

### 当前留给后续 AI/开发者的调优点

- 主城入口坐标仍需结合实际画面继续微调
- 主城逻辑网格目前是粗网格，优先保证玩法入口验收
- 医院 / 便利店目前只做了占位入口与室内图，未接 M3 的恢复 / 商店玩法

## 补充更新：蓝图碰撞层与编辑器校准（2026-05-08）

- 地图运行时新增 `collisionMask` 支持，优先于 tile walkable 规则
- 地图编辑器新增"碰撞"图层，可刷：
  - 可走
  - 阻挡
- 蓝图地图在编辑器中可直接显示背景图，便于对照实际道路校准碰撞
- 蓝图地图寻路新增斜向移动，用于降低透视道路下的移动违和感

## 补充更新：室内素材试点拆分计划（2026-05-08）

- 已确认素材接入顺序：
  1. `isometric` 室内试点拆分
  2. `Icons_no_background` 图标接入
  3. 再决定是否补最小渲染增强
- 已新增：
  - `pic_resource/isometric/SPLIT_PLAN.md`
  - `pic_resource/isometric/slice_plan.csv`
- 当前第一张试点地图定为：`school_interior`

## 补充更新：室内试点已接入 + spriteScale（2026-05-08）

- 已从 `pic_resource/isometric/pico8-isometric.png` 裁出：
  - `interior_floor_beige_01.png`
  - `interior_wall_white_01.png`
- 渲染器已支持 `spriteScale`
- 当前 `tile-manifest.json` 已将：
  - `ground` → `interior_floor_beige_01` + `spriteScale: 3`
  - `wall` → `interior_wall_white_01` + `spriteScale: 3`
- 已评估 `Icons_no_background`：更适合后续装备/消耗品图标，不是当前室内试点的主优先级

## 补充更新：tile 语义统一（2026-05-08）

- 地图 tile 已统一为：
  - `ground`
  - `wall`
  - `grass`
- `door` 概念已移除
- 入口改由 portal 标记与传送特效表达
- `school_interior` 与 `restaurant_interior` 已改成纯地面+墙体布局

### 1. 渲染器改造

**文件：`client/src/game/renderer.js`**

- 地块渲染从硬编码 if-else 改为 manifest 驱动
  - `drawTile()` 读取 `tile-manifest.json`，优先 sprite（drawImage），fallback 到 procedural（diamond/block）
  - 内置 `HARD_FALLBACK` 常量，manifest 加载失败时仍可正常渲染
- 角色渲染从硬编码改为 manifest 驱动
  - `drawActor()` 按 actorId 查找 `character-manifest.json`，优先 sprite，fallback 到 procedural
  - NPC 精确匹配（npc_luna → npc_luna.png）；未匹配的走 npc_default / remote_player 兜底
  - 名字标签已调整：更靠上（Y=-78）、更大（18px 加粗）、更透明（0.67）、更宽（90×26）
- `getTileConfig()` 逻辑：manifest 优先 → HARD_FALLBACK 兜底

### 2. 美术规范与清单

**新增文件：**

| 文件 | 用途 |
|------|------|
| `game-config/art/README.md` | 完整美术规范：素材格式（PNG/RGBA）、精确尺寸（96×60/96×110/48×64/32×32）、锚点、分层、裁切流程、注册步骤 |
| `game-config/art/tile-manifest.json` | 4 种 tile → 视觉配置（sprite + procedural fallback），已关联 sprite |
| `game-config/art/sprite-manifest.json` | 精灵资源注册表，含填写示例 |
| `game-config/art/character-manifest.json` | 角色 → 视觉配置，player_self + 3 个 NPC + 兜底 |
| `pic_resource/asset_list.csv` | 34 条目素材清单（7 tiles + 11 buildings + 6 characters + 10 icons），含提示词、尺寸、目标路径、状态 |
| `pic_resource/ai-generated/` | AI 生成素材输出目录（tiles/buildings/characters/icons） |
| `quick-start/slice-sprites.ps1` | 从概念图批量裁切 sprite 的 PowerShell 脚本 |
| `ai/ART_ASSETS.md` | AI 美术协作指南（给后续 AI 模型阅读） |

### 3. 服务端

- 新增 `GET /api/meta/tile-manifest` — 返回地块视觉清单
- 新增 `GET /api/meta/character-manifest` — 返回角色视觉清单
- 修复 `configPaths.js` 未导出 `REPO_ROOT` 的 bug

### 4. 前端接线

- `gameplay.json` 新增 `tileManifestPath` 和 `characterManifestPath`
- `GameCanvas.vue` → `game-app.js` → `renderer.js` 完整 manifest 加载链路
- API 响应解包：`{ code, data }` 包装自动取 `.data`

### 5. 素材资源

- 34 个 PNG sprite 已放入 `client/public/assets/sprites/`
- 全部来自 AI 生成，覆蓋 tiles / buildings / characters / icons 四类

### 6. AI 协作文档

- `ai/STATUS.md` — 更新 M2 进展
- `ai/DECISIONS.md` — 新增决策 #8（资源目录分离）、#9（sprite 优先 + procedural 保底）
- `ai/ROADMAP.md` — M2 标记为进行中
- `ai/README.md` — 新增 ART_ASSETS.md 索引
- `ai/ART_ASSETS.md` — AI 美术协作完整指南

## 当前保底机制

| 层级 | 机制 |
|------|------|
| manifest 文件缺失 | 前端 catch 警告，tileManifest/characterManifest 为 null |
| manifest 加载为 null | renderer 使用 HARD_FALLBACK（5 种 tile 原始颜色） |
| tile 类型无配置 | renderer 回退到 HARD_FALLBACK |
| character 无 sprite | drawActor 走 procedural（bodyColor + hairColor 程序化） |
| sprite 图片 404 | drawImage 跳过，走 procedural |

**结论：任何情况下游戏都能正常渲染，不会白屏。**

## 架构约定（后续AI请注意）

1. 所有资源配置在 `game-config/art/` 下，图片资源在 `client/public/assets/sprites/` 下
2. manifest 通过 `/api/meta/` 接口暴露，响应为 `{ code, data, message }` 包装格式
3. 前端加载时需解包 `.data`，失败时 catch 不阻断启动
4. 新增 tile 类型或角色时：放图 → 登记 manifest → 重启验证
5. 目前所有 `building` tile 共用同一 sprite（mine.png），建筑子类型区分暂未实现

## 补充更新：M2 收口 — 出口坐标校准 + 图标评估（2026-05-08）

### 修复内容

1. **6 个室内图出口坐标校准**：
   - `school_interior` 出口：`(14,5)` → `(18,6)` — 对齐入口 (18,5)
   - `restaurant_interior` 出口：`(10,6)` → `(16,12)` — 对齐入口 (16,11)
   - `fishing_pier` 出口：`(22,8)` → `(4,11)` — 对齐入口 (3,11)，原目标 (3,12) 为 blocked
   - `hospital_interior` 出口：`(7,5)` → `(7,4)` — 紧邻入口 (8,4)
   - `convenience_store_interior` 出口：`(6,12)` → `(7,12)` — 对齐入口 (7,11)
   - `mine_interior` 出口：保持不变 `(3,6)` — 已正确

2. **碰撞层连通性验证**：
   - 编写 Node.js 验证脚本，确认全部 12 个 portal/exit 点 walkable + reachable from spawn
   - 全部通过 ✅

3. **Icons_no_background 最终评估**：
   - 148 个图标，8 类，绝大部分为 RPG 装备/武器图标
   - 适合 M5/M6 装备系统，不在 M3 引入
   - 现有 10 个 icon_*.png 已覆盖 M3 所需的资源/属性图标

### 更新文件列表

| 文件 | 变更 |
|------|------|
| `game-config/generated/maps/school_interior.json` | 出口坐标校准 |
| `game-config/generated/maps/restaurant_interior.json` | 出口坐标校准 |
| `game-config/generated/maps/fishing_pier.json` | 出口坐标校准 |
| `game-config/generated/maps/hospital_interior.json` | 出口坐标校准 |
| `game-config/generated/maps/convenience_store_interior.json` | 出口坐标校准 |
| `ai/STATUS.md` | 更新 M2 进展 + Icons 评估结论 |
| `ai/ROADMAP.md` | 更新 M2 待完成清单 |
| `ai/M2_BLUEPRINT_ACCEPTANCE.md` | 更新 POI 映射表 + 出口坐标 |

### 剩余需人工操作项

- 进游戏验 `school_interior / restaurant_interior` 室内 sprite 视觉效果
- 用地图编辑器对照背景图微调 collisionMask 道路精确对齐
