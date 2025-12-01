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

/** TABLE COLUMNS */
const columns = [
  { title: 'Course Code', dataIndex: 'course_code' },
  { title: 'Course Name', dataIndex: 'course_name' },
  { title: 'Department', dataIndex: 'department_name' },
  { title: 'Duration (Years)', dataIndex: 'duration_years' },
  { title: 'Actions', dataIndex: 'actions' },
]

// --- Helpers ---
function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

/** Fetch paginated courses */
async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const { data } = await operations.list('courses', {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })

    courses.value = data.data // backend returns {data:[], current_page,...}
    pagination.current = data.current_page
    pagination.total = data.total
  }
  finally {
    loading.value = false
  }
}

/** Search Handler */
function handleSearch() {
  pagination.current = 1
  fetchData()
}

/** Fetch Departments */
async function fetchDepartments() {
  departmentsLoading.value = true
  try {
    const { data } = await operations.list('departments')
    departments.value = data.data.map((d: any) => ({
      label: `${d.department_code} - ${d.department_name}`,
      value: d.id, // FIXED ✔
    }))
  }
  finally {
    departmentsLoading.value = false
  }
}

/** Open Create/Edit Form */
function openForm(record: any | null = null) {
  selected.value = record
  Object.keys(form).forEach(k => delete form[k])

  if (record)
    Object.assign(form, record)

  formVisible.value = true
}

/** Save course */
async function handleSubmit() {
  try {
    const payload = {
      course_code: form.course_code,
      course_name: form.course_name,
      department_id: form.department_id,
      duration_years: form.duration_years,
      description: form.description,
    }

    if (selected.value)
      await operations.update('courses', selected.value.id, payload) // FIXED ✔
    else
      await operations.create('courses', payload)

    message.success('Saved successfully!')
    formVisible.value = false
    await fetchData()
  }
  catch (error: any) {
    const errors = error?.response?.data?.errors
    if (errors) {
      const combined = Object.values(errors).flat().join('\n')
      return message.error(combined)
    }
    message.error('Error saving record')
  }
}

/** Delete course */
async function handleDelete(record: any) {
  try {
    await operations.remove('courses', record.id) // FIXED ✔
    message.success('Deleted successfully!')
    await fetchData()
  }
  catch {
    message.error('Error deleting record')
  }
}

/** Pagination change */
function handlePageChange(page: number) {
  pagination.current = page
  fetchData(page)
}

// ------------------------------------------------------------
// SUBJECTS
// ------------------------------------------------------------

/** Open subjects drawer */
async function openSubjectsDrawer(record: any) {
  selectedCourse.value = record
  const { data } = await operations.get('courses', record.id) // FIXED ✔
  subjects.value = data.subjects || []
  subjectsDrawerVisible.value = true
}

/** Open Subject Create/Edit */
function openSubjectForm(record: any | null = null) {
  Object.keys(subjectForm).forEach(k => delete subjectForm[k])
  if (record)
    Object.assign(subjectForm, record)
  subjectFormVisible.value = true
}

/** Save subject */
async function saveSubject() {
  try {
    const payload = { ...subjectForm }

    if (subjectForm.id) {
      // update existing
      await operations.update('subjects', subjectForm.id, payload)
    }
    else {
      // create new under a course
      await operations.create(`courses/${selectedCourse.value.id}/subjects`, payload)
    }

    message.success('Subject saved!')
    subjectFormVisible.value = false
    await openSubjectsDrawer(selectedCourse.value!)
  }
  catch (err: any) {
    const errors = err?.response?.data?.errors
    if (errors) {
      const combined = Object.values(errors).flat().join('\n')
      return message.error(combined, 6)
    }
    message.error(err?.response?.data?.message || 'Error saving subject')
  }
}

/** Delete subject */
async function deleteSubject(record: any) {
  try {
    await operations.remove('subjects', record.id) // FIXED ✔
    message.success('Deleted successfully!')
    await openSubjectsDrawer(selectedCourse.value!)
  }
  catch {
    message.error('Error deleting')
  }
}

onMounted(() => {
  fetchData()
  fetchDepartments()
})
</script>

<template>
  <div>
    <a-space style="margin-bottom:16px; width:100%">
      <a-input-search v-model:value="search" placeholder="Search courses..." enter-button style="max-width:300px"
        @search="handleSearch" />
      <a-button type="primary" @click="openForm()">
        Add Course
      </a-button>
    </a-space>

    <a-table :columns="columns" :data-source="courses" :loading="loading" row-key="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a @click="openForm(record)">Edit</a>
            <a @click="openSubjectsDrawer(record)">Subjects</a>
            <a-popconfirm title="Delete this course?" ok-text="Yes" cancel-text="No" @confirm="handleDelete(record)">
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
      <a-pagination :current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize"
        :show-total="(total: number) => `Total ${total} courses`" @change="handlePageChange" />
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
    <a-drawer v-model:open="subjectsDrawerVisible" :title="`Subjects for ${selectedCourse?.course_name || ''}`"
      width="70%">
      <a-button type="primary" style="margin-bottom:12px" @click="openSubjectForm()">
        Add Subject
      </a-button>
      <a-table :data-source="subjects" row-key="id" bordered :columns="[
        { title: 'Code', dataIndex: 'subject_code' },
        { title: 'Name', dataIndex: 'subject_name' },
        { title: 'Units', dataIndex: 'units' },
        { title: 'Year', dataIndex: 'year_level' },
        { title: 'Semester', dataIndex: 'semester' },
        { title: 'Actions', dataIndex: 'actions' },
      ]">
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'actions'">
            <a-space>
              <a @click="openSubjectForm(record)">Edit</a>
              <a-popconfirm title="Delete this subject?" ok-text="Yes" cancel-text="No"
                @confirm="deleteSubject(record)">
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
            <a-select v-model:value="subjectForm.year_level" :options="[
              { label: '1st Year', value: 1 },
              { label: '2nd Year', value: 2 },
              { label: '3rd Year', value: 3 },
              { label: '4th Year', value: 4 },
            ]" />
          </a-form-item>
          <a-form-item label="Semester" name="semester">
            <a-select v-model:value="subjectForm.semester" :options="[
              { label: '1st', value: '1st' },
              { label: '2nd', value: '2nd' },
              { label: 'Summer', value: 'Summer' },
            ]" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-drawer>
  </div>
</template>
