$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$proc = Start-Process -FilePath 'node' -ArgumentList '.\server\src\server.js' -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru

try {
  $health = $null
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/health' -TimeoutSec 2
      if ($health.code -eq 0) {
        break
      }
    } catch {
      # wait for server
    }
  }

  if (-not $health -or $health.code -ne 0) {
    throw '后端服务未能在预期时间内启动'
  }

  $suffix = Get-Date -Format 'HHmmss'
  $rand = Get-Random -Minimum 100 -Maximum 999
  $username = "it$suffix$rand"
  $password = 'test1234'
  $characterName = "T$rand"

  $registerBody = @{
    username = $username
    password = $password
    characterName = $characterName
    gender = 'male'
  } | ConvertTo-Json

  $register = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/auth/register' -ContentType 'application/json' -Body $registerBody

  $loginBody = @{
    username = $username
    password = $password
  } | ConvertTo-Json

  $login = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/auth/login' -ContentType 'application/json' -Body $loginBody

  $token = $login.data.token
  $playerId = $login.data.player._id
  $headers = @{
    Authorization = "Bearer $token"
  }

  $env:TEST_PLAYER_ID = $playerId
  $env:TEST_GOLD = '200'
  $env:TEST_ENERGY = '50'
  $env:TEST_HUNGER = '30'

  @'
const mongoose = require('./server/node_modules/mongoose');
const config = require('./server/src/config');
const Player = require('./server/src/models/Player');

(async () => {
  await mongoose.connect(config.mongodb.uri);
  await Player.updateOne(
    { _id: process.env.TEST_PLAYER_ID },
    {
      $set: {
        'currency.gold': Number(process.env.TEST_GOLD),
        'lifeAttributes.energy': Number(process.env.TEST_ENERGY),
        'lifeAttributes.hunger': Number(process.env.TEST_HUNGER)
      }
    }
  );
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@ | node -

  $shops = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/api/economy/shops' -Headers $headers

  $buyBody = @{
    shopId = 'general_store'
    itemId = 'bread'
    quantity = 2
  } | ConvertTo-Json
  $buy = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/economy/buy' -Headers $headers -ContentType 'application/json' -Body $buyBody

  $inventoryAfterBuy = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/api/player/inventory' -Headers $headers

  $sellBody = @{
    itemId = 'bread'
    quantity = 1
  } | ConvertTo-Json
  $sell = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/economy/sell' -Headers $headers -ContentType 'application/json' -Body $sellBody

  $recoveryList = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/api/recovery/list' -Headers $headers

  $mealBody = @{
    recoveryActionId = 'meal_canteen'
  } | ConvertTo-Json
  $meal = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/recovery/perform' -Headers $headers -ContentType 'application/json' -Body $mealBody

  $restBody = @{
    recoveryActionId = 'rest_bench'
  } | ConvertTo-Json
  $rest = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/recovery/perform' -Headers $headers -ContentType 'application/json' -Body $restBody

  $inventoryFinal = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/api/player/inventory' -Headers $headers
  $attributesFinal = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:3000/api/player/attributes' -Headers $headers

  $summary = [ordered]@{
    register = [ordered]@{
      username = $username
      playerId = $register.data.player._id
    }
    shops = [ordered]@{
      shopCount = $shops.data.shops.Count
      firstShop = $shops.data.shops[0].id
      firstShopEntryCount = $shops.data.shops[0].entries.Count
    }
    buy = [ordered]@{
      itemId = $buy.data.itemId
      quantity = $buy.data.quantity
      goldAfterBuy = $buy.data.currency.gold
    }
    sell = [ordered]@{
      itemId = $sell.data.itemId
      quantity = $sell.data.quantity
      gainedGold = $sell.data.gainedGold
      goldAfterSell = $sell.data.currency.gold
    }
    recoveryList = [ordered]@{
      count = $recoveryList.data.recoveryActions.Count
      ids = @($recoveryList.data.recoveryActions | ForEach-Object { $_.id })
    }
    meal = [ordered]@{
      applied = $meal.data.applied
      goldAfterMeal = $meal.data.currency.gold
      hungerAfterMeal = $meal.data.lifeAttributes.hunger
    }
    rest = [ordered]@{
      applied = $rest.data.applied
      goldAfterRest = $rest.data.currency.gold
      energyAfterRest = $rest.data.lifeAttributes.energy
    }
    inventoryAfterBuy = $inventoryAfterBuy.data.inventory
    inventoryFinal = $inventoryFinal.data.inventory
    finalAttributes = [ordered]@{
      gold = $attributesFinal.data.currency.gold
      energy = $attributesFinal.data.lifeAttributes.energy
      hunger = $attributesFinal.data.lifeAttributes.hunger
    }
  }

  $summary | ConvertTo-Json -Depth 8
}
finally {
  if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}
