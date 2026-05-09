# M2 Blueprint Acceptance

更新时间：2026-05-08

## 当前目标

M2 不再只看"资源配置化是否完成"，而是要交付一版**可以直接在主城蓝图图上验收**的前端可玩内容。

当前验收链路：

1. 进入主城蓝图地图
2. 角色在蓝图图上移动
3. 走到 POI 入口
4. 自动传送到对应室内图
5. 在室内图中进入行为区并打开对应玩法弹窗

## 已选蓝图

- 原图：`pic_resource/ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png`
- 运行时图片：`client/public/assets/maps/city-main-blueprint.png`
- 主城地图配置：`game-config/generated/maps/city_blueprint.json`

## 当前 POI 映射（2026-05-08 更新）

| 主城入口 | 入口坐标 | 室内图 | 出口坐标 | 当前作用 |
|------|------|------|------|------|
| 学校 | (18, 5) | `school_interior` | (18, 6) | `study` |
| 餐馆 | (16, 11) | `restaurant_interior` | (16, 12) | `work` |
| 矿洞 | (3, 5) | `mine_interior` | (3, 6) | `mining` |
| 钓鱼点 | (3, 11) | `fishing_pier` | (4, 11) | `fishing` |
| 医院 | (8, 4) | `hospital_interior` | (7, 4) | 占位入口 |
| 便利店 | (7, 11) | `convenience_store_interior` | (7, 12) | 占位入口 |

- 出口坐标已在 2026-05-08 校准：确保每个出口落点紧邻入口且 walkable + reachable
- 全部 12 个 portal/exit 点均已通过路径连通性验证（从 spawn 可到达）

## 当前实现约定

### 1. 主城地图模式

- `renderMode = "blueprint"`
- 背景图直接绘制
- 逻辑网格与视觉背景分离
- 网格默认隐藏
- 入口标记使用圆形 POI 标签

### 2. 隐藏网格用途

- 移动寻路
- 位置判定
- 入口落点
- 回城落点
- 后续可扩展成更细粒度碰撞

### 2.1 独立碰撞层

- 地图可配置 `collisionMask`
- `0 = 可走`
- `1 = 阻挡`
- 运行时优先读取碰撞层
- 地图编辑器已支持直接刷碰撞层，不再只能依赖 tile 类型

### 3. 室内图策略

- 室内继续沿用原有等距地图
- 不重做动作系统
- `study / work / mining / fishing` 先落到室内行为区
- `hospital / convenience_store` 先保留占位图，后续接 M3
- 室内 tile 已统一为 `ground / wall / grass`，素材试点已接入：
  - `ground` → `interior_floor_beige_01.png` (32x32, spriteScale:3)
  - `wall` → `interior_wall_white_01.png` (32x32, spriteScale:3)
  - `grass` → `grass_iso_01.png` (32x32, spriteScale:3)

## 验收重点

- 点击主城蓝图任意道路位置，角色能移动到目标附近
- 走到带标签的 POI 圆点时，能自动切进室内图
- 学校 / 餐馆 / 矿洞 / 钓鱼点室内有可触发的行为区
- 从室内返回主城后，落点位置在入口附近

## 若需要调坐标，优先改哪里

1. 改 `game-config/generated/maps/city_blueprint.json`
2. 主要改：
   - `grid.originOffsetX`
   - `grid.originOffsetY`
   - `grid.tileWidth`
   - `grid.tileHeight`
   - `portals[].x`
   - `portals[].y`
   - `player.spawnX`
   - `player.spawnY`
3. 如果只是想临时看网格：
   - 把 `background.showGrid` 改成 `true`
   - 或把 `background.showBlockedMask` 改成 `true`

## 编辑器校准建议

1. 打开地图编辑器，加载 `city_blueprint`
2. 切到 `碰撞` 图层
3. 对着背景图把道路刷成"可走"，把建筑和不可进入区域刷成"阻挡"
4. 需要回退时可点"按地块重建"
5. 保存后重新进游戏验移动路径

## 当前未收口项

- 主城 POI 入口坐标已校准，但需进游戏实际验背景图与网格对应关系
- 主城逻辑网格目前是粗网格，不是精细碰撞
- 蓝图概念图存在透视角度，碰撞层只能减少违和，不能把它完全变成严格俯视可导航图
- 医院 / 商店还没接真实玩法（M3）
- 室内 sprite 替换效果需进游戏实际验（school_interior / restaurant_interior），代码链路已验证正确
- collisionMask 道路连通性已验证（全部 portal/exit 可到达），但道路与背景图实际道路的精确对齐需人工校准
