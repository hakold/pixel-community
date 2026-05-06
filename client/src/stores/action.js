/**
 * 行为系统状态管理 (Pinia Store)
 * 管理挂机任务的开始、进度、结算、取消
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as actionApi from '@/api/action';
import { useUserStore } from '@/stores/user';

export const useActionStore = defineStore('action', () => {
  // ---------- 状态 ----------

  /** 全量行为配置 { study: [...], work: [...], ... } */
  const actionList = ref({ study: [], work: [], mining: [], woodcut: [], fishing: [] });

  /** 当前任务状态 */
  const currentTask = ref(null);

  /** 结算结果（奖励展示用） */
  const collectResult = ref(null);

  /** 加载中 */
  const loading = ref(false);

  /** 错误信息 */
  const error = ref('');

  /** 轮询定时器 ID */
  let pollTimer = null;

  // ---------- 计算属性 ----------

  const hasTask = computed(() => currentTask.value?.hasTask ?? false);
  const task = computed(() => currentTask.value?.task ?? null);
  const isComplete = computed(() => task.value?.isComplete ?? false);
  const progress = computed(() => task.value?.progress ?? 0);

  // ---------- 操作 ----------

  /**
   * 获取全部行为配置
   */
  async function fetchActionList() {
    try {
      const data = await actionApi.getActionList();
      actionList.value = data;
    } catch (err) {
      error.value = err.message;
    }
  }

  /**
   * 查询当前任务状态
   */
  async function fetchTaskStatus() {
    try {
      const data = await actionApi.getStatus();
      currentTask.value = data;
    } catch {
      // 网络抖动时不覆盖已获取的任务状态
      if (currentTask.value && currentTask.value.hasTask) {
        // 保留现有状态，等下次轮询成功再更新
      } else {
        currentTask.value = null;
      }
    }
  }

  /**
   * 开始一个挂机任务
   * @param {string} actionType
   * @param {string} actionId
   */
  async function startAction(actionType, actionId) {
    loading.value = true;
    error.value = '';
    try {
      const data = await actionApi.startAction(actionType, actionId);
      // 从创建响应立即构建任务状态（不依赖后续 getStatus）
      const config = actionList.value[actionType]?.find(a => a.id === actionId);
      currentTask.value = {
        hasTask: true,
        task: {
          id: data.task?._id,
          actionType,
          actionId,
          actionName: config?.name || actionId,
          startTime: data.task?.startTime || new Date().toISOString(),
          duration: data.task?.duration || 0,
          elapsed: 0,
          remaining: data.task?.duration || 0,
          progress: 0,
          isComplete: false,
        },
      };
      // 更新玩家状态（精力已消耗）
      const userStore = useUserStore();
      if (data.player) {
        userStore.player = data.player;
        localStorage.setItem('player', JSON.stringify(data.player));
      }
      startPolling();
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 结算已完成任务，领取奖励
   */
  async function collectAction() {
    loading.value = true;
    error.value = '';
    try {
      const data = await actionApi.collectAction();
      collectResult.value = data;
      // 更新玩家状态（属性衰减 + 奖励）
      const userStore = useUserStore();
      if (data.player) {
        userStore.player = data.player;
        localStorage.setItem('player', JSON.stringify(data.player));
      }
      stopPolling();
      currentTask.value = null;
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 取消进行中的任务
   */
  async function cancelAction() {
    loading.value = true;
    error.value = '';
    try {
      await actionApi.cancelAction();
      stopPolling();
      currentTask.value = null;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /** 开始轮询任务进度（每 5 秒一次） */
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
      try {
        const data = await actionApi.getStatus();
        currentTask.value = data;
        if (!data.hasTask) {
          stopPolling();
        }
      } catch {
        // 网络波动不停止轮询，保留现有状态
        if (!currentTask.value || !currentTask.value.hasTask) {
          stopPolling();
        }
      }
    }, 5000);
  }

  /** 停止轮询 */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  /** 清除奖励展示 */
  function clearCollectResult() {
    collectResult.value = null;
  }

  /** 清除错误 */
  function clearError() {
    error.value = '';
  }

  return {
    actionList,
    currentTask,
    collectResult,
    loading,
    error,
    hasTask,
    task,
    isComplete,
    progress,
    fetchActionList,
    fetchTaskStatus,
    startAction,
    collectAction,
    cancelAction,
    startPolling,
    stopPolling,
    clearCollectResult,
    clearError,
  };
});
