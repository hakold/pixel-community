# Game Config

这个目录是项目后续统一的独立配置目录，职责是承接：

- Excel 策划源
- 模板案例
- 导表生成物
- 美术资源 manifest
- 配置 schema

## 当前状态

当前运行时优先使用 `game-config/generated/`。

这意味着：

- 目录结构设计已经落地
- 导表脚本与配置加载路径已经切换到独立目录优先
- 迁移完成后，`server/config/` 会逐步降级为兼容层或被移除

## 当前工作流

1. 在 `game-config/excel/` 中用 Excel 编辑 CSV
2. 运行 `node server/scripts/buildGameConfig.js`
3. 生成结果输出到 `game-config/generated/`
4. 服务端优先从 `game-config/generated/` 读取配置

## 当前已纳入导表

- `game_global.csv`
- `actions.csv`
- `action_drop_items.csv`
- `skills.csv`
- `items.csv`
- `shops.csv`
- `recovery_actions.csv`

## 目标结构

```text
game-config/
  excel/
  templates/
  generated/
  art/
  schemas/
```

## 迁移原则

- 先新增，不直接破坏现有运行逻辑
- 先保证导表产物正确，再切换读取路径
- 先做兼容层，再彻底移除旧路径
