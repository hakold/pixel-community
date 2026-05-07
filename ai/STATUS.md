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
  - 核心玩法缺少“恢复手段/商店/出售/使用”的闭环
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

当前阶段：`M1 配置基线（已完成）`

当前目标：

- 建立 Excel 导表的最小可用链路
- 让服务端支持从独立配置目录读取
- 准备首批可直接参考填写的配置案例
- 保持现有玩法运行逻辑不被破坏

当前进行中的重点：

- Excel 采用“Excel 编辑后导出 UTF-8 CSV”作为 M1 输入格式
- 运行时目标目录为 `game-config/generated/`
- 地图配置暂时仍以 JSON 为主，不纳入第一批导表
- 当前已纳入导表：
  - `game_global.csv`
  - `actions.csv`
  - `action_drop_items.csv`
  - `skills.csv`
  - `items.csv`
  - `shops.csv`
  - `recovery_actions.csv`
- 已完成一轮真实联调：
  - 注册/登录
  - 商店列表
  - 购买
  - 出售
  - 恢复行为
  - 背包详情返回

## 未来规划

优先级从高到低：

1. `M1` 建立独立配置目录、Excel 模板、CSV 导表脚本、JSON 校验
2. `M2` 建立美术资源规范、资源清单、资源引用规则
3. `M3` 完成恢复闭环、商店、材料出售、道具使用
4. `M4` 批量扩展内容生产能力
5. `M5` 合成、任务、技能熟练度、更多地图
6. `M6` 战斗、装备、社交、房屋等长线系统

## 下一步建议

下一执行批次建议直接做：

1. 进入 M2 美术资源基线
2. 定义资源 manifest 与命名规范
3. 选择一块最小前端区域做资源配置化试点
