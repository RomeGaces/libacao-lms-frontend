<script setup>
import { message } from 'ant-design-vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/axios.js'
import ScheduleFormModal from './components/form.vue'
import schedulesApi from './components/schedules.js'

const route = useRoute()

const schedules = ref([])
const subjects = ref([])
const professors = ref([])
const rooms = ref([])
const courses = ref([])
const sections = ref([])
const filters = ref({ day: '', subject: '' })

const dayOfWeek = computed(() => sessionStorage.getItem('day_of_week') || 'N/A')
const startHour = computed(() => Number(sessionStorage.getItem('start_hour')) || null)
const endHour = computed(() => (startHour.value !== null ? startHour.value + 1 : null))

const formattedTime = computed(() => {
  if (startHour.value === null || endHour.value === null)
    return '(N/A)'
  return `(${startHour.value}:00 - ${endHour.value}:00)`
})

const modalOpen = ref(false)
const isEditing = ref(false)
const selectedSchedule = ref(null)

const columns = [
  // { title: 'Day', dataIndex: 'day_of_week', key: 'day' },
  // { title: 'Start', dataIndex: 'start_time', key: 'start_time' },
  // { title: 'End', dataIndex: 'end_time', key: 'end_time' },
  { title: 'Subject', dataIndex: 'subject_name', key: 'subject' },
  { title: 'Professor', dataIndex: 'professor_name', key: 'professor_name' },
  { title: 'Section', dataIndex: 'section_name', key: 'section_name' },
  { title: 'Room', dataIndex: 'room_name', key: 'room' },
  { title: 'Actions', key: 'actions' },
]

const filteredSchedules = computed(() =>
  schedules.value.filter(item =>
    item.day_of_week?.toLowerCase().includes(filters.value.day.toLowerCase())
    && item.subject_name?.toLowerCase().includes(filters.value.subject.toLowerCase()),
  ),
)

async function fetchSchedules() {
  try {
    const day = sessionStorage.getItem('day_of_week')
    const hour = sessionStorage.getItem('start_hour')

    const data = await schedulesApi.fetchTimeslotSchedules(day, hour)
    // 🔧 Flatten the data for display
    schedules.value = data.map(item => ({
      ...item,
      subject_name: item.subject?.subject_name || '',
      professor_name: item.professor
        ? `${item.professor.first_name} ${item.professor.last_name}`
        : '',
      section_name: item.class_section?.section_name || '',
      room_name: item.room
        ? `${item.room.building_name} - ${item.room.room_number}`
        : '',
    }))
  }
  catch {
    message.error('Failed to load schedules')
  }
}

async function fetchSubjects() {
  try {
    const { data } = await axios.get('http://localhost:8000/api/subjects')
    subjects.value = data
  }
  catch {
    message.error('Failed to load subjects')
  }
}

async function fetchProfessors() {
  try {
    const { data } = await axios.get('http://localhost:8000/api/professors')
    professors.value = data
  }
  catch {
    message.error('Failed to load professors')
  }
}

async function fetchRooms() {
  try {
    const { data } = await axios.get('http://localhost:8000/api/rooms')
    rooms.value = data
  }
  catch {
    message.error('Failed to load rooms')
  }
}

async function fetchSections() {
  try {
    const { data } = await axios.get('http://localhost:8000/api/sections')
    sections.value = data
  }
  catch {
    message.error('Failed to load sections')
  }
}

async function fetchCourses() {
  try {
    const { data } = await axios.get('http://localhost:8000/api/courses')
    courses.value = data
  }
  catch {
    message.error('Failed to load courses')
  }
}

function openAddModal() {
  fetchSubjects()
  fetchProfessors()
  fetchRooms()
  fetchSections()
  fetchCourses()
  selectedSchedule.value = null
  isEditing.value = false
  modalOpen.value = true
}

function openEditModal(record) {
  fetchSubjects()
  fetchProfessors()
  fetchRooms()
  fetchSections()
  fetchCourses()
  selectedSchedule.value = { ...record }
  isEditing.value = true
  modalOpen.value = true
}

async function handleSave() {
  await fetchSchedules()
}

async function deleteSchedule(id) {
  try {
    await schedulesApi.deleteSchedule(id)
    message.success('Schedule deleted successfully')
    fetchSchedules()
  }
  catch {
    message.error('Failed to delete schedule')
  }
}

onMounted(fetchSchedules)
</script>

<template>
  <div class="p-6 bg-gray-900 min-h-screen text-white">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold">
        Class Scheduler – {{ dayOfWeek }} {{ formattedTime }}
      </h1>
      <a-button type="primary" @click="openAddModal">
        + Add Schedule
      </a-button>
    </div>

    <div class="flex gap-2 mb-4">
      <a-input v-model:value="filters.day" placeholder="Search by day" allow-clear style="width: 200px" />
      <a-input v-model:value="filters.subject" placeholder="Search by subject" allow-clear style="width: 200px" />
      <a-button type="default" @click="fetchSchedules">
        Search
      </a-button>
    </div>

    <a-table
      :columns="columns" :data-source="filteredSchedules" row-key="class_schedule_id" bordered
      :pagination="{ pageSize: 5 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <div class="flex gap-2">
            <a-button type="link" @click="openEditModal(record)">
              Edit
            </a-button>
            <a-popconfirm
              title="Are you sure you want to delete this schedule?" ok-text="Yes" cancel-text="No"
              @confirm="deleteSchedule(record.class_schedule_id)"
            >
              <a-button danger type="link">
                Delete
              </a-button>
            </a-popconfirm>
          </div>
        </template>
      </template>
    </a-table>

    <ScheduleFormModal
      :open="modalOpen" :is-editing="isEditing" :record="selectedSchedule" :subjects="subjects"
      :professors="professors" :rooms="rooms" :courses:="courses" :sections="sections" @close="modalOpen = false"
      @saved="handleSave"
    />
  </div>
</template>
