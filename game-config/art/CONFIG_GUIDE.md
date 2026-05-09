# 美术配置操作指南

本文档写给**不懂程序代码的策划和美术**阅读。

---

## 一、给美术：如何出资源

### 你需要出什么图

| 图片类型 | 用途 | 必须尺寸（宽×高） | 举例 |
|---------|------|------------------|------|
| 地块 | 草地、地面 | **96 × 60 像素** | grass_01.png |
| 墙体块 | 墙、阻挡块 | **96 × 110 像素** | wall_01.png |
| 角色 | 玩家、NPC | **48 × 64 像素** | npc_luna.png |
| 图标 | 金币、药水等 | **32 × 32 像素** | icon_gold.png |

### 技术要求

- **格式**：PNG（不是 JPG、不是 GIF）
- **背景**：必须透明（抠掉背景，保存时勾选"透明背景"）
- **风格**：像素画（pixel art），16-bit 复古 RPG 风格
- **文件名**：全小写英文 + 下划线，例如 `grass_01.png`、`npc_luna.png`
  - 正确：`shop_convenience.png`
  - 错误：`Shop Convenience.png`、`shop-convenience.png`

### 对齐规则（重要）

图片在游戏中的对齐方式由"锚点"决定：

```
地块：图片正中心对齐格子正中心
      ┌──────────┐
      │          │
      │   图片   │  ← 中心对准地面格
      │          │
      └────┬─────┘
           ▼ 格子中心

建筑：图片底部中心对齐格子中心
      ┌──────────┐
      │  建筑图  │
      │          │  ← 建筑从地面"长"出来
      │          │
      └────┬─────┘
           ▼ 底部对齐地面格中心

角色：图片底部中心对齐格子中心（脚踩在地上）
      ┌──────────┐
      │  角色图  │
      │          │
      │          │  ← 脚底对齐地面格中心
      └────┬─────┘
           ▼ 脚底
```

### 出图流程

1. 用 AI 工具或像素画软件生成/绘制图片
2. 检查尺寸是否精确（96×60 / 96×110 / 48×64 / 32×32）
3. 去掉背景，保存为 PNG
4. 文件名按要求命名
5. 把图片放到 `client/public/assets/sprites/` 下对应文件夹（tiles / buildings / characters / icons）
6. 告诉策划去登记这张图（见下方）

---

## 二、给策划：如何配置素材

### 你想做什么？

#### A. 我想给某个地块类型换一张图

例如：草地原来是绿色的，我想换成我自己找的 `grass_02.png`。

1. 确保图片已经放在 `client/public/assets/sprites/tiles/` 下
2. 用记事本打开 `game-config/art/tile-manifest.json`
3. 找到 `"grass"` 这一段：

```json
"grass": {
  "sprite": "/assets/sprites/tiles/grass_01.png",
  ...
}
```

4. 把 `grass_01.png` 改成你想要的图片名，例如 `grass_02.png`
5. 保存文件，刷新游戏页面（Ctrl+F5）
6. 草地就换了

#### B. 我想把某个墙体块的图换成另一张

例如：地图上所有墙体现在显示白色墙块，我想换成另一张墙体图。

1. 同样的文件 `game-config/art/tile-manifest.json`
2. 找到 `"wall"` 这一段
3. 把 `sprite` 路径改成新的墙体图片路径
4. 保存，刷新

#### C. 我想给某个 NPC 角色换一张图

例如：把 NPC "露娜" 的图换成新图。

1. 用记事本打开 `game-config/art/character-manifest.json`
2. 找到 `"npc_luna"` 这一段：

```json
"npc_luna": {
  "sprite": "/assets/sprites/characters/npc_luna.png",
  ...
}
```

3. 把图片名改成新的，例如 `npc_luna_02.png`
4. 保存，刷新

#### D. 我想新增一个 NPC 并给它配图

1. 把角色图片放入 `client/public/assets/sprites/characters/`
2. 在 `character-manifest.json` 中加一段：

```json
"npc_xiaoming": {
  "sprite": "/assets/sprites/characters/npc_xiaoming.png",
  "anchor": { "x": 0.5, "y": 1.0 }
}
```

3. 保存

**注意**：`npc_xiaoming` 这个 ID 需要和地图配置中的 actorId 一致。如果你只是在现有 NPC 基础上改 ID，需要同步改地图 JSON 中的 `"actorId"` 字段。

#### E. 我暂时没有图，想让某个角色退回"程序画的小人"

在 `character-manifest.json` 中，删除该角色的 `"sprite"` 那一行即可：

```json
"npc_luna": {
  "anchor": { "x": 0.5, "y": 1.0 }
}
```

没有 sprite 字段 → 游戏会自动用彩色几何图形画一个小人（保底效果）。

---

## 三、我需要改哪些文件

| 我要做的事 | 改哪个文件 | 在哪 |
|-----------|-----------|------|
| 换地块/墙体的图 | `tile-manifest.json` | `game-config/art/` |
| 换角色/NPC的图 | `character-manifest.json` | `game-config/art/` |
| 登记新图片 | `sprite-manifest.json` | `game-config/art/` |
| 放入新图片 | 直接放文件 | `client/public/assets/sprites/` 对应文件夹 |

**不需要改任何 JS 代码文件。**

如果图片本身较小，例如 `32x32` 的切片素材，也可以在 manifest 里加：

```json
"spriteScale": 3
```

表示运行时按 3 倍放大显示，不需要你手工先把图片放大成 `96x96` 再导入。

---

## 四、AI 生成素材清单

`pic_resource/asset_list.csv` 是一张 Excel 表格，列出了所有需要 AI 生成的素材。

用 Excel 打开后可以看到：
- **file_name**：生成后的文件名
- **prompt**：发给 AI 的提示词（英文）
- **width × height**：要求的像素尺寸
- **target_path**：生成后应该放到哪里
- **status**：当前状态

工作方式：
1. 打开 CSV，找到 status 为"待生成"的行
2. 复制 prompt 发给 AI 图片生成工具
3. AI 出图后保存到 `pic_resource/ai-generated/` 对应文件夹
4. 用图片工具裁切/修整到目标尺寸
5. 最终 PNG 放入 `target_path` 指定的位置
6. status 改为"已放入"
7. 按上面 B/C 的步骤在 manifest 中关联

---

## 五、常见问题

**Q：刷新后图没变？**
A：按 Ctrl+F5 强制刷新（跳过浏览器缓存）。

**Q：图显示了但位置不对？**
A：检查图片尺寸是否精确。建筑图如果不是 96×110，位置会偏移。

**Q：为什么很多墙体都显示同一张图？**
A：当前地图语义已统一为 `ground / wall / grass`。如果想让不同区域墙体不同，需要后续再增加墙体变体类型。

**Q：我不小心改坏了文件怎么办？**
A：用 Git 回退：`git checkout -- game-config/art/tile-manifest.json`
