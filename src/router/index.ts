import { createRouter, createWebHistory } from 'vue-router'
import staticRoutes from './static-routes'

const router = createRouter({
  routes: [
    ...staticRoutes,
    {
      path: '/class-scheduling/timeslot/:day_of_week/:start_hour',
      name: 'ScheduleTimeslot',
      component: () => import('~/pages/scheduler/timeslot.vue'),
      props: true,
    },
  ],
  history: createWebHistory(import.meta.env.VITE_APP_BASE),
})

export default router
