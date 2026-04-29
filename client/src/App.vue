<template>
  <div id="app-container">
    <router-view />
  </div>
</template>

<script setup>
/**
 * 根组件 - 仅提供路由出口
 * 后续阶段可在此添加全局布局（导航栏、背景等）
 */
</script>

<style>
#app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1a1a2e;
}
</style>
