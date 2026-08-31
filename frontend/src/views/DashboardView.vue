<template>
  <div class="space-y-6">
    <!-- Date Selector -->
    <div class="flex items-center gap-4">
      <input
        type="date"
        v-model="selectedDate"
        @change="onDateChange"
        class="bg-deep-blue-800/50 border border-tech-border rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
      />
      <button
        @click="resetToToday"
        class="px-4 py-2 text-xs rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
      >
        今天
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <SummaryCard
        title="总任务数"
        :value="summary?.totalTasks || 0"
        icon="📋"
        icon-bg="bg-blue-500/20"
        :trend="5"
        subtitle="今日全部任务"
      />
      <SummaryCard
        title="完成率"
        :value="summary?.avgCompletion || 0"
        suffix="%"
        icon="✅"
        icon-bg="bg-green-500/20"
        :trend="3"
        subtitle="综合完成率"
      />
      <SummaryCard
        title="待处理"
        :value="(summary?.pendingTasks || 0) + (summary?.blockedTasks || 0)"
        icon="⏳"
        icon-bg="bg-amber-500/20"
        :trend="-2"
        subtitle="待处理+阻塞"
      />
      <SummaryCard
        title="今日问题"
        :value="summary?.totalIssues || 0"
        icon="⚠️"
        icon-bg="bg-red-500/20"
        :trend="0"
        subtitle="需关注问题"
      />
    </div>

    <!-- Module Progress -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ProgressCard
        title="点检完成率"
        :rate="modules?.inspection?.completionRate || 0"
        :total="modules?.inspection?.totalTasks || 0"
        :completed="modules?.inspection?.completedTasks || 0"
        color="blue"
      />
      <ProgressCard
        title="保养完成率"
        :rate="modules?.maintenance?.completionRate || 0"
        :total="modules?.maintenance?.totalTasks || 0"
        :completed="modules?.maintenance?.completedTasks || 0"
        color="cyan"
      />
      <ProgressCard
        title="报修响应率"
        :rate="modules?.repair?.responseRate || 0"
        :total="modules?.repair?.totalTasks || 0"
        :completed="modules?.repair?.completedTasks || 0"
        :extra="modules?.repair?.avgResponseTime ? `平均 ${modules.repair.avgResponseTime.toFixed(0)} 分钟` : ''"
        color="green"
      />
    </div>

    <!-- Trend Chart & Activity -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2">
        <TrendChart
          title="完成率趋势"
          :data="trendData"
          :period="trendPeriod"
          @period-change="onPeriodChange"
        />
      </div>
      <ActivityFeed :items="activities" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js'
import SummaryCard from '../components/SummaryCard.vue'
import ProgressCard from '../components/ProgressCard.vue'
import TrendChart from '../components/TrendChart.vue'
import ActivityFeed from '../components/ActivityFeed.vue'

const store = useDashboardStore()
const selectedDate = ref(new Date().toISOString().split('T')[0])
const trendPeriod = ref(7)

const summary = computed(() => store.summary?.summary)
const modules = computed(() => store.summary?.modules)
const trendData = computed(() => store.trend)
const activities = computed(() => store.activities)

function onDateChange() {
  store.selectedDate = selectedDate.value
  store.fetchSummary(selectedDate.value)
}

function resetToToday() {
  selectedDate.value = new Date().toISOString().split('T')[0]
  onDateChange()
}

function onPeriodChange(days) {
  trendPeriod.value = days
  store.fetchTrend(days)
}

onMounted(() => store.loadAll())
</script>
