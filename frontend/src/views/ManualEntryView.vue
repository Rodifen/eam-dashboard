<template>
  <div class="space-y-6">
    <!-- Form -->
    <div class="glass-card p-6 glow-border">
      <h3 class="text-sm font-medium text-gray-300 mb-4">录入每日进度</h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">日期</label>
          <input
            v-model="form.date"
            type="date"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">模块</label>
          <select
            v-model="form.module"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          >
            <option value="inspection">点检</option>
            <option value="maintenance">保养</option>
            <option value="repair">报修</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">总任务数</label>
          <input
            v-model.number="form.total_tasks"
            type="number"
            min="0"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">已完成</label>
          <input
            v-model.number="form.completed_tasks"
            type="number"
            min="0"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">进行中</label>
          <input
            v-model.number="form.in_progress_tasks"
            type="number"
            min="0"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">待处理</label>
          <input
            v-model.number="form.pending_tasks"
            type="number"
            min="0"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">阻塞</label>
          <input
            v-model.number="form.blocked_tasks"
            type="number"
            min="0"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">备注</label>
          <input
            v-model="form.notes"
            type="text"
            placeholder="可选备注"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <!-- Auto calc preview -->
      <div class="mt-4 p-3 rounded-lg bg-deep-blue-900/30">
        <p class="text-xs text-gray-400">
          自动计算完成率: <span class="text-blue-400 font-medium">{{ calculatedRate }}%</span>
        </p>
      </div>

      <div class="flex gap-3 mt-4">
        <button
          @click="submitForm"
          :disabled="submitting"
          class="px-6 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
        >
          {{ submitting ? '提交中...' : '提交' }}
        </button>
        <button
          @click="resetForm"
          class="px-6 py-2 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-colors text-sm"
        >
          重置
        </button>
      </div>

      <div v-if="submitResult" class="mt-3 p-3 rounded-lg text-sm" :class="submitResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'">
        {{ submitResult.message }}
      </div>
    </div>

    <!-- Batch Import -->
    <div class="glass-card p-6 glow-border">
      <h3 class="text-sm font-medium text-gray-300 mb-4">批量导入</h3>
      <p class="text-sm text-gray-400 mb-4">粘贴JSON格式数据进行批量导入。格式: [{"date":"2024-01-01","module":"inspection","total_tasks":10,"completed_tasks":8}, ...]</p>

      <textarea
        v-model="batchData"
        rows="6"
        placeholder='[{"date":"2024-01-01","module":"inspection","total_tasks":10,"completed_tasks":8,"in_progress_tasks":1,"pending_tasks":1,"blocked_tasks":0,"notes":""}]'
        class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500/50"
      ></textarea>

      <button
        @click="batchImport"
        :disabled="importing"
        class="mt-3 px-6 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm disabled:opacity-50"
      >
        {{ importing ? '导入中...' : '批量导入' }}
      </button>

      <div v-if="importResult" class="mt-3 p-3 rounded-lg text-sm" :class="importResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'">
        {{ importResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { manualEntryApi } from '../api/index.js'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()

const form = ref({
  date: new Date().toISOString().split('T')[0],
  module: 'inspection',
  total_tasks: 0,
  completed_tasks: 0,
  in_progress_tasks: 0,
  pending_tasks: 0,
  blocked_tasks: 0,
  notes: ''
})

const submitting = ref(false)
const submitResult = ref(null)
const batchData = ref('')
const importing = ref(false)
const importResult = ref(null)

const calculatedRate = computed(() => {
  const t = form.value.total_tasks
  const c = form.value.completed_tasks
  return t > 0 ? Math.round((c / t) * 100 * 10) / 10 : 0
})

async function submitForm() {
  submitting.value = true
  submitResult.value = null
  try {
    await manualEntryApi.submitProgress(form.value)
    submitResult.value = { success: true, message: '数据提交成功！' }
    store.fetchSummary()
  } catch (e) {
    submitResult.value = { success: false, message: '提交失败: ' + (e.error || e.message) }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    module: 'inspection',
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    pending_tasks: 0,
    blocked_tasks: 0,
    notes: ''
  }
  submitResult.value = null
}

async function batchImport() {
  importing.value = true
  importResult.value = null
  try {
    const records = JSON.parse(batchData.value)
    if (!Array.isArray(records)) throw new Error('数据格式错误')
    const result = await manualEntryApi.batchImport(records)
    importResult.value = { success: true, message: `成功导入 ${result.imported} 条记录！` }
    batchData.value = ''
    store.fetchSummary()
  } catch (e) {
    importResult.value = { success: false, message: '导入失败: ' + (e.error || e.message) }
  } finally {
    importing.value = false
  }
}
</script>
