# Quick Start Scripts

这里放常用的一键脚本。

## 脚本列表

- `build-config.ps1`
  重新生成 `game-config/generated/`
- `start-dev-infra.ps1`
  使用 Docker Compose 启动 MongoDB 和 Redis
- `reset-dev-data.ps1`
  清空当前项目开发用 MongoDB 数据库和 Redis 当前库
- `start-lan-server.ps1`
  以 `0.0.0.0` 启动后端，便于局域网访问
- `integration-test.ps1`
  启动后端并跑一轮 M1 联调链路

## 使用说明

在仓库根目录执行，例如：

```powershell
powershell -ExecutionPolicy Bypass -File .\quick-start\build-config.ps1
```

注意：

- `reset-dev-data.ps1` 是破坏性操作，会清空开发数据
- `start-lan-server.ps1` 只启动后端，不会自动启动前端
- `integration-test.ps1` 会创建一个临时测试账号，并通过数据库为其写入最小测试金币与属性，以便验证购买/出售/恢复接口
