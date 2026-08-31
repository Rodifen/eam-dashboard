import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
  { path: '/bigscreen', name: 'BigScreen', component: () => import('../views/BigScreenView.vue') },
  { path: '/mobile', name: 'Mobile', component: () => import('../views/MobileView.vue') },
  { path: '/eam/:module', name: 'EamDetail', component: () => import('../views/EamDetailView.vue'), props: true },
  { path: '/data-source', name: 'DataSource', component: () => import('../views/DataSourceView.vue') },
  { path: '/manual-entry', name: 'ManualEntry', component: () => import('../views/ManualEntryView.vue') },
  { path: '/ai-requirements', name: 'AiRequirements', component: () => import('../views/AiRequirementsView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
