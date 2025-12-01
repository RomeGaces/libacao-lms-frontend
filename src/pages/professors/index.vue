<script setup lang="ts">
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { onMounted, reactive, ref } from 'vue'
import { operations } from '@/api/crud-operations'

const professors = ref<any[]>([])
const departments = ref<{ label: string, value: number }[]>([])
const loading = ref(false)
const departmentsLoading = ref(false)
const search = ref('')
const formVisible = ref(false)
const selected = ref<any | null>(null)
const form = reactive<any>({})
const formRef = ref()

const schedulesDrawerVisible = ref(false)
const schedules = ref<any[]>([])
const selectedProfessor = ref<any | null>(null)
const schedulesLoading = ref(false)

const resource = 'professors'

const defaultForm = {
  first_name: '',
  last_name: '',
  middle_name: '',
  gender: '',
  email: '',
  phone_number: '',
  hire_date: null,
  specialization: '',
  status: 'active',
  department_id: null,
}

// Pagination
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 10,
})

const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
]

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const columns = [
  { title: 'First Name', dataIndex: 'first_name' },
  { title: 'Last Name', dataIndex: 'last_name' },
  { title: 'Email', dataIndex: 'email' },
  { title: 'Phone', dataIndex: 'phone_number' },
  { title: 'Gender', dataIndex: 'gender' },
  { title: 'Department', dataIndex: 'department_name' },
  { title: 'Status', dataIndex: 'status' },
  { title: 'Actions', dataIndex: 'actions' },
]

function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const res = await operations.list(resource, {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })
    professors.value = res.data.data
    pagination.current = res.data.current_page
    pagination.total = res.data.total
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
    const res = await operations.list('departments')
    departments.value = res.data.data.map((d: any) => ({
      label: `${d.department_code} - ${d.department_name}`,
      value: d.id, // FIXED ✔
    }))
  }
  finally {
    departmentsLoading.value = false
  }
}

async function openSchedulesDrawer(record: any) {
  selectedProfessor.value = record
  schedulesDrawerVisible.value = true
  schedulesLoading.value = true

  try {
    const res = await operations.list('schedules', {
      professor_id: record.id, // backend supports this ✔
    })

    schedules.value = res.data.flatMap((block: any) =>
      block.classes.map((cls: any) => ({
        id: cls.id,
        title: cls.title,
        section: cls.section,
        room: cls.room,
        day_of_week: cls.day_of_week,
        start_time: cls.start_time,
        end_time: cls.end_time,
      })),
    )
  }
  finally {
    schedulesLoading.value = false
  }
}

function openForm(record: any | null = null) {
  Object.assign(form, defaultForm)
  selected.value = record

  if (record) {
    Object.assign(form, {
      first_name: record.first_name,
      last_name: record.last_name,
      middle_name: record.middle_name,
      gender: record.gender,
      email: record.email,
      phone_number: record.phone_number,
      specialization: record.specialization,
      status: record.status,
      department_id: record.department_id,
      hire_date: record.hire_date ? dayjs(record.hire_date) : null,
    })
  }

  formVisible.value = true
}

async function handleSubmit() {
  try {
    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      middle_name: form.middle_name,
      gender: form.gender,
      email: form.email,
      phone_number: form.phone_number,
      specialization: form.specialization,
      status: form.status,
      department_id: form.department_id,
      hire_date: form.hire_date ? form.hire_date.format('YYYY-MM-DD') : null,
    }

    if (selected.value)
      await operations.update(resource, selected.value.id, payload) // FIXED ✔
    else
      await operations.create(resource, payload)

    message.success('Saved successfully!')
    formVisible.value = false
    await fetchData()
  }
  catch (e) {
    console.error(e)
    message.error('Error saving record')
  }
}

async function handleDelete(record: any) {
  try {
    await operations.remove(resource, record.id) // FIXED ✔
    message.success('Deleted successfully!')
    await fetchData()
  }
  catch {
    message.error('Error deleting')
  }
}

function handlePageChange(page: number) {
  pagination.current = page
  fetchData(page)
}

onMounted(() => {
  fetchData()
  fetchDepartments()
})
</script>

<template>
  <div>
    <!-- Search & Add -->
    <a-space style="margin-bottom:16px; width:100%">
      <a-input-search v-model:value="search" placeholder="Search professors..." enter-button style="max-width:300px"
        @search="handleSearch" />
      <a-button type="primary" @click="openForm()">
        Add Professor
      </a-button>
    </a-space>

    <!-- List -->
    <a-table :columns="columns" :data-source="professors" :loading="loading" row-key="id" bordered :pagination="false">
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a @click="openForm(record)">Edit</a>
            <a @click="openSchedulesDrawer(record)">Schedules</a>
            <a-popconfirm title="Delete this professor?" ok-text="Yes" cancel-text="No" @confirm="handleDelete(record)">
              <a>Delete</a>
            </a-popconfirm>
          </a-space>
        </template>
        <template v-else-if="column.dataIndex === 'department_name'">
          {{ record.department?.department_name || '-' }} <!-- FIXED ✔ -->
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status }}
          </a-tag>
        </template>
        <template v-else>
          {{ record[column.dataIndex as string] }}
        </template>
      </template>
    </a-table>

    <!-- Pagination -->
    <div style="margin-top:16px; text-align:right">
      <a-pagination :current="pagination.current" :total="pagination.total" :page-size="pagination.pageSize"
        :show-size-changer="true" :show-total="(total: number) => `Total ${total} professors`"
        @change="handlePageChange"
        @show-size-change="(current, size) => { pagination.pageSize = size; fetchData(current) }" />
    </div>

    <!-- Form Modal -->
    <a-modal v-model:open="formVisible" :title="selected ? 'Edit Professor' : 'Add Professor'" destroy-on-close
      @ok="handleSubmit">
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="First Name" name="first_name" :rules="req('First name')">
              <a-input v-model:value="form.first_name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="Last Name" name="last_name" :rules="req('Last name')">
              <a-input v-model:value="form.last_name" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Middle Name" name="middle_name">
          <a-input v-model:value="form.middle_name" />
        </a-form-item>

        <a-form-item label="Gender" name="gender" :rules="req('Gender')">
          <a-select v-model:value="form.gender" :options="genderOptions" />
        </a-form-item>

        <a-form-item label="Email" name="email" :rules="req('Email')">
          <a-input v-model:value="form.email" type="email" />
        </a-form-item>

        <a-form-item label="Phone Number" name="phone_number">
          <a-input v-model:value="form.phone_number" />
        </a-form-item>

        <a-form-item label="Hire Date" name="hire_date">
          <a-date-picker v-model:value="form.hire_date" style="width:100%" />
        </a-form-item>

        <a-form-item label="Specialization" name="specialization">
          <a-input v-model:value="form.specialization" />
        </a-form-item>

        <a-form-item label="Status" name="status">
          <a-select v-model:value="form.status" :options="statusOptions" />
        </a-form-item>

        <a-form-item label="Department" name="department_id">
          <a-select v-model:value="form.department_id" :options="departments" :loading="departmentsLoading" show-search
            option-filter-prop="label" />
        </a-form-item>
      </a-form>
    </a-modal>
    <!-- Schedules Drawer -->
    <a-drawer v-model:open="schedulesDrawerVisible"
      :title="`Schedules for ${selectedProfessor?.first_name} ${selectedProfessor?.last_name}`" width="60%">
      <a-spin :spinning="schedulesLoading">
        <a-table :data-source="schedules" row-key="id" bordered :columns="[
          { title: 'Subject', dataIndex: 'title' },
          { title: 'Section', dataIndex: 'section' },
          { title: 'Room', dataIndex: 'room' },
          { title: 'Day', dataIndex: 'day_of_week' },
          { title: 'Start', dataIndex: 'start_time' },
          { title: 'End', dataIndex: 'end_time' },
        ]" />
      </a-spin>
    </a-drawer>

  </div>
</template>
