<template>
  <div class="space-y-6">
    <!-- Template Display -->
    <div class="glass-card p-6 glow-border">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-300">Prompt 模板</h3>
        <button
          @click="showTemplate = !showTemplate"
          class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {{ showTemplate ? '收起' : '展开' }}
        </button>
      </div>
      <div v-if="showTemplate" class="p-4 rounded-lg bg-deep-blue-900/50 border border-tech-border">
        <pre class="text-xs text-gray-300 whitespace-pre-wrap font-mono">{{ template }}</pre>
      </div>
    </div>

    <!-- Generate -->
    <div class="glass-card p-6 glow-border">
      <h3 class="text-sm font-medium text-gray-300 mb-4">生成分析报告</h3>
      <p class="text-sm text-gray-400 mb-4">基于当前数据自动生成EAM实施进度分析报告和产品需求文档。</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">数据日期</label>
          <input
            v-model="generateDate"
            type="date"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">分析周期</label>
          <select
            v-model="generateDays"
            class="w-full bg-deep-blue-800/50 border border-tech-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50"
          >
            <option :value="7">最近7天</option>
            <option :value="14">最近14天</option>
            <option :value="30">最近30天</option>
          </select>
        </div>
      </div>

      <button
        @click="generate"
        :disabled="generating"
        class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all text-sm disabled:opacity-50"
      >
        {{ generating ? '生成中...' : '🤖 生成分析报告' }}
      </button>
    </div>

    <!-- Generated Content -->
    <div v-if="generatedContent" class="glass-card p-6 glow-border">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium text-gray-300">{{ generatedTitle }}</h3>
        <div class="flex gap-2">
          <button
            @click="copyContent"
            class="px-3 py-1.5 text-xs rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
          >
            📋 复制
          </button>
          <button
            @click="downloadContent"
            class="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
          >
            📥 下载
          </button>
        </div>
      </div>

      <div v-if="dataUsed" class="flex gap-4 mb-4 text-xs text-gray-500">
        <span>进度记录: {{ dataUsed.progressRecords }} 条</span>
        <span>趋势数据: {{ dataUsed.trendDays }} 天</span>
        <span>待解决问题: {{ dataUsed.openIssues }} 个</span>
      </div>

      <div class="prose prose-invert prose-sm max-w-none">
        <div class="markdown-content" v-html="renderedContent"></div>
      </div>
    </div>

    <!-- Saved Reports -->
    <div class="glass-card p-6 glow-border">
      <h3 class="text-sm font-medium text-gray-300 mb-4">历史报告</h3>
      <div class="space-y-2">
        <div
          v-for="req in savedRequirements"
          :key="req.id"
          class="flex items-center justify-between p-3 rounded-lg bg-deep-blue-900/30 hover:bg-deep-blue-900/50 transition-colors cursor-pointer"
          @click="loadRequirement(req.id)"
        >
          <div>
            <p class="text-sm text-gray-200">{{ req.title }}</p>
            <p class="text-xs text-gray-500">{{ req.created_at }}</p>
          </div>
          <span class="text-blue-400 text-sm">→</span>
        </div>
        <div v-if="!savedRequirements.length" class="text-center text-gray-500 py-4 text-sm">暂无历史报告</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { aiApi } from '../api/index.js'

const showTemplate = ref(false)
const template = ref('')
const generateDate = ref(new Date().toISOString().split('T')[0])
const generateDays = ref(7)
const generating = ref(false)
const generatedContent = ref('')
const generatedTitle = ref('')
const dataUsed = ref(null)
const savedRequirements = ref([])

const renderedContent = computed(() => {
  // Simple markdown rendering
  let html = generatedContent.value
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => `<td class="px-3 py-2 border border-tech-border">${c.trim()}</td>`)
      return `<tr>${cells.join('')}</tr>`
    })
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br>')

  // Wrap tables
  html = html.replace(/(<tr>.*<\/tr>)+/gs, '<table class="w-full text-sm border-collapse border border-tech-border my-4"><tbody>$&</tbody></table>')

  return `<p class="mb-3">${html}</p>`
})

async function loadTemplate() {
  try {
    const data = await aiApi.getTemplate()
    template.value = data.template
  } catch (e) {
    console.error('Failed to load template:', e)
  }
}

async function loadSaved() {
  try {
    const data = await aiApi.getRequirements()
    savedRequirements.value = data.requirements || []
  } catch (e) {
    console.error('Failed to load saved requirements:', e)
  }
}

async function generate() {
  generating.value = true
  try {
    const data = await aiApi.generate({ date: generateDate.value, days: generateDays.value })
    generatedContent.value = data.content
    generatedTitle.value = data.title
    dataUsed.value = data.dataUsed
    loadSaved()
  } catch (e) {
    console.error('Failed to generate:', e)
  } finally {
    generating.value = false
  }
}

async function loadRequirement(id) {
  try {
    const data = await aiApi.getRequirement(id)
    generatedContent.value = data.requirement.content
    generatedTitle.value = data.requirement.title
    dataUsed.value = null
  } catch (e) {
    console.error('Failed to load requirement:', e)
  }
}

function copyContent() {
  navigator.clipboard.writeText(generatedContent.value)
}

function downloadContent() {
  const blob = new Blob([generatedContent.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${generatedTitle.value}.md`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadTemplate()
  loadSaved()
})
</script>

<style scoped>
.markdown-content :deep(table) {
  border-collapse: collapse;
}
.markdown-content :deep(td),
.markdown-content :deep(th) {
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: 8px 12px;
}
.markdown-content :deep(li) {
  list-style-type: disc;
  margin-left: 16px;
}
</style>
