# Decisions

更新时间：2026-05-07

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
  schemas/
```

说明：

- `excel/`：策划填写源文件
- `templates/`：模板与案例
- `generated/`：导表产物，供前后端读取
- `art/`：资源 manifest 与资源引用配置
- `schemas/`：字段校验规则
