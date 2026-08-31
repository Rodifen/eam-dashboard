<template>
  <div class="glass-card overflow-hidden glow-border">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-tech-border">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
              :class="{ 'cursor-pointer hover:text-blue-400': col.sortable }"
              @click="col.sortable && toggleSort(col.key)"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <span v-if="col.sortable && sortKey === col.key" class="text-blue-400">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-tech-border">
          <tr
            v-for="row in data"
            :key="row.id"
            class="hover:bg-white/5 transition-colors"
          >
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 whitespace-nowrap">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="!data.length">
            <td :colspan="columns.length" class="px-4 py-8 text-center text-gray-500">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-tech-border">
      <span class="text-xs text-gray-500">
        共 {{ pagination.total }} 条，第 {{ pagination.page }}/{{ pagination.totalPages }} 页
      </span>
      <div class="flex gap-1">
        <button
          v-for="p in paginationRange"
          :key="p"
          @click="$emit('page-change', p)"
          class="w-8 h-8 rounded-lg text-xs transition-colors"
          :class="p === pagination.page ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'"
        >
          {{ p }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, default: () => [] },
  pagination: Object
})

const emit = defineEmits(['sort', 'page-change'])

const sortKey = ref('')
const sortOrder = ref('asc')

function toggleSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  emit('sort', { key: sortKey.value, order: sortOrder.value })
}

const paginationRange = computed(() => {
  if (!props.pagination) return []
  const { page, totalPages } = props.pagination
  const range = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) range.push(i)
  return range
})
</script>
