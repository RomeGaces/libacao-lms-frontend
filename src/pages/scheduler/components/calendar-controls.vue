<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'

interface CourseItem {
  id: number
  course_code: string
  course_name: string
  description?: string
  duration_years?: number
  department_id?: number
}

interface RoomItem {
  id: number
  room_number: string
  building_name: string
  capacity: number
  type: string
}

// ---------------- EMITS ----------------
const emit = defineEmits<{
  (e: 'filters-change', payload: any): void
}>()

// ---------------- VIEW-BY OPTIONS ----------------

const viewBy = ref<'student' | 'professor' | 'room' | 'section' | 'course' | 'year_level'>('course')

// ---------------- DROPDOWN DATA ----------------
const courses = ref<CourseItem[]>([])
const professors = ref<any[]>([])
const rooms = ref<RoomItem[]>([])
const sections = ref<any[]>([])
const students = ref<any[]>([])
const buildings = ref<string[]>([])
const schoolYears = ref<any[]>([])
const semesters = ref<any[]>([])

// ---------------- FILTER STATE ----------------
const filters = ref({
  student_id: undefined as number | undefined,
  professor_id: undefined as number | undefined,
  room_id: undefined as number | undefined,
  building: undefined as string | undefined,
  section_id: undefined as number | undefined,
  course_id: undefined as number | undefined,
  year_level: undefined as number | undefined,
  school_year_id: undefined as number | undefined,
  semester_id: undefined as number | undefined,
})

// ---------------- SEARCH MODAL ----------------
const searchModalOpen = ref(false)
const searchMode = ref<'student' | 'professor'>('student')
const searchQuery = ref('')

const searchResults = ref<any[]>([])
const isSearching = ref(false)

const selectedStudentName = ref<string>('')   // what the user sees
const selectedProfessorName = ref<string>('') // for the professor version

// ---------------- SEARCH FUNCTION ----------------
async function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true

  try {
    const keyword = encodeURIComponent(searchQuery.value)

    let url = ''

    if (searchMode.value === 'student') {
      url = `/students/search?keyword=${keyword}`
    } else {
      url = `/professors/search?keyword=${keyword}`
    }

    const res = await useGet(url)

    searchResults.value = res.data   // ← array of matches
  } catch (err) {
    message.error('Search failed.')
  }

  isSearching.value = false
}


function openSearchModal(mode: 'student' | 'professor') {
  searchMode.value = mode
  searchModalOpen.value = true
  searchQuery.value = ''
}

function selectSearchResult(item: any) {
  if (searchMode.value === 'student') {
    // Store the ID for backend filtering
    filters.value.student_id = item.id

    // Format: Last, First M.
    const middle = item.middle_name ? `${item.middle_name.charAt(0).toUpperCase()}.` : ''
    selectedStudentName.value = `${item.last_name}, ${item.first_name} ${middle}`.trim()
  }
  else if (searchMode.value === 'professor') {
    // Store the ID for backend filtering
    filters.value.professor_id = item.id

    // Format: Last, First M.
    const middle = item.middle_name ? `${item.middle_name.charAt(0).toUpperCase()}.` : ''
    selectedProfessorName.value = `${item.last_name}, ${item.first_name} ${middle}`.trim()
  }

  searchModalOpen.value = false
}

// ---------------- LOAD DROPDOWN DATA ----------------
async function loadData() {
  try {
    // Load all school years
    const syRes = await useGet('/master/school-years')
    schoolYears.value = syRes.data.data

    // Find active school year
    const activeSY = schoolYears.value.find((sy: any) => sy.is_active === 1 || sy.is_active === true)
    if (activeSY) {
      filters.value.school_year_id = activeSY.id
    }

    // Load all semesters
    const semRes = await useGet('/master/semesters')
    const semList = Array.isArray(semRes?.data?.data) ? semRes.data.data : (Array.isArray(semRes?.data) ? semRes.data : [])
    semesters.value = semList

    const activeSem = (Array.isArray(semesters.value) ? semesters.value : []).find(
      (s: any) => s.is_active === 1 || s.is_active === true
    )
    if (activeSem) filters.value.semester_id = activeSem.id


    const { data } = await useGet('/courses')
    courses.value = data.data as CourseItem[]

    // Auto-select first course only if none selected
    if (filters.value.course_id == null && courses.value.length > 0) {
      filters.value.course_id = courses.value[0]?.id
    }

    professors.value = (await useGet('/professors')).data.data
    students.value = (await useGet('/students')).data.data
    sections.value = (await useGet('/sections')).data.data

    const roomRes = (await useGet('/rooms'))
    rooms.value = roomRes.data.data as RoomItem[]
    buildings.value = [...new Set(roomRes.data.data.map((r: { building_name: String }) => r.building_name))] as string[]


  } catch (e) {
    message.error('Failed loading filter data.')
  }
}

loadData()

// ---------------- EMIT FILTERS TO PARENT ----------------
watch([filters, viewBy], () => {
  emit('filters-change', {
    view_by: viewBy.value,
    ...filters.value,
  })
}, { deep: true })

watch(viewBy, (newVal, oldVal) => {

  // --- Reset filters per mode ---
  switch (newVal) {
    case "course":
      filters.value.year_level = undefined
      filters.value.section_id = undefined
      filters.value.professor_id = undefined
      break

    case "year_level":
      filters.value.course_id = undefined
      filters.value.section_id = undefined
      filters.value.professor_id = undefined
      break

    case "section":
      filters.value.course_id = undefined
      filters.value.year_level = undefined
      filters.value.professor_id = undefined
      break

    case "professor":
      filters.value.course_id = undefined
      filters.value.year_level = undefined
      filters.value.section_id = undefined
      break
  }

  // --- Reset search states when leaving student/professor view ---
  if (oldVal === 'student' && newVal !== 'student') {
    searchResults.value = []
    searchQuery.value = ''
  }

  if (oldVal === 'professor' && newVal !== 'professor') {
    searchResults.value = []
    searchQuery.value = ''
  }
})
</script>



<template>
  <div class="flex items-center gap-4 mb-4">

    <!-- VIEW BY DROPDOWN -->
    <a-select v-model:value="viewBy" :mode="undefined" style="width: 180px">
      <a-select-option value="student">View by Student</a-select-option>
      <a-select-option value="professor">View by Professor</a-select-option>
      <a-select-option value="room">View by Room</a-select-option>
      <a-select-option value="section">View by Section</a-select-option>
      <a-select-option value="course">View by Course</a-select-option>
      <a-select-option value="year_level">View by Year Level</a-select-option>
    </a-select>

    <a-select v-model:value="filters.school_year_id" placeholder="School Year" allow-clear style="width: 150px">
      <a-select-option v-for="sy in schoolYears" :key="sy.id" :value="sy.id">
        {{ sy.year_start }} - {{ sy.year_end }}
      </a-select-option>
    </a-select>

    <!-- SEMESTER -->
    <a-select v-model:value="filters.semester_id" placeholder="Semester" allow-clear style="width: 150px">
      <a-select-option v-for="s in semesters" :key="s.id" :value="s.id">
        {{ s.name }}
      </a-select-option>
    </a-select>

    <!-- ================= STUDENT ================= -->
    <template v-if="viewBy === 'student'">
      <a-input v-model:value="selectedStudentName" placeholder="Search student" style="width: 220px" readonly />
      <a-button @click="openSearchModal('student')">Find Student</a-button>
    </template>

    <!-- ================= PROFESSOR ================= -->
    <template v-else-if="viewBy === 'professor'">
      <a-input v-model:value="selectedProfessorName" placeholder="Search professor" style="width: 220px" readonly />
      <a-button @click="openSearchModal('professor')">Find Professor</a-button>
    </template>

    <!-- ================= ROOM ================= -->
    <template v-else-if="viewBy === 'room'">
      <!-- Building -->
      <a-select v-model:value="filters.building" allow-clear placeholder="Building" style="width: 160px">
        <a-select-option v-for="b in buildings" :key="b" :value="b">
          {{ b }}
        </a-select-option>
      </a-select>

      <!-- Room -->
      <a-select v-model:value="filters.room_id" allow-clear placeholder="Room" style="width: 160px">
        <a-select-option v-for="r in rooms.filter(r => !filters.building || r.building_name === filters.building)"
          :key="r.id" :value="r.id">
          {{ r.room_number }} — {{ r.building_name }}
        </a-select-option>
      </a-select>
    </template>

    <!-- ================= SECTION ================= -->
    <template v-else-if="viewBy === 'section'">
      <!-- Course -->
      <a-select v-model:value="filters.course_id" allow-clear placeholder="Course" style="width: 120px">
        <a-select-option v-for="c in courses" :key="c.id" :value="c.id">
          {{ c.course_code }}
        </a-select-option>
      </a-select>

      <!-- Year Level -->
      <a-select v-model:value="filters.year_level" allow-clear placeholder="Year Level" style="width: 120px">
        <a-select-option :value="1">1</a-select-option>
        <a-select-option :value="2">2</a-select-option>
        <a-select-option :value="3">3</a-select-option>
        <a-select-option :value="4">4</a-select-option>
        <a-select-option :value="5">5</a-select-option>
      </a-select>

      <!-- Section -->
      <a-select v-model:value="filters.section_id" allow-clear placeholder="Section" style="width: 160px">
        <a-select-option v-for="s in sections.filter(s =>
          (!filters.course_id || s.course_id === filters.course_id) &&
          (!filters.year_level || s.year_level === filters.year_level)
        )" :key="s.id" :value="s.id">
          {{ s.section_name }}
        </a-select-option>
      </a-select>
    </template>

    <!-- ================= COURSE ================= -->
    <template v-else-if="viewBy === 'course'">
      <a-select v-model:value="filters.course_id" allow-clear placeholder="Course" style="width: 350px">
        <a-select-option v-for="c in courses" :key="c.id" :value="c.id">
          {{ c.course_code }} — {{ c.course_name }}
        </a-select-option>
      </a-select>
    </template>

    <!-- ================= YEAR LEVEL ================= -->
    <template v-else-if="viewBy === 'year_level'">
      <a-select v-model:value="filters.year_level" allow-clear placeholder="Year Level" style="width: 160px">
        <a-select-option :value="1">1</a-select-option>
        <a-select-option :value="2">2</a-select-option>
        <a-select-option :value="3">3</a-select-option>
        <a-select-option :value="4">4</a-select-option>
        <a-select-option :value="5">5</a-select-option>
      </a-select>
    </template>

  </div>

  <!-- ================= SEARCH MODAL ================= -->
  <a-modal v-model:open="searchModalOpen" :title="searchMode === 'student' ? 'Find Student' : 'Find Professor'"
    width="480">
    <!-- Search bar -->
    <div class="flex gap-2 mb-3">
      <a-input v-model:value="searchQuery" :placeholder="searchMode === 'student'
        ? 'Search by name or student number'
        : 'Search by name or email'" />
      <a-button type="primary" @click="performSearch">
        Search
      </a-button>
    </div>

    <!-- Loader -->
    <div v-if="isSearching" class="text-center py-3">
      <a-spin />
    </div>

    <!-- Results list -->
    <a-list class="search-modal-list" :data-source="searchResults" bordered>
      <a-list-item v-for="item in searchResults" :key="item.id" @click="selectSearchResult(item)">
        class="cursor-pointer hover:bg-gray-100">
        <template v-if="searchMode === 'student'">
          {{ item.student_number }} —
          {{ item.first_name }} {{ item.last_name }}
        </template>

        <template v-else>
          {{ item.first_name }} {{ item.last_name }}
          ({{ item.email }})
        </template>
      </a-list-item>
    </a-list>
  </a-modal>
</template>
<style scoped>
.search-modal-list .ant-list-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  cursor: pointer;
}
</style>
