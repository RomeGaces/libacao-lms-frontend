<script setup>
import dayjs from 'dayjs'
import { ref } from 'vue'

const events = ref({})
const isModalVisible = ref(false)
const isDetailsVisible = ref(false)
const selectedDate = ref(null)
const newEvent = ref({ title: '', description: '' })
const selectedEvent = ref(null)

function onSelect(date) {
  selectedDate.value = date.format('YYYY-MM-DD')
  isModalVisible.value = true
}

function handleOk() {
  if (!events.value[selectedDate.value]) {
    events.value[selectedDate.value] = []
  }
  events.value[selectedDate.value].push({
    title: newEvent.value.title,
    description: newEvent.value.description,
  })

  // trigger reactivity
  events.value = { ...events.value }

  newEvent.value = { title: '', description: '' }
  isModalVisible.value = false
}

function openDetails(dateStr, index) {
  selectedEvent.value = events.value[dateStr][index]
  isDetailsVisible.value = true
}
</script>

<template>
  <div>
    <a-calendar @select="onSelect">
      <template #dateCellRender="{ current }">
        <ul class="events">
          <li
            v-for="(event, index) in events[current.format('YYYY-MM-DD')] || []"
            :key="index"
          >
            <a-tag
              color="blue"
              style="margin: 2px 0; cursor: pointer"
              @click.stop="openDetails(current.format('YYYY-MM-DD'), index)"
            >
              {{ event.title }}
            </a-tag>
          </li>
        </ul>
      </template>
    </a-calendar>

    <!-- Add Event Modal -->
    <a-modal
      v-model:open="isModalVisible"
      title="Add Event"
      @ok="handleOk"
      @cancel="() => (isModalVisible = false)"
    >
      <a-form layout="vertical">
        <a-form-item label="Title">
          <a-input v-model:value="newEvent.title" />
        </a-form-item>
        <a-form-item label="Description">
          <a-input v-model:value="newEvent.description" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Event Details Modal -->
    <a-modal
      v-model:open="isDetailsVisible"
      title="Event Details"
      @cancel="() => (isDetailsVisible = false)"
    >
      <p><strong>Title:</strong> {{ selectedEvent?.title }}</p>
      <p><strong>Description:</strong> {{ selectedEvent?.description }}</p>
    </a-modal>
  </div>
</template>

<style scoped>
.events {
  list-style: none;
  margin: 0;
  padding: 0;
}
.events li {
  margin: 0;
  padding: 0;
}
</style>
