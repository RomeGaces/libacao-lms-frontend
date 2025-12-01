<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'

/* ---------------------- Types ---------------------- */
interface Subject {
    id: number
    subject_code: string
    subject_name: string
}

interface Room {
    id: number
    room_number: string
}

interface Professor {
    id: number
    first_name: string
    last_name: string
}

interface ScheduleRow {
    id: number
    day_of_week: string
    start_time: string
    end_time: string
    subject: Subject
    room: Room | null
    professor: Professor | null
}

/* ---------------------- Props ---------------------- */
const props = defineProps<{
    visible: boolean
    studentId: number | null
}>()

/* ---------------------- Emits ---------------------- */
const emit = defineEmits<{
    (event: 'update:visible', value: boolean): void
}>()

/* ---------------------- State ---------------------- */
const schedule = ref<ScheduleRow[]>([])

const formatTime = (time: string) => {
    if (!time) return ''

    const [hour, minute] = time.split(':')
    const h = parseInt(hour, 10)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12

    return `${hour12}:${minute} ${suffix}`
}

/* ---------------------- Watch drawer open ---------------------- */
watch(
    () => props.visible,
    async (open) => {
        if (open && props.studentId) {
            try {
                const { data } = await useGet<ScheduleRow[]>(`/students/${props.studentId}/schedule`)
                schedule.value = data ?? []
            } catch (err) {
                message.error('Failed to load schedule.')
            }
        }
    }
)

/* ---------------------- Columns ---------------------- */
const columns = computed(() => [
    { title: 'Subject', dataIndex: 'subject_code', key: 'subject_code' },
    { title: 'Day', dataIndex: 'day_of_week', key: 'day_of_week' },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Room', dataIndex: 'room_name', key: 'room_name' },
    { title: 'Professor', dataIndex: 'professor', key: 'professor' },
])
</script>

<template>
    <a-drawer title="Student Schedule" placement="right" width="460" :open="visible"
        @close="$emit('update:visible', false)">
        <a-table :columns="columns" :data-source="schedule" :pagination="false" row-key="id" bordered>

            <!-- GLOBAL Cell Renderer -->
            <template #bodyCell="{ column, record }">

                <!-- Subject Code -->
                <template v-if="column.dataIndex === 'subject_code'">
                    {{ (record as ScheduleRow).subject.subject_code }}
                </template>

                <!-- Day -->
                <template v-else-if="column.dataIndex === 'day_of_week'">
                    {{ (record as ScheduleRow).day_of_week }}
                </template>

                <!-- Time -->
                <template v-else-if="column.dataIndex === 'time'">
                    {{ formatTime((record as ScheduleRow).start_time) }} -
                    {{ formatTime((record as ScheduleRow).end_time) }}
                </template>

                <!-- Room -->
                <template v-else-if="column.dataIndex === 'room_name'">
                    {{ (record as ScheduleRow).room?.room_number || '-' }}
                </template>

                <!-- Professor -->
                <template v-else-if="column.dataIndex === 'professor'">
                    {{ (record as ScheduleRow).professor?.last_name || '-' }}
                </template>

            </template>

        </a-table>
    </a-drawer>
</template>
