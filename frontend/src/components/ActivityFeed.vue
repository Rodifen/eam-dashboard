<template>
  <div class="glass-card p-6 glow-border">
    <h3 class="text-sm font-medium text-gray-300 mb-4">{{ title }}</h3>
    <div class="space-y-3 max-h-80 overflow-y-auto">
      <div
        v-for="item in items"
        :key="item.id"
        class="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
             :class="moduleColor(item.module)">
          {{ moduleIcon(item.module) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-200 truncate">{{ item.description }}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-gray-500">{{ item.user_name }}</span>
            <span class="text-xs text-gray-600">·</span>
            <span class="text-xs text-gray-500">{{ formatTime(item.created_at) }}</span>
          </div>
        </div>
      </div>
      <div v-if="!items.length" class="text-center text-gray-500 py-8 text-sm">暂无活动记录</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '最近活动' },
  items: { type: Array, default: () => [] }
})

function moduleColor(mod) {
  const colors = {
    inspection: 'bg-blue-500/20 text-blue-400',
    maintenance: 'bg-cyan-500/20 text-cyan-400',
    repair: 'bg-purple-500/20 text-purple-400'
  }
  return colors[mod] || 'bg-gray-500/20 text-gray-400'
}

function moduleIcon(mod) {
  const icons = { inspection: '🔍', maintenance: '🔧', repair: '🚨' }
  return icons[mod] || '📋'
}

function formatTime(str) {
  if (!str) return ''
  const d = new Date(str)
  const now = new Date()
  const diff = (now - d) / 1000

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
