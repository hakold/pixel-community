# AI 美术素材协作指南

本文档供后续 AI 模型（或人类协作者）接手美术素材生成工作时参考。

## 目录结构约定

```
pic_resource/
  asset_list.csv              ← 素材清单（Excel 可编辑），定义所有需要生成的素材
  *.png                        ← 概念图 / 参考图（AI 生成的原图输入）
  ai-generated/                ← AI 生成后、裁切前的中间产物
    tiles/
    buildings/
    characters/
    icons/

client/public/assets/sprites/  ← 最终 sprite 产出（游戏运行时直接读取）
  tiles/                        ← 96×60 PNG，锚点 (0.5, 0.5)
  buildings/                    ← 96×110 PNG，锚点 (0.5, 1.0)
  characters/                   ← 48×64 PNG，锚点 (0.5, 1.0)
  icons/                        ← 32×32 PNG，锚点 (0.5, 0.5)

game-config/art/
  README.md                    ← 美术完整规范（尺寸/锚点/分层/注册流程）
  tile-manifest.json           ← 地块→视觉配置映射（sprite + procedural fallback）
  sprite-manifest.json         ← 精灵资源注册表（登记所有 sprite 路径和参数）
```

## 素材清单说明

`pic_resource/asset_list.csv` 是核心物料表，每一行代表一个需要生成的 sprite。

### 字段解释

| 字段 | 说明 | 示例 |
|------|------|------|
| `file_name` | 输出文件名（snake_case） | `mine.png` |
| `category` | 类别：tiles / buildings / characters / icons | `buildings` |
| `prompt` | AI 生成提示词（英文） | `pixel art isometric building...` |
| `width` | 像素宽度 | `96` |
| `height` | 像素高度 | `110` |
| `format` | 文件格式 | `PNG` |
| `target_path` | 游戏运行时目标路径 | `client/public/assets/sprites/buildings/mine.png` |
| `status` | 状态标记 | `待生成` → `已生成` → `已放入` → `已验证` |
| `notes` | 补充说明 | 锚点、变体说明等 |

### 状态流转

```
待生成 → 已生成（AI 产出，放在 pic_resource/ai-generated/）
       → 已放入（裁切/修整后放入 client/public/assets/sprites/）
       → 已验证（在游戏中确认显示正确）
```

## 工作流

### 流程 A：逐素材生成（推荐，质量可控）

1. 打开 `pic_resource/asset_list.csv`
2. 找到状态为 `待生成` 的行
3. 将该行的 `prompt` 发给 AI 图片生成工具
4. AI 生成的图片保存到 `pic_resource/ai-generated/{category}/{file_name}`
5. 用图片编辑工具裁切/调整到目标尺寸（`width × height`）
6. 最终 PNG 放入 `target_path` 指定的位置
7. 将 status 更新为 `已放入`
8. 在 `game-config/art/sprite-manifest.json` 中登记
9. 如需替换现有 tile 渲染，在 `game-config/art/tile-manifest.json` 对应 tile 添加 `sprite` 字段
10. 启动游戏验证效果，通过后 status 更新为 `已验证`

### 流程 B：先出概念图再裁切

1. 给 AI 一个场景描述，生成整张概念图（如 `pic_resource/` 中已有的 1448×1086 全景）
2. 概念图放入 `pic_resource/`
3. 在 `pic_resource/asset_list.csv` 中为每个建筑填写裁切坐标
4. 运行 `quick-start/slice-sprites.ps1` 批量裁切
5. 裁切产物手动修整（去背景、调色、补细节）
6. 放入 `client/public/assets/sprites/` 对应目录
7. 后续同流程 A 的步骤 7-10

## 提示词编写指南

为保持风格统一，所有 prompt 使用以下模板：

```
pixel art {对象描述}, {视角}, {尺寸说明}, transparent background, 16-bit retro RPG style
```

关键约束词（每个 prompt 必须包含）：
- `pixel art` — 像素画风
- `transparent background` — 透明背景
- `16-bit retro RPG style` — 统一风格锚点

按类别补充词汇：

| 类别 | 补充约束 |
|------|---------|
| tiles | `top-down diamond shape, {W}x{H} canvas` |
| buildings | `isometric building, {W}x{H} canvas, bottom-center anchor` |
| characters | `character sprite, {W}x{H} canvas, bottom-center anchor` |
| icons | `item icon, {W}x{H} canvas, centered` |

## 当前素材状态

| 类别 | 总数 | 待生成 | 已生成 | 已放入 | 已验证 |
|------|------|--------|--------|--------|--------|
| tiles | 7 | 7 | 0 | 0 | 0 |
| buildings | 11 | 11 | 0 | 0 | 0 |
| characters | 6 | 6 | 0 | 0 | 0 |
| icons | 10 | 10 | 0 | 0 | 0 |
| **合计** | **34** | **34** | **0** | **0** | **0** |

## 渲染技术背景

本项目使用 Canvas 2D 等距渲染。每帧渲染顺序：

1. **ground 层** — 菱形地面 tile（grass/road/interior），锚点图片中心对齐 tile 中心
2. **路径预览** — 半透明蓝色菱形叠加
3. **hover 高亮** — 半透明黄色菱形叠加
4. **raised 层** — 立方体建筑 tile（building/door），锚点图片底部中心对齐 tile 中心
5. **传送门标记** — 半透明橙红圆圈 + "门" 文字
6. **角色层** — 玩家 / NPC / 远程玩家，按 Y 坐标深度排序

渲染器代码：[client/src/game/renderer.js](../client/src/game/renderer.js)

## 相关文档

- 美术完整规范：[game-config/art/README.md](../game-config/art/README.md)
- M2 路线图：[ROADMAP.md](./ROADMAP.md)
- 项目架构决策：[DECISIONS.md](./DECISIONS.md)
- 当前项目状态：[STATUS.md](./STATUS.md)
