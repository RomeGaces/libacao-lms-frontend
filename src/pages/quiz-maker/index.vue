<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue'
import { DownOutlined } from '@ant-design/icons-vue'

const searchText = ref('')
interface QuizItem {
  id: number
  date: string
  title: string
  description: string
  questions: number
  isShared: boolean
}

const columns: TableColumnType[] = [
  { title: 'Date', dataIndex: 'date', sorter: true },
  { title: 'Title', dataIndex: 'title' },
  { title: 'Description', dataIndex: 'description' },
  { title: 'Questions', dataIndex: 'questions' },
  { title: 'Is Shared', dataIndex: 'isShared' },
]

const data: QuizItem[] = [
  {
    id: 1,
    date: '09/02/2025 17:02:04',
    title: 'ITE 101 - History of Information Technology',
    description: 'Information Technology in the Baby Boomer Era',
    questions: 10,
    isShared: true,
  },
  {
    id: 2,
    date: '09/02/2025 16:59:25',
    title: 'MATH 101 - Algebra',
    description: 'Logarithmic Functions',
    questions: 8,
    isShared: false,
  },
  {
    id: 3,
    date: '09/02/2025 16:59:22',
    title: 'AP207 - History Quiz',
    description: 'World War II overview',
    questions: 12,
    isShared: true,
  },
  {
    id: 4,
    date: '09/02/2025 16:58:41',
    title: 'IT 307 - Information Technology Assurance',
    description: 'Importance of Cybersecurity',
    questions: 20,
    isShared: false,
  },
]

// function handleExport(type: string) {
//   switch (type) {
//     case 'csv':
//       console.log('Export CSV')
//       break
//     case 'json':
//       console.log('Export JSON')
//       break
//     case 'xlsx':
//       console.log('Export XLSX')
//       break
//     case 'print':
//       window.print()
//       break
//   }
// }

const filteredData = computed(() => {
  if (!searchText.value)
    return data
  return data.filter(exam =>
    Object.values(exam).some(value =>
      String(value).toLowerCase().includes(searchText.value.toLowerCase()),
    ),
  )
})

// function onMenuClick(info: { key: string }) {
//   handleExport(info.key)
// }
</script>

<template>
  <div>
    <div class="flex gap-2 mb-4">
      <a-button type="primary">
        + Add Quiz Questionnaire
      </a-button>
      <a-button type="primary">
        + Add Quiz to Class
      </a-button>
      <a-button danger>
        Delete
      </a-button>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <a-input-search
        v-model:value="searchText" placeholder="Search quizzes" allow-clear
        style="width: 250px; margin-bottom: 16px"
      />
      <div class="mt-4 flex gap-2">
        <a-dropdown>
          <a-button>
            Export Options
            <DownOutlined />
          </a-button>
          <template #overlay>
            <!-- <a-menu @click="onMenuClick">
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
            </a-menu> -->
          </template>
        </a-dropdown>
      </div>
    </div>

    <a-alert
      type="success"
      message="Use right click (computer) or long press (mobile) to edit or duplicate."
      show-icon
      class="mb-4"
    />

    <a-table
      row-key="id"
      :columns="columns"
      :data-source="filteredData"
      :pagination="false"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'questions'">
          <a href="#">Click to add Questions ({{ record.questions }})</a>
        </template>
        <template v-else-if="column.dataIndex === 'isShared'">
          {{ record.isShared ? 'Yes' : 'No' }}
        </template>
      </template>
    </a-table>

    <div class="mt-2 text-right text-gray-500">
      {{ data.length }} of {{ data.length }}
    </div>
  </div>
</template>
