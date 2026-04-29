/**
 * 行为系统 API
 */
import http from './auth';

/**
 * 获取全部行为配置列表
 * @returns {Promise<Object>} { study, work, mining, woodcut, fishing }
 */
export function getActionList() {
  return http.get('/action/list').then((res) => res.data.data);
}

/**
 * 开始挂机任务
 * @param {string} actionType - study | work | mining | woodcut | fishing
 * @param {string} actionId - 行为 ID
 * @returns {Promise<Object>} { task, player }
 */
export function startAction(actionType, actionId) {
  return http.post('/action/start', { actionType, actionId }).then((res) => res.data.data);
}

/**
 * 查询当前任务进度
 * @returns {Promise<Object>} { hasTask, task }
 */
export function getStatus() {
  return http.get('/action/status').then((res) => res.data.data);
}

/**
 * 结算已完成任务
 * @returns {Promise<Object>} { rewards, player, moodMultiplier, ... }
 */
export function collectAction() {
  return http.post('/action/collect').then((res) => res.data.data);
}

/**
 * 取消进行中的任务
 * @returns {Promise<Object>} { task }
 */
export function cancelAction() {
  return http.post('/action/cancel').then((res) => res.data.data);
}
