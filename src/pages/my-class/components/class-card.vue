<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface Course {
  code: string
  ref: string
  section: string
  title: string
  units: number
  students: number
  schedules: string[]
}

const { course } = defineProps<{
  course: Course
}>()

 function openClass(url: string) {
  // If you want to open in a new tab, use this method
  router.push(url)
 }
</script>

<template>
  <a-card class="class-card" :bordered="true">
    <template #title>
      <div class="class-header">
        {{ course.code }}
      </div>
    </template>

    <div class="class-body">
      <p><strong>Class Ref #:</strong> {{ course.ref }}</p>
      <p><strong>Section:</strong> {{ course.section }}</p>
      <p><strong>Title:</strong> {{ course.title }}</p>
      <p><strong>Units:</strong> {{ course.units }}</p>
      <p><strong># of Students:</strong> {{ course.students }}</p>

      <a-divider orientation="left">
        Schedules
      </a-divider>
      <ul class="schedule-list">
        <li v-for="(sched, index) in course.schedules" :key="index">
          {{ sched }}
        </li>
      </ul>
    </div>

    <template #actions>
      <a-button type="primary" @click="openClass('/my-class/2025-2026/1st/ite101/i-eed3')">
        Open Class
      </a-button>
    </template>
  </a-card>
</template>

<style scoped>
.class-card {
  height: 100%;
  min-width: 250px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.class-header {
  font-size: 18px;
  font-weight: bold;
  color: #f59e0b;
}

.class-body p {
  margin: 4px 0;
}

.schedule-list {
  padding-left: 18px;
  margin: 0;
}
</style>
