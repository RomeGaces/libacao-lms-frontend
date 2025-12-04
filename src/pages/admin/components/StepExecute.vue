<script setup lang="ts">
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

const props = defineProps<{
  form: Record<string, any>,
  dryRunData?: Record<string, any> | null
}>()

const emit = defineEmits(['done', 'back'])

const loading = ref(false)

async function execute() {
  Modal.confirm({
    title: 'Confirm Execution',
    content: 'This will create the new Academic Year and/or semester, sections, assign students, and generate schedules.',
    onOk: async () => {
      loading.value = true
      try {
        const res = await usePost("/master-setup", {
          academic_year_name: props.form.academic_year_name,
          start_date: props.form.start_date,
          end_date: props.form.end_date,
          semester_id: props.form.semester_id,

          dry_run: false,

          section_capacity: props.form.section_capacity,
          advance_academic_year: props.form.advance_academic_year,
          fallback_online: props.form.fallback_online,
          prof_default_max_load: props.form.prof_default_max_load,
        });

        emit("done")
        console.log("Execution result:", res.data);
      } catch (e: any) {
        message.error(e.response?.data?.message || "Execution failed.")
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div>
    <h3 class="font-semibold mb-3">Generated Sections (Dry Run Result)</h3>

    <a-table :columns="[
      { title: 'Course', dataIndex: 'course_code' },
      { title: 'Year Level', dataIndex: 'year_level' },
      { title: 'Section', dataIndex: 'name' }
    ]" :data-source="props.dryRunData?.sections || []" rowKey="name" class="mb-6" bordered />

    <h3 class="font-semibold mb-3">Scheduling Proposal</h3>

    <div v-if="props.dryRunData?.schedule_proposal?.success">
      <p class="text-green-600 mb-2">✔ All sessions were successfully scheduled.</p>

      <a-table :columns="[
        { title: 'Section', dataIndex: 'section_name' },
        { title: 'Subject', dataIndex: 'subject_code' },
        { title: 'Professor', dataIndex: 'professor_name' },
        { title: 'Room', dataIndex: 'room_name' },
        { title: 'Day', dataIndex: ['timeslot', 'day'] },
        { title: 'Start', dataIndex: ['timeslot', 'start'] },
        { title: 'End', dataIndex: ['timeslot', 'end'] }
      ]" :data-source="props.dryRunData?.schedule_proposal?.assignment || []" rowKey="session_index" bordered
        size="small" />
    </div>

    <div v-else>
      <p class="text-red-600 font-semibold">
        ⚠ Some sessions could not be scheduled:
      </p>

      <pre class="bg-red-50 border p-3 rounded text-red-700">
Unschedulable Sessions:
{{ props.dryRunData?.schedule_proposal?.unschedulable }}
      </pre>

      <p class="mt-2 text-gray-600">
        You may adjust section capacity, fallback_online, or professor load and run the dry run again.
      </p>
    </div>

    <div class="text-right mt-6">
      <a-button @click="emit('back')">Back</a-button>

      <a-button type="primary" class="ml-2" :loading="loading" :disabled="!props.dryRunData?.schedule_proposal?.success"
        @click="execute">
        Execute Master Setup
      </a-button>
    </div>
  </div>
</template>
