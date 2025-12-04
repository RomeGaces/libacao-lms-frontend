<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MasterSetupWizardModal from './components/MasterSetupWizard.vue'
import CourseBreakdownCard from './components/CourseBreakdownCard.vue'
import { message } from 'ant-design-vue'

interface AcademicYear {
  id: number
  year_start?: string
  year_end?: string
}

interface CourseSummary {
  id: number
  name: string
  student_count: number
  section_count: number
  year_levels: number
}

const showWizard = ref(false)

const academicYear = ref<AcademicYear | null>(null)
const semester = ref<any | null>(null)

const stats = ref({
  total_students: 0,
  total_sections: 0,
  total_courses: 0
})

const courses = ref<CourseSummary[]>([])
const loading = ref(false)

const loadDashboard = async () => {
  loading.value = true
  try {
    const [summaryRes, activeSYRes, activeSemRes] = await Promise.all([
      useGet("/dashboard/ay-summary"),
      useGet("/master/active-school-year"),
      useGet("/master/active-semester"),
    ])

    stats.value = summaryRes.data.stats
    courses.value = summaryRes.data.courses

    academicYear.value = activeSYRes.data.data
    semester.value = activeSemRes.data.data

  } catch (e) {
    message.error("Failed loading dashboard")
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>


  <div class="dashboard space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Active Academic Year -->
      <div class="bg-[#1f1f1f] shadow rounded p-4 text-gray-100">
        <p class="text-lg font-semibold">Active Academic Year</p>
        <p v-if="academicYear" class="mt-1 text-gray-300">
          {{ academicYear.year_start }} – {{ academicYear.year_end }}
        </p>
      </div>

      <!-- Active Semester -->
      <div class="bg-[#1f1f1f] shadow rounded p-4 text-gray-100">
        <p class="text-lg font-semibold">Active Semester</p>
        <p v-if="semester" class="mt-1 text-gray-300">
          {{ semester?.name }}
        </p>
      </div>
    </div>
    <h1 class="text-2xl font-bold mb-3">Academic Year Dashboard</h1>

    <!-- Quick Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <a-card title="Current AY">
        {{ academicYear ? academicYear.year_start + ' - ' + academicYear.year_end : '' }}
      </a-card>
      <a-card title="Total Students">{{ stats.total_students }}</a-card>
      <a-card title="Total Sections">{{ stats.total_sections }}</a-card>
      <a-card title="Courses">{{ stats.total_courses }}</a-card>
    </div>

    <!-- Course Breakdown -->
    <h2 class="text-xl font-semibold mt-5">Course Breakdown</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CourseBreakdownCard v-for="c in courses" :key="c.id" :course="c" />
    </div>

    <!-- Wizard Trigger -->
    <div class="text-right mt-6">
      <a-button type="primary" size="large" @click="showWizard = true">
        Run Master Setup Wizard
      </a-button>
    </div>

    <!-- Wizard Modal -->
    <MasterSetupWizardModal v-model:visible="showWizard" @completed="loadDashboard" />
  </div>
</template>
