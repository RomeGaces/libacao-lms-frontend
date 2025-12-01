<script setup>
import { message } from 'ant-design-vue'
import { onMounted, ref, watch } from 'vue'

// Props
const props = defineProps({
  open: Boolean,
  type: String, // 'professor' | 'section'
  departments: Array,
})

const emit = defineEmits(['update:open', 'select'])

// State
const loading = ref(false)
const tableData = ref([])
const searchFilters = ref({
  departmentId: null,
  yearLevel: null,
  courseId: null,
})

// Options
const yearLevels = ref([
  { label: '1st Year', value: '1st' },
  { label: '2nd Year', value: '2nd' },
  { label: '3rd Year', value: '3rd' },
  { label: '4th Year', value: '4th' },
])
const courses = ref([]) // loaded only for sections

// Table columns (dynamic based on type)
const columns = ref([])

// Methods
async function fetchData() {
  loading.value = true
  tableData.value = []
  try {
    if (props.type === 'professor') {
      const res = await useGet(`/professors`, {
        params: { department_id: searchFilters.value.departmentId },
      })
      tableData.value = res.data.map(p => ({
        id: p.id,
        name: p.name,
        department: p.department_name,
      }))
      columns.value = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Department', dataIndex: 'department', key: 'department' },
      ]
    }
    else if (props.type === 'section') {
      const res = await useGet(`/sections`, {
        params: {
          year_level: searchFilters.value.yearLevel,
          course_id: searchFilters.value.courseId,
        },
      })
      tableData.value = res.data.map(s => ({
        id: s.id,
        name: s.name,
        yearLevel: s.year_level,
        course: s.course_name,
      }))
      columns.value = [
        { title: 'Section', dataIndex: 'name', key: 'name' },
        { title: 'Year Level', dataIndex: 'yearLevel', key: 'yearLevel' },
        { title: 'Course', dataIndex: 'course', key: 'course' },
      ]
    }
  }
  catch (err) {
    message.error('Failed to fetch data.')
  }
  finally {
    loading.value = false
  }
}

function handleSelect(record) {
  emit('select', record)
  emit('update:open', false)
}

function handleCancel() {
  emit('update:open', false)
}

async function loadCourses() {
  if (props.type === 'section') {
    try {
      const res = await useGet('/courses')
      courses.value = res.data.map(c => ({ label: c.name, value: c.id }))
    }
    catch {
      message.error('Failed to load courses.')
    }
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      tableData.value = []
      searchFilters.value = { departmentId: null, yearLevel: null, courseId: null }
      loadCourses()
      if (props.type === 'professor') {
        columns.value = [
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Department', dataIndex: 'department', key: 'department' },
        ]
      }
      else {
        columns.value = [
          { title: 'Section', dataIndex: 'name', key: 'name' },
          { title: 'Year Level', dataIndex: 'yearLevel', key: 'yearLevel' },
          { title: 'Course', dataIndex: 'course', key: 'course' },
        ]
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <a-modal
    :open="open"
    :title="type === 'professor' ? 'Search Professor' : 'Search Section'"
    width="700px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="flex flex-wrap gap-3 mb-4">
      <!-- Professor Filters -->
      <template v-if="type === 'professor'">
        <a-select
          v-model:value="searchFilters.departmentId"
          :options="departments"
          placeholder="Select Department"
          style="width: 250px"
        />
      </template>

      <!-- Section Filters -->
      <template v-else>
        <a-select
          v-model:value="searchFilters.yearLevel"
          :options="yearLevels"
          placeholder="Select Year Level"
          style="width: 200px"
        />
        <a-select
          v-model:value="searchFilters.courseId"
          :options="courses"
          placeholder="Select Course"
          style="width: 250px"
        />
      </template>

      <a-button type="primary" :loading="loading" @click="fetchData">
        Search
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      row-key="id"
      size="middle"
      :pagination="{ pageSize: 5 }"
      @row-click="handleSelect"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a class="text-blue-500 hover:underline cursor-pointer" @click="handleSelect(record)">
            {{ record.name }}
          </a>
        </template>
        <template v-else>
          {{ record[column.key] }}
        </template>
      </template>
    </a-table>
  </a-modal>
</template>

<style scoped>
.flex {
  display: flex;
}
.text-blue-500 {
  color: #3b82f6;
}
</style>
