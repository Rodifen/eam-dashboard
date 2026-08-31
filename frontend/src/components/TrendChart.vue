<template>
  <div class="glass-card p-6 glow-border">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-gray-300">{{ title }}</h3>
      <div class="flex gap-2">
        <button
          v-for="opt in periodOptions"
          :key="opt.value"
          @click="$emit('period-change', opt.value)"
          class="px-3 py-1 text-xs rounded-lg transition-colors"
          :class="period === opt.value ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
    <div class="relative" :style="{ height: height + 'px' }">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  title: { type: String, default: '趋势图' },
  data: { type: Array, default: () => [] },
  period: { type: Number, default: 7 },
  height: { type: Number, default: 250 }
})

defineEmits(['period-change'])

const periodOptions = [
  { label: '7天', value: 7 },
  { label: '30天', value: 30 }
]

const chartCanvas = ref(null)
let chartInstance = null

function createChart() {
  if (chartInstance) chartInstance.destroy()
  if (!chartCanvas.value || !props.data.length) return

  const labels = props.data.map(d => {
    const date = new Date(d.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '点检',
          data: props.data.map(d => d.inspection),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#3b82f6',
        },
        {
          label: '保养',
          data: props.data.map(d => d.maintenance),
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#22d3ee',
        },
        {
          label: '报修',
          data: props.data.map(d => d.repair),
          borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#a78bfa',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(13, 42, 80, 0.9)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(59, 130, 246, 0.08)', drawBorder: false },
          ticks: { color: '#64748b', font: { size: 11 } }
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(59, 130, 246, 0.08)', drawBorder: false },
          ticks: {
            color: '#64748b',
            font: { size: 11 },
            callback: (v) => v + '%'
          }
        }
      }
    }
  })
}

onMounted(() => nextTick(createChart))
watch(() => props.data, () => nextTick(createChart), { deep: true })
</script>
