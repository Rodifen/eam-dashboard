import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardApi, dataSourceApi } from '../api/index.js'

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref(null)
  const trend = ref([])
  const activities = ref([])
  const activeSource = ref(null)
  const loading = ref(false)
  const selectedDate = ref(new Date().toISOString().split('T')[0])

  async function fetchSummary(date) {
    loading.value = true
    try {
      summary.value = await dashboardApi.getSummary(date || selectedDate.value)
    } catch (e) {
      console.error('Failed to fetch summary:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchTrend(days = 7) {
    try {
      const data = await dashboardApi.getTrend(days)
      trend.value = data.trend || []
    } catch (e) {
      console.error('Failed to fetch trend:', e)
    }
  }

  async function fetchActivity(limit = 20) {
    try {
      const data = await dashboardApi.getActivity(limit)
      activities.value = data.activities || []
    } catch (e) {
      console.error('Failed to fetch activity:', e)
    }
  }

  async function fetchActiveSource() {
    try {
      const data = await dataSourceApi.getActive()
      activeSource.value = data.source
    } catch (e) {
      console.error('Failed to fetch active source:', e)
    }
  }

  async function loadAll() {
    await Promise.all([
      fetchSummary(),
      fetchTrend(7),
      fetchActivity(),
      fetchActiveSource()
    ])
  }

  return {
    summary, trend, activities, activeSource, loading, selectedDate,
    fetchSummary, fetchTrend, fetchActivity, fetchActiveSource, loadAll
  }
})
