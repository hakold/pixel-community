# Decisions

更新时间：2026-05-08

## 已确认决策

### 1. 配置来源与运行时分离

- Excel 是策划填写源
- JSON 是运行时配置
- 不直接在运行时读取 Excel

原因：

- 运行时简单稳定
- 易于做校验与热重载
- 兼容现有 `server/config/*.json` 结构

### 2. 地图格子不放入 Excel

- 地图 tile 矩阵继续由地图编辑器维护
- Excel 只负责地图元信息、资源引用、行为区/NPC/设施等非密集表格配置

原因：

- 大量二维格子数据不适合 Excel
- 现有地图编辑器已经能处理这部分工作

### 3. 配置目录需要独立于前后端

目标目录：仓库根目录下 `game-config/`

原则：

- `client/` 不持有业务配置源
- `server/` 不再作为配置归属目录
- 前后端都从独立配置目录消费导出结果

### 4. 先搭生产链路，再扩玩法

执行顺序固定为：

1. 配置体系
2. 美术资源体系
3. 核心闭环玩法
4. 内容扩展
5. 长线系统

### 5. AI 进度记录长期保留

- 使用根目录 `ai/` 作为 AI 协作目录
- 至少维护：
  - 已做内容
  - 当前内容
  - 未来规划

### 6. M1 先采用 Excel 编辑 + CSV 导出

- M1 输入格式先使用 UTF-8 CSV
- 策划可直接用 Excel 打开、编辑、另存为 CSV
- 运行时仍然只消费导出的 JSON

原因：

- 当前仓库没有现成的 `.xlsx` 解析依赖
- 先把导表链路跑通，比先引入复杂依赖更稳
- 后续如果有需要，再升级为直接读取 `.xlsx`

### 7. 常用运维动作独立到 `quick-start/`

- 项目根目录下维护 `quick-start/`
- 用于存放开发常用的一键脚本
- 破坏性脚本和启动脚本分开管理

### 8. 美术 sprite 资源目录与配置目录分离

- 二进制图片资源放在 `client/public/assets/sprites/`（Vite 静态服务）
- 资源配置（manifest）放在 `game-config/art/`（独立配置目录）
- 图片按类别分子目录：`tiles/`、`buildings/`、`characters/`、`icons/`

原因：

- Vite dev server 只服务 `client/public/` 下的静态文件
- manifest 作为配置归属 `game-config/`，遵循配置独立原则
- sprite 为二进制资源，不属于文本配置范畴

### 9. 渲染采用 sprite 优先 + procedural 保底的双轨策略

- tile-manifest 中每个 tile 可配置 `sprite` 和 `render` 两个字段
- 渲染器优先尝试 `sprite`（drawImage），失败或不存在时走 `render`（程序化绘制）
- procedural 支持 `diamond`（菱形地面）和 `block`（立方体建筑）两种模式

原因：

- 美术资源暂时不全，procedural 保底保证任何时候都能运行
- 资源就位后只需改 manifest 配置，无需改渲染代码
- 满足 M2 验收标准："前端至少能通过配置切换一套地块或建筑资源"

### 10. M2 主城外景改为"蓝图背景图 + 隐藏逻辑网格"

- 选定 `pic_resource/ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png` 作为当前主城蓝图
- 外景不再强行用重复 tile 拼整城
- 主城地图直接显示蓝图背景图
- 网格继续存在，但只用于：
  - 角色移动
  - 位置判定
  - POI/入口配置
  - 行为触发与传送
- 网格默认隐藏，必要时可通过配置临时显示用于校准

原因：

- 避免草地/道路 tile 拼接割裂
- 避免整张高像素概念图硬缩放后效果发糊
- 避免整栋建筑素材按 tile 重复铺满整片建筑区

### 11. M2 验收以"主城可走到点并进入对应玩法"为准

- 当前 M2 的产品验收目标改为：
  - 进入主城蓝图地图
  - 角色可正常移动
  - 可到达学校 / 餐馆 / 矿洞 / 钓鱼点等 POI
  - 踩中入口后传送到室内图
  - 在室内图中触发对应行为区
- 医院 / 便利店本阶段先保留为可进入的占位室内图
- 恢复 / 商店等完整玩法闭环放入后续里程碑处理

### 12. 可走/阻挡不再绑定 tile 类型，地图配置增加独立碰撞层

- 地图运行时优先读取 `collisionMask`
- `collisionMask` 中：
  - `0` = 可走
  - `1` = 阻挡
- 如果地图未配置 `collisionMask`，才回退到旧规则：
  - `ground` 可走
  - 其他 tile 阻挡
- 地图编辑器需要支持单独刷碰撞层，而不是只能通过改 tile 曲线救国

原因：

- 蓝图地图的视觉和 tile 类型不再一一对应
- 有些区域视觉是道路，但实际不希望玩家穿过去
- 有些区域视觉不是标准道路，但需要保留为可走廊道

### 13. 地图 tile 语义统一为 `ground / wall / grass`

- 不再保留独立的：
  - `road`
  - `interior`
  - `building`
  - `door`
- 统一收口为：
  - `ground`：可走地面
  - `wall`：墙体/阻挡块
  - `grass`：草地/自然地表
- 地图入口统一由 `portal` 标记和传送特效表达，不再依赖 door tile

## 暂不执行事项

- 暂不把战斗系统作为第一阶段目标
- 暂不把社交/房屋作为第一阶段目标
- 暂不重做地图编辑器
- 暂不建设复杂后台配置平台

## 独立配置目录的目标结构

```text
game-config/
  README.md
  excel/
  templates/
  generated/
    game.json
    study.json
    work.json
    mining.json
    woodcut.json
    fishing.json
    skills.json
    items.json
    shops.json
    recoveryActions.json
    levelExp.json
    maps/
  art/
    README.md
    tile-manifest.json
    sprite-manifest.json
  generated/
    maps/
      city_blueprint.json
      school_interior.json
      restaurant_interior.json
      mine_interior.json
      fishing_pier.json
  schemas/
```

说明：

- `excel/`：策划填写源文件
- `templates/`：模板与案例
- `generated/`：导表产物，供前后端读取
- `art/`：资源 manifest 与资源引用配置
- `schemas/`：字段校验规则
