<template>
  <span class="badge" :class="`badge-${status}`">
    <span class="w-1.5 h-1.5 rounded-full" :class="dotColor"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true }
})

const labelMap = {
  completed: '已完成',
  in_progress: '进行中',
  pending: '待处理',
  blocked: '已阻塞',
  open: '待解决',
  investigating: '调查中',
  resolved: '已解决',
  closed: '已关闭'
}

const dotColorMap = {
  completed: 'bg-green-400',
  in_progress: 'bg-blue-400',
  pending: 'bg-yellow-400',
  blocked: 'bg-red-400',
  open: 'bg-yellow-400',
  investigating: 'bg-blue-400',
  resolved: 'bg-green-400',
  closed: 'bg-gray-400'
}

const label = computed(() => labelMap[props.status] || props.status)
const dotColor = computed(() => dotColorMap[props.status] || 'bg-gray-400')
</script>
