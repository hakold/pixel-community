# Project Status

更新时间：2026-05-08

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
- M2 蓝图主城验收链路已开始落地：
  - 已新增主城蓝图地图 `city_blueprint`
  - 已将选定蓝图图复制到 `client/public/assets/maps/city-main-blueprint.png`
  - 已新增"背景图 + 隐藏逻辑网格"地图渲染/点击映射支持
  - 已新增首批 POI 入口：
    - 学校
    - 餐馆
    - 矿洞
    - 钓鱼点
    - 医院
    - 便利店
  - 已新增首批室内图：
    - `school_interior`（study）
    - `restaurant_interior`（work）
    - `mine_interior`（mining）
    - `fishing_pier`（fishing）
    - `hospital_interior`（占位）
    - `convenience_store_interior`（占位）
  - 前端默认起始地图已切换为 `city_blueprint`
  - 已新增独立碰撞层：
    - 运行时优先读 `collisionMask`
    - 蓝图地图支持 8 方向寻路
    - 地图编辑器可直接刷可走 / 阻挡
    - 蓝图地图编辑器可显示背景图辅助校准

## 当前内容

当前阶段：`M2 美术资源基线 + 主城蓝图验收版（收口中）`

M2 当前已具备：

- tile 渲染配置化 ✅ — `drawTile()` manifest 驱动，sprite 优先 + HARD_FALLBACK 保底
- 角色渲染配置化 ✅ — `drawActor()` manifest 驱动，sprite 优先 + procedural 保底
- 主城蓝图地图模式 ✅ — 背景图 + 隐藏网格 + 入口标记
- 主城 → 室内图传送链路 ✅
- 室内行为区触发链路 ✅（study / work / mining / fishing）
- 独立碰撞层 ✅ — `collisionMask` 优先于 tile walkable 规则
- 地图编辑器碰撞绘制 ✅ — 可在背景图上直接刷碰撞
- 蓝图地图斜向移动 ✅ — 用于缓解道路角度与移动轴不一致
- tile 语义统一 ✅ — `ground / wall / grass`
- 入口表达统一 ✅ — portal 代替 door 概念
- `GET /api/meta/tile-manifest` + `GET /api/meta/character-manifest` 接口 ✅
- 完整美术规范 + 配置操作指南 ✅
- 室内素材试点接入 ✅：
  - `ground` → `interior_floor_beige_01.png`
  - `wall` → `interior_wall_white_01.png`
  - `grass` → `grass_iso_01.png`
- 室内图出口坐标校准 ✅ — 全部 6 个 interior map 出口已对齐 city_blueprint 入口
- 碰撞层路径连通性验证 ✅ — 全部 12 个 portal/exit 点从 spawn 可到达
- `Icons_no_background` 评估完成 ✅ — 148 个图标，8 个类别，适合 M5/M6 装备系统

当前正在收口：

- 室内 sprite 替换效果需进游戏实际验（school_interior / restaurant_interior）
- collisionMask 道路与背景图实际道路的精确对齐需人工校准
- 医院 / 便利店后续玩法占位说明

已知限制：

- 主城外景当前优先保证玩法入口验收，尚未做精细碰撞遮挡
- 蓝图网格是粗粒度逻辑网格，后续可继续细化坐标
- 蓝图概念图本身不是严格俯视图，碰撞层能修正"哪里能走"，但无法彻底消除透视导致的方向错觉
- 医院 / 便利店目前只完成可进入占位图，未接恢复 / 商店玩法
- 室内素材为 32x32 像素风（spriteScale:3 放大到 96x96），视觉适配效果需进游戏确认

## Icons_no_background 评估结论

- 共 148 个图标，分 8 类：axes / consumables / fans / rings_and_necklaces / slingshots / staffs / swords / tridents
- 绝大部分为 RPG 装备/武器图标，更适合 M5/M6 的装备/战斗系统
- consumables 类（12 个）可能与 M3 恢复道具部分重叠，但当前项目已有足够的基础图标（10 个 icon_*.png）
- **推荐：不在 M3 引入，留给 M5/M6 装备系统阶段统一接入**

## 未来规划

优先级从高到低：

1. `M1` 建立独立配置目录、Excel 模板、CSV 导表脚本、JSON 校验 ✅
2. `M2` 建立美术资源规范、资源清单、资源引用规则 🔄（收口中）
3. `M3` 完成恢复闭环、商店、材料出售、道具使用
4. `M4` 批量扩展内容生产能力
5. `M5` 合成、任务、技能熟练度、更多地图
6. `M6` 战斗、装备、社交、房屋等长线系统

## 下一步建议

1. 进游戏验 `school_interior / restaurant_interior` 室内 sprite 替换效果
2. 用地图编辑器微调 `city_blueprint` 的 `collisionMask`（已有背景图对照 + 碰撞刷子）
3. 若室内效果确认，扩第二批室内素材拆分
4. 推进 M3：医院接恢复玩法、便利店接商店玩法、道具使用闭环
