<template>
  <div class="min-h-screen bg-gradient-to-br from-deep-blue-900 to-deep-blue-800 p-4 lg:p-6 overflow-hidden" ref="rootEl">
    <!-- Header -->
    <header class="flex items-center justify-between mb-4 lg:mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl lg:text-2xl font-bold text-white">E</div>
        <div>
          <h1 class="text-xl lg:text-3xl font-bold text-white">EAM 实施进度日报</h1>
          <p class="text-xs lg:text-sm text-gray-400">{{ currentDate }} · 每 {{ refreshInterval }}s 自动刷新</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-xs lg:text-sm text-green-300">实时</span>
        </div>
        <span class="text-xs lg:text-sm text-gray-500">{{ currentTime }}</span>
      </div>
    </header>

    <!-- Summary Cards Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 mb-4 lg:mb-6">
      <div v-for="card in summaryCards" :key="card.title"
        class="glass-card p-4 lg:p-6 glow-border relative overflow-hidden">
        <div class="absolute top-0 right-0 w-20 h-20 lg:w-32 lg:h-32 rounded-full opacity-5"
          :class="card.bgClass" style="transform: translate(30%, -30%)"></div>
        <p class="text-xs lg:text-base text-gray-400 mb-1">{{ card.title }}</p>
        <p class="text-2xl lg:text-5xl font-bold" :class="card.textClass">{{ card.value }}{{ card.suffix }}</p>
        <div v-if="card.trend !== null" class="flex items-center gap-1 mt-1 text-xs lg:text-sm"
          :class="card.trend >= 0 ? 'text-green-400' : 'text-red-400'">
          <span>{{ card.trend >= 0 ? '▲' : '▼' }}</span>
          <span>{{ Math.abs(card.trend) }}%</span>
        </div>
      </div>
    </div>

    <!-- Middle: Module Progress + Trend -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 mb-4 lg:mb-6" style="height: calc(100vh - 380px); min-height: 200px;">
      <!-- Module Progress Bars -->
      <div class="lg:col-span-2 glass-card p-4 lg:p-6 glow-border flex flex-col gap-4 lg:gap-6 justify-center">
        <div v-for="mod in moduleProgress" :key="mod.key">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg lg:text-2xl">{{ mod.icon }}</span>
              <span class="text-sm lg:text-lg font-medium text-gray-200">{{ mod.name }}</span>
            </div>
            <span class="text-lg lg:text-2xl font-bold" :class="rateColor(mod.rate)">{{ mod.rate }}%</span>
          </div>
          <div class="w-full h-3 lg:h-5 bg-deep-blue-900/50 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-1000 ease-out progress-glow"
              :class="mod.barClass" :style="{ width: mod.rate + '%' }"></div>
          </div>
          <div class="flex justify-between mt-1 text-xs lg:text-sm text-gray-500">
            <span>{{ mod.completed }}/{{ mod.total }} 已完成</span>
            <span v-if="mod.extra" class="text-blue-400">{{ mod.extra }}</span>
          </div>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="lg:col-span-3 glass-card p-4 lg:p-6 glow-border flex flex-col">
        <h3 class="text-sm lg:text-base font-medium text-gray-300 mb-3">完成率趋势 (7日)</h3>
        <div class="flex-1 relative min-h-0">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Bottom: Activity Feed -->
    <div class="glass-card p-4 lg:p-6 glow-border" style="max-height: 180px; overflow: hidden;">
      <h3 class="text-sm lg:text-base font-medium text-gray-300 mb-3">最近活动</h3>
      <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <div v-for="item in activities.slice(0, 12)" :key="item.id"
          class="flex-shrink-0 w-64 lg:w-80 p-3 rounded-lg bg-deep-blue-900/30">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">{{ moduleIcon(item.module) }}</span>
            <span class="text-xs lg:text-sm text-gray-200 truncate">{{ item.description }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span>{{ item.user_name }}</span>
            <span>·</span>
            <span>{{ formatTime(item.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { dashboardApi } from '../api/index.js'

Chart.register(...registerables)

const refreshInterval = 60
const rootEl = ref(null)
const chartCanvas = ref(null)
let chartInstance = null
let timer = null

const summary = ref(null)
const trendData = ref([])
const activities = ref([])
const currentTime = ref('')

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
})

const summaryCards = computed(() => {
  const s = summary.value?.summary
  if (!s) return [
    { title: '总任务', value: '--', suffix: '', textClass: 'text-blue-400', bgClass: 'bg-blue-500', trend: null },
    { title: '完成率', value: '--', suffix: '%', textClass: 'text-green-400', bgClass: 'bg-green-500', trend: null },
    { title: '待处理', value: '--', suffix: '', textClass: 'text-amber-400', bgClass: 'bg-amber-500', trend: null },
    { title: '今日问题', value: '--', suffix: '', textClass: 'text-red-400', bgClass: 'bg-red-500', trend: null },
  ]
  return [
    { title: '总任务', value: s.totalTasks, suffix: '', textClass: 'text-blue-400', bgClass: 'bg-blue-500', trend: 5 },
    { title: '完成率', value: s.avgCompletion, suffix: '%', textClass: 'text-green-400', bgClass: 'bg-green-500', trend: 3 },
    { title: '待处理', value: s.pendingTasks + s.blockedTasks, suffix: '', textClass: 'text-amber-400', bgClass: 'bg-amber-500', trend: -2 },
    { title: '今日问题', value: s.totalIssues, suffix: '', textClass: 'text-red-400', bgClass: 'bg-red-500', trend: 0 },
  ]
})

const moduleProgress = computed(() => {
  const m = summary.value?.modules
  if (!m) return []
  return [
    { key: 'inspection', name: '点检', icon: '🔍', rate: m.inspection?.completionRate || 0, total: m.inspection?.totalTasks || 0, completed: m.inspection?.completedTasks || 0, barClass: 'bg-gradient-to-r from-blue-600 to-blue-400', extra: '' },
    { key: 'maintenance', name: '保养', icon: '🔧', rate: m.maintenance?.completionRate || 0, total: m.maintenance?.totalTasks || 0, completed: m.maintenance?.completedTasks || 0, barClass: 'bg-gradient-to-r from-cyan-600 to-cyan-400', extra: '' },
    { key: 'repair', name: '报修', icon: '🚨', rate: m.repair?.responseRate || 0, total: m.repair?.totalTasks || 0, completed: m.repair?.completedTasks || 0, barClass: 'bg-gradient-to-r from-green-600 to-green-400', extra: m.repair?.avgResponseTime ? `平均 ${m.repair.avgResponseTime.toFixed(0)} 分钟` : '' },
  ]
})

function rateColor(rate) {
  if (rate >= 80) return 'text-green-400'
  if (rate >= 60) return 'text-blue-400'
  if (rate >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function moduleIcon(mod) {
  return { inspection: '🔍', maintenance: '🔧', repair: '🚨' }[mod] || '📋'
}

function formatTime(str) {
  if (!str) return ''
  const d = new Date(str)
  const diff = (Date.now() - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function renderChart() {
  if (chartInstance) chartInstance.destroy()
  if (!chartCanvas.value || !trendData.value.length) return

  const labels = trendData.value.map(d => {
    const dt = new Date(d.date)
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  })

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: '点检', data: trendData.value.map(d => d.inspection), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#3b82f6' },
        { label: '保养', data: trendData.value.map(d => d.maintenance), borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.08)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#22d3ee' },
        { label: '报修', data: trendData.value.map(d => d.repair), borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.08)', fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#a78bfa' },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 800 },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top', labels: { color: '#94a3b8', usePointStyle: true, padding: 16, font: { size: 13 } } },
        tooltip: { backgroundColor: 'rgba(13,42,80,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', borderColor: 'rgba(59,130,246,0.3)', borderWidth: 1, padding: 14, callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%` } }
      },
      scales: {
        x: { grid: { color: 'rgba(59,130,246,0.06)' }, ticks: { color: '#64748b', font: { size: 12 } } },
        y: { min: 0, max: 100, grid: { color: 'rgba(59,130,246,0.06)' }, ticks: { color: '#64748b', font: { size: 12 }, callback: v => v + '%' } }
      }
    }
  })
}

async function loadData() {
  try {
    const [s, t, a] = await Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getTrend(7),
      dashboardApi.getActivity(20)
    ])
    summary.value = s
    trendData.value = t.trend || []
    activities.value = a.activities || []
    await nextTick()
    renderChart()
  } catch (e) {
    console.error('Bigscreen load error:', e)
  }
}

function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

onMounted(async () => {
  await loadData()
  updateClock()
  timer = setInterval(() => {
    loadData()
    updateClock()
  }, refreshInterval * 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (chartInstance) chartInstance.destroy()
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
