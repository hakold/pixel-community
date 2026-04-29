/**
 * Express 应用配置
 * 中间件注册 → 路由挂载 → 异常处理
 */
const express = require('express');
const cors = require('cors');
const registerRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { fail } = require('./utils/response');

const app = express();

// --------------- 全局中间件 ---------------

// CORS 跨域
app.use(cors());

// JSON 请求体解析
app.use(express.json());

// 请求日志
app.use((req, _res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// --------------- 路由挂载 ---------------

registerRoutes(app);

// --------------- 404 + 全局错误处理 ---------------

// 404 兜底
app.use((req, res) => {
  fail(res, `接口不存在: ${req.method} ${req.path}`, 404);
});

// 全局错误处理（必须放在最后，4 参数签名）
app.use(errorHandler);

module.exports = app;
