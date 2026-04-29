<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 标题 -->
      <h1 class="game-title">像素社区</h1>
      <p class="game-subtitle">欢迎回到像素世界</p>

      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model.trim="form.username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            maxlength="20"
            :disabled="userStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            maxlength="30"
            :disabled="userStore.loading"
          />
        </div>

        <!-- 错误提示 -->
        <p v-if="userStore.error" class="error-msg">{{ userStore.error }}</p>

        <!-- 提交按钮 -->
        <button class="btn-primary" type="submit" :disabled="userStore.loading">
          {{ userStore.loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <!-- 底部链接 -->
      <p class="footer-link">
        还没有账号？
        <router-link to="/register">注册角色</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  username: '',
  password: '',
});

async function handleLogin() {
  if (!form.username || !form.password) {
    userStore.error = '请填写用户名和密码';
    return;
  }

  userStore.clearError();

  try {
    await userStore.doLogin({
      username: form.username,
      password: form.password,
    });
    router.replace('/game');
  } catch {
    // 错误已在 store 中处理
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 50%, #0f3460 100%);
}

.login-card {
  width: 380px;
  padding: 40px 36px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.game-title {
  text-align: center;
  font-size: 32px;
  color: #e94560;
  letter-spacing: 8px;
  margin-bottom: 8px;
}

.game-subtitle {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  font-size: 14px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #e94560;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-group input:disabled {
  opacity: 0.5;
}

.error-msg {
  color: #e94560;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

.btn-primary {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #e94560, #c23152);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  letter-spacing: 4px;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer-link {
  margin-top: 24px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.footer-link a {
  color: #e94560;
  text-decoration: none;
}

.footer-link a:hover {
  text-decoration: underline;
}
</style>
