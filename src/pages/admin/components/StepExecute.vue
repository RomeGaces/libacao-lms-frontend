<script setup lang="ts">
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

const props = defineProps<{
  form: Record<string, any>,
  dryRunData?: Record<string, any> | null
}>()

const emit = defineEmits(['done','back'])

const loading = ref(false)

async function execute() {
  Modal.confirm({
    title: 'Confirm Execution',
    content: 'This will create the new AY and all sections.',
    onOk: async () => {
      loading.value = true
      try {
        await usePost(`/master-setup`, {
          ...props.form,
          dry_run: false
        })
        emit('done')
      } catch (e:any) {
        message.error(e.response?.data?.message || 'Execution failed.')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div>
    <h3 class="font-semibold mb-3">Summary</h3>

    <a-table
      :columns="[
        { title: 'Course', dataIndex: 'course' },
        { title: 'Year Level', dataIndex: 'year_level' },
        { title: 'Section', dataIndex: 'name' }
      ]"
      :data-source="props.dryRunData?.sections_created || []"
      rowKey="name"
      class="mb-4"
    />

    <div class="text-right">
      <a-button @click="emit('back')">Back</a-button>
      <a-button type="primary" class="ml-2" :loading="loading" @click="execute">
        Execute Master Setup
      </a-button>
    </div>
  </div>
</template>
