<template>
  <div class="min-h-screen bg-gradient-to-br from-deep-blue-900 to-deep-blue-800">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 glass-card rounded-none border-l-0 border-t-0 border-b-0 z-30">
      <div class="p-6 border-b border-tech-border">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl font-bold">E</div>
          <div>
            <h1 class="text-lg font-bold text-white">EAM 实施日报</h1>
            <p class="text-xs text-gray-400">设备资产管理系统</p>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
          active-class="!bg-blue-500/20 !text-blue-400 border-l-2 border-blue-400"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-sm font-medium">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-tech-border">
        <div class="glass-card p-3 rounded-lg">
          <p class="text-xs text-gray-400">数据源</p>
          <p class="text-sm text-blue-400 font-medium">{{ activeSourceName }}</p>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 min-h-screen pb-20 lg:pb-0">
      <!-- Top Bar -->
      <header class="sticky top-0 z-20 glass-card rounded-none border-l-0 border-r-0 border-t-0 px-4 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ currentTitle }}</h2>
            <p class="text-xs text-gray-400">{{ currentDate }}</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="refreshData"
              class="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              title="刷新数据"
            >
              <svg class="w-5 h-5" :class="{ 'animate-spin': isRefreshing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span class="text-xs text-blue-300">系统在线</span>
            </div>
          </div>
        </div>
      </header>

      <div class="p-4 lg:p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 glass-card rounded-none border-b-0 border-l-0 border-r-0 z-30">
      <div class="flex">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex-1 flex flex-col items-center py-3 text-gray-400 transition-colors"
          active-class="!text-blue-400"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="text-[10px] mt-1">{{ item.name }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDashboardStore } from './stores/dashboard.js'

const route = useRoute()
const store = useDashboardStore()
const isRefreshing = ref(false)

const navItems = [
  { path: '/', name: '总览', icon: '📊' },
  { path: '/eam/inspection', name: '点检', icon: '🔍' },
  { path: '/eam/maintenance', name: '保养', icon: '🔧' },
  { path: '/eam/repair', name: '报修', icon: '🚨' },
  { path: '/data-source', name: '数据源', icon: '🗄️' },
  { path: '/manual-entry', name: '录入', icon: '📝' },
  { path: '/ai-requirements', name: 'AI分析', icon: '🤖' },
]

const currentTitle = computed(() => {
  const item = navItems.find(n => route.path === n.path || route.path.startsWith(n.path + '/'))
  return item ? item.name + ' - EAM实施进度日报' : 'EAM实施进度日报'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

const activeSourceName = computed(() => store.activeSource?.name || 'Demo数据')

async function refreshData() {
  isRefreshing.value = true
  await store.fetchSummary()
  setTimeout(() => { isRefreshing.value = false }, 1000)
}
</script>
