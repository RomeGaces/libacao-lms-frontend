<script setup lang="ts">
import CalendarHeader from './components/CalendarHeader.vue'
import CalendarGrid from './components/CalendarGrid.vue'
import CalendarEvents from './components/CalendarEvents.vue'
import EventDrawer from './components/EventDrawer.vue'
import EventEditModal from './components/EventEditModal.vue'
import CalendarControls from './components/CalendarControls.vue'

import useCalendarData from './composables/useCalendarData'
import { ref, onMounted, nextTick } from 'vue'

/* Ref to CalendarGrid component */
const gridComp = ref<{
  localHeaderRef: { value: HTMLElement | null },
  localDaysGridRef: { value: HTMLElement | null }
} | null>(null)




/* Get all state + refs + methods from composable */
const {
  isLoading,
  displayDays,
  timeSlots,
  slotHeightPx,
  totalGridHeight,
  dayColumnWidth,
  dayRenderData,

  drawerVisible,
  drawerTitle,
  drawerData,
  drawerMode,
  editModalVisible,
  editModalData,
  eventLoadingId,

  subjectOptions,
  professorOptions,
  allRooms,
  buildingOptions,
  timeOptions,
  eventRefs,
  editForm,
  editConflict,
  isSaving,

  handleFilters,
  onScroll,
  eventStyle,
  onEventClick,
  onGroupSummaryClick,
  closeDrawer,
  openEditModalForClass,
  saveEditedClass,

  filters,
  schoolYears,
  semesters,
  courses,
  sections,
  yearLevels,

  /* RESTORED SCROLL-SYNC REFS */
  daysGridRef,
  headerDaysRef
} = useCalendarData()

/* Attach DOM refs exposed from CalendarGrid to composable */
onMounted(async () => {
  await nextTick()

  if (gridComp.value) {

    /* Header scroll area */
    if (gridComp.value.localHeaderRef?.value) {
      headerDaysRef.value = gridComp.value.localHeaderRef.value
    }

    /* Main scroll area */
    if (gridComp.value.localDaysGridRef?.value) {
      daysGridRef.value = gridComp.value.localDaysGridRef.value
    }
  }
})
</script>

<template>
  <div class="scheduler-page">

    <!-- Page Title -->
    <CalendarHeader />

    <!-- Filters -->
    <CalendarControls v-model="filters" :options="{
      schoolYears,
      semesters,
      courses,
      sections,
      professorOptions,
      allRooms,
      yearLevels
    }" @filters-change="handleFilters" />

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <a-spin size="large" tip="Loading schedules..." />
    </div>

    <!-- Calendar -->
    <div v-else class="calendar-wrap">
      <CalendarGrid ref="gridComp" :display-days="displayDays" :time-slots="timeSlots" :slot-height-px="slotHeightPx"
        :total-grid-height="totalGridHeight" :day-column-width="dayColumnWidth" @scroll="onScroll">

        <!-- EVENTS SLOT -->
        <template #events="{ day }">
          <CalendarEvents :day="day" :day-render-data="dayRenderData" :event-style="eventStyle" :event-loading-id="eventLoadingId"
            :on-event-click="onEventClick" :on-group-summary-click="onGroupSummaryClick" :event-refs="eventRefs" />
        </template>

      </CalendarGrid>
    </div>

    <!-- DRAWER -->
    <EventDrawer v-model:visible="drawerVisible" :editForm="editForm" :editConflict="editConflict" :title="drawerTitle" :mode="drawerMode" :drawer-data="drawerData" :isSaving="isSaving"
      :subject-options="subjectOptions" :professor-options="professorOptions" :all-rooms="allRooms"
      :building-options="buildingOptions" :time-options="timeOptions" @close="closeDrawer"
      @open-edit="openEditModalForClass"  @save="saveEditedClass" />

    <!-- EDIT MODAL -->
    <EventEditModal v-model:visible="editModalVisible" :data="editModalData" :time-options="timeOptions"
      @save="saveEditedClass" />

  </div>
</template>

<style scoped>
.scheduler-page {
  padding: 12px;
}
</style>
