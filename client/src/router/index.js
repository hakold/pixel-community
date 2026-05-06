/**
 * Vue Router 路由配置
 */
import { createRouter, createWebHashHistory } from 'vue-router';

// 懒加载
const Login = () => import('@/views/Login.vue');
const Register = () => import('@/views/Register.vue');
const Game = () => import('@/views/Game.vue');
const MapEditor = () => import('@/views/MapEditor.vue');

const routes = [
  { path: '/', redirect: '/game' },
  { path: '/login', name: 'Login', component: Login, meta: { guest: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guest: true } },
  { path: '/game', name: 'Game', component: Game, meta: { requiresAuth: true } },
  { path: '/editor', name: 'MapEditor', component: MapEditor, meta: { requiresAuth: true, localOnly: true } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

function isLocalBrowserHost() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * 全局路由守卫：未登录时跳转到登录，已登录时跳过登录/注册页
 */
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    // 需要登录但未登录 → 去登录页
    next('/login');
  } else if (to.meta.localOnly && !isLocalBrowserHost()) {
    next('/game');
  } else if (to.meta.guest && token) {
    // 已登录但访问登录/注册 → 去游戏页
    next('/game');
  } else {
    next();
  }
});

export default router;
