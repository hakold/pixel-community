/**
 * 一次性迁移脚本：将所有玩家属性的浮点数四舍五入为整数
 *
 * 用法：node server/scripts/roundAttributes.js
 *
 * 处理字段：
 *   - lifeAttributes: energy / mood / hunger / health / clean / strength / intelligence / charm
 *   - battleAttributes: attack / defense / speed / dodge / hp / maxHp
 *   - currency: gold / coupon / achievementPoint
 *   - exp
 */
const mongoose = require('mongoose');
const { connectMongoDB } = require('../src/config/db');
const Player = require('../src/models/Player');

const NUMBER_FIELDS = {
  lifeAttributes: ['energy', 'mood', 'hunger', 'health', 'clean', 'strength', 'intelligence', 'charm'],
  battleAttributes: ['attack', 'defense', 'speed', 'dodge', 'hp', 'maxHp'],
  currency: ['gold', 'coupon', 'achievementPoint'],
};

async function run() {
  await connectMongoDB();

  const players = await Player.find({});
  console.log(`[Migrate] 找到 ${players.length} 名玩家`);

  let updated = 0;

  for (const player of players) {
    let changed = false;

    // 生活属性
    for (const key of NUMBER_FIELDS.lifeAttributes) {
      if (player.lifeAttributes[key] !== undefined) {
        const rounded = Math.round(player.lifeAttributes[key]);
        if (player.lifeAttributes[key] !== rounded) {
          player.lifeAttributes[key] = rounded;
          changed = true;
        }
      }
    }

    // 战斗属性
    for (const key of NUMBER_FIELDS.battleAttributes) {
      if (player.battleAttributes[key] !== undefined) {
        const rounded = Math.round(player.battleAttributes[key]);
        if (player.battleAttributes[key] !== rounded) {
          player.battleAttributes[key] = rounded;
          changed = true;
        }
      }
    }

    // 货币
    if (player.currency) {
      for (const key of NUMBER_FIELDS.currency) {
        if (player.currency[key] !== undefined) {
          const rounded = Math.round(player.currency[key]);
          if (player.currency[key] !== rounded) {
            player.currency[key] = rounded;
            changed = true;
          }
        }
      }
    }

    // 经验
    if (player.exp !== undefined && player.exp !== Math.round(player.exp)) {
      player.exp = Math.round(player.exp);
      changed = true;
    }

    if (changed) {
      await player.save();
      updated++;
      console.log(`[Migrate] 已更新: ${player.characterName}`);
    }
  }

  console.log(`[Migrate] 完成: ${updated}/${players.length} 名玩家已修正`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Migrate] 失败:', err);
  process.exit(1);
});
