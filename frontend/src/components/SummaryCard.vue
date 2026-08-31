<template>
  <div class="glass-card p-6 glow-border">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl" :class="iconBg">
          {{ icon }}
        </div>
        <div>
          <p class="text-sm text-gray-400">{{ title }}</p>
          <p class="text-2xl font-bold text-white">{{ displayValue }}</p>
        </div>
      </div>
      <div v-if="trend !== null" class="flex items-center gap-1 text-sm" :class="trend >= 0 ? 'text-green-400' : 'text-red-400'">
        <span>{{ trend >= 0 ? '↑' : '↓' }}</span>
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>
    <div v-if="subtitle" class="text-xs text-gray-500">{{ subtitle }}</div>
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  value: [Number, String],
  icon: { type: String, default: '📊' },
  iconBg: { type: String, default: 'bg-blue-500/20' },
  trend: { type: Number, default: null },
  subtitle: String,
  suffix: { type: String, default: '' }
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString() + props.suffix
  }
  return props.value
})
</script>
