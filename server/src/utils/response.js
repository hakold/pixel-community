/**
 * 统一 API 响应格式
 * 所有接口返回统一结构，方便前端处理
 */

/**
 * 成功响应
 * @param {Object} res - Express response 对象
 * @param {*} data - 返回数据
 * @param {string} [message='ok'] - 提示信息
 * @param {number} [statusCode=200] - HTTP 状态码
 */
function success(res, data = null, message = 'ok', statusCode = 200) {
  return res.status(statusCode).json({
    code: 0,
    message,
    data,
  });
}

/**
 * 失败响应
 * @param {Object} res - Express response 对象
 * @param {string} message - 错误信息
 * @param {number} [statusCode=400] - HTTP 状态码
 * @param {number} [errCode=-1] - 业务错误码
 */
function fail(res, message = 'error', statusCode = 400, errCode = -1) {
  return res.status(statusCode).json({
    code: errCode,
    message,
    data: null,
  });
}

module.exports = { success, fail };
