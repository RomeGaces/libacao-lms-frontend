<script setup lang="ts">
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { operations } from '@/api/crud-operations'

const courses = ref<any[]>([])
const departments = ref<{ label: string, value: number }[]>([])
const loading = ref(false)
const departmentsLoading = ref(false)
const search = ref('')
const formVisible = ref(false)
const selected = ref<any | null>(null)
const form = reactive<any>({})
const formRef = ref()

// Subjects drawer
const subjectsDrawerVisible = ref(false)
const subjects = ref<any[]>([])
const subjectFormVisible = ref(false)
const subjectForm = reactive<any>({})
const selectedCourse = ref<any | null>(null)
const subjectFormRef = ref()

// Pagination
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 10,
})

const columns = [
  { title: 'Course Code', dataIndex: 'course_code' },
  { title: 'Course Name', dataIndex: 'course_name' },
  { title: 'Department', dataIndex: 'department_name' },
  { title: 'Duration (Years)', dataIndex: 'duration_years' },
  { title: 'Actions', dataIndex: 'actions' },
]

function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const { data } = await operations.list('courses', {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })
    courses.value = data.data
    pagination.current = data.current_page
    pagination.total = data.total
  }
  finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.current = 1
  fetchData()
}

async function fetchDepartments() {
  departmentsLoading.value = true
  try {
    const { data } = await operations.list('departments')
    departments.value = data.data.map((d: any) => ({
      label: `${d.department_code} - ${d.department_name}`,
      value: d.department_id,
    }))
  }
  finally {
    departmentsLoading.value = false
  }
}

function openForm(record: any | null = null) {
  selected.value = record
  Object.keys(form).forEach(k => delete form[k])
  if (record)
    Object.assign(form, record)

  formVisible.value = true
}

async function handleSubmit() {
  try {
    const payload = { ...form }

    if (selected.value)
      await operations.update('courses', selected.value.course_id, payload)
    else
      await operations.create('courses', payload)

    message.success('Saved successfully!')
    formVisible.value = false
    await fetchData()
  }
  catch {
    message.error('Error saving record')
  }
}

async function handleDelete(record: any) {
  try {
    await operations.remove('courses', record.course_id)
    message.success('Deleted successfully!')
    await fetchData()
  }
  catch {
    message.error('Error deleting record')
  }
}

function handlePageChange(page: number) {
  pagination.current = page
  fetchData(page)
}

// ----- Subjects -----

async function openSubjectsDrawer(record: any) {
  selectedCourse.value = record
  const { data } = await operations.get('courses', record.course_id)
  subjects.value = data.subjects || []
  subjectsDrawerVisible.value = true
}

function openSubjectForm(record: any | null = null) {
  Object.keys(subjectForm).forEach(k => delete subjectForm[k])
  if (record)
    Object.assign(subjectForm, record)
  subjectFormVisible.value = true
}

async function saveSubject() {
  try {
    const payload = { ...subjectForm }

    if (subjectForm.subject_id) {
      await operations.update('subjects', subjectForm.subject_id, payload)
    }
    else {
      await operations.create(`courses/${selectedCourse.value.course_id}/subjects`, payload)
    }

    message.success('Subject saved!')
    subjectFormVisible.value = false
    openSubjectsDrawer(selectedCourse.value!)
  }
  catch (err: any) {
    // Check if it's a Laravel validation error
    const errors = err?.response?.data?.errors
    const msg = err?.response?.data?.message || 'Error saving subject'

    if (errors) {
      // Build a readable message string
      const combined = Object.values(errors).flat().join('\n')
      message.error(`${msg}:\n${combined}`, 6)
    }
    else {
      message.error(msg)
    }
  }
}

async function deleteSubject(record: any) {
  await operations.remove('subjects', record.subject_id)
  message.success('Deleted successfully!')
  openSubjectsDrawer(selectedCourse.value!)
}

onMounted(() => {
  fetchData()
  fetchDepartments()
})
</script>

<template>
  <div>
    <a-space style="margin-bottom:16px; width:100%">
      <a-input-search
        v-model:value="search"
        placeholder="Search courses..."
        enter-button
        style="max-width:300px"
        @search="handleSearch"
      />
      <a-button type="primary" @click="openForm()">
        Add Course
      </a-button>
    </a-space>

    <a-table
      :columns="columns"
      :data-source="courses"
      :loading="loading"
      row-key="course_id"
      bordered
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a @click="openForm(record)">Edit</a>
            <a @click="openSubjectsDrawer(record)">Subjects</a>
            <a-popconfirm
              title="Delete this course?"
              ok-text="Yes"
              cancel-text="No"
              @confirm="handleDelete(record)"
            >
              <a>Delete</a>
            </a-popconfirm>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'department_name'">
          {{ record.department?.department_name || '-' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as string] }}
        </template>
      </template>
    </a-table>

    <div style="margin-top:16px; text-align:right">
      <a-pagination
        :current="pagination.current"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :show-total="(total: number) => `Total ${total} courses`"
        @change="handlePageChange"
      />
    </div>

    <!-- Course Form -->
    <a-modal v-model:open="formVisible" :title="selected ? 'Edit Course' : 'Add Course'" @ok="handleSubmit">
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-form-item label="Course Code" name="course_code" :rules="req('Course Code')">
          <a-input v-model:value="form.course_code" />
        </a-form-item>
        <a-form-item label="Course Name" name="course_name" :rules="req('Course Name')">
          <a-input v-model:value="form.course_name" />
        </a-form-item>
        <a-form-item label="Department" name="department_id">
          <a-select v-model:value="form.department_id" :options="departments" :loading="departmentsLoading" />
        </a-form-item>
        <a-form-item label="Duration (Years)" name="duration_years">
          <a-input-number v-model:value="form.duration_years" :min="1" :max="6" style="width:100%" />
        </a-form-item>
        <a-form-item label="Description" name="description">
          <a-textarea v-model:value="form.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Subjects Drawer -->
    <a-drawer
      v-model:open="subjectsDrawerVisible"
      :title="`Subjects for ${selectedCourse?.course_name || ''}`"
      width="70%"
    >
      <a-button type="primary" style="margin-bottom:12px" @click="openSubjectForm()">
        Add Subject
      </a-button>
      <a-table
        :data-source="subjects"
        row-key="subject_id"
        bordered
        :columns="[
          { title: 'Code', dataIndex: 'subject_code' },
          { title: 'Name', dataIndex: 'subject_name' },
          { title: 'Units', dataIndex: 'units' },
          { title: 'Year', dataIndex: 'year_level' },
          { title: 'Semester', dataIndex: 'semester' },
          { title: 'Actions', dataIndex: 'actions' },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'actions'">
            <a-space>
              <a @click="openSubjectForm(record)">Edit</a>
              <a-popconfirm
                title="Delete this subject?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="deleteSubject(record)"
              >
                <a>Delete</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- Add/Edit Subject Modal -->
      <a-modal v-model:open="subjectFormVisible" title="Subject Details" @ok="saveSubject">
        <a-form ref="subjectFormRef" :model="subjectForm" layout="vertical">
          <a-form-item label="Subject Code" name="subject_code" :rules="req('Subject Code')">
            <a-input v-model:value="subjectForm.subject_code" />
          </a-form-item>
          <a-form-item label="Subject Name" name="subject_name" :rules="req('Subject Name')">
            <a-input v-model:value="subjectForm.subject_name" />
          </a-form-item>
          <a-form-item label="Units" name="units">
            <a-input-number v-model:value="subjectForm.units" :min="1" :max="10" style="width:100%" />
          </a-form-item>
          <a-form-item label="Year Level" name="year_level">
            <a-select
              v-model:value="subjectForm.year_level" :options="[
                { label: '1st Year', value: 1 },
                { label: '2nd Year', value: 2 },
                { label: '3rd Year', value: 3 },
                { label: '4th Year', value: 4 },
              ]"
            />
          </a-form-item>
          <a-form-item label="Semester" name="semester">
            <a-select
              v-model:value="subjectForm.semester" :options="[
                { label: '1st', value: '1st' },
                { label: '2nd', value: '2nd' },
                { label: 'Summer', value: 'Summer' },
              ]"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-drawer>
  </div>
</template>
