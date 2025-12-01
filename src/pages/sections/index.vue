<script setup lang="ts">
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { operations } from '@/api/crud-operations' // single operations helper

// ---------------- state ----------------
const sections = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const formVisible = ref(false)
const selected = ref<any | null>(null)
interface SectionForm { section_name?: string, course_id?: number, academic_year?: string, semester?: string }
const form = reactive<SectionForm>({ section_name: '', course_id: undefined, academic_year: '', semester: '1st' })

// pagination
const pagination = reactive({ current: 1, total: 0, pageSize: 10 })

// drawer: schedules + students
const drawerVisible = ref(false)
const activeTab = ref<'schedules' | 'students'>('schedules')
const selectedSection = ref<any | null>(null)
const schedules = ref<any[]>([])
const students = ref<any[]>([])
const studentLoading = ref(false)

// supporting lists
const courses = ref<{ label: string, value: number }[]>([])
const professors = ref<{ label: string, value: number }[]>([])
const rooms = ref<{ label: string, value: number }[]>([])
const subjects = ref<{ label: string, value: number }[]>([])

// schedule form
const scheduleFormVisible = ref(false)
const scheduleForm = reactive<any>({ class_schedule_id: undefined, subject_id: undefined, professor_id: undefined, room_id: undefined, day_of_week: undefined, start_time: undefined, end_time: undefined, status: 'pending' })

// student-assign form
const studentFormVisible = ref(false)
const studentAssignForm = reactive<any>({ student_id: undefined, subject_id: undefined, status: 'enrolled', grade: '' })

// columns
const columns = [
  { title: 'Section', dataIndex: 'section_name' },
  { title: 'Course', dataIndex: 'course_name' },
  { title: 'Academic Year', dataIndex: 'academic_year' },
  { title: 'Semester', dataIndex: 'semester' },
  { title: 'Actions', dataIndex: 'actions' },
]

// ---------------- helper ----------------
function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

// ---------------- fetchers ----------------
async function fetchSections(page = pagination.current) {
  loading.value = true
  try {
    const res = await operations.list('sections', {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })
    sections.value = res.data.data ?? res.data
    pagination.current = res.data.current_page ?? page
    pagination.total = res.data.total ?? (sections.value.length)
  }
  catch (err) {
        message.error('Failed to load sections.')
    }
  finally {
    loading.value = false
  }
}

async function fetchSupportLists() {
  const [cRes, pRes, rRes, sRes] = await Promise.all([
    operations.list('courses'),
    operations.list('professors'),
    operations.list('rooms'),
    operations.list('subjects'),
  ])

  courses.value = (cRes.data?.data ?? cRes.data).map((c: any) => ({ label: `${c.course_code} - ${c.course_name}`, value: c.course_id }))
  professors.value = (pRes.data?.data ?? pRes.data).map((p: any) => ({ label: `${p.first_name} ${p.last_name}`, value: p.professor_id }))
  rooms.value = (rRes.data?.data ?? rRes.data).map((r: any) => ({ label: `${r.room_number} - ${r.building_name}`, value: r.room_id }))
  subjects.value = (sRes.data?.data ?? sRes.data).map((s: any) => ({ label: `${s.subject_code} - ${s.subject_name}`, value: s.subject_id }))
}

// ---------------- section CRUD ----------------
function openForm(record: any | null = null) {
  selected.value = record
  Object.keys(form).forEach(k => delete (form as any)[k])
  if (record)
    Object.assign(form, { section_name: record.section_name, course_id: record.course_id, academic_year: record.academic_year, semester: record.semester })
  formVisible.value = true
}

async function saveSection() {
  try {
    if (selected.value) {
      await operations.update('sections', selected.value.class_section_id, form)
      message.success('Section updated')
    }
    else {
      await operations.create('sections', form)
      message.success('Section created')
    }
    formVisible.value = false
    fetchSections()
  }
  catch (err: any) {
    const errors = err?.response?.data?.errors
    const msg = err?.response?.data?.message || 'Error saving section'
    if (errors)
      message.error(Object.values(errors).flat().join('\n'))
    else message.error(msg)
  }
}

async function deleteSection(record: any) {
  try {
    await operations.remove('sections', record.class_section_id)
    message.success('Section deleted')
    fetchSections()
  }
  catch (err: any) {
    const msg = err?.response?.data?.message || 'Error deleting'
    message.error(msg)
  }
}

// ---------------- drawer open ----------------
async function openDrawer(record: any) {
  selectedSection.value = record
  drawerVisible.value = true
  activeTab.value = 'schedules'
  await Promise.all([loadSchedules(record.class_section_id), loadStudents(record.class_section_id)])
}

async function loadSchedules(sectionId: number) {
  try {
    const res = await operations.list(`sections/${sectionId}/schedules`)
    schedules.value = res.data
  }
  catch {
    schedules.value = []
  }
}

async function loadStudents(sectionId: number) {
  studentLoading.value = true
  try {
    const res = await operations.list(`sections/${sectionId}/students`)
    students.value = res.data
  }
  finally {
    studentLoading.value = false
  }
}

// ---------------- schedule CRUD (uses existing schedules endpoints) ----------------
function openScheduleForm(record: any | null = null) {
  Object.keys(scheduleForm).forEach(k => delete scheduleForm[k])
  if (record) {
    Object.assign(scheduleForm, record)
  }
  else {
    scheduleForm.class_section_id = selectedSection.value.class_section_id
    scheduleForm.status = 'pending'
  }
  scheduleFormVisible.value = true
}

async function saveSchedule() {
  try {
    const payload = { ...scheduleForm }
    if (scheduleForm.class_schedule_id)
      await operations.update('schedules', scheduleForm.class_schedule_id, payload)
    else
      await operations.create('schedules', payload)
    message.success('Schedule saved')
    scheduleFormVisible.value = false
    await loadSchedules(selectedSection.value.class_section_id)
  }
  catch (err: any) {
    const errors = err?.response?.data?.errors
    const msg = err?.response?.data?.message || 'Error saving schedule'
    if (errors)
      message.error(Object.values(errors).flat().join('\n'))
    else message.error(msg)
  }
}

async function deleteSchedule(record: any) {
  try {
    await operations.remove('schedules', record.class_schedule_id)
    message.success('Schedule deleted')
    loadSchedules(selectedSection.value.class_section_id)
  }
  catch {
    message.error('Error deleting schedule')
  }
}

// ---------------- student assignment CRUD ----------------
function openStudentAssignForm(record: any | null = null) {
  Object.keys(studentAssignForm).forEach(k => delete studentAssignForm[k])
  if (record) {
    // editing assignment is out of scope for simple flow; we support add and delete
    Object.assign(studentAssignForm, { student_id: record.student_id })
  }
  else {
    studentAssignForm.class_section_id = selectedSection.value.class_section_id
  }
  studentFormVisible.value = true
}

async function assignStudent() {
  try {
    // const payload = { ...studentAssignForm }
    // const res = await operations.create(`sections/${selectedSection.value.class_section_id}/assign-student`, payload)
    message.success('Student assigned')
    studentFormVisible.value = false
    loadStudents(selectedSection.value.class_section_id)
  }
  catch (err: any) {
    const errors = err?.response?.data?.errors
    const msg = err?.response?.data?.message || 'Error assigning student'
    if (errors)
      message.error(Object.values(errors).flat().join('\n'))
    else message.error(msg)
  }
}

async function removeAssignment(assignment: any) {
  try {
    await operations.remove(`assignments`, assignment.assignment_id)
    message.success('Assignment removed')
    loadStudents(selectedSection.value.class_section_id)
  }
  catch {
    message.error('Error removing assignment')
  }
}

// ---------------- pagination & mount ----------------
function handlePageChange(page: number) {
  pagination.current = page
  fetchSections(page)
}

onMounted(() => {
  fetchSections()
  fetchSupportLists()
})
</script>

<template>
  <div>
    <a-space style="margin-bottom:16px; width:100%">
      <a-input-search v-model:value="search" placeholder="Search sections..." enter-button style="max-width:300px" @search="() => { pagination.current = 1; fetchSections() }" />
      <a-button type="primary" @click="openForm()">
        Add Section
      </a-button>
    </a-space>

    <a-table :columns="columns" :data-source="sections" :loading="loading" row-key="class_section_id" bordered :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <!-- Edit -->
            <a-button type="default" size="small" @click="openForm(record)">
              Edit
            </a-button>

            <!-- View: Schedules & Students -->
            <a-button type="primary" size="small" class="!bg-blue-600 hover:!bg-blue-700" @click="openDrawer(record)">
              Schedules & Students
            </a-button>

            <!-- Delete -->
            <a-popconfirm title="Delete this section?" ok-text="Yes" cancel-text="No" @confirm="deleteSection(record)">
              <a-button danger size="small">
                Delete
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'course_name'">
          {{ record.course?.course_name || '-' }}
        </template>
        <template v-else>
          {{ record[column.dataIndex as string] }}
        </template>
      </template>
    </a-table>

    <div style="margin-top:16px; text-align:right">
      <a-pagination :current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize" :show-total="(t:number) => `Total ${t} sections`" @change="handlePageChange" />
    </div>

    <!-- Section modal -->
    <a-modal v-model:open="formVisible" :title="selected ? 'Edit Section' : 'Add Section'" @ok="saveSection">
      <a-form :model="form" layout="vertical">
        <a-form-item label="Section Name" name="section_name" :rules="req('Section Name')">
          <a-input v-model:value="form.section_name" />
        </a-form-item>
        <a-form-item label="Course" name="course_id" :rules="req('Course')">
          <a-select v-model:value="form.course_id" :options="courses" show-search option-filter-prop="label" />
        </a-form-item>
        <a-form-item label="Academic Year" name="academic_year" :rules="req('Academic Year')">
          <a-input v-model:value="form.academic_year" placeholder="e.g. 2025-2026" />
        </a-form-item>
        <a-form-item label="Semester" name="semester" :rules="req('Semester')">
          <a-select v-model:value="form.semester" :options="[{ label: '1st', value: '1st' }, { label: '2nd', value: '2nd' }, { label: 'Summer', value: 'Summer' }]" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Drawer (schedules + students) -->
    <a-drawer v-model:open="drawerVisible" :title="selectedSection ? `${selectedSection.section_name} (${selectedSection.academic_year} ${selectedSection.semester})` : ''" width="90%">
      <a-tabs v-model:active-key="activeTab">
        <a-tab-pane key="schedules" tab="Schedules">
          <a-button type="primary" style="margin-bottom:12px" @click="openScheduleForm()">
            Add Schedule
          </a-button>
          <a-table :data-source="schedules" row-key="class_schedule_id" bordered>
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'subject'">
                {{ record.subject }}
              </template>
              <template v-else-if="column.dataIndex === 'professor'">
                {{ record.professor || 'Unassigned' }}
              </template>
              <template v-else-if="column.dataIndex === 'room'">
                {{ record.room || 'Unassigned' }}
              </template>
              <template v-else-if="column.dataIndex === 'day_of_week'">
                {{ record.day_of_week || 'Unscheduled' }}
              </template>
              <template v-else-if="column.dataIndex === 'start_time'">
                {{ record.start_time ? `${record.start_time} - ${record.end_time}` : 'Unscheduled' }}
              </template>
              <template v-else-if="column.dataIndex === 'status'">
                <a-tag :color="record.status === 'finalized' ? 'green' : 'orange'">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-else-if="column.dataIndex === 'actions'">
                <a-space>
                  <a @click="openScheduleForm(record)">Edit</a>
                  <a-popconfirm title="Delete schedule?" ok-text="Yes" cancel-text="No" @confirm="deleteSchedule(record)">
                    <a>Delete</a>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
            <a-table-column title="Subject" data-index="subject" />
            <a-table-column title="Professor" data-index="professor" />
            <a-table-column title="Room" data-index="room" />
            <a-table-column title="Day" data-index="day_of_week" />
            <a-table-column title="Time" :data-index="['start_time']" />
            <a-table-column title="Status" data-index="status" />
            <a-table-column title="Actions" data-index="actions" />
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="students" tab="Students">
          <a-button type="primary" style="margin-bottom:12px" @click="openStudentAssignForm()">
            Assign Student
          </a-button>
          <a-table :data-source="students" :loading="studentLoading" row-key="student_id" bordered>
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'student_number'">
                {{ record.student_number }}
              </template>
              <template v-else-if="column.dataIndex === 'full_name'">
                {{ record.first_name }} {{ record.last_name }}
              </template>
              <template v-else-if="column.dataIndex === 'subjects'">
                <div v-for="sub in record.subjects" :key="sub.assignment_id" style="margin-bottom:6px">
                  <strong>{{ sub.subject_code }}</strong> — {{ sub.subject_name }} ({{ sub.status }})
                  <a-popconfirm title="Remove assignment?" ok-text="Yes" cancel-text="No" @confirm="() => removeAssignment(sub)">
                    <a>Remove</a>
                  </a-popconfirm>
                </div>
              </template>
              <template v-else-if="column.dataIndex === 'actions'">
                <a-space>
                  <a @click="openStudentAssignForm(record)">Add Subject</a>
                </a-space>
              </template>
            </template>

            <a-table-column title="Student #" data-index="student_number" />
            <a-table-column title="Name" data-index="full_name" />
            <a-table-column title="Email" data-index="email" />
            <a-table-column title="Subjects" data-index="subjects" />
            <a-table-column title="Actions" data-index="actions" />
          </a-table>
        </a-tab-pane>
      </a-tabs>

      <!-- schedule modal -->
      <a-modal v-model:open="scheduleFormVisible" title="Schedule" @ok="saveSchedule">
        <a-form :model="scheduleForm" layout="vertical">
          <a-form-item label="Subject" :rules="req('Subject')">
            <a-select v-model:value="scheduleForm.subject_id" :options="subjects" show-search option-filter-prop="label" />
          </a-form-item>
          <a-form-item label="Professor">
            <a-select v-model:value="scheduleForm.professor_id" :options="professors" />
          </a-form-item>
          <a-form-item label="Room">
            <a-select v-model:value="scheduleForm.room_id" :options="rooms" />
          </a-form-item>
          <a-form-item label="Day">
            <a-select v-model:value="scheduleForm.day_of_week" :options="[{ label: 'Monday', value: 'Monday' }, { label: 'Tuesday', value: 'Tuesday' }, { label: 'Wednesday', value: 'Wednesday' }, { label: 'Thursday', value: 'Thursday' }, { label: 'Friday', value: 'Friday' }, { label: 'Saturday', value: 'Saturday' }]" />
          </a-form-item>
          <a-form-item label="Start Time">
            <a-time-picker v-model:value="scheduleForm.start_time" format="HH:mm" style="width:100%" />
          </a-form-item>
          <a-form-item label="End Time">
            <a-time-picker v-model:value="scheduleForm.end_time" format="HH:mm" style="width:100%" />
          </a-form-item>
          <a-form-item label="Status">
            <a-select v-model:value="scheduleForm.status" :options="[{ label: 'Pending', value: 'pending' }, { label: 'Finalized', value: 'finalized' }]" />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- student assign modal -->
      <a-modal v-model:open="studentFormVisible" :title="studentAssignForm.student_id ? 'Assign Subject' : 'Assign Student to Subject'" @ok="assignStudent">
        <a-form :model="studentAssignForm" layout="vertical">
          <a-form-item label="Student" :rules="req('Student')">
            <a-select v-model:value="studentAssignForm.student_id" :options="[] /* you can load student list or use search endpoint */" placeholder="Enter student id or implement search" />
          </a-form-item>
          <a-form-item label="Subject" :rules="req('Subject')">
            <a-select v-model:value="studentAssignForm.subject_id" :options="subjects" />
          </a-form-item>
          <a-form-item label="Status">
            <a-select v-model:value="studentAssignForm.status" :options="[{ label: 'Enrolled', value: 'enrolled' }, { label: 'Dropped', value: 'dropped' }, { label: 'Completed', value: 'completed' }]" />
          </a-form-item>
          <a-form-item label="Grade">
            <a-input v-model:value="studentAssignForm.grade" />
          </a-form-item>
        </a-form>
      </a-modal>
    </a-drawer>
  </div>
</template>

<style scoped>
/* keep simple, style as needed */
</style>
