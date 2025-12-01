<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import StepAYConfig from './StepAYConfig.vue'
import StepDryRun from './StepDryRun.vue'
import StepExecute from './StepExecute.vue'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'completed'])

const currentStep = ref(0)

const form = ref({
  academic_year_name: '',
  start_date: '',
  end_date: ''
})

const dryRunData = ref(null)

function close() {
  emit('update:visible', false)
  currentStep.value = 0
  dryRunData.value = null
}

function onDryRun(data: any) {
  dryRunData.value = data
  currentStep.value = 2
}

function onExecuted() {
  message.success("Master Setup Completed!")
  emit("completed")
  close()
}
</script>

<template>
  <a-modal :visible="visible" @cancel="close" :footer="null" width="800px">
    <a-steps :current="currentStep" class="mb-5">
      <a-step title="Academic Year Config"/>
      <a-step title="Dry Run Preview"/>
      <a-step title="Execute"/>
    </a-steps>

    <div v-show="currentStep === 0">
      <StepAYConfig
        :form="form"
        @next="currentStep = 1"
      />
    </div>

    <div v-show="currentStep === 1">
      <StepDryRun
        :form="form"
        @back="currentStep = 0"
        @dry-run-complete="onDryRun"
      />
    </div>

    <div v-show="currentStep === 2">
      <StepExecute
        :form="form"
        :dryRunData="dryRunData"
        @back="currentStep = 1"
        @done="onExecuted"
      />
    </div>
  </a-modal>
</template>
