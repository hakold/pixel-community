/**
 * 认证 API 封装
 * 所有请求使用 axios，自动携带 JWT Token
 */
import axios from 'axios';
import { API_BASE_URL } from '@/config';

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器：自动附加 JWT Token
 */
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 响应拦截器：统一错误处理
 */
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // Token 过期或无效，清除本地状态
        localStorage.removeItem('token');
        localStorage.removeItem('player');
        window.location.hash = '#/login';
      }
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return Promise.reject(new Error('网络异常，请检查连接'));
  }
);

/**
 * 用户注册（含创建角色）
 * @param {Object} params
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @param {string} params.characterName - 角色名
 * @param {string} params.gender - 性别
 * @returns {Promise<Object>} { player, token }
 */
export function register(params) {
  return http.post('/auth/register', params).then((res) => res.data.data);
}

/**
 * 用户登录
 * @param {Object} params
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @returns {Promise<Object>} { player, token }
 */
export function login(params) {
  return http.post('/auth/login', params).then((res) => res.data.data);
}

/**
 * 获取当前玩家信息
 * @returns {Promise<Object>} { player }
 */
export function getProfile() {
  return http.get('/auth/me').then((res) => res.data.data);
}

export default http;
