<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  form: Object
})
const emit = defineEmits(['dry-run-complete', 'back'])

const loading = ref(false)

async function runDry() {
  loading.value = true
  try {
    const res = await usePost(`/master-setup`, {
      ...props.form,
      dry_run: true
    })
    emit('dry-run-complete', res.data)
  } catch (e:any) {
    message.error(e.response?.data?.message || 'Dry run failed.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <p class="mb-3 text-gray-600">Preview the sections that will be generated.</p>

    <div class="text-right mb-4">
      <a-button @click="emit('back')">Back</a-button>
      <a-button type="primary" class="ml-2" :loading="loading" @click="runDry">
        Run Dry Run
      </a-button>
    </div>
  </div>
</template>
