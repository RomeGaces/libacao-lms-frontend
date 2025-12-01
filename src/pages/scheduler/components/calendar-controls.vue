<script setup>
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import SearchModal from '../components/search-modal.vue' // 🔹 shared modal for search

const emit = defineEmits(['filters-change'])

// =============================================
// STATE
// =============================================
const viewBy = ref('course')
const filters = ref({
  department: null,
  professor: null,
  building: null,
  room: null,
  course: null,
  yearLevel: null,
  section: null,
})

// Dropdown data
const departments = ref([])
const buildings = ref([])
const rooms = ref([])
const courses = ref([])
const yearLevels = ref([
  { label: '1st Year', value: '1st' },
  { label: '2nd Year', value: '2nd' },
  { label: '3rd Year', value: '3rd' },
  { label: '4th Year', value: '4th' },
])

// Search modal controls
const showSearchModal = ref(false)
const searchType = ref('professor')

// =============================================
// HANDLERS
// =============================================

// When a user selects from search modal
function handleSelectFromModal(record) {
  if (searchType.value === 'professor') {
    filters.value.professor = record.name
  }
  else if (searchType.value === 'section') {
    filters.value.section = record.name
  }
  showSearchModal.value = false
}

// =============================================
// DATA LOADING
// =============================================
async function loadInitialData() {
  try {
    const [deptRes, roomRes, courseRes] = await Promise.all([
      useGet('/departments'),
      useGet('/rooms'),
      useGet('/courses'),
    ])

    // Departments
    departments.value = deptRes.data.data.map(d => ({
      label: d.department_name,
      value: d.department_id,
    }))

    // Group rooms by building name
    const grouped = {}
    roomRes.data.data.forEach((r) => {
      if (!grouped[r.building_name])
        grouped[r.building_name] = []
      grouped[r.building_name].push({
        label: `Room ${r.room_number}`,
        value: r.room_id,
      })
    })

    // Convert to Ant Design compatible option groups
    rooms.value = Object.entries(grouped).map(([building, items]) => ({
      label: building,
      options: items,
    }))

    // Courses
    courses.value = courseRes.data.data.map(c => ({
      label: c.course_code,
      value: c.course_id,
    }))

    // Derive building list (for Room filters)
    buildings.value = Object.keys(grouped).map(b => ({ label: b, value: b }))
  }
  catch (err) {
    console.error(err)
    message.error('Failed to load initial data.')
  }
}

onMounted(loadInitialData)

// =============================================
// EMIT FILTER CHANGES
// =============================================
watch([viewBy, filters], () => {
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('filters-change', { viewBy: viewBy.value, filters: filters.value })
}, { deep: true })

// =============================================
// COMPUTED VIEW STATES
// =============================================
const isProfessorView = computed(() => viewBy.value === 'professor')
const isRoomView = computed(() => viewBy.value === 'room')
const isSectionView = computed(() => viewBy.value === 'section')

// =============================================
// MODAL
// =============================================
function openSearchModal(type) {
  searchType.value = type
  showSearchModal.value = true
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 bg-gray-900 p-4 rounded-xl mb-4 shadow">
    <!-- View By Selector -->
    <div class="flex items-center gap-2">
      <span class="text-gray-300 font-medium">View By:</span>
      <a-select
        v-model:value="viewBy"
        style="width: 160px"
        :options="[
          { label: 'Course', value: 'course' },
          { label: 'Professor', value: 'professor' },
          { label: 'Room', value: 'room' },
          { label: 'Section', value: 'section' },
          { label: 'Student', value: 'student' },
        ]"
      />
    </div>

    <!-- Dynamic Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <!-- Professor View -->
      <template v-if="isProfessorView">
        <a-select
          v-model:value="filters.department"
          :options="departments"
          placeholder="Select Department"
          style="width: 200px"
        />

        <div class="flex gap-2 items-center">
          <a-input-search
            v-model:value="filters.professor"
            placeholder="Search Professor"
            style="width: 200px"
            enter-button
            readonly
            @search="openSearchModal('professor')"
          />
        </div>
      </template>

      <!-- Room View -->
      <template v-if="isRoomView">
        <a-select
          v-model:value="filters.room"
          :options="rooms"
          placeholder="Select room"
          style="width: 200px"
        />
      </template>

      <!-- Section View -->
      <template v-if="isSectionView">
        <a-select
          v-model:value="filters.course"
          :options="courses"
          placeholder="Select Course"
          style="width: 200px"
        />
        <a-select
          v-model:value="filters.yearLevel"
          :options="yearLevels"
          placeholder="Select Year Level"
          style="width: 180px"
        />
        <div class="flex gap-2 items-center">
          <a-input
            v-model:value="filters.section"
            placeholder="Search Section"
            style="width: 150px"
            readonly
          />
          <a-button type="primary" @click="openSearchModal('section')">
            Search
          </a-button>
        </div>
      </template>
    </div>
  </div>

  <!-- Search Modal -->
  <SearchModal
    v-model:open="showSearchModal"
    :type="searchType"
    :departments="departments"
    :courses="courses"
    :year-levels="yearLevels"
    @select="handleSelectFromModal"
  />
</template>

<style scoped>
.ant-select {
  background-color: #1e1e2e;
  color: #fff;
}
</style>
