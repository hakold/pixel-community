/**
 * Vue3 应用入口
 * 创建应用实例，注册路由、状态管理
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);

// 状态管理
app.use(createPinia());

// 路由
app.use(router);

app.mount('#app');
