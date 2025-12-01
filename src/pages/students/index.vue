<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'

import StudentFormModal from './components/StudentFormModal.vue'
import StudentScheduleDrawer from './components/StudentScheduleDrawer.vue'
import StudentTranscriptDrawer from './components/StudentTranscriptDrawer.vue'

/* ---------------- Types ---------------- */
interface Course {
    id: number
    course_code: string
    course_name: string
}

interface Student {
    id: number
    student_number: string
    first_name: string
    last_name: string
    year_level: number
    course?: Course
}

/* -------------- State ---------------- */
const students = ref<Student[]>([])
const loading = ref(false)
const search = ref('')
const pagination = reactive({
    total: 0,
    current: 1,
    pageSize: 10,
})

/* Modals / Drawers */
const formVisible = ref(false)
const editData = ref<Student | null>(null)

const scheduleVisible = ref(false)
const transcriptVisible = ref(false)
const selectedStudentId = ref<number | null>(null)

/* ---------------- Load students ---------------- */
const loadStudents = async () => {
    loading.value = true
    try {
        const { data } = await useGet('/students', {
            params: {
                page: pagination.current,
                search: search.value,
            }
        })

        students.value = data.data
        pagination.total = data.total

    } catch (err) {
        message.error('Failed to load students.')
    }
    loading.value = false
}

const openAdd = () => {
    editData.value = null
    formVisible.value = true
}

const openEdit = (record: Student) => {
    editData.value = record
    formVisible.value = true
}

const openSchedule = (id: number) => {
    selectedStudentId.value = id
    scheduleVisible.value = true
}

const openTranscript = (id: number) => {
    selectedStudentId.value = id
    transcriptVisible.value = true
}

const deleteStudent = (record: Student) => {
    Modal.confirm({
        title: 'Delete this student?',
        okType: 'danger',
        onOk: async () => {
            try {
                await useDelete(`/students/${record.id}`)
                message.success('Deleted.')
                loadStudents()
            } catch {
                message.error('Delete failed.')
            }
        }
    })
}

onMounted(() => loadStudents())

/* ---------------- Columns ---------------- */
const columns = computed(() => [
    {
        title: 'Student #',
        dataIndex: 'student_number',
        key: 'student_number',
    },
    {
        title: 'Name',
        key: 'full_name',
        dataIndex: 'full_name', // not real field, but used as semantic key
    },
    {
        title: 'Course',
        key: 'course_name',
        dataIndex: 'course_name',
    },
    {
        title: 'Year',
        dataIndex: 'year_level',
        key: 'year_level',
    },
    {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
    }
])
</script>

<template>
    <div class="p-4">

        <!-- Search + Create -->
        <div class="flex justify-between mb-3">
            <a-input-search v-model:value="search" placeholder="Search students..." style="width: 300px"
                @search="loadStudents" />

            <a-button type="primary" @click="openAdd">Add Student</a-button>
        </div>

        <!-- Students Table -->
        <a-table :columns="columns" :data-source="students" :loading="loading" row-key="id" bordered
            :pagination="false">
            <template #bodyCell="{ column, record }">

                <!-- Name -->
                <template v-if="column.dataIndex === 'full_name'">
                    {{ record.last_name }}, {{ record.first_name }}
                </template>

                <!-- Course -->
                <template v-else-if="column.dataIndex === 'course_name'">
                    {{ record.course?.course_code || '-' }}
                </template>

                <!-- Actions -->
                <template v-if="column.dataIndex === 'actions'">
                    <a-space>
                        <a-button size="small" @click="openEdit(record as Student)">Edit</a-button>
                        <a-button size="small" @click="openSchedule((record as Student).id)">Schedule</a-button>
                        <a-button size="small" type="dashed"
                            @click="openTranscript((record as Student).id)">TOR</a-button>
                        <a-popconfirm title="Delete this student?" @confirm="deleteStudent(record as Student)">
                            <a-button danger size="small">Delete</a-button>
                        </a-popconfirm>
                    </a-space>
                </template>

                <!-- Default fallback -->
                <template v-else>
                    {{ record[column.dataIndex as string] }}
                </template>

            </template>
        </a-table>

        <!-- Pagination -->
        <div class="flex justify-end mt-3">
            <a-pagination :current="pagination.current" :total="pagination.total" :pageSize="pagination.pageSize"
                @change="(p) => { pagination.current = p; loadStudents() }" />
        </div>

        <!-- Modals / Drawers -->
        <StudentFormModal v-model:visible="formVisible" :editData="editData" @saved="loadStudents" />

        <StudentScheduleDrawer v-model:visible="scheduleVisible" :studentId="selectedStudentId" />

        <StudentTranscriptDrawer v-model:visible="transcriptVisible" :studentId="selectedStudentId" />

    </div>
</template>
