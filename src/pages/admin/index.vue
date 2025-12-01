<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MasterSetupWizardModal from './components/MasterSetupWizard.vue' 
import CourseBreakdownCard from './components/CourseBreakdownCard.vue'
import { message } from 'ant-design-vue'

interface AcademicYear {
  id: number
  name: string
  start_date?: string
  end_date?: string
}

interface CourseSummary {
  id: number
  name: string
  student_count: number
  section_count: number
  year_levels: number
}

const showWizard = ref(false)

const currentAY = ref<AcademicYear | null>(null)
const stats = ref({
  total_students: 0,
  total_sections: 0,
  total_courses: 0
})
const courses = ref<CourseSummary[]>([])

async function loadDashboard() {
  try {
    const res = await useGet('/dashboard/ay-summary')
    currentAY.value = res.data.current_academic_year
    stats.value = res.data.stats
    courses.value = res.data.courses
  } catch (e:any) {
    message.error('Failed to load dashboard data.')
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="dashboard space-y-6">

    <h1 class="text-2xl font-bold mb-3">Academic Year Dashboard</h1>

    <!-- Quick Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <a-card title="Current AY">{{ currentAY?.name }}</a-card>
      <a-card title="Total Students">{{ stats.total_students }}</a-card>
      <a-card title="Total Sections">{{ stats.total_sections }}</a-card>
      <a-card title="Courses">{{ stats.total_courses }}</a-card>
    </div>

    <!-- Course Breakdown -->
    <h2 class="text-xl font-semibold mt-5">Course Breakdown</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CourseBreakdownCard
        v-for="c in courses"
        :key="c.id"
        :course="c"
      />
    </div>

    <!-- Wizard Trigger -->
    <div class="text-right mt-6">
      <a-button type="primary" size="large" @click="showWizard = true">
        Run Master Setup Wizard
      </a-button>
    </div>

    <!-- Wizard Modal -->
    <MasterSetupWizardModal
      v-model:visible="showWizard"
      @completed="loadDashboard"
    />
  </div>
</template>
