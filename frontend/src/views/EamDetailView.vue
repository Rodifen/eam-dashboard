<template>
  <div class="space-y-6">
    <!-- Module Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :class="moduleIconBg">
          {{ moduleIcon }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">{{ moduleName }}实施详情</h2>
          <p class="text-sm text-gray-400">{{ selectedDate }} 数据概览</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <input
          type="date"
          v-model="selectedDate"
          @change="loadData"
          class="bg-deep-blue-800/50 border border-tech-border rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-blue-400">{{ progress?.total_tasks || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">总任务</p>
      </div>
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-green-400">{{ progress?.completed_tasks || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">已完成</p>
      </div>
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-amber-400">{{ progress?.in_progress_tasks || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">进行中</p>
      </div>
      <div class="glass-card p-4 text-center">
        <p class="text-2xl font-bold text-red-400">{{ progress?.blocked_tasks || 0 }}</p>
        <p class="text-xs text-gray-400 mt-1">已阻塞</p>
      </div>
    </div>

    <!-- Completion Progress -->
    <ProgressCard
      :title="`${moduleName}完成率`"
      :rate="progress?.completion_rate || 0"
      :total="progress?.total_tasks || 0"
      :completed="progress?.completed_tasks || 0"
      :color="module === 'inspection' ? 'blue' : module === 'maintenance' ? 'cyan' : 'green'"
    />

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <select
        v-model="statusFilter"
        @change="loadData"
        class="bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
      >
        <option value="">全部状态</option>
        <option value="completed">已完成</option>
        <option value="in_progress">进行中</option>
        <option value="pending">待处理</option>
        <option value="blocked">已阻塞</option>
      </select>
      <select
        v-model="priorityFilter"
        @change="loadData"
        class="bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
      >
        <option value="">全部优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
    </div>

    <!-- Task Table -->
    <DataTable
      :columns="tableColumns"
      :data="tasks"
      :pagination="pagination"
      @sort="onSort"
      @page-change="onPageChange"
    >
      <template #cell-title="{ row }">
        <div>
          <p class="text-sm font-medium text-gray-200">{{ row.title }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ row.description }}</p>
        </div>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.status" />
      </template>
      <template #cell-priority="{ row }">
        <span class="badge" :class="priorityClass(row.priority)">{{ priorityLabel(row.priority) }}</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <button
            v-if="row.status !== 'completed'"
            @click="updateTaskStatus(row.id, 'completed')"
            class="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            完成
          </button>
          <button
            v-if="row.status === 'pending'"
            @click="updateTaskStatus(row.id, 'in_progress')"
            class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            开始
          </button>
        </div>
      </template>
    </DataTable>

    <!-- Issues Section -->
    <div v-if="issues.length" class="glass-card p-6 glow-border">
      <h3 class="text-sm font-medium text-gray-300 mb-4">问题跟踪</h3>
      <div class="space-y-3">
        <div
          v-for="issue in issues"
          :key="issue.id"
          class="flex items-start gap-3 p-3 rounded-lg bg-deep-blue-900/30"
        >
          <span class="badge severity-badge" :class="`severity-${issue.severity}`">
            {{ issue.severity.toUpperCase() }}
          </span>
          <div class="flex-1">
            <p class="text-sm text-gray-200">{{ issue.title }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ issue.description }}</p>
            <div class="flex items-center gap-2 mt-2">
              <StatusBadge :status="issue.status" />
              <span class="text-xs text-gray-500">{{ issue.assigned_to || '未分配' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { eamApi } from '../api/index.js'
import ProgressCard from '../components/ProgressCard.vue'
import DataTable from '../components/DataTable.vue'
import StatusBadge from '../components/StatusBadge.vue'

const route = useRoute()
const module = computed(() => route.params.module)

const selectedDate = ref(new Date().toISOString().split('T')[0])
const statusFilter = ref('')
const priorityFilter = ref('')
const sortKey = ref('id')
const sortOrder = ref('desc')
const currentPage = ref(1)

const progress = ref(null)
const tasks = ref([])
const issues = ref([])
const pagination = ref(null)

const moduleName = computed(() => {
  const names = { inspection: '点检', maintenance: '保养', repair: '报修' }
  return names[module.value] || ''
})

const moduleIcon = computed(() => {
  const icons = { inspection: '🔍', maintenance: '🔧', repair: '🚨' }
  return icons[module.value] || '📋'
})

const moduleIconBg = computed(() => {
  const bgs = {
    inspection: 'bg-blue-500/20',
    maintenance: 'bg-cyan-500/20',
    repair: 'bg-purple-500/20'
  }
  return bgs[module.value] || 'bg-gray-500/20'
})

const tableColumns = [
  { key: 'title', label: '任务名称', sortable: true },
  { key: 'status', label: '状态', sortable: true },
  { key: 'priority', label: '优先级', sortable: true },
  { key: 'assignee', label: '负责人', sortable: true },
  { key: 'due_date', label: '截止日期', sortable: true },
  { key: 'actions', label: '操作', sortable: false }
]

async function loadData() {
  try {
    const data = await eamApi.getModule(module.value, {
      date: selectedDate.value,
      page: currentPage.value,
      pageSize: 20,
      status: statusFilter.value || undefined,
      priority: priorityFilter.value || undefined,
      sort: sortKey.value,
      order: sortOrder.value
    })
    progress.value = data.progress
    tasks.value = data.tasks.data
    issues.value = data.issues
    pagination.value = data.tasks.pagination
  } catch (e) {
    console.error('Failed to load module data:', e)
  }
}

async function updateTaskStatus(taskId, status) {
  try {
    await eamApi.updateTask(taskId, { status })
    loadData()
  } catch (e) {
    console.error('Failed to update task:', e)
  }
}

function onSort({ key, order }) {
  sortKey.value = key
  sortOrder.value = order
  loadData()
}

function onPageChange(page) {
  currentPage.value = page
  loadData()
}

function priorityClass(p) {
  const map = { high: 'badge-blocked', medium: 'badge-pending', low: 'badge-completed' }
  return map[p] || ''
}

function priorityLabel(p) {
  const map = { high: '高', medium: '中', low: '低' }
  return map[p] || p
}

watch(module, () => loadData())
onMounted(() => loadData())
</script>
