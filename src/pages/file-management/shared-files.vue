<script setup>
import { message } from 'ant-design-vue'
import { ref } from 'vue'

const selectedRowKeys = ref([])
const sharedFiles = ref([
  {
    id: 1,
    name: 'ProjectPlan.pdf',
    size: '2 MB',
    type: 'PDF',
    modified: '2025-09-15',
    owner: 'Alice',
  },
  {
    id: 2,
    name: 'TeamNotes.docx',
    size: '1.5 MB',
    type: 'Word Document',
    modified: '2025-09-20',
    owner: 'Bob',
  },
  {
    id: 3,
    name: 'DesignMockup.png',
    size: '3.2 MB',
    type: 'Image',
    modified: '2025-09-25',
    owner: 'Charlie',
  },
])

const columns = [
  { title: 'File Name', dataIndex: 'name', key: 'name' },
  { title: 'Size', dataIndex: 'size', key: 'size' },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Last Modified', dataIndex: 'modified', key: 'modified' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner' }, // 👈 New column
]

// Row selection handler
function onSelectChange(keys) {
  selectedRowKeys.value = keys
}

// Action Handlers
const uploadFile = () => message.info('Upload file clicked')
const addLesson = () => message.info('Add Lesson clicked')
function deleteFiles() {
  files.value = files.value.filter(f => !selectedRowKeys.value.includes(f.id))
  selectedRowKeys.value = []
  message.success('Selected files deleted')
}
const editFile = record => message.info(`Edit ${record.title}`)
const downloadFile = record => message.info(`Download ${record.filename}`)

// Export handlers
const downloadCSV = () => message.info('Download CSV')
const downloadJSON = () => message.info('Download JSON')
const downloadExcel = () => message.info('Download Excel')
const printTable = () => window.print()

function handleExport(type) {
  switch (type) {
    case 'csv':
      console.log('Export CSV')
      break
    case 'json':
      console.log('Export JSON')
      break
    case 'xlsx':
      console.log('Export XLSX')
      break
    case 'print':
      window.print()
      break
  }
}
</script>

<template>
  <div>
    <!-- Action Buttons -->
    <div style="margin-bottom: 16px; display: flex; gap: 8px;">
      <a-button type="primary" @click="uploadFile">
        + Upload My Files
      </a-button>
      <a-button type="dashed" @click="addLesson">
        + Add Lesson to Class
      </a-button>
      <a-button danger :disabled="!selectedRowKeys.length" @click="deleteFiles">
        Delete
      </a-button>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <a-input-search
        v-model:value="searchText" placeholder="Search files" allow-clear
        style="width: 250px; margin-bottom: 16px"
      />
      <div class="mt-4 flex gap-2">
        <a-dropdown>
          <a-button>
            Export Options
            <DownOutlined />
          </a-button>
          <template #overlay>
            <a-menu @click="({ key }) => handleExport(key)">
              <a-menu-item key="csv">
                Download CSV
              </a-menu-item>
              <a-menu-item key="json">
                Download JSON
              </a-menu-item>
              <a-menu-item key="xlsx">
                Download XLSX
              </a-menu-item>
              <a-menu-item key="print">
                Print
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- Files Table -->
    <a-table
      row-key="id" :columns="columns" :data-source="sharedFiles"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }" :pagination="{ pageSize: 5 }" bordered
    >
      <!-- Custom Render Slots -->
      <template #bodyCell="{ column, record }">
        <!-- Actions Column -->
        <template v-if="column.key === 'actions'">
          <a-space>
            <a-button size="small" @click="editFile(record)">
              Edit
            </a-button>
            <a-button size="small" @click="downloadFile(record)">
              Download
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>
