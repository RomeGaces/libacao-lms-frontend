<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'

/* ---------------------- Types ---------------------- */
interface Subject {
  id: number
  subject_code: string
  subject_name: string
  units: number
}

interface TranscriptRow {
  id: number
  grade: string | null
  status: 'Completed' | 'Enrolled' | 'Dropped'
  subject: Subject
}

interface Student {
  id: number
  student_number: string
  first_name: string
  last_name: string
  course?: {
    course_code: string
    course_name: string
  }
}

interface TranscriptResponse {
  student: Student
  records: TranscriptRow[]
}

/* ---------------------- Props ---------------------- */
const props = defineProps<{
  visible: boolean
  studentId: number | null
}>()

/* ---------------------- Emits ---------------------- */
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

/* ---------------------- State ---------------------- */
const student = ref<Student | null>(null)
const records = ref<TranscriptRow[]>([])

/* ---------------------- Load on Drawer Open ---------------------- */
watch(
  () => props.visible,
  async (open) => {
    if (open && props.studentId) {
      try {
        const { data } = await useGet<TranscriptResponse>(
          `/students/${props.studentId}/transcript`
        )

        if (data) {
          student.value = data.student
          records.value = data.records
        } else {
          student.value = null
          records.value = []
        }

      } catch (err) {
        message.error('Failed to load transcript.')
      }
    }
  }
)

/* ---------------------- Columns ---------------------- */
const columns = computed(() => [
  { title: 'Code', dataIndex: 'code', key: 'code' },
  { title: 'Subject', dataIndex: 'subject_name', key: 'subject_name' },
  { title: 'Units', dataIndex: 'units', key: 'units' },
  { title: 'Grade', dataIndex: 'grade', key: 'grade' },
])
</script>

<template>
  <a-drawer
    title="Transcript of Records"
    placement="right"
    width="500"
    :open="visible"
    @close="$emit('update:visible', false)"
  >

    <!-- Student Header -->
    <div v-if="student" class="mb-4">
      <strong>{{ student.last_name }}, {{ student.first_name }}</strong><br>
      Student #: {{ student.student_number }}<br>
      Course: {{ student.course?.course_code || '' }}
    </div>

    <!-- Transcript Table -->
    <a-table
      :columns="columns"
      :data-source="records"
      :pagination="false"
      bordered
      row-key="id"
    >

      <!-- Unified Cell Renderer -->
      <template #bodyCell="{ column, record }">

        <!-- Subject Code -->
        <template v-if="column.dataIndex === 'code'">
          {{ (record as TranscriptRow).subject.subject_code }}
        </template>

        <!-- Subject Name -->
        <template v-else-if="column.dataIndex === 'subject_name'">
          {{ (record as TranscriptRow).subject.subject_name }}
        </template>

        <!-- Units -->
        <template v-else-if="column.dataIndex === 'units'">
          {{ (record as TranscriptRow).subject.units }}
        </template>

        <!-- Grade -->
        <template v-else-if="column.dataIndex === 'grade'">
          {{ (record as TranscriptRow).grade || '-' }}
        </template>

      </template>

    </a-table>

  </a-drawer>
</template>
