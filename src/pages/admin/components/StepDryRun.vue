<script setup lang="ts">
import { ref, PropType } from 'vue'
import { message } from 'ant-design-vue'

const props = defineProps({
  form: {
    type: Object as PropType<Record<string, any>>,
    required: true,
  },
})

const emit = defineEmits(['dry-run-complete', 'back'])

const loading = ref(false)

async function runDry() {
  loading.value = true

  try {
    const res = await usePost("/master-setup", {
      academic_year_name: props.form.academic_year_name,
      start_date: props.form.start_date,
      end_date: props.form.end_date,
      semester_id: props.form.semester_id,
      dry_run: true,

      section_capacity: props.form.section_capacity,
      advance_academic_year: props.form.advance_academic_year,
      fallback_online: props.form.fallback_online,
      prof_default_max_load: props.form.prof_default_max_load,
    })

    // backend returns { preview: {...}, message: "..." }
    emit("dry-run-complete", res.data.preview)

  } catch (e: any) {
    message.error(e.response?.data?.message || "Dry run failed.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <p class="mb-3 text-gray-600">
      This dry run will analyze all students, generate required sections,
      list subjects, candidate rooms & professors, and simulate scheduling.
    </p>

    <div class="text-right mb-4">
      <a-button @click="emit('back')">Back</a-button>

      <a-button type="primary" class="ml-2" :loading="loading" @click="runDry">
        Run Dry Run
      </a-button>
    </div>
  </div>
</template>
