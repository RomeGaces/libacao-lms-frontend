<script setup lang="ts">
import { ref, onMounted, PropType } from "vue";
import { message } from "ant-design-vue";
import dayjs from "dayjs";

interface Semester {
  id: string | number;
  name: string;
}

const props = defineProps({
  form: {
    type: Object as PropType<Record<string, any>>,
    required: true
  }
});

const emit = defineEmits(["next"]);

// expose form in template
const form = props.form;

const semesters = ref<Semester[]>([]);

const loadSemesters = async () => {
  const res = await useGet("/master/semesters");

  semesters.value = (res.data.data || []).filter(
    (sem: { is_active: boolean; }) => !sem.is_active
  );
};

onMounted(loadSemesters);

function nextStep() {
  if (!form.academic_year_name) {
    return message.error("Academic Year Name is required");
  }
  if (!form.semester_id) {
    return message.error("Please select a semester");
  }
  if (!form.start_date) {
    return message.error("Start date is required");
  }
  if (!form.end_date) {
    return message.error("End date is required");
  }

  emit("next");
}

// Handle date picker outputs
function updateStartDate(value: any) {
  form.start_date = value ? value.format("YYYY-MM-DD") : "";
}

function updateEndDate(value: any) {
  form.end_date = value ? value.format("YYYY-MM-DD") : "";
}
</script>

<template>
  <div>
    <a-form layout="vertical">

      <a-form-item label="Academic Year Name" required>
        <a-input v-model:value="form.academic_year_name" placeholder="2025-2026" />
      </a-form-item>

      <a-form-item label="Select Semester" required>
        <a-select v-model:value="form.semester_id" placeholder="Choose Semester">
          <a-select-option v-for="s in semesters" :key="s.id" :value="s.id">
            {{ s.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="Start Date" required>
        <a-date-picker :value="form.start_date ? dayjs(form.start_date) : undefined" @change="updateStartDate"
          style="width: 100%" />
      </a-form-item>

      <a-form-item label="End Date" required>
        <a-date-picker :value="form.end_date ? dayjs(form.end_date) : undefined" @change="updateEndDate"
          style="width: 100%" />
      </a-form-item>

      <div class="text-right">
        <a-button type="primary" @click="nextStep">Next</a-button>
      </div>

    </a-form>
  </div>
</template>
