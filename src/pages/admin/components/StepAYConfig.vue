<script setup lang="ts">
import type { PropType } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  form: {
    type: Object as PropType<Record<string, any>>,
    required: true
  }
})

const emit = defineEmits(['next'])

function nextStep() {
  if (!props.form.academic_year_name) {
    message.warning("Please enter the Academic Year Name")
    return
  }
  emit('next', props.form)
}
</script>

<template>
  <div>
    <a-form layout="vertical">
      <a-form-item label="Academic Year Name">
        <a-input v-model:value="form.academic_year_name" placeholder="2025-2026" />
      </a-form-item>

      <a-form-item label="Start Date">
        <a-date-picker v-model:value="form.start_date" style="width: 100%" />
      </a-form-item>

      <a-form-item label="End Date">
        <a-date-picker v-model:value="form.end_date" style="width: 100%" />
      </a-form-item>

      <div class="text-right">
        <a-button type="primary" @click="nextStep">Next</a-button>
      </div>
    </a-form>
  </div>
</template>
