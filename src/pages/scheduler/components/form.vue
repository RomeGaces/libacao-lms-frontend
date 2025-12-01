<script setup>
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ref, watch } from 'vue'
import schedulesApi from '../components/schedules.js'

const props = defineProps({
  open: Boolean,
  isEditing: Boolean,
  record: Object,
  subjects: Array,
  professors: Array,
  rooms: Array,
  sections: Array,
})

const emit = defineEmits(['close', 'saved'])

const loading = ref(false)
const formRef = ref(null)
const form = ref({
  day_of_week: '',
  subject_id: '',
  professor_id: '',
  start_time: null,
  end_time: null,
  room_id: '',
  class_section_id: '',
})

const rules = {
  day_of_week: [{ required: true, message: 'Please select a day' }],
  subject_id: [{ required: true, message: 'Please select a subject' }],
  professor_id: [{ required: true, message: 'Please select a professor' }],
  start_time: [{ required: true, message: 'Please select start time' }],
  end_time: [{ required: true, message: 'Please select end time' }],
  room_id: [{ required: true, message: 'Please select a room' }],
  class_section_id: [{ required: true, message: 'Please select a section' }],
}

const dayOptions = [
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
]

// populate form when editing
watch(
  () => props.record,
  (record) => {
    if (record && props.isEditing) {
      form.value = {
        day_of_week: record.day_of_week,
        subject_id: record.subject_id,
        professor_id: record.professor_id,
        start_time: dayjs(record.start_time, 'HH:mm'),
        end_time: dayjs(record.end_time, 'HH:mm'),
        room_id: record.room_id,
        class_section_id: record.class_section_id,
      }
    }
  },
  { immediate: true },
)

async function handleSubmit() {
  try {
    await formRef.value.validate()
    loading.value = true

    const payload = {
      ...form.value,
      semester: '1st Sem',
      academic_year: 'AY 2024-2025',
      start_time: form.value.start_time.format('HH:mm'),
      end_time: form.value.end_time.format('HH:mm'),
    }

    if (props.isEditing) {
      try {
        await schedulesApi.updateSchedule(props.record.class_schedule_id, payload)
        message.success('Schedule updated successfully!')
      }
      catch (error) {
        message.error()
      }
    }
    else {
      await schedulesApi.createSchedule(payload)
      message.success('Schedule added successfully!')
    }

    emit('saved')
    handleCancel()
  }
  catch (err) {
    if (err.meta?.exists) {
      message.error(err.meta.message || 'Conflict detected')
    }
    else if (err.errorFields) {
      message.warning('Please fill out all required fields')
    }
    else {
      message.error('Something went wrong')
      console.error(err)
    }
  }
  finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('close')
  form.value = {
    day_of_week: '',
    subject_id: '',
    professor_id: '',
    start_time: null,
    end_time: null,
    room_id: '',
    class_section_id: '',
  }
}
</script>

<template>
  <a-modal
    :open="open" :title="isEditing ? 'Edit Class Schedule' : 'Add Class Schedule'" :confirm-loading="loading"
    width="600px" destroy-on-close @cancel="handleCancel" @ok="handleSubmit"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item label="Day of the Week" name="day_of_week">
        <a-select v-model:value="form.day_of_week" placeholder="Select day" :options="dayOptions" />
      </a-form-item>

      <a-form-item label="Subject" name="subject_id">
        <a-select
          v-model:value="form.subject_id" placeholder="Select subject"
          :options="subjects.map(s => ({ label: `${s.subject_code} - ${s.subject_name}`, value: s.subject_id }))"
        />
      </a-form-item>

      <a-form-item label="Professor" name="professor_id">
        <a-select
          v-model:value="form.professor_id" placeholder="Select professor" :options="professors.map(p => ({
            label: `${p.first_name} ${p.last_name}`,
            value: p.professor_id,
          }))"
        />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Start Time" name="start_time">
            <a-time-picker
              v-model:value="form.start_time" format="HH:mm" style="width: 100%"
              placeholder="Start"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="End Time" name="end_time">
            <a-time-picker
              v-model:value="form.end_time" format="HH:mm" style="width: 100%"
              placeholder="End"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Room" name="room_id">
        <a-select
          v-model:value="form.room_id" placeholder="Select room" :options="rooms.map(r => ({
            label: `${r.building_name} - room: ${r.room_number}`,
            value: r.room_id,
          }))"
        />
      </a-form-item>

      <a-form-item label="Section" name="class_section_id">
        <a-select
          v-model:value="form.class_section_id" placeholder="Select section" :options="sections.map(s => ({
            label: s.section_name,
            value: s.class_section_id,
          }))"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
