import type { RouteRecordRaw } from 'vue-router'

export const ROOT_ROUTE_REDIRECT_PATH = '/my-class/2025-2026/1st'
const Layout = () => import('~/layouts/index.vue')

export const rootRoute: RouteRecordRaw = {
  path: '/',
  name: 'rootPath',
  redirect: ROOT_ROUTE_REDIRECT_PATH,
  component: Layout,
  children: [],
}
