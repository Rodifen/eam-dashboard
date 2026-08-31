<template>
  <div class="space-y-6">
    <!-- Active Source -->
    <div class="glass-card p-6 glow-border">
      <h3 class="text-sm font-medium text-gray-300 mb-4">当前数据源</h3>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-500/20">
          {{ activeSource ? sourceIcon(activeSource.type) : '❓' }}
        </div>
        <div>
          <p class="text-lg font-semibold text-white">{{ activeSource?.name || '未配置' }}</p>
          <p class="text-sm text-gray-400">{{ activeSource ? sourceLabel(activeSource.type) : '请选择数据源' }}</p>
        </div>
      </div>
    </div>

    <!-- Source Tabs -->
    <div class="flex gap-2 border-b border-tech-border pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-2 text-sm rounded-t-lg transition-colors"
        :class="activeTab === tab.key ? 'bg-blue-500/20 text-blue-300 border border-b-0 border-blue-500/30' : 'text-gray-500 hover:text-gray-300'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Demo Source -->
    <div v-if="activeTab === 'demo'" class="glass-card p-6 glow-border">
      <h4 class="text-sm font-medium text-gray-300 mb-4">演示数据</h4>
      <p class="text-sm text-gray-400 mb-4">使用系统内置的演示数据，包含30天的模拟实施进度数据。</p>
      <button
        @click="activateDemo"
        class="px-6 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm"
      >
        使用演示数据
      </button>
    </div>

    <!-- Manual Source -->
    <div v-if="activeTab === 'manual'" class="glass-card p-6 glow-border">
      <h4 class="text-sm font-medium text-gray-300 mb-4">手动录入</h4>
      <p class="text-sm text-gray-400 mb-4">通过手动输入或批量导入的方式录入数据。</p>
      <button
        @click="activateManual"
        class="px-6 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm"
      >
        启用手动录入
      </button>
    </div>

    <!-- SQL Source -->
    <div v-if="activeTab === 'sql'" class="glass-card p-6 glow-border space-y-4">
      <h4 class="text-sm font-medium text-gray-300">SQL 数据库连接</h4>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">数据库类型</label>
          <select v-model="sqlConfig.dbType" class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50">
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mssql">SQL Server</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">主机地址</label>
          <input v-model="sqlConfig.host" type="text" placeholder="localhost" class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">端口</label>
          <input v-model="sqlConfig.port" type="text" placeholder="3306" class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">数据库名</label>
          <input v-model="sqlConfig.database" type="text" placeholder="eam_db" class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">用户名</label>
          <input v-model="sqlConfig.username" type="text" placeholder="root" class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">密码</label>
          <input v-model="sqlConfig.password" type="password" placeholder="••••••" class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
        </div>
      </div>

      <div>
        <label class="block text-xs text-gray-400 mb-1">查询模板</label>
        <textarea
          v-model="sqlConfig.query"
          rows="4"
          placeholder="SELECT date, module, total_tasks, completed_tasks FROM daily_progress WHERE date = ?"
          class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-blue-500/50"
        ></textarea>
      </div>

      <div class="flex gap-3">
        <button
          @click="testConnection"
          :disabled="testing"
          class="px-6 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-sm disabled:opacity-50"
        >
          {{ testing ? '测试中...' : '测试连接' }}
        </button>
        <button
          @click="saveSqlConfig"
          class="px-6 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm"
        >
          保存配置
        </button>
      </div>

      <!-- Connection Result -->
      <div v-if="connectionResult" class="p-3 rounded-lg text-sm" :class="connectionResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'">
        {{ connectionResult.message || connectionResult.error }}
      </div>

      <!-- Query Preview -->
      <div v-if="queryResult" class="mt-4">
        <h5 class="text-xs text-gray-400 mb-2">查询预览 (前100条)</h5>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-tech-border">
                <th v-for="col in queryColumns" :key="col" class="px-3 py-2 text-left text-gray-400">{{ col }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-tech-border">
              <tr v-for="(row, i) in queryResult.rows.slice(0, 10)" :key="i" class="hover:bg-white/5">
                <td v-for="col in queryColumns" :key="col" class="px-3 py-2 text-gray-300">{{ row[col] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-gray-500 mt-2">共 {{ queryResult.count }} 条结果</p>
      </div>
    </div>

    <!-- Saved Sources -->
    <div class="glass-card p-6 glow-border">
      <h4 class="text-sm font-medium text-gray-300 mb-4">已保存的数据源</h4>
      <div class="space-y-3">
        <div
          v-for="source in sources"
          :key="source.id"
          class="flex items-center justify-between p-3 rounded-lg bg-deep-blue-900/30 hover:bg-deep-blue-900/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ sourceIcon(source.type) }}</span>
            <div>
              <p class="text-sm text-gray-200">{{ source.name }}</p>
              <p class="text-xs text-gray-500">{{ sourceLabel(source.type) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="source.is_active" class="badge badge-completed">使用中</span>
            <button
              v-if="!source.is_active"
              @click="activateSource(source.id)"
              class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              激活
            </button>
            <button
              v-if="!source.is_active"
              @click="deleteSource(source.id)"
              class="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
        <div v-if="!sources.length" class="text-center text-gray-500 py-4 text-sm">暂无保存的数据源</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { dataSourceApi } from '../api/index.js'
import { useDashboardStore } from '../stores/dashboard.js'

const store = useDashboardStore()

const activeTab = ref('demo')
const sources = ref([])
const activeSource = ref(null)
const testing = ref(false)
const connectionResult = ref(null)
const queryResult = ref(null)

const tabs = [
  { key: 'demo', label: '演示数据' },
  { key: 'manual', label: '手动录入' },
  { key: 'sql', label: 'SQL数据库' }
]

const sqlConfig = ref({
  dbType: 'mysql',
  host: 'localhost',
  port: '3306',
  database: '',
  username: '',
  password: '',
  query: "SELECT date, module, total_tasks, completed_tasks, completion_rate\nFROM daily_progress\nWHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)\nORDER BY date DESC"
})

const queryColumns = computed(() => {
  if (!queryResult.value?.rows?.length) return []
  return Object.keys(queryResult.value.rows[0])
})

function sourceIcon(type) {
  return { demo: '🎮', manual: '✏️', sql: '🗄️' }[type] || '❓'
}

function sourceLabel(type) {
  return { demo: '演示数据', manual: '手动录入', sql: 'SQL数据库' }[type] || '未知'
}

async function loadSources() {
  try {
    const data = await dataSourceApi.list()
    sources.value = data.sources
    activeSource.value = data.activeSource
    store.activeSource = data.activeSource
  } catch (e) {
    console.error('Failed to load sources:', e)
  }
}

async function activateDemo() {
  try {
    let demo = sources.value.find(s => s.type === 'demo')
    if (!demo) {
      const data = await dataSourceApi.create({ name: '演示数据', type: 'demo' })
      demo = data.source
    }
    await dataSourceApi.activate(demo.id)
    loadSources()
    store.fetchSummary()
  } catch (e) {
    console.error('Failed to activate demo:', e)
  }
}

async function activateManual() {
  try {
    let manual = sources.value.find(s => s.type === 'manual')
    if (!manual) {
      const data = await dataSourceApi.create({ name: '手动录入', type: 'manual' })
      manual = data.source
    }
    await dataSourceApi.activate(manual.id)
    loadSources()
    store.fetchSummary()
  } catch (e) {
    console.error('Failed to activate manual:', e)
  }
}

async function testConnection() {
  testing.value = true
  connectionResult.value = null
  try {
    connectionResult.value = await dataSourceApi.testConnection(sqlConfig.value)
  } catch (e) {
    connectionResult.value = { success: false, error: e.message || '连接失败' }
  } finally {
    testing.value = false
  }
}

async function saveSqlConfig() {
  try {
    const existing = sources.value.find(s => s.type === 'sql' && s.name === `${sqlConfig.value.dbType}@${sqlConfig.value.host}`)
    if (existing) {
      await dataSourceApi.update(existing.id, { config: sqlConfig.value })
    } else {
      await dataSourceApi.create({
        name: `${sqlConfig.value.dbType}@${sqlConfig.value.host}`,
        type: 'sql',
        config: sqlConfig.value
      })
    }
    loadSources()
  } catch (e) {
    console.error('Failed to save SQL config:', e)
  }
}

async function activateSource(id) {
  try {
    await dataSourceApi.activate(id)
    loadSources()
    store.fetchSummary()
  } catch (e) {
    console.error('Failed to activate source:', e)
  }
}

async function deleteSource(id) {
  try {
    await dataSourceApi.delete(id)
    loadSources()
  } catch (e) {
    console.error('Failed to delete source:', e)
  }
}

onMounted(() => loadSources())
</script>
