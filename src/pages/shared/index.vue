<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue'
import { ref } from 'vue'

const searchText = ref('')
const columns: TableColumnType[] = [
  { title: 'Date', dataIndex: 'date', key: 'date' },
  { title: 'Title', dataIndex: 'title', key: 'title' },
  { title: 'Description', dataIndex: 'description', key: 'description' },
  { title: 'Questions', dataIndex: 'questions', key: 'questions' },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Owner', dataIndex: 'owner', key: 'owner' },
]

interface Exam {
  id: number
  date: string
  title: string
  description: string
  questions: number
  type: string
  owner: string
}

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

const data: Exam[] = [
  {
    id: 1,
    date: '02/10/2025 09:30:15',
    title: 'CHEM101_MidtermQ1',
    description: 'Basic Chemistry Midterm Q1',
    questions: 25,
    type: 'Test',
    owner: 'Maria Santos',
  },
  {
    id: 2,
    date: '02/10/2025 09:45:42',
    title: 'PHHIST_PrelimQ1',
    description: 'Philippine History Prelim Exam',
    questions: 30,
    type: 'Quiz',
    owner: 'Jose Dela Cruz',
  },
  {
    id: 3,
    date: '02/10/2025 10:05:11',
    title: 'ALG201_MidtermQ2',
    description: 'Algebra Problem Solving',
    questions: 20,
    type: 'Test',
    owner: 'Liza Bautista',
  },
  {
    id: 4,
    date: '02/10/2025 11:15:59',
    title: 'CALC2_FinalQ1',
    description: 'Calculus 2 Final Exam',
    questions: 40,
    type: 'Test',
    owner: 'Carlos Reyes',
  },
  {
    id: 5,
    date: '02/10/2025 13:20:44',
    title: 'ENG101_PrelimQ3',
    description: 'English Grammar Prelim',
    questions: 15,
    type: 'Quiz',
    owner: 'Anna Lopez',
  },
]

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
    <h2 class="text-xl font-semibold mb-4">
      Shared Test and Quizzes
    </h2>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <a-input-search
        v-model:value="searchText" placeholder="Search exams" allow-clear
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
      message="Use right click (computer) or long press (mobile) to copy." type="success" show-icon
      class="mb-4"
    />

    <a-table :columns="columns" :data-source="filteredData" row-key="id" bordered :pagination="{ pageSize: 10 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'questions'">
          <a href="javascript:;" class="text-blue-600">
            ❓ Number of Questions ({{ record.questions }})
          </a>
        </template>

        <template v-else-if="column.key === 'type'">
          <a-tag color="green">
            {{ record.type }}
          </a-tag>
        </template>

        <template v-else>
          {{ record[(column.key as string)] }}
        </template>
      </template>
    </a-table>
  </div>
</template>
