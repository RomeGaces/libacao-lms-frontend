<script setup>
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ref, watch } from 'vue'
import axios from '@/axios'

const props = defineProps({
  open: Boolean,
  isEditing: Boolean,
  professor: Object,
  departments: Array,
})
const emit = defineEmits(['close', 'saved'])

const form = ref({})

watch(
  () => props.professor,
  (val) => {
    form.value = { ...val }
  },
  { immediate: true },
)

async function handleSubmit() {
  const payload = { ...form.value }

  // Format the date properly
  if (payload.hire_date) {
    payload.hire_date = dayjs(payload.hire_date).format('YYYY-MM-DD')
  }

  try {
    if (props.isEditing) {
      await axios.put(`/professors/${payload.professor_id}`, payload)
      message.success('Professor updated successfully')
    }
    else {
      await axios.post('/professors', payload)
      message.success('Professor created successfully')
    }
    emit('saved')
    emit('close')
  }
  catch (err) {
    message.error('Failed to save professor')
  }
}
</script>

<template>
  <a-modal
    :open="open" :title="isEditing ? 'Edit Professor' : 'Add Professor'" ok-text="Save" @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <a-form layout="vertical">
      <a-form-item label="First Name">
        <a-input v-model:value="form.first_name" />
      </a-form-item>

      <a-form-item label="Last Name">
        <a-input v-model:value="form.last_name" />
      </a-form-item>

      <a-form-item label="Middle Name">
        <a-input v-model:value="form.middle_name" />
      </a-form-item>

      <a-form-item label="Gender">
        <a-select v-model:value="form.gender" placeholder="Select gender">
          <a-select-option value="Male">
            Male
          </a-select-option>
          <a-select-option value="Female">
            Female
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="Email">
        <a-input v-model:value="form.email" />
      </a-form-item>

      <a-form-item label="Phone Number">
        <a-input v-model:value="form.phone_number" />
      </a-form-item>

      <a-form-item label="Hire Date">
        <a-date-picker v-model:value="form.hire_date" style="width: 100%" />
      </a-form-item>

      <a-form-item label="Specialization">
        <a-input v-model:value="form.specialization" />
      </a-form-item>

      <a-form-item label="Status">
        <a-select v-model:value="form.status">
          <a-select-option value="active">
            Active
          </a-select-option>
          <a-select-option value="inactive">
            Inactive
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="Department">
        <a-select v-model:value="form.department_id" placeholder="Select Department">
          <a-select-option v-for="dept in departments" :key="dept.department_id" :value="dept.department_id">
            {{ dept.department_name }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
