<template>
  <div class="min-h-screen bg-gradient-to-br from-deep-blue-900 to-deep-blue-800 pb-20">
    <!-- Header -->
    <header class="sticky top-0 z-20 glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold">E</div>
          <span class="text-base font-semibold text-white">EAM日报</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span class="text-xs text-gray-400">{{ currentDate }}</span>
        </div>
      </div>
    </header>

    <!-- Pull to refresh hint -->
    <div v-if="refreshing" class="text-center py-2">
      <span class="text-xs text-blue-400">刷新中...</span>
    </div>

    <!-- Summary Cards - 2 col grid -->
    <div class="grid grid-cols-2 gap-3 px-4 mt-4">
      <div v-for="card in summaryCards" :key="card.title" class="glass-card p-4 glow-border">
        <p class="text-xs text-gray-400 mb-1">{{ card.title }}</p>
        <p class="text-2xl font-bold" :class="card.textClass">{{ card.value }}{{ card.suffix }}</p>
      </div>
    </div>

    <!-- Module Progress -->
    <div class="px-4 mt-4 space-y-3">
      <div v-for="mod in moduleProgress" :key="mod.key" class="glass-card p-4 glow-border">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span>{{ mod.icon }}</span>
            <span class="text-sm font-medium text-gray-200">{{ mod.name }}</span>
          </div>
          <span class="text-lg font-bold" :class="rateColor(mod.rate)">{{ mod.rate }}%</span>
        </div>
        <div class="w-full h-2.5 bg-deep-blue-900/50 rounded-full overflow-hidden">
          <div class="h-full rounded-full progress-glow" :class="mod.barClass" :style="{ width: mod.rate + '%' }"></div>
        </div>
        <p class="text-xs text-gray-500 mt-1">{{ mod.completed }}/{{ mod.total }} 已完成</p>
      </div>
    </div>

    <!-- Quick Nav -->
    <div class="px-4 mt-4">
      <div class="grid grid-cols-3 gap-2">
        <router-link to="/eam/inspection" class="glass-card p-3 text-center glow-border">
          <span class="text-2xl">🔍</span>
          <p class="text-xs text-gray-300 mt-1">点检</p>
        </router-link>
        <router-link to="/eam/maintenance" class="glass-card p-3 text-center glow-border">
          <span class="text-2xl">🔧</span>
          <p class="text-xs text-gray-300 mt-1">保养</p>
        </router-link>
        <router-link to="/eam/repair" class="glass-card p-3 text-center glow-border">
          <span class="text-2xl">🚨</span>
          <p class="text-xs text-gray-300 mt-1">报修</p>
        </router-link>
      </div>
    </div>

    <!-- Mini Chart -->
    <div class="px-4 mt-4">
      <div class="glass-card p-4 glow-border">
        <h3 class="text-sm font-medium text-gray-300 mb-3">7日趋势</h3>
        <div style="height: 160px;">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="px-4 mt-4">
      <div class="glass-card p-4 glow-border">
        <h3 class="text-sm font-medium text-gray-300 mb-3">最近活动</h3>
        <div class="space-y-2.5 max-h-60 overflow-y-auto">
          <div v-for="item in activities.slice(0, 8)" :key="item.id"
            class="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
              :class="moduleBg(item.module)">{{ moduleIcon(item.module) }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-gray-200 truncate">{{ item.description }}</p>
              <p class="text-[10px] text-gray-500 mt-0.5">{{ item.user_name }} · {{ formatTime(item.created_at) }}</p>
            </div>
          </div>
          <div v-if="!activities.length" class="text-center text-gray-500 text-xs py-4">暂无活动</div>
        </div>
      </div>
    </div>

    <!-- Bottom Nav -->
    <nav class="fixed bottom-0 left-0 right-0 glass-card rounded-none border-b-0 border-x-0 z-30">
      <div class="flex">
        <router-link to="/mobile" class="flex-1 flex flex-col items-center py-2.5 text-blue-400">
          <span class="text-lg">📊</span>
          <span class="text-[10px] mt-0.5">总览</span>
        </router-link>
        <router-link to="/eam/inspection" class="flex-1 flex flex-col items-center py-2.5 text-gray-400">
          <span class="text-lg">🔍</span>
          <span class="text-[10px] mt-0.5">点检</span>
        </router-link>
        <router-link to="/eam/maintenance" class="flex-1 flex flex-col items-center py-2.5 text-gray-400">
          <span class="text-lg">🔧</span>
          <span class="text-[10px] mt-0.5">保养</span>
        </router-link>
        <router-link to="/eam/repair" class="flex-1 flex flex-col items-center py-2.5 text-gray-400">
          <span class="text-lg">🚨</span>
          <span class="text-[10px] mt-0.5">报修</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { dashboardApi } from '../api/index.js'

Chart.register(...registerables)

const chartCanvas = ref(null)
const refreshing = ref(false)
let chartInstance = null

const summary = ref(null)
const trendData = ref([])
const activities = ref([])

const currentDate = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日 ${['日','一','二','三','四','五','六'][d.getDay()]}`
})

const summaryCards = computed(() => {
  const s = summary.value?.summary
  if (!s) return [
    { title: '总任务', value: '--', suffix: '', textClass: 'text-blue-400' },
    { title: '完成率', value: '--', suffix: '%', textClass: 'text-green-400' },
    { title: '待处理', value: '--', suffix: '', textClass: 'text-amber-400' },
    { title: '问题数', value: '--', suffix: '', textClass: 'text-red-400' },
  ]
  return [
    { title: '总任务', value: s.totalTasks, suffix: '', textClass: 'text-blue-400' },
    { title: '完成率', value: s.avgCompletion, suffix: '%', textClass: 'text-green-400' },
    { title: '待处理', value: s.pendingTasks + s.blockedTasks, suffix: '', textClass: 'text-amber-400' },
    { title: '问题数', value: s.totalIssues, suffix: '', textClass: 'text-red-400' },
  ]
})

const moduleProgress = computed(() => {
  const m = summary.value?.modules
  if (!m) return []
  return [
    { key: 'inspection', name: '点检', icon: '🔍', rate: m.inspection?.completionRate || 0, total: m.inspection?.totalTasks || 0, completed: m.inspection?.completedTasks || 0, barClass: 'bg-gradient-to-r from-blue-600 to-blue-400' },
    { key: 'maintenance', name: '保养', icon: '🔧', rate: m.maintenance?.completionRate || 0, total: m.maintenance?.totalTasks || 0, completed: m.maintenance?.completedTasks || 0, barClass: 'bg-gradient-to-r from-cyan-600 to-cyan-400' },
    { key: 'repair', name: '报修', icon: '🚨', rate: m.repair?.responseRate || 0, total: m.repair?.totalTasks || 0, completed: m.repair?.completedTasks || 0, barClass: 'bg-gradient-to-r from-green-600 to-green-400' },
  ]
})

function rateColor(rate) { return rate >= 80 ? 'text-green-400' : rate >= 60 ? 'text-blue-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400' }
function moduleIcon(m) { return { inspection: '🔍', maintenance: '🔧', repair: '🚨' }[m] || '📋' }
function moduleBg(m) { return { inspection: 'bg-blue-500/20 text-blue-400', maintenance: 'bg-cyan-500/20 text-cyan-400', repair: 'bg-purple-500/20 text-purple-400' }[m] || 'bg-gray-500/20' }

function formatTime(str) {
  if (!str) return ''
  const diff = (Date.now() - new Date(str)) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${new Date(str).getMonth() + 1}/${new Date(str).getDate()}`
}

function renderChart() {
  if (chartInstance) chartInstance.destroy()
  if (!chartCanvas.value || !trendData.value.length) return

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: trendData.value.map(d => { const dt = new Date(d.date); return `${dt.getMonth()+1}/${dt.getDate()}` }),
      datasets: [
        { label: '点检', data: trendData.value.map(d => d.inspection), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: '保养', data: trendData.value.map(d => d.maintenance), borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: '报修', data: trendData.value.map(d => d.repair), borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(13,42,80,0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8', callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0 } },
        y: { min: 0, max: 100, grid: { color: 'rgba(59,130,246,0.06)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + '%' } }
      }
    }
  })
}

async function loadData() {
  refreshing.value = true
  try {
    const [s, t, a] = await Promise.all([
      dashboardApi.getSummary(),
      dashboardApi.getTrend(7),
      dashboardApi.getActivity(15)
    ])
    summary.value = s
    trendData.value = t.trend || []
    activities.value = a.activities || []
    await nextTick()
    renderChart()
  } catch (e) { console.error('Mobile load error:', e) }
  finally { refreshing.value = false }
}

onMounted(() => loadData())
</script>
