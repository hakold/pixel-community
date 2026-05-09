# Roadmap

## M1 配置基线

目标：建立"Excel -> 导表 -> JSON -> 热重载"的最小闭环。

当前状态：已完成 ✅

当前进展：

- 已完成 `game_global / actions / action_drop_items / skills / items / shops / recovery_actions` 七张 CSV
- 已完成导表脚本
- 已完成服务端读取目录切换
- 已完成静态配置运行时接入
- 已完成静态配置聚合接口
- 已完成商店/出售/恢复的最小接口接线
- 已完成真实联调验证
- 已完成 `levelExp.json` 自动生成
- `maps` 仍为 JSON 托管，尚未纳入 Excel 导表

交付物：

- 独立配置目录 `game-config/`
- Excel 模板样例
- 导表脚本
- JSON schema 或字段校验
- 配置说明文档

验收标准：

- 修改 Excel 中一行配置后，可以重新导出为 JSON
- 服务端可继续读取导出的 JSON
- 配置热重载仍然可用

## M2 美术资源基线 🔄

目标：建立资源模块化与配置化方案，并交付一版可在主城蓝图上验收的前端可玩地图。

当前状态：进行中

当前进展：

- 已创建 `client/public/assets/sprites/` 目录结构
- 已落地 `game-config/art/README.md` 美术完整规范
- 已创建 `tile-manifest.json`（地块→视觉配置）和 `sprite-manifest.json`（精灵注册表）
- 已新增 `GET /api/meta/tile-manifest` 服务端接口
- `renderer.js` 已切换为 manifest 驱动：sprite 优先 + procedural fallback
- `GameCanvas.vue` → `game-app.js` → `renderer.js` 加载链路已接线
- 已新增主城蓝图地图模式：
  - 背景图直出
  - 隐藏逻辑网格
  - POI 入口标记
  - 入口传送到室内图
- 已接入主城蓝图图：
  - `client/public/assets/maps/city-main-blueprint.png`
  - `game-config/generated/maps/city_blueprint.json`
- 已新增首批 POI 室内图：
  - `school_interior`
  - `restaurant_interior`
  - `mine_interior`
  - `fishing_pier`
  - `hospital_interior`
  - `convenience_store_interior`
- 已新增独立碰撞层能力：
  - 运行时优先读 `collisionMask`
  - 地图编辑器可切换到碰撞层刷可走/阻挡
  - 蓝图地图编辑器可直接显示背景图并校准碰撞
- 蓝图地图寻路已允许斜向移动，降低道路透视不一致时的别扭感
- 已确认下一步素材接入顺序：
  1. `isometric` 图集室内试点拆分
  2. `Icons_no_background` 第一批图标接入
  3. 按试点结果决定是否补最小渲染增强（`spriteScale` 或离线放大）
- 已完成最小渲染增强：
  - `renderer.js` 支持 `spriteScale`
  - `32x32` 切片可直接按倍数放大绘制
- 已完成室内试点第一批接入：
  - `interior_floor_beige_01`
  - `interior_wall_white_01`
  - 已挂到 `ground / wall` 两类 tile 上
- 已统一 tile 语义：
  - `ground`
  - `wall`
  - `grass`
- 已移除门语义，入口统一由 portal 表现
- 已校准室内图出口坐标：
  - 全部 6 个 interior map 出口已对齐 city_blueprint 对应入口附近
  - 全部 12 个 portal/exit 点已通过路径连通性验证
- 已完成 `Icons_no_background` 评估：
  - 共 148 个图标（8 类），适合 M5/M6 装备系统
  - **不在 M3 引入**，当前项目已有足够的基础图标
- 已新增 `grass_iso_01` 草地 sprite 替换（32x32, spriteScale:3）

待完成：

- [x] 角色/NPC 渲染配置化（actor-manifest.json）
- [x] 主城蓝图 POI 坐标与隐藏网格继续校准（出口坐标已对齐，连通性已验证）
- [x] `city_blueprint` 的 `collisionMask` 路径连通性验证（全部 portal/exit 可到达）
- [x] 按 `pic_resource/isometric/SPLIT_PLAN.md` 完成第一批室内试点拆分
- [x] 评估 `Icons_no_background` → 结论：留给 M5/M6 装备系统
- [ ] 进游戏验 `school_interior / restaurant_interior` 的室内替换效果
- [ ] `city_blueprint` 的 `collisionMask` 与背景图实际道路的精确对齐（需人工对照校准）
- [ ] 医院 / 商店对应的恢复 / 商店玩法在后续里程碑接线（M3）
- [ ] 更新 M2 验收记录与回归项

交付物：

- 美术资源规范文档 ✅
- 资源目录规范 ✅
- `asset manifest` 结构 ✅
- 最小可运行示例：地块配置化 ✅（sprite 链路已就位）
- 主城蓝图地图模式 ✅
- 主城 POI → 室内图传送链路 ✅（出口入口已对齐）
- 独立碰撞层与地图编辑器碰撞刷子 ✅

验收标准：

- 前端至少能通过配置切换一套地块或建筑资源 ✅（改 tile-manifest.json 颜色即可验证）
- 新增资源时无需改渲染核心逻辑 ✅（改 manifest 即可）
- 可以直接进入主城蓝图图验收，并完成"走到点 → 进室内 → 触发行为"的最小链路 🔄（代码链路已验证，待视觉验收）
- 可以在地图编辑器里直接校准蓝图地图的碰撞区域，而不是手改 JSON 🔄（编辑器已支持，待人工对照背景图校准）

## M3 核心玩法闭环

目标：补齐当前最缺的"衰减 -> 恢复 -> 消耗 -> 产出"循环。

交付物：

- 食物/休息/洗澡/娱乐/医疗
- 商店系统
- 材料出售功能
- 道具使用功能

验收标准：

- 玩家属性衰减后有明确恢复路径
- 采集物可出售
- 消耗品可直接影响属性

## M4 内容生产提速

目标：后续扩内容主要靠填表，不靠反复改代码。

交付物：

- 行为表扩展
- 掉落组配置
- 道具表
- 商店表
- NPC 服务配置
- 地图元信息配置

验收标准：

- 新增一个行为/道具/NPC 服务时，主要改表不改逻辑

## M5 中期玩法

目标：从单一挂机成长为多系统生活模拟。

交付物：

- 合成/烹饪
- 任务系统
- 技能熟练度接入
- 更多区域地图

## M6 长线系统

目标：构建长期留存玩法。

交付物：

- PvE 战斗
- 装备系统
- 社交与交易
- 房屋系统

## 当前推荐顺序

只建议按下面顺序推进：

1. `M1` ✅
2. `M2` 🔄
3. `M3`
4. `M4`
5. `M5`
6. `M6`

原因：

- 先把生产工具链搭好，后面内容扩展才不会反复返工
- 先补闭环，再补大系统，能更早形成可玩版本
