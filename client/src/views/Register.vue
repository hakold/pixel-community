<template>
  <div class="register-page">
    <div class="register-card">
      <!-- 标题 -->
      <h1 class="game-title">创建角色</h1>
      <p class="game-subtitle">注册账号并创建你的像素角色</p>

      <!-- 注册表单 -->
      <form class="register-form" @submit.prevent="handleRegister">
        <!-- 账号信息 -->
        <div class="section-title">账号信息</div>

        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model.trim="form.username"
            type="text"
            placeholder="3-20位字符"
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
            placeholder="至少6位"
            maxlength="30"
            :disabled="userStore.loading"
          />
        </div>

        <div class="form-group">
          <label for="confirmPwd">确认密码</label>
          <input
            id="confirmPwd"
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            maxlength="30"
            :disabled="userStore.loading"
          />
        </div>

        <!-- 角色信息 -->
        <div class="section-title">角色信息</div>

        <div class="form-group">
          <label for="characterName">角色名</label>
          <input
            id="characterName"
            v-model.trim="form.characterName"
            type="text"
            placeholder="1-12位字符"
            maxlength="12"
            :disabled="userStore.loading"
          />
        </div>

        <!-- 性别选择 -->
        <div class="form-group">
          <label>性别</label>
          <div class="gender-options">
            <label
              class="gender-btn"
              :class="{ active: form.gender === 'male' }"
            >
              <input
                v-model="form.gender"
                type="radio"
                value="male"
                :disabled="userStore.loading"
              />
              <span class="gender-icon">&#9794;</span>
              <span>男</span>
            </label>
            <label
              class="gender-btn"
              :class="{ active: form.gender === 'female' }"
            >
              <input
                v-model="form.gender"
                type="radio"
                value="female"
                :disabled="userStore.loading"
              />
              <span class="gender-icon">&#9792;</span>
              <span>女</span>
            </label>
          </div>
        </div>

        <!-- 错误提示 -->
        <p v-if="userStore.error" class="error-msg">{{ userStore.error }}</p>

        <!-- 提交按钮 -->
        <button class="btn-primary" type="submit" :disabled="userStore.loading">
          {{ userStore.loading ? '创建中...' : '创建角色' }}
        </button>
      </form>

      <!-- 底部链接 -->
      <p class="footer-link">
        已有账号？
        <router-link to="/login">返回登录</router-link>
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

// 表单数据
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  characterName: '',
  gender: 'male', // 默认男
});

/**
 * 表单验证
 * @returns {string|null} 错误信息或 null
 */
function validate() {
  if (!form.username || form.username.length < 3) {
    return '用户名至少需要3个字符';
  }
  if (!form.password || form.password.length < 6) {
    return '密码至少需要6个字符';
  }
  if (form.password !== form.confirmPassword) {
    return '两次输入的密码不一致';
  }
  if (!form.characterName || form.characterName.length < 1) {
    return '请输入角色名';
  }
  if (!form.gender) {
    return '请选择性别';
  }
  return null;
}

/**
 * 处理注册提交
 */
async function handleRegister() {
  const errMsg = validate();
  if (errMsg) {
    userStore.error = errMsg;
    return;
  }

  userStore.clearError();

  try {
    await userStore.doRegister({
      username: form.username,
      password: form.password,
      characterName: form.characterName,
      gender: form.gender,
    });
    router.replace('/game');
  } catch {
    // 错误已在 store 中处理
  }
}
</script>

<style scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 50%, #0f3460 100%);
  overflow-y: auto;
  padding: 40px 20px;
}

.register-card {
  width: 420px;
  padding: 36px 36px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.game-title {
  text-align: center;
  font-size: 28px;
  color: #e94560;
  letter-spacing: 6px;
  margin-bottom: 6px;
}

.game-subtitle {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 28px;
}

.section-title {
  font-size: 13px;
  color: rgba(233, 69, 96, 0.8);
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(233, 69, 96, 0.3);
  margin-bottom: 16px;
  margin-top: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.form-group input[type='text'],
.form-group input[type='password'] {
  width: 100%;
  height: 40px;
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

/* 性别选择 */
.gender-options {
  display: flex;
  gap: 12px;
}

.gender-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 40px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.gender-btn input[type='radio'] {
  display: none;
}

.gender-btn.active {
  color: #e94560;
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.1);
}

.gender-icon {
  font-size: 18px;
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
  margin-top: 8px;
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
