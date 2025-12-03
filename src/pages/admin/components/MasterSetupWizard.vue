<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'

import StepAYConfig from './StepAYConfig.vue'
import StepDryRun from './StepDryRun.vue'
import StepExecute from './StepExecute.vue'

/*
|--------------------------------------------------------------------------
| Props & Emits
|--------------------------------------------------------------------------
*/
const props = defineProps({
  visible: { type: Boolean, default: false },
  academicYearName: { type: String, required: true },
  semesterId: { type: Number, required: true }
})

const emit = defineEmits(['update:visible', 'completed'])

/*
|--------------------------------------------------------------------------
| Wizard State
|--------------------------------------------------------------------------
*/
const currentStep = ref(0)

const form = ref({
  academic_year_name: '',
  start_date: '',
  end_date: '',
  semester_id: 0,
  advance_academic_year: false,
  section_capacity: 35,
  fallback_online: true,
  prof_default_max_load: 10
})

const dryRunData = ref(null)

/*
|--------------------------------------------------------------------------
| Logic
|--------------------------------------------------------------------------
*/
watch(
  () => props.visible,
  (v) => {
    if (v) initializeForm()
  }
)

function initializeForm() {
  form.value.academic_year_name = props.academicYearName
  form.value.semester_id = props.semesterId
  form.value.start_date = ''
  form.value.end_date = ''
  form.value.advance_academic_year = false
  form.value.section_capacity = 35
  form.value.fallback_online = true
  form.value.prof_default_max_load = 10
  dryRunData.value = null
  currentStep.value = 0
}

function close() {
  emit('update:visible', false)
  currentStep.value = 0
  dryRunData.value = null
}

function handleDryRunCompleted(data: any) {
  dryRunData.value = data.preview
  currentStep.value = 2
}

function handleExecuted() {
  message.success('Master Setup Completed!');
  emit('completed');
  close();
}
</script>

<template>
  <a-modal :visible="visible" title="Master Setup Wizard" @cancel="close" :footer="null" width="900px">
    <a-steps :current="currentStep" class="mb-5">
      <a-step title="Configuration" />
      <a-step title="Dry Run" />
      <a-step title="Execute" />
    </a-steps>

    <!-- STEP 1 -->
    <div v-show="currentStep === 0">
      <StepAYConfig v-model:form="form" :semester-id="props.semesterId" @next="currentStep = 1" />
    </div>

    <!-- STEP 2 -->
    <div v-show="currentStep === 1">
      <StepDryRun :form="form" @dry-run-complete="handleDryRunCompleted" @back="currentStep = 0" />
    </div>

    <!-- STEP 3 -->
    <div v-show="currentStep === 2">
      <StepExecute :form="form" :dryRunData="dryRunData" @done="handleExecuted" @back="currentStep = 1" />
    </div>

  </a-modal>
</template>
