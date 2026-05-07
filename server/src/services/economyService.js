const Player = require('../models/Player');
const { getItemsConfig, getItemConfig, getShopsConfig, getShopConfig } = require('../config/gameConfig');

function attachItemConfig(item) {
  return {
    itemId: item.itemId,
    count: item.count,
    item: getItemConfig(item.itemId)
  };
}

function normalizeQuantity(quantity) {
  const parsed = Number(quantity || 1);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('数量必须是大于 0 的整数');
  }
  return parsed;
}

function findInventoryItem(player, itemId) {
  return player.inventory.find((item) => item.itemId === itemId) || null;
}

function addInventoryItem(player, itemId, quantity) {
  const existingItem = findInventoryItem(player, itemId);
  if (existingItem) {
    existingItem.count += quantity;
    return existingItem;
  }

  const created = { itemId, count: quantity };
  player.inventory.push(created);
  return created;
}

function removeInventoryItem(player, itemId, quantity) {
  const existingItem = findInventoryItem(player, itemId);
  if (!existingItem || existingItem.count < quantity) {
    throw new Error('背包物品数量不足');
  }

  existingItem.count -= quantity;
  if (existingItem.count <= 0) {
    player.inventory = player.inventory.filter((item) => item.itemId !== itemId);
  }
}

function listItems() {
  return getItemsConfig() || [];
}

function listShops(playerLevel = 0) {
  const shops = getShopsConfig() || [];

  return shops.map((shop) => {
    return {
      ...shop,
      entries: shop.entries.map((entry) => {
        const item = getItemConfig(entry.itemId);
        return {
          ...entry,
          item,
          isUnlocked: !entry.unlockLevel || playerLevel >= entry.unlockLevel
        };
      })
    };
  });
}

async function buyItem(playerId, shopId, itemId, quantity) {
  const amount = normalizeQuantity(quantity);
  const shop = getShopConfig(shopId);
  if (!shop) {
    throw new Error('商店不存在');
  }

  const entry = (shop.entries || []).find((item) => item.itemId === itemId);
  if (!entry) {
    throw new Error('商店未出售该物品');
  }

  if (entry.unlockLevel && entry.unlockLevel > 0) {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('玩家不存在');
    }
    if (player.level < entry.unlockLevel) {
      throw new Error(`需要等级 ${entry.unlockLevel} 才能购买`);
    }
    return executeBuy(player, itemId, amount, entry.price, shop.currency);
  }

  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  return executeBuy(player, itemId, amount, entry.price, shop.currency);
}

async function executeBuy(player, itemId, quantity, unitPrice, currencyType) {
  if (currencyType !== 'gold') {
    throw new Error('当前仅支持金币购买');
  }

  const item = getItemConfig(itemId);
  if (!item) {
    throw new Error('物品配置不存在');
  }

  const totalPrice = unitPrice * quantity;
  if (player.currency.gold < totalPrice) {
    throw new Error(`金币不足（需要 ${totalPrice}，当前 ${player.currency.gold}）`);
  }

  player.currency.gold -= totalPrice;
  addInventoryItem(player, itemId, quantity);
  await player.save();

  return {
    itemId,
    quantity,
    totalPrice,
    currency: { gold: player.currency.gold },
    inventory: player.inventory.map(attachItemConfig)
  };
}

async function sellItem(playerId, itemId, quantity) {
  const amount = normalizeQuantity(quantity);
  const player = await Player.findById(playerId);
  if (!player) {
    throw new Error('玩家不存在');
  }

  const item = getItemConfig(itemId);
  if (!item) {
    throw new Error('物品配置不存在');
  }

  if (!item.sellPrice || item.sellPrice <= 0) {
    throw new Error('该物品不可出售');
  }

  removeInventoryItem(player, itemId, amount);
  const gainedGold = item.sellPrice * amount;
  player.currency.gold += gainedGold;
  await player.save();

  return {
    itemId,
    quantity: amount,
    gainedGold,
    currency: { gold: player.currency.gold },
    inventory: player.inventory.map(attachItemConfig)
  };
}

function formatInventory(inventory) {
  return (inventory || []).map(attachItemConfig);
}

module.exports = {
  listItems,
  listShops,
  buyItem,
  sellItem,
  formatInventory
};
