<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: Boolean,
  professor: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

const isVisible = ref(props.open)

watch(
  () => props.open,
  (newVal) => {
    isVisible.value = newVal
  },
)

function handleClose() {
  isVisible.value = false
  emit('close')
}
</script>

<template>
  <a-modal
    :open="isVisible"
    title="Professor Information"
    :footer="null"
    width="600px"
    @cancel="handleClose"
  >
    <div class="p-4 bg-gray-900 text-gray-200 rounded-lg">
      <div class="grid grid-cols-2 gap-y-3 gap-x-6">
        <div>
          <p class="font-semibold text-gray-400">
            Name:
          </p>
          <p>{{ professor.first_name }} {{ professor.last_name }}</p>
        </div>
        <div>
          <p class="font-semibold text-gray-400">
            Middle Name:
          </p>
          <p>{{ professor.middle_name || '-' }}</p>
        </div>

        <div>
          <p class="font-semibold text-gray-400">
            Gender:
          </p>
          <p>{{ professor.gender }}</p>
        </div>
        <div>
          <p class="font-semibold text-gray-400">
            Email:
          </p>
          <p>{{ professor.email }}</p>
        </div>

        <div>
          <p class="font-semibold text-gray-400">
            Phone:
          </p>
          <p>{{ professor.phone_number || '-' }}</p>
        </div>
        <div>
          <p class="font-semibold text-gray-400">
            Hire Date:
          </p>
          <p>{{ professor.hire_date || '-' }}</p>
        </div>

        <div>
          <p class="font-semibold text-gray-400">
            Specialization:
          </p>
          <p>{{ professor.specialization || '-' }}</p>
        </div>
        <div>
          <p class="font-semibold text-gray-400">
            Status:
          </p>
          <a-tag :color="professor.status === 'active' ? 'green' : 'red'">
            {{ professor.status }}
          </a-tag>
        </div>

        <div class="col-span-2">
          <p class="font-semibold text-gray-400">
            Department:
          </p>
          <p>{{ professor.department?.department_name || '-' }}</p>
        </div>
      </div>

      <div class="border-t border-gray-700 mt-4 pt-3 text-right">
        <a-button type="primary" @click="handleClose">
          Close
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.ant-modal-body {
  background-color: #111827 !important;
}
</style>
