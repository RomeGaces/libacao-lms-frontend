<script setup>
const props = defineProps({
  open: Boolean,
})
const emit = defineEmits(['close'])

const dummySchedule = [
  { day: 'Monday', time: '08:00 - 10:00', subject: 'Math 101', room: 'Rm 201' },
  { day: 'Wednesday', time: '10:00 - 12:00', subject: 'CS 301', room: 'Rm 305' },
]
</script>

<template>
  <a-modal :open="open" title="Professor Availability" width="600px" footer="{null}" @cancel="() => emit('close')">
    <a-table
      :columns="[
        { title: 'Day', dataIndex: 'day' },
        { title: 'Time', dataIndex: 'time' },
        { title: 'Subject', dataIndex: 'subject' },
        { title: 'Room', dataIndex: 'room' },
      ]"
      :data-source="dummySchedule"
      bordered
      size="small"
      row-key="time"
    />
  </a-modal>
</template>
