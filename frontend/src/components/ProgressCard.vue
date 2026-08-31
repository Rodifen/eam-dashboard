<template>
  <div class="glass-card p-6 glow-border">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-300">{{ title }}</h3>
      <span class="text-lg font-bold" :class="rateColor">{{ rate }}%</span>
    </div>
    <div class="w-full h-3 bg-deep-blue-900/50 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-1000 ease-out progress-glow"
        :class="barColor"
        :style="{ width: rate + '%' }"
      />
    </div>
    <div class="flex justify-between mt-2 text-xs text-gray-500">
      <span>{{ completed }}/{{ total }} 已完成</span>
      <span v-if="extra" class="text-blue-400">{{ extra }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  rate: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  extra: String,
  color: { type: String, default: 'blue' }
})

const barColor = computed(() => {
  const colors = {
    blue: 'bg-gradient-to-r from-blue-600 to-blue-400',
    cyan: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
    green: 'bg-gradient-to-r from-green-600 to-green-400',
    amber: 'bg-gradient-to-r from-amber-600 to-amber-400',
  }
  return colors[props.color] || colors.blue
})

const rateColor = computed(() => {
  if (props.rate >= 80) return 'text-green-400'
  if (props.rate >= 60) return 'text-blue-400'
  if (props.rate >= 40) return 'text-amber-400'
  return 'text-red-400'
})
</script>
