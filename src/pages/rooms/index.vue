<script setup lang="ts">
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { operations } from '@/api/crud-operations'

const rooms = ref<any[]>([])
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

const typeOptions = [
  { label: 'Lecture', value: 'Lecture' },
  { label: 'Laboratory', value: 'Laboratory' },
  { label: 'Online', value: 'Online' },
]

const columns = [
  { title: 'Room Number', dataIndex: 'room_number' },
  { title: 'Building Name', dataIndex: 'building_name' },
  { title: 'Capacity', dataIndex: 'capacity' },
  { title: 'Type', dataIndex: 'type' },
  { title: 'Actions', dataIndex: 'actions' },
]

function req(name: string) {
  return [{ required: true, message: `Please input ${name}` }]
}

async function fetchData(page = pagination.current) {
  loading.value = true
  try {
    const { data } = await operations.list('rooms', {
      search: search.value,
      page,
      per_page: pagination.pageSize,
    })
    rooms.value = data.data
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
      await operations.update('rooms', selected.value.room_id, payload)
    else
      await operations.create('rooms', payload)

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
    await operations.remove('rooms', record.room_id)
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
        placeholder="Search rooms..."
        enter-button
        style="max-width:300px"
        @search="handleSearch"
      />
      <a-button type="primary" @click="openForm()">
        Add Room
      </a-button>
    </a-space>

    <!-- List -->
    <a-table
      :columns="columns"
      :data-source="rooms"
      :loading="loading"
      row-key="room_id"
      bordered
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'actions'">
          <a-space>
            <a @click="openForm(record)">Edit</a>
            <a-popconfirm
              title="Delete this room?"
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
        :show-total="(total: number) => `Total ${total} rooms`"
        @change="handlePageChange"
      />
    </div>

    <!-- Form Modal -->
    <a-modal
      v-model:open="formVisible"
      :title="selected ? 'Edit Room' : 'Add Room'"
      destroy-on-close
      @ok="handleSubmit"
    >
      <a-form ref="formRef" :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item
              label="Room Number"
              name="room_number"
              :rules="req('Room Number')"
            >
              <a-input v-model:value="form.room_number" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="Building Name"
              name="building_name"
              :rules="req('Building Name')"
            >
              <a-input v-model:value="form.building_name" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="Capacity" name="capacity">
          <a-input-number
            v-model:value="form.capacity"
            :min="0"
            style="width:100%"
          />
        </a-form-item>

        <a-form-item label="Type" name="type">
          <a-select v-model:value="form.type" :options="typeOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
