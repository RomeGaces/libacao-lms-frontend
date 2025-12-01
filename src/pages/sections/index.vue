<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { operations } from '@/api/crud-operations' // keep your existing helper

// ---------- state ----------
const sections = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const formVisible = ref(false)
const selected = ref<any | null>(null)

interface SectionForm {
  section_name?: string
  course_id?: number
  academic_year?: string
  semester?: string
  year_level?: number
}
const form = reactive<SectionForm>({ section_name: '', course_id: undefined, academic_year: '', semester: '1st', year_level: 1 })

// pagination
const pagination = reactive({ current: 1, total: 0, pageSize: 10 })

// drawer
const drawerVisible = ref(false)
const activeTab = ref<'schedules' | 'students'>('schedules')
const selectedSection = ref<any | null>(null)
const schedules = ref<any[]>([])
const studentLoading = ref(false)
const regularStudents = ref<any[]>([])
const irregularStudents = ref<any[]>([])
const filteredRegular = ref<any[]>([])
const filteredIrregular = ref<any[]>([])
const regularSearch = ref('')
const irregularSearch = ref('')

// supporting lists
const courses = ref<{ label: string, value: number }[]>([])
const professors = ref<{ label: string, value: number }[]>([])
const rooms = ref<{ label: string, value: number }[]>([])
const subjects = ref<{ label: string, value: number }[]>([])

// available students / assignment UI
const availableStudents = ref<any[]>([])
const filteredAvailable = ref<any[]>([])
const availableSearch = ref('')
const selectedStudents = ref<number[]>([]) // student_id list selected for assignment

// schedule form
const scheduleFormVisible = ref(false)
const scheduleForm = reactive<any>({ class_schedule_id: undefined, subject_id: undefined, professor_id: undefined, room_id: undefined, day_of_week: undefined, start_time: undefined, end_time: undefined, status: 'pending' })

// student assign modal
const studentFormVisible = ref(false)

// columns for main table
const columns = [
  { title: 'Section', dataIndex: 'section_name' },
  { title: 'Course', dataIndex: 'course_name' },
  { title: 'Academic Year', dataIndex: 'academic_year' },
  { title: 'Year Level', dataIndex: 'year_level' },
  { title: 'Semester', dataIndex: 'semester' },
  { title: 'Actions', dataIndex: 'actions' },
]

// ---------- helpers ----------
function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

function filterRegular() {
  const term = regularSearch.value.toLowerCase()
  filteredRegular.value = regularStudents.value.filter(s =>
    s.student.first_name.toLowerCase().includes(term) || s.student.last_name.toLowerCase().includes(term)
  )
}
function filterIrregular() {
  const term = irregularSearch.value.toLowerCase()
  filteredIrregular.value = irregularStudents.value.filter(s =>
    s.student.first_name.toLowerCase().includes(term) || s.student.last_name.toLowerCase().includes(term)
  )
}
function filterAvailableStudents() {
  const term = availableSearch.value.toLowerCase()
  filteredAvailable.value = availableStudents.value.filter(s =>
    s.first_name.toLowerCase().includes(term) || s.last_name.toLowerCase().includes(term) || (s.student_number || '').toLowerCase().includes(term)
  )
}

// compute standard subjects for selected section (used by Option A)
const standardSubjectsForSelected = computed(() => {
  if (!selectedSection.value) return []
  return (subjects.value as any[]).filter(s =>
    s.course_id === selectedSection.value.course_id
    && s.year_level === selectedSection.value.year_level
    && s.semester === selectedSection.value.semester
  )
})

// convert selected row keys (Key[] from antd) into number[] for selectedStudents
function onSelectedRowsChange(keys: (string | number)[]) {
  selectedStudents.value = keys.map(k => Number(k))
}

// ---------- fetchers ----------
async function fetchSections(page = pagination.current) {
  loading.value = true
  try {
    const res = await operations.list('sections', {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })
    // backend returns paginated structure
    const payload = res.data
    sections.value = payload.data ?? payload
    pagination.current = payload.current_page ?? page
    pagination.total = payload.total ?? (sections.value.length)
  } catch (err: any) {
    message.error('Error loading sections')
  } finally {
    loading.value = false
  }
}

async function fetchSupportLists() {
  try {
    const [cRes, pRes, rRes, sRes] = await Promise.all([
      operations.list('courses'),
      operations.list('professors'),
      operations.list('rooms'),
      operations.list('subjects'),
    ])

    courses.value = (cRes.data?.data ?? cRes.data).map((c: any) => ({ label: `${c.course_code} - ${c.course_name}`, value: c.course_id }))
    professors.value = (pRes.data?.data ?? pRes.data).map((p: any) => ({ label: `${p.first_name} ${p.last_name}`, value: p.professor_id }))
    rooms.value = (rRes.data?.data ?? rRes.data).map((r: any) => ({ label: `${r.room_number} - ${r.building_name}`, value: r.room_id }))
    subjects.value = (sRes.data?.data ?? sRes.data).map((s: any) => ({
      label: `${s.subject_code} - ${s.subject_name}`,
      value: s.subject_id,
      // keep raw subject props to allow filtering by course/year/semester
      course_id: s.course_id,
      year_level: s.year_level,
      semester: s.semester,
      subject_code: s.subject_code,
      subject_name: s.subject_name,
    }))
  } catch {
    message.error('Error loading support lists')
  }
}

async function loadAvailableStudents() {
  if (!selectedSection.value) return
  try {
    const res = await operations.list(`sections/${selectedSection.value.class_section_id}/available-students`)
    availableStudents.value = res.data ?? []
    filteredAvailable.value = [...availableStudents.value]
  } catch {
    availableStudents.value = []
    filteredAvailable.value = []
  }
}

// ---------- sections CRUD ----------
function openForm(record: any | null = null) {
  selected.value = record
  // reset form
  Object.keys(form).forEach(k => delete (form as any)[k])
  if (record) {
    Object.assign(form, {
      section_name: record.section_name,
      course_id: record.course_id,
      academic_year: record.academic_year,
      semester: record.semester,
      year_level: record.year_level,
    })
  } else {
    Object.assign(form, { section_name: '', course_id: undefined, academic_year: '', semester: '1st', year_level: 1 })
  }
  formVisible.value = true
}

async function saveSection() {
  try {
    if (selected.value) {
      await operations.update('sections', selected.value.class_section_id, form)
      message.success('Section updated')
    } else {
      await operations.create('sections', form)
      message.success('Section created')
    }
    formVisible.value = false
    fetchSections()
  } catch (err: any) {
    const errors = err?.response?.data?.errors
    const msg = err?.response?.data?.message || 'Error saving section'
    if (errors) message.error(Object.values(errors).flat().join('\n'))
    else message.error(msg)
  }
}

async function deleteSection(record: any) {
  try {
    await operations.remove('sections', record.class_section_id)
    message.success('Section deleted')
    fetchSections()
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'Error deleting'
    message.error(msg)
  }
}

// ---------- drawer: open schedules + students ----------
async function openDrawer(record: any) {
  selectedSection.value = record
  drawerVisible.value = true
  activeTab.value = 'schedules'
  await Promise.all([loadSchedules(record.class_section_id), loadStudents(record.class_section_id)])
}

async function loadSchedules(sectionId: number) {
  try {
    const res = await operations.list(`sections/${sectionId}/schedules`)
    schedules.value = res.data ?? []
  } catch {
    schedules.value = []
  }
}

async function loadStudents(sectionId: number) {
  studentLoading.value = true
  try {
    const res = await operations.list(`sections/${sectionId}/students`)
    regularStudents.value = res.data.regular ?? []
    irregularStudents.value = res.data.irregular ?? []
    filteredRegular.value = [...regularStudents.value]
    filteredIrregular.value = [...irregularStudents.value]
  } catch {
    regularStudents.value = []
    irregularStudents.value = []
    filteredRegular.value = []
    filteredIrregular.value = []
  } finally {
    studentLoading.value = false
  }
}

// ---------- schedule CRUD ----------
function openScheduleForm(record: any | null = null) {
  Object.keys(scheduleForm).forEach(k => delete (scheduleForm as any)[k])
  if (record) Object.assign(scheduleForm, record)
  else {
    scheduleForm.class_section_id = selectedSection.value.class_section_id
    scheduleForm.status = 'pending'
  }
  scheduleFormVisible.value = true
}

async function saveSchedule() {
  try {
    const payload = { ...scheduleForm }
    if (scheduleForm.class_schedule_id) {
      await operations.update('schedules', scheduleForm.class_schedule_id, payload)
    } else {
      await operations.create('schedules', payload)
    }
    message.success('Schedule saved')
    scheduleFormVisible.value = false
    await loadSchedules(selectedSection.value.class_section_id)
  } catch (err: any) {
    const errors = err?.response?.data?.errors
    const msg = err?.response?.data?.message || 'Error saving schedule'
    if (errors) message.error(Object.values(errors).flat().join('\n'))
    else message.error(msg)
  }
}

async function deleteSchedule(record: any) {
  try {
    await operations.remove('schedules', record.class_schedule_id)
    message.success('Schedule deleted')
    loadSchedules(selectedSection.value.class_section_id)
  } catch {
    message.error('Error deleting schedule')
  }
}

// ---------- student assignment (Option A) ----------
/**
 * Assign selected students to ALL standard subjects of the selected section.
 * Implementation note: this iterates the standard subjects (derived from the subjects list)
 * and calls POST /sections/{id}/assign-student {student_id, subject_id} for each.
 */
async function assignSelectedStudents() {
  if (!selectedSection.value) return message.error('No section selected')
  if (!selectedStudents.value.length) return message.error('No students selected')

  try {
    // refresh current student counts (safe check)
    await loadStudents(selectedSection.value.class_section_id)
    const currentAssignedCount = regularStudents.value.length + irregularStudents.value.length

    // determine standard subjects for the section (uses preloaded subjects list)
    const standardSubjects = standardSubjectsForSelected.value
    if (!standardSubjects.length) {
      message.error('No standard subjects found for this section (check subjects data)')
      return
    }

    // check capacity: each student will count as +1 assigned student (distinct student),
    // so ensure not exceeding 30
    const canAccept = 30 - currentAssignedCount
    if (canAccept <= 0) {
      message.error('Section is already full (max 30)')
      return
    }
    if (selectedStudents.value.length > canAccept) {
      const ok = await new Promise<boolean>((resolve) => {
        const modal = Modal.confirm({
          title: 'Section Capacity',
          content: `Only ${canAccept} slot(s) available but ${selectedStudents.value.length} selected. Proceed and fill up to capacity?`,
          okText: 'Yes, fill up',
          cancelText: 'Cancel',
          onOk() {
            resolve(true)
            modal.destroy()
          },
          onCancel() {
            resolve(false)
            modal.destroy()
          }
        })
      })

      if (!ok) return
    }
    let assignedCount = 0
    for (const studentId of selectedStudents.value) {
      // stop if capacity reached
      if ((currentAssignedCount + assignedCount) >= 30) break

      // for each standard subject, create assignment
      for (const subj of standardSubjects) {
        try {
          await operations.create(`sections/${selectedSection.value.class_section_id}/assign-student`, {
            student_id: studentId,
            subject_id: subj.value, // subj.value is subject_id per fetchSupportLists mapping
          })
        } catch (err: any) {
          // ignore duplicate-first-or-create-like errors, but show critical ones
          const status = err?.response?.status
          const msg = err?.response?.data?.message
          // if section becomes full while assigning, break
          if (status === 409 && msg && msg.toLowerCase().includes('full')) {
            message.warning(`Section is full while assigning. Stopped at student ${studentId}.`)
            break
          }
          // otherwise continue (firstOrCreate on server typically returns existing or OK)
        }
      }
      assignedCount++
    }

    message.success('Selected students assigned (standard subjects)')
    // refresh lists
    selectedStudents.value = []
    await loadStudents(selectedSection.value.class_section_id)
    await loadAvailableStudents()
    studentFormVisible.value = false
  } catch (err: any) {
    message.error(err?.response?.data?.message || 'Error assigning students')
  }
}

// autoAssign uses backend
async function autoAssign() {
  if (!selectedSection.value) return
  try {
    await operations.create(`sections/${selectedSection.value.class_section_id}/auto-assign`, {})
    message.success('Students auto-assigned')
    await loadStudents(selectedSection.value.class_section_id)
    await loadAvailableStudents()
  } catch (err: any) {
    message.error(err?.response?.data?.message || 'Error auto-assigning')
  }
}

// open student assign modal
async function openStudentAssignForm() {
  if (!selectedSection.value) return message.error('No section selected')
  await loadAvailableStudents()
  selectedStudents.value = []
  studentFormVisible.value = true
}

// remove assignment (DELETE /api/assignments/{id})
async function removeAssignment(assignmentId: number) {
  try {
    await operations.remove('assignments', assignmentId)
    message.success('Assignment removed')
    if (selectedSection.value) await loadStudents(selectedSection.value.class_section_id)
  } catch {
    message.error('Error removing assignment')
  }
}

// ---------- pagination ----------
function handlePageChange(page: number) {
  pagination.current = page
  fetchSections(page)
}

// ---------- lifecycle ----------
onMounted(() => {
  fetchSections()
  fetchSupportLists()
})
</script>

<template>
  <div>
    <a-space style="margin-bottom:16px; width:100%">
      <a-input-search v-model:value="search" placeholder="Search sections..." enter-button style="max-width:300px"
        @search="() => { pagination.current = 1; fetchSections() }" />
      <a-button type="primary" @click="openForm()">
        Add Section
      </a-button>
    </a-space>

    <a-table :columns="columns" :data-source="sections" :loading="loading" row-key="class_section_id" bordered
      :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a-button type="default" size="small" @click="openForm(record)">Edit</a-button>
            <a-button type="primary" size="small" @click="openDrawer(record)">Schedules & Students</a-button>
            <a-popconfirm title="Delete this section?" ok-text="Yes" cancel-text="No" @confirm="deleteSection(record)">
              <a-button danger size="small">Delete</a-button>
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
      <a-pagination :current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize"
        :show-total="(t: number) => `Total ${t} sections`" @change="handlePageChange" />
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
          <a-select v-model:value="form.semester"
            :options="[{ label: '1st', value: '1st' }, { label: '2nd', value: '2nd' }, { label: 'Summer', value: 'Summer' }]" />
        </a-form-item>
        <a-form-item label="Year Level" name="year_level" :rules="req('Year Level')">
          <a-input-number v-model:value="form.year_level" :min="1" :max="5" style="width: 100%" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Drawer -->
    <a-drawer v-model:open="drawerVisible"
      :title="selectedSection ? `${selectedSection.section_name} (${selectedSection.academic_year} ${selectedSection.semester})` : ''"
      width="90%">
      <a-tabs v-model:active-key="activeTab">
        <a-tab-pane key="schedules" tab="Schedules">
          <a-button type="primary" style="margin-bottom:12px" @click="openScheduleForm()">Add Schedule</a-button>

          <a-table :data-source="schedules" row-key="class_schedule_id" bordered>
            <a-table-column title="Subject">
              <template #default="{ record }">
                {{ record.subject?.subject_code }} - {{ record.subject?.subject_name }}
              </template>
            </a-table-column>
            <a-table-column title="Professor" data-index="professor">
              <template #default="{ record }">
                {{ record.professor?.first_name }} {{ record.professor?.last_name }}
              </template>
            </a-table-column>
            <a-table-column title="Room" data-index="room">
              <template #default="{ record }">
                {{ record.room?.room_number }} - {{ record.room?.building_name }}
              </template>
            </a-table-column>
            <a-table-column title="Day" data-index="day_of_week" />
            <a-table-column title="Time" :data-index="['start_time']" />
            <a-table-column title="Status" data-index="status" />
            <a-table-column title="Actions" data-index="actions">
              <template #default="{ record }">
                <a-space>
                  <a @click="openScheduleForm(record)">Edit</a>
                  <a-popconfirm title="Delete schedule?" ok-text="Yes" cancel-text="No"
                    @confirm="deleteSchedule(record)">
                    <a>Delete</a>
                  </a-popconfirm>
                </a-space>
              </template>
            </a-table-column>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="students" tab="Students">
          <a-button type="primary" style="margin-bottom:12px" @click="openStudentAssignForm()">Assign
            Student(s)</a-button>
          <a-button style="margin-left:8px" @click="autoAssign()">Auto Assign (backend)</a-button>

          <a-tabs style="margin-top:12px">
            <a-tab-pane key="regular" tab="Regular Students">
              <a-input v-model:value="regularSearch" placeholder="Search regular students..." style="margin-bottom:10px"
                @input="filterRegular" />
              <a-table :data-source="filteredRegular" :loading="studentLoading" :row-key="(r) => r.student.student_id"
                bordered>
                <a-table-column title="Student No." :data-index="['student', 'student_number']" />
                <a-table-column title="Name">
                  <template #default="{ record }">
                    {{ record.student.first_name }} {{ record.student.last_name }}
                  </template>
                </a-table-column>
                <a-table-column title="Actions">
                  <template #default="{ record }">
                    <a-popconfirm title="Remove student from this section?" ok-text="Yes" cancel-text="No"
                      @confirm="() => removeAssignment(record.subjects[0].id /* NOTE: use actual assignment id */)">
                      <a>Remove</a>
                    </a-popconfirm>
                  </template>
                </a-table-column>
              </a-table>
            </a-tab-pane>

            <a-tab-pane key="irregular" tab="Irregular Students">
              <a-input v-model:value="irregularSearch" placeholder="Search irregular students..."
                style="margin-bottom:10px" @input="filterIrregular" />
              <a-table :data-source="filteredIrregular" :loading="studentLoading" :row-key="(r) => r.student.student_id"
                bordered>
                <a-table-column title="Student No." :data-index="['student', 'student_number']" />
                <a-table-column title="Name">
                  <template #default="{ record }">
                    {{ record.student.first_name }} {{ record.student.last_name }}
                  </template>
                </a-table-column>
                <a-table-column title="Actions">
                  <template #default="{ record }">
                    <a-popconfirm title="Remove student from this section?" ok-text="Yes" cancel-text="No"
                      @confirm="() => removeAssignment(record.subjects[0].id /* NOTE: use actual assignment id */)">
                      <a>Remove</a>
                    </a-popconfirm>
                  </template>
                </a-table-column>
              </a-table>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
      </a-tabs>

      <!-- schedule modal -->
      <a-modal v-model:open="scheduleFormVisible" title="Schedule" @ok="saveSchedule">
        <a-form :model="scheduleForm" layout="vertical">
          <a-form-item label="Subject" :rules="req('Subject')">
            <a-select v-model:value="scheduleForm.subject_id" :options="subjects" show-search
              option-filter-prop="label" />
          </a-form-item>
          <a-form-item label="Professor">
            <a-select v-model:value="scheduleForm.professor_id" :options="professors" />
          </a-form-item>
          <a-form-item label="Room">
            <a-select v-model:value="scheduleForm.room_id" :options="rooms" />
          </a-form-item>
          <a-form-item label="Day">
            <a-select v-model:value="scheduleForm.day_of_week"
              :options="[{ label: 'Monday', value: 'Monday' }, { label: 'Tuesday', value: 'Tuesday' }, { label: 'Wednesday', value: 'Wednesday' }, { label: 'Thursday', value: 'Thursday' }, { label: 'Friday', value: 'Friday' }, { label: 'Saturday', value: 'Saturday' }]" />
          </a-form-item>
          <a-form-item label="Start Time">
            <a-time-picker v-model:value="scheduleForm.start_time" format="HH:mm" style="width:100%" />
          </a-form-item>
          <a-form-item label="End Time">
            <a-time-picker v-model:value="scheduleForm.end_time" format="HH:mm" style="width:100%" />
          </a-form-item>
          <a-form-item label="Status">
            <a-select v-model:value="scheduleForm.status"
              :options="[{ label: 'Pending', value: 'pending' }, { label: 'Finalized', value: 'finalized' }]" />
          </a-form-item>
        </a-form>
      </a-modal>

      <a-modal v-model:open="studentFormVisible" title="Assign Students to Section" @ok="assignSelectedStudents"
        width="600px"> <a-space direction="vertical" style="width:100%">
          <a-input v-model:value="availableSearch" placeholder="Search student..." @input="filterAvailableStudents" />
          <!-- student assign modal (Option A flow) -->
          <a-table :data-source="filteredAvailable" :row-selection="{
            selectedRowKeys: selectedStudents,
            onChange: onSelectedRowsChange
          }" :row-key="(r) => r.student_id" :pagination="false" bordered size="small">

            <!-- <a-table :data-source="filteredAvailable" :row-selection="{
            selectedRowKeys: selectedStudents,
            onChange: (keys) => selectedStudents = keys
          }" :row-key="(r) => r.student_id" :pagination="false" bordered size="small"> -->
            <a-table-column title="Student Number" data-index="student_number" />
            <a-table-column title="Name">
              <template #default="{ record }">
                {{ record.first_name }} {{ record.last_name }}
              </template>
            </a-table-column>
          </a-table>

          <div>
            <a-text>Note: Assigning will enroll each selected student in <strong>all standard subjects</strong> for the
              section (based on course, year level, semester).</a-text>
          </div>

          <a-button type="primary" style="margin-top:10px" @click="autoAssign">Auto Assign (backend)</a-button>
        </a-space>
      </a-modal>
    </a-drawer>
  </div>
</template>

<style scoped>
/* keep simple - style as needed */
</style>
