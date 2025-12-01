<script setup>
defineProps({
  schedules: Array,
})
</script>

<template>
  <div class="overflow-x-auto bg-white rounded shadow">
    <table class="min-w-full border-collapse">
      <thead class="bg-gray-100">
        <tr>
          <th class="p-2 border">
            Day
          </th>
          <th class="p-2 border">
            Start
          </th>
          <th class="p-2 border">
            End
          </th>
          <th class="p-2 border">
            Subject
          </th>
          <th class="p-2 border">
            Professor
          </th>
          <th class="p-2 border">
            Section
          </th>
          <th class="p-2 border">
            Room
          </th>
          <th class="p-2 border w-32">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in schedules" :key="s.id">
          <td class="p-2 border">
            {{ s.day_of_week }}
          </td>
          <td class="p-2 border">
            {{ s.start_time }}
          </td>
          <td class="p-2 border">
            {{ s.end_time }}
          </td>
          <td class="p-2 border">
            {{ s.subject.name }}
          </td>
          <td class="p-2 border">
            {{ s.professor.first_name }} {{ s.professor.last_name }}
          </td>
          <td class="p-2 border">
            {{ s.section.section_name }}
          </td>
          <td class="p-2 border">
            {{ s.room.room_number }}
          </td>
          <td class="p-2 border text-center">
            <button class="text-blue-600" @click="$emit('edit', s)">
              Edit
            </button>
            <button class="text-red-600 ml-2" @click="$emit('delete', s.id)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
