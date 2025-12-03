<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'

import MasterSetupWizard from './components/MasterSetupWizard.vue'
import CourseBreakdownCard from './components/CourseBreakdownCard.vue'

/**
 * STATE
 */
const loading = ref(false)

const currentAY = ref<any>(null)
const nextAYName = ref<string>('') // e.g. "2025-2026"
const semesters = ref<any[]>([])

const courses = ref<any[]>([])

const showWizard = ref(false)

const selectedSemester = ref<number | undefined>(undefined)
/**
 * Load initial dashboard data
 */
async function loadDashboard() {
  loading.value = true
  try {
    const res = await useGet('/admin/dashboard')
    currentAY.value = res.data.currentAY
    courses.value = res.data.courses

    // Compute next AY name based on currentAY
    if (currentAY.value) {
      const nextStart = Number(currentAY.value.year_end)
      const nextEnd = nextStart + 1
      nextAYName.value = `${nextStart}-${nextEnd}`
    } else {
      // fallback
      nextAYName.value = '2025-2026'
    }

    // Load semesters
    const sem = await useGet('/semesters')
    semesters.value = sem.data

  } catch (err: any) {
    message.error('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

/**
 * Wizard Launch
 */
function openMasterSetup() {
  if (!selectedSemester.value) {
    return message.warning('Please select a semester first.')
  }
  showWizard.value = true
}

function onMasterSetupCompleted() {
  showWizard.value = false
  loadDashboard()
  message.success('Master Setup completed.')
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="p-6">
    <h2 class="text-2xl font-semibold mb-4">Admin Dashboard</h2>

    <!-- Current Academic Year Display -->
    <div class="mb-6 p-4 bg-gray-100 rounded-lg border">
      <h3 class="text-lg font-semibold">Current Academic Year</h3>
      <p class="text-gray-700">
        <b>{{ currentAY?.year_start }} - {{ currentAY?.year_end }}</b>
      </p>

      <div class="mt-3">
        <label class="font-medium">Select Upcoming Semester:</label>
        <a-select v-model:value="selectedSemester" placeholder="Select semester" class="w-64 ml-2">
          <a-select-option v-for="s in semesters" :key="s.id" :value="s.id">
            {{ s.name }}
          </a-select-option>
        </a-select>
      </div>

      <div class="mt-4">
        <a-button type="primary" @click="openMasterSetup">
          Run Master Setup for Next Semester
        </a-button>
      </div>
    </div>

    <!-- Course Breakdown -->
    <div class="grid grid-cols-3 gap-4">
      <CourseBreakdownCard v-for="c in courses" :key="c.id" :course="c" />
    </div>

    <!-- Master Setup Wizard Modal -->
    <MasterSetupWizard v-model:visible="showWizard" :academicYearName="nextAYName" :semesterId="selectedSemester || 0"
      @completed="onMasterSetupCompleted" />
  </div>
</template>

<style scoped></style>
