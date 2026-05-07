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

目标：建立资源模块化与配置化方案，不再把视觉规则散落在渲染代码中。

当前状态：进行中

当前进展：

- 已创建 `client/public/assets/sprites/` 目录结构
- 已落地 `game-config/art/README.md` 美术完整规范
- 已创建 `tile-manifest.json`（地块→视觉配置）和 `sprite-manifest.json`（精灵注册表）
- 已新增 `GET /api/meta/tile-manifest` 服务端接口
- `renderer.js` 已切换为 manifest 驱动：sprite 优先 + procedural fallback
- `GameCanvas.vue` → `game-app.js` → `renderer.js` 加载链路已接线

待完成：

- [ ] 角色/NPC 渲染配置化（actor-manifest.json）
- [ ] 建筑独立渲染配置化（与 tile 解耦）
- [ ] 导入首批 sprite 资源并验证 drawImage 链路
- [ ] 更新 M1_CHECKLIST 加入 visual 回归项

交付物：

- 美术资源规范文档 ✅
- 资源目录规范 ✅
- `asset manifest` 结构 ✅
- 最小可运行示例：地块配置化 ✅（sprite 链路待资源就位后验证）

验收标准：

- 前端至少能通过配置切换一套地块或建筑资源 ✅（改 tile-manifest.json 颜色即可验证）
- 新增资源时无需改渲染核心逻辑 ✅（改 manifest 即可）

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
