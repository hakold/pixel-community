# Art Resource Specification

## 目录结构

```
client/public/assets/sprites/    ← 实际图片资源（Vite 静态服务）
  tiles/                          ← 地块 sprite
  buildings/                      ← 建筑 sprite
  characters/                     ← 角色/NPC sprite
  icons/                          ← UI 图标
game-config/art/                  ← 资源配置（独立于 client/、server/）
  README.md                       ← 本文件
  tile-manifest.json              ← 地块→视觉配置映射
  sprite-manifest.json            ← 精灵资源注册表
```

---

## 一、素材格式规范（生成 / 导出时遵守）

### 1.1 文件格式

| 要求 | 值 |
|------|-----|
| 格式 | PNG（必须） |
| 色彩空间 | RGBA（必须带透明通道） |
| 位深 | 8-bit per channel |
| 背景 | 透明（需要透明的区域不要填色） |

为什么是 PNG：
- Canvas `drawImage()` 直接支持
- 透明通道让建筑不会遮挡不该遮挡的格子
- 像素画不会因为 JPEG 压缩产生噪点

### 1.2 像素尺寸（精确值）

当前网格参数：`tileWidth=96`, `tileHeight=48`, `blockHeight=54`

#### 地面 tile（grass / ground）

```
渲染方式：菱形 diamond，从 tile 中心向上下各 24px，向左右各 48px
菱形包围盒：96 × 48 像素
推荐 sprite 尺寸：96 × 60 像素（上下各留 6px 呼吸空间）
锚点：(0.5, 0.5) — 图片中心对齐 tile 中心
```

直观示意：
```
        ▲ (centerX, centerY-24)
       / \
      /   \
     <--96px-->
      \   /
       \ /
        ▼ (centerX, centerY+24)
```

#### 墙体 / 阻挡块（wall）

```
渲染方式：立方体 block，从 tile 中心向上延伸 blockHeight 像素
立方体包围盒：96 × 102 像素 (宽=tileWidth, 高=tileHeight+blockHeight)
推荐 sprite 尺寸：96 × 110 像素（底部留 8px 余量）
锚点：(0.5, 1.0) — 图片底部中心对齐 tile 中心（建筑从地面"长"出来）
```

直观示意：
```
        ┌──── 96px ────┐  ← 顶面 (centerY - 54)
        │               │
        │     顶面      │
        │               │
        ├──左面──┬──右面─┤
        │        │      │
        │        │      │  102px 总高
        │        │      │
        │        │      │
        └────────┴──────┘  ← 底面 (centerY + 48)
               ▲
          锚点 (0.5, 1.0)
```

#### 角色 / NPC

```
推荐 sprite 尺寸：48 × 64 像素
锚点：(0.5, 1.0) — 脚底对齐 tile 中心
```

#### 图标

```
推荐 sprite 尺寸：32 × 32 像素
锚点：(0.5, 0.5) — 居中
```

### 1.3 命名规则

```
{类别}_{名称}[_{变体编号}].png

正确示例：
  tiles/grass_01.png
  tiles/road_stone.png
  buildings/mine.png
  buildings/hospital.png
  buildings/school.png
  buildings/shop_convenience.png
  buildings/restaurant.png
  buildings/fishing_hut.png
  characters/npc_luna.png
  characters/player_base.png
  icons/icon_gold_32x32.png

错误示例：
  Grass.png              ← 不要大写
  road-stone.png         ← 不要连字符，用下划线
  mine_final_v2_ok.png   ← 不要版本标记，用数字后缀
```

---

## 二、从概念图裁切 sprite — 完整操作流程

假设你有一张整图（如 AI 生成的城市全景，1448×1086），里面包含多个建筑。

### 2.1 准备工作

1. 用图片编辑工具打开概念图（PS / Aseprite / GIMP / 甚至 Windows 画图）
2. 逐个框选每个建筑，记录像素坐标

### 2.2 裁切规则

每个建筑需要裁成一个**独立的 PNG 文件**，尺寸遵循上表的推荐值。

关键约束：
- 建筑的**底部中心**对齐裁切框的底部中心（对应锚点 0.5, 1.0）
- 裁切框宽度 = 96px（对齐游戏 tile 宽度）
- 裁切框高度 = 110px（覆盖 block 完整高度 + 余量）
- 建筑主体必须在框内，背景必须是透明的
- 如果建筑在图里不是等距视角，需要先调整为等距视角再裁

### 2.3 示例：从概念图裁切"矿场"

```
概念图 (1448×1086)
  ┌────────────────────────────────────────────┐
  │                                            │
  │     🏥         🏪                          │
  │              ⛏️                             │
  │  医院    便利店  矿场                      │
  │          🏫         🎣                      │
  │       学校              钓鱼台             │
  │     🍽️                                     │
  │  饭店                                     │
  └────────────────────────────────────────────┘

步骤：
1. 在概念图中找到矿场，框选它
2. 确定裁切框（以矿场底部中心为锚点）：
   - 宽度 = 96px
   - 高度 = 110px
   - 锚点位置 = 框的底部中心（x=48, y=110）
3. 裁切并保存为 buildings/mine.png
4. 去掉建筑以外的背景（设为透明）
5. 确保画布恰好是 96×110（不要多也不要少）

裁切框示意（以锚点为基准）：
        ┌──── 96px ────┐
        │              │
        │   建筑主体   │
        │              │
        │              │  110px
        │              │
        │              │
        └──────┬───────┘
           锚点 (48, 110) ← 建筑底部中心
```

### 2.4 批量裁切脚本

项目提供了裁切辅助脚本 `quick-start/slice-sprites.ps1`，可从大图按坐标批量裁切。

用法：
```powershell
# 1. 先编辑 quick-start/slice-sprites.ps1 中的 $slices 配置
# 2. 运行裁切
.\quick-start\slice-sprites.ps1
```

裁切配置模板（在脚本中修改）：
```powershell
$slices = @(
  @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 200; y = 300; w = 96; h = 110; name = "mine" },
  @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 400; y = 250; w = 96; h = 110; name = "hospital" },
  @{ src = "..."; x = 600; y = 350; w = 96; h = 110; name = "school" }
  # ... 逐个添加
)
```

---

## 三、注册 sprite 到游戏 — 三步走

### Step 1：放入图片

```
把裁好的 PNG 放到对应目录：
  client/public/assets/sprites/tiles/       ← 地面 tile
  client/public/assets/sprites/buildings/   ← 建筑/设施
  client/public/assets/sprites/characters/  ← 角色
  client/public/assets/sprites/icons/       ← 图标
```

### Step 2：登记到 sprite-manifest.json

编辑 `game-config/art/sprite-manifest.json`，在对应分类下登记：

```json
{
  "version": "1.0",
  "sprites": {
    "tiles": {
      "grass_01": {
        "path": "/assets/sprites/tiles/grass_01.png",
        "width": 96,
        "height": 60,
        "anchor": { "x": 0.5, "y": 0.5 }
      }
    },
    "buildings": {
      "mine": {
        "path": "/assets/sprites/buildings/mine.png",
        "width": 96,
        "height": 110,
        "anchor": { "x": 0.5, "y": 1.0 }
      }
    },
    "characters": {},
    "icons": {}
  }
}
```

每个 sprite 登记项说明：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 相对 public 的 URL 路径 |
| `width` | number | 是 | 图片实际宽度 (px) |
| `height` | number | 是 | 图片实际高度 (px) |
| `anchor.x` | 0~1 | 是 | 水平锚点，0=左 0.5=中 1=右 |
| `anchor.y` | 0~1 | 是 | 垂直锚点，0=上 0.5=中 1=下 |
| `spriteScale` | number | 否 | 运行时缩放倍数，默认 `1`。例如 `32x32` tile 可配 `3` 按像素风放大到 `96x96` 绘制 |
| `frames` | number | 否 | 动画帧数（如有时） |
| `frameWidth` | number | 否 | 单帧宽度（spritesheet 时） |

### Step 3：关联到 tile-manifest.json

编辑 `game-config/art/tile-manifest.json`，为要替换的 tile 加上 `sprite` 字段：

```json
{
  "tiles": {
    "building": {
      "layer": "raised",
      "anchor": { "x": 0.5, "y": 1.0 },
      "sprite": "/assets/sprites/buildings/mine.png",
      "render": {
        "mode": "block",
        "colors": { "top": "#b8795a", "left": "#8f563f", "right": "#744130" }
      }
    }
  }
}
```

注意：
- `sprite` 和 `render` 同时存在 → sprite 优先，失败时 fallback 到 render
- `sprite` 路径就是 `sprite-manifest.json` 中登记的 `path`
- 去掉 `sprite` 字段 → 恢复为纯 procedural 渲染
- **当前所有 tile 都只配了 `render`，所以现在是 procedural 保底效果**

---

## 四、验证 sprite 是否生效

1. 启动前端开发服务器
2. 打开浏览器 DevTools → Network 标签
3. 刷新页面，确认 `/assets/sprites/...` 请求返回 200（不是 404）
4. 在地图上观察对应 tile 是否从纯色菱形/方块变成了你的 sprite 图片

如果看到 sprite 了 → 成功。
如果还是纯色 → 检查 DevTools Console 是否有加载失败警告，检查 manifest 路径是否正确。

---

## 五、渲染模式参考

tile-manifest 中每个 tile 可配置：

### sprite 模式（有图时）
```json
{
  "grass": {
    "layer": "ground",
    "anchor": { "x": 0.5, "y": 0.5 },
    "sprite": "/assets/sprites/tiles/grass_01.png"
  }
}
```

### procedural 模式（无图保底）
```json
{
  "grass": {
    "layer": "ground",
    "render": {
      "mode": "diamond",
      "colors": { "fill": "#97c977", "stroke": "rgba(53, 85, 33, 0.2)" }
    }
  }
}
```

| mode | 适用 tile | colors 字段 | 说明 |
|------|-----------|-------------|------|
| `diamond` | grass, ground | `fill`, `stroke`, `highlight`(可选) | 菱形平面 |
| `block` | wall | `top`, `left`, `right` | 立方体三面 |

---

## 六、分层规范

渲染顺序从下到上：

| 层 | 内容 | 说明 |
|----|------|------|
| `ground` | 草地、道路、地板 | 先绘制，底层 |
| `raised` | 建筑、门 | 在 ground 之上，会遮挡角色 |
| `overlay` | 传送门标记、特效 | 最上层 |
| `ui` | 名字标签、hover | 最后绘制 |
