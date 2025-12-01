<script setup lang="ts">
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { operations } from '@/api/crud-operations'

const departments = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const formVisible = ref(false)
const selected = ref<any | null>(null)
const form = reactive<any>({})
const formRef = ref()

// Pagination state
const pagination = reactive({
  current: 1,
  total: 0,
  pageSize: 10,
})

const columns = [
  { title: 'Code', dataIndex: 'department_code' },
  { title: 'Name', dataIndex: 'department_name' },
  { title: 'Office Location', dataIndex: 'office_location' },
  { title: 'Email', dataIndex: 'contact_email' },
  { title: 'Contact Number', dataIndex: 'contact_number' },
  { title: 'Actions', dataIndex: 'actions' },
]

function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const { data } = await operations.list('departments', {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })
    departments.value = data.data
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
      await operations.update('departments', selected.value.department_id, payload)
    else
      await operations.create('departments', payload)

    message.success('Saved successfully!')
    formVisible.value = false
    await fetchData()
  }
  catch (e) {
    message.error('Error saving record')
  }
}

async function handleDelete(record: any) {
  try {
    await operations.remove('departments', record.department_id)
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

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <!-- Search & Add -->
    <a-space style="margin-bottom:16px; width:100%">
      <a-input-search
        v-model:value="search"
        placeholder="Search departments..."
        enter-button
        style="max-width:300px"
        @search="handleSearch"
      />
      <a-button type="primary" @click="openForm()">
        Add Department
      </a-button>
    </a-space>

    <!-- List -->
    <a-table
      :columns="columns"
      :data-source="departments"
      :loading="loading"
      row-key="department_id"
      bordered
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a @click="openForm(record)">Edit</a>
            <a-popconfirm
              title="Delete this department?"
              ok-text="Yes"
              cancel-text="No"
              @confirm="handleDelete(record)"
            >
              <a>Delete</a>
            </a-popconfirm>
          </a-space>
        </template>
        <template v-else>
          {{ record[column.dataIndex as string] || '-' }}
        </template>
      </template>
    </a-table>

    <!-- Pagination -->
    <div style="margin-top:16px; text-align:right">
      <a-pagination
        :current="pagination.current"
        :total="pagination.total"
        :page-size="pagination.pageSize"
        :show-total="(total: number) => `Total ${total} departments`"
        @change="handlePageChange"
      />
    </div>

    <!-- Form Modal -->
    <a-modal
      v-model:open="formVisible"
      :title="selected ? 'Edit Department' : 'Add Department'"
      destroy-on-close
      @ok="handleSubmit"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="Department Code"
              name="department_code"
              :rules="req('Department Code')"
            >
              <a-input v-model:value="form.department_code" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="Department Name"
              name="department_name"
              :rules="req('Department Name')"
            >
              <a-input v-model:value="form.department_name" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Office Location" name="office_location">
          <a-input v-model:value="form.office_location" />
        </a-form-item>

        <a-form-item label="Contact Email" name="contact_email">
          <a-input v-model:value="form.contact_email" type="email" />
        </a-form-item>

        <a-form-item label="Contact Number" name="contact_number">
          <a-input v-model:value="form.contact_number" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
