# CSV Field Guide

M1 采用“Excel 编辑 -> UTF-8 CSV -> JSON”的轻量导表方案。

## 文件列表

- `game-config/excel/game_global.csv`
  全局参数，按 `path/type/value` 方式维护
- `game-config/excel/actions.csv`
  学习、打工、采集行为统一维护
- `game-config/excel/action_drop_items.csv`
  采集类行为的掉落明细
- `game-config/excel/skills.csv`
  技能配置
- `game-config/excel/items.csv`
  道具配置
- `game-config/excel/shops.csv`
  商店配置
- `game-config/excel/recovery_actions.csv`
  恢复玩法配置

## 使用方式

1. 用 Excel 打开对应 CSV
2. 编辑内容
3. 保存为 `CSV UTF-8`
4. 在仓库根目录运行 `node server/scripts/buildGameConfig.js`
5. 导出结果会写入 `game-config/generated/`

## game_global.csv

字段：

- `path`
  JSON 路径，例如 `player.initialLevel`
- `type`
  支持 `string`、`number`、`boolean`、`json`
- `value`
  实际值
- `comment`
  备注，不参与导出

## actions.csv

字段：

- `actionType`
  `study`、`work`、`mining`、`woodcut`、`fishing`
- `id`
  行为唯一 ID
- `name`
  行为名称
- `category`
  目前主要用于 `work`
- `stage`
  目前主要用于 `study`
- `description`
  描述
- `req_level`
- `req_gold`
- `req_strength`
- `req_intelligence`
- `req_charm`
- `req_education`
- `duration_sec`
- `energy_cost`
- `reward_exp`
- `reward_gold`
- `reward_attr_strength`
- `reward_attr_intelligence`
- `reward_attr_charm`
- `unlocks`
  多个值用 `|` 分隔

说明：

- 不适用的字段留空即可
- 采集类行为的掉落不写在这里，单独放在 `action_drop_items.csv`

## action_drop_items.csv

字段：

- `actionType`
- `actionId`
- `itemId`
- `count`
- `weight`

说明：

- 只为 `mining`、`woodcut`、`fishing` 使用
- 同一个行为可对应多行掉落记录

## skills.csv

字段：

- `id` `name` `category` `description`
- `max_level`
- `level_cost_type`
- `level_costs`
  多个值用 `|` 分隔
- 战斗字段：
  `type` `base_damage` `damage_per_level` `base_heal` `heal_per_level` `cooldown` `aoe` `stun_chance` `stun_chance_per_level`
- 每级效果字段：
  `effect_hunger` `effect_charisma` `effect_strength` `effect_attack` `effect_defense` `effect_speed` `effect_intelligence`

## items.csv

字段：

- `item_id` `name` `type`
- `quality`
- `max_stack`
- `sell_price`
- `buy_price`
- `use_effect_type`
- `use_effect_value`
- `tags`
  多个标签用 `|` 分隔
- `description`

## shops.csv

字段：

- `shop_id`
- `shop_name`
- `currency`
- `item_id`
- `price`
- `stock`
- `unlock_level`

说明：

- 同一个商店对应多行商品
- 导表后会按 `shop_id` 自动聚合

## recovery_actions.csv

字段：

- `id`
- `name`
- `recovery_type`
- `facility`
- `zone_id`
- `duration_sec`
- `cost_gold`
- `recover_energy`
- `recover_hunger`
- `recover_clean`
- `recover_mood`
- `recover_health`
- `req_level`
- `description`
