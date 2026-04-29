/**
 * 用户状态管理 (Pinia Store)
 * 管理登录态、玩家信息、Token 持久化
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  // ---------- 状态 ----------

  /** JWT Token */
  const token = ref(localStorage.getItem('token') || '');

  /** 玩家信息 */
  const player = ref(JSON.parse(localStorage.getItem('player') || 'null'));

  /** 加载状态 */
  const loading = ref(false);

  /** 错误信息 */
  const error = ref('');

  // ---------- 计算属性 ----------

  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value);

  /** 玩家 ID */
  const playerId = computed(() => player.value?._id || '');

  // ---------- 操作 ----------

  /**
   * 注册（含创建角色）
   * @param {Object} params - { username, password, characterName, gender }
   */
  async function doRegister(params) {
    loading.value = true;
    error.value = '';
    try {
      const data = await authApi.register(params);
      token.value = data.token;
      player.value = data.player;
      // 持久化存储
      localStorage.setItem('token', data.token);
      localStorage.setItem('player', JSON.stringify(data.player));
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 登录
   * @param {Object} params - { username, password }
   */
  async function doLogin(params) {
    loading.value = true;
    error.value = '';
    try {
      const data = await authApi.login(params);
      token.value = data.token;
      player.value = data.player;
      // 持久化存储
      localStorage.setItem('token', data.token);
      localStorage.setItem('player', JSON.stringify(data.player));
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 退出登录
   */
  function doLogout() {
    token.value = '';
    player.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('player');
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = '';
  }

  return {
    // 状态
    token,
    player,
    loading,
    error,
    // 计算属性
    isLoggedIn,
    playerId,
    // 操作
    doRegister,
    doLogin,
    doLogout,
    clearError,
  };
});
