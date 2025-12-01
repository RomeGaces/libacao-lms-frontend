<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, h, nextTick, onMounted, ref, watch } from 'vue'
import CalendarControls from './components/calendar-controls.vue'

// ------------------- INTERFACES -------------------
interface FilterInterface {
  academic_year: string
  semester: string
  course_id: number
}

interface ClassItem {
  id: number
  title: string
  professor: string
  room: string
  section?: string
  capacity_status?: string
  start_time: string
  end_time: string
}

interface BackendSchedule {
  day_of_week: string
  start_time: string
  end_time: string
  count: number
  label: string
  classes: ClassItem[]
}

interface CalendarEvent {
  id: string
  label: string
  start: number
  end: number
  count: number
  col: number
  groupCols: number
  classes: ClassItem[]
  raw: BackendSchedule
  _isCompact?: boolean
  [key: string]: any
}

// ------------------- CONFIG / STATE -------------------
const slotMinutes = 30 // used for grid lines only
const displayDays = [
  { key: 'Monday', label: 'Mon' },
  { key: 'Tuesday', label: 'Tue' },
  { key: 'Wednesday', label: 'Wed' },
  { key: 'Thursday', label: 'Thu' },
  { key: 'Friday', label: 'Fri' },
  { key: 'Saturday', label: 'Sat' },
]

// data from backend
const rawEvents = ref<BackendSchedule[]>([])
const positionedEvents = ref<Record<string, CalendarEvent[]>>({})
// keep groups (overlap groups) per day to render stack summaries
const overlapGroups = ref<Record<string, CalendarEvent[][]>>({})

const isLoading = ref(true)
const filters = ref<FilterInterface>({
  academic_year: '2025-2026',
  semester: '1st',
  course_id: 1,
})

// drawer & modal state
const drawerVisible = ref(false)
const drawerTitle = ref('')
const drawerData = ref<CalendarEvent[]>([]) // events to show in drawer
const drawerMode = ref<'edit-single' | 'list-single-timeslot' | 'multi-timeslot'>('multi-timeslot')

const editModalVisible = ref(false)
const editModalData = ref<ClassItem | null>(null)

// compact heuristic
const eventRefs = ref<HTMLElement[]>([])

// time range
const dayStartMinute = ref(7 * 60)
const dayEndMinute = ref(18 * 60)

// sizing - responsive
const daysGridRef = ref<HTMLElement | null>(null)
const headerDaysRef = ref<HTMLElement | null>(null)
const containerHeightPx = ref(600) // default; will update with ResizeObserver
const hourHeight = computed(() => {
  // compute hours in view
  const minutes = Math.max(60, dayEndMinute.value - dayStartMinute.value)
  const hours = minutes / 60
  // prefer to base on container height if available
  const h = containerHeightPx.value ? containerHeightPx.value / hours : 62
  return Math.max(40, h) // ensure a reasonable minimum
})
const slotHeightPx = computed(() => (hourHeight.value * (slotMinutes / 60)))

// ------------------- FETCH -------------------
async function fetchSchedules() {
  isLoading.value = true
  try {
    const query = new URLSearchParams({
      academic_year: filters.value.academic_year,
      semester: filters.value.semester,
      course_id: String(filters.value.course_id),
    }).toString()
    const res = await useGet(`/schedules/query?${query}`)
    if (!res || !res.data) {
      throw new Error('Failed to fetch schedules')
    }
    rawEvents.value = res.data
  }
  catch (err) {
    message.warning('Could not fetch schedules, using sample payload')
    rawEvents.value = []
  }
  computeTimeRange()
  computeLayout()
  isLoading.value = false
}

// ------------------- COMPUTE RANGE -------------------
function computeTimeRange() {
  if (!rawEvents.value?.length)
    return
  let minStart = 24 * 60
  let maxEnd = 0
  for (const e of rawEvents.value) {
    const s = parseTimeToMinutes(e.start_time)
    const en = parseTimeToMinutes(e.end_time)
    if (s < minStart)
      minStart = s
    if (en > maxEnd)
      maxEnd = en
  }
  dayStartMinute.value = Math.max(6 * 60, Math.floor(minStart / 60) * 60)
  dayEndMinute.value = Math.min(22 * 60, Math.ceil(maxEnd / 60) * 60)
}

// ------------------- COMPUTE LAYOUT & OVERLAP GROUPS -------------------
function computeLayout() {
  const byDay: Record<string, CalendarEvent[]> = {}

  // 1️⃣ Organize events per day
  for (const item of rawEvents.value) {
    const day = item.day_of_week
    if (!byDay[day])
      byDay[day] = []

    byDay[day].push({
      id: `${day}-${item.start_time}-${item.end_time}-${Math.random().toString(36).slice(2, 6)}`,
      label: item.label || `${item.count} classes`,
      start: parseTimeToMinutes(item.start_time),
      end: parseTimeToMinutes(item.end_time),
      count: item.count,
      col: 0,
      groupCols: 1,
      classes: item.classes,
      raw: item,
    })
  }

  const positioned: Record<string, CalendarEvent[]> = {}
  const groupsMap: Record<string, CalendarEvent[][]> = {}

  // 2️⃣ Process each day separately
  for (const day of displayDays) {
    const events = (byDay[day.key] || []).slice()
    if (!events.length) {
      positioned[day.key] = []
      groupsMap[day.key] = []
      continue
    }

    // sort by start time first
    events.sort((a, b) => a.start - b.start || a.end - b.end)

    // 3️⃣ Merge overlapping events
    const merged: CalendarEvent[] = []
    let current = { ...events[0] }

    for (let i = 1; i < events.length; i++) {
      const next = events[i]
      // if overlaps or touches current range
      if (next.start < current.end) {
        // merge them
        current.end = Math.max(current.end, next.end)
        current.count += next.count
        current.classes = [...(current.classes || []), ...(next.classes || [])]
      }
      else {
        merged.push(current)
        current = { ...next }
      }
    }
    merged.push(current)

    // 4️⃣ Treat each merged block as a single group (no overlap)
    const positionedDay: CalendarEvent[] = []
    const groups: CalendarEvent[][] = []

    for (const ev of merged) {
      positionedDay.push({ ...ev, col: 0, groupCols: 1 })
      groups.push([ev]) // each merged block is one group
    }

    positioned[day.key] = positionedDay
    groupsMap[day.key] = groups
  }

  positionedEvents.value = positioned
  overlapGroups.value = groupsMap
}

const drawerPanelGroups = computed(() => {
  // ensure we always work with an array
  const eventsArr: CalendarEvent[] = Array.isArray(drawerData.value)
    ? drawerData.value
    : drawerData.value ? [drawerData.value] : []

  const map: Record<string, ClassItem[]> = {}

  for (const ev of eventsArr) {
    for (const cls of ev.classes) {
      const key = `${cls.start_time} – ${cls.end_time}`
      if (!map[key])
        map[key] = []
      map[key].push(cls)
    }
  }

  // return array of panels { key, classes } in stable order (sorted by start time)
  const entries = Object.entries(map)
  // sort by start time to keep panels in chronological order
  entries.sort((a, b) => {
    // parse "HH:mm:ss – HH:mm:ss" and compare start times
    const aStart = a[0].split('–')[0].trim()
    const bStart = b[0].split('–')[0].trim()
    return aStart.localeCompare(bStart)
  })

  return entries.map(([k, v]) => ({ key: k, classes: v }))
})

// ------------------- UTILS -------------------
function parseTimeToMinutes(t: string): number {
  const [h, m = '0'] = t.split(':')
  return Number(h) * 60 + Number(m)
}
function timeString(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
function formatHour(minute: number): string {
  const h = Math.floor(minute / 60)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = ((h + 11) % 12) + 1
  return `${hr}:00 ${ampm}`
}

// responsive event style using computed hourHeight and percentages
function eventStyle(ev: CalendarEvent) {
  const startFromTopMin = Math.max(ev.start, dayStartMinute.value) - dayStartMinute.value
  const endFromTopMin = Math.min(ev.end, dayEndMinute.value) - dayStartMinute.value
  const topPx = (startFromTopMin / 60) * hourHeight.value
  const heightPx = Math.max(((endFromTopMin - startFromTopMin) / 60) * hourHeight.value, 6)
  const widthPercent = 100 / ev.groupCols
  const leftPercent = ev.col * widthPercent

  return {
    top: `${topPx}px`,
    height: `${heightPx}px`,
    left: `${leftPercent}%`,
    width: `calc(${widthPercent}% - 6px)`,
  }
}

// ------------------- INTERACTIONS -------------------

// fixed handleFilters: await fetchSchedules so callers can rely on completion
async function handleFilters(data: FilterInterface) {
  filters.value = data
  await fetchSchedules()
  // optionally reset scroll
  if (daysGridRef.value)
    daysGridRef.value.scrollTop = 0
}

// event click behavior
function onEventClick(ev: CalendarEvent) {
  // if the CalendarEvent corresponds to a single schedule entry and that schedule has exactly 1 class
  if (ev.classes.length === 1 && ev.count === 1) {
    // single class: open drawer in edit form mode for that class
    drawerTitle.value = `Edit — ${ev.classes[0].title}`
    drawerData.value = [ev]
    drawerMode.value = 'edit-single'
    drawerVisible.value = true
  }
  else {
    // single timeslot but multiple classes (same start/end but multiple classes)
    drawerTitle.value = `${formatTimeRange(ev.start, ev.end)} — ${ev.classes.length} classes`
    drawerData.value = [ev]
    drawerMode.value = 'list-single-timeslot'
    drawerVisible.value = true
  }
}

// when user clicks the "+N more" summary for a specific overlap group
function onGroupSummaryClick(dayKey: string, groupIndex: number) {
  const group = overlapGroups.value[dayKey]?.[groupIndex] || []
  if (!group.length)
    return
  // determine if group contains multiple unique timeslots
  drawerData.value = group.slice() // copy
  drawerTitle.value = `${dayKey} — ${formatTimeRange(Math.min(...group.map(g => g.start)), Math.max(...group.map(g => g.end)))}`
  drawerMode.value = 'multi-timeslot'
  drawerVisible.value = true
}

// helper to format start-end
function formatTimeRange(s: number, e: number) {
  return `${timeString(s)} - ${timeString(e)}`
}

// open edit modal for a specific class row
function openEditModalForClass(c: ClassItem) {
  editModalData.value = c
  editModalVisible.value = true
}

// handle edit save (dummy; replace with actual save)
function saveEditedClass(payload: ClassItem) {
  // implement your API call here

  message.success(`Saved (simulate)${payload.start_time} - ${payload.end_time}`)
  editModalVisible.value = false
  // refresh schedules after save
  fetchSchedules()
}

// on drawer close
function closeDrawer() {
  drawerVisible.value = false
  drawerData.value = []
}

// ------------------- SCROLL SYNC -------------------
function onScroll(e: Event) {
  const target = e.target as HTMLElement
  if (headerDaysRef.value)
    headerDaysRef.value.scrollLeft = target.scrollLeft
}

// ------------------- COMPUTED / HELPERS FOR TEMPLATE -------------------
const timeSlots = computed(() => {
  const arr: number[] = []
  for (let m = dayStartMinute.value; m < dayEndMinute.value; m += slotMinutes) arr.push(m)
  return arr
})

const totalGridHeight = computed(() => {
  const minutes = dayEndMinute.value - dayStartMinute.value
  return (minutes / 60) * hourHeight.value
})

const dayColumnWidth = computed(() => 100 / displayDays.length)

// visible grouped rendering structure per day to consume in template
const dayRenderData = computed(() => {
  const out: Record<string, { groups: CalendarEvent[][], eventsFlat: CalendarEvent[] }> = {}
  for (const d of displayDays) {
    out[d.key] = {
      groups: overlapGroups.value[d.key] || [],
      eventsFlat: positionedEvents.value[d.key] || [],
    }
  }
  return out
})

// ------------------- COMPACT DETECT -------------------
function updateCompactView() {
  nextTick(() => {
    // eventRefs contains elements in the same order as positionedEvents flat order,
    // this may be unreliable — ensure matching by data-key if you need deterministic behavior.
    eventRefs.value.forEach((el: HTMLElement | undefined) => {
      if (!el)
        return
      const vnodeKey = (el as any).__vnode?.key
      if (!vnodeKey)
        return
      const allEvents = Object.values(positionedEvents.value).flat()
      const ev = allEvents.find(e => String(e.id) === String(vnodeKey))
      if (ev) {
        ev._isCompact = el.offsetHeight < 56 || el.offsetWidth < 100
      }
    })
  })
}

// ------------------- LIFECYCLE -------------------
onMounted(async () => {
  // fetch initial
  await fetchSchedules()

  // observe container height for responsive hourHeight
  // if (daysGridRef.value) {
  //   const ro = new ResizeObserver((entries) => {
  //     for (const ent of entries) {
  //       const h = ent.contentRect.height
  //       if (h > 0)
  //         containerHeightPx.value = h
  //     }
  //   })
  //   ro.observe(daysGridRef.value)
  // }
  // initial compact update
  updateCompactView()
})

watch(rawEvents, () => {
  computeTimeRange()
  computeLayout()
})
watch(positionedEvents, () => updateCompactView(), { deep: true })
</script>

<template>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-semibold tracking-wide">
      Class Scheduler
    </h1>
    <a-button type="primary" class="!bg-blue-600 hover:!bg-blue-700 font-medium rounded-xl shadow-md">
      + Add Schedule
    </a-button>
  </div>

  <!-- Filters -->
  <CalendarControls @filters-change="handleFilters" />

  <!-- Loading -->
  <div v-if="isLoading" class="flex justify-center items-center h-64">
    <a-spin size="large" tip="Loading schedules..." />
  </div>

  <div v-else class="calendar-wrap">
    <div class="calendar-header">
      <div class="header-left sticky-time-col" />
      <div ref="headerDaysRef" class="header-days">
        <div v-for="day in displayDays" :key="day.key" class="day-cell">
          <div class="day-label">
            {{ day.label }}
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-body">
      <!-- sticky time column -->
      <div class="time-col sticky-time-col">
        <div v-for="slot in timeSlots" :key="slot" class="time-slot" :style="{ height: `${slotHeightPx}px` }">
          <div v-if="slot % 60 === 0" class="time-text">
            {{ formatHour(slot) }}
          </div>
        </div>
      </div>

      <!-- scrollable days area -->
      <div ref="daysGridRef" class="days-grid" @scroll="onScroll">
        <div class="days-row" :style="{ height: `${totalGridHeight}px` }">
          <div v-for="(day) in displayDays" :key="day.key" class="day-column" :style="{ width: `${dayColumnWidth}%` }">
            <!-- background rows -->
            <div
              v-for="slot in timeSlots" :key="`bg-${day.key}-${slot}`" class="bg-slot"
              :style="{ height: `${slotHeightPx}px` }"
            />

            <!-- Render overlap groups and events -->
            <div class="events-container">
              <!-- iterate groups to decide when to show '+N more' -->
              <template v-for="(group, gi) in dayRenderData[day.key].groups">
                <!-- if group length < 3: render each event normally -->
                <template v-if="group[0].classes.length < 3">
                  <div
                    v-for="ev in group" :key="ev.id" :ref="el => eventRefs.push(el as HTMLElement)" class="event"
                    :style="eventStyle(ev)"
                  >
                    <a-tooltip
                      v-if="ev.count > 1" :title="ev.classes.map(c => c.title).slice(0, 5).join('; ')"
                      placement="top"
                    >
                      <div class="event-card clickable" @click="onEventClick(ev)">
                        <div class="event-title">
                          {{ ev.classes[0]?.title }}
                        </div>
                        <div class="event-sections">
                          {{ ev.classes.slice(0, 2).map(c => c.section).join(', ') }}
                        </div>
                        <div v-if="ev.count > 1" class="event-extra">
                          {{ ev.count - 1 }} more {{ ev.count - 1 === 1 ? 'class' : 'classes' }}
                        </div>
                      </div>
                    </a-tooltip>
                    <div v-else class="event-card clickable" @click="onEventClick(ev)">
                      <div class="event-title">
                        {{ ev.classes[0]?.title }}
                      </div>
                      <div class="event-sections">
                        {{ ev.classes.slice(0, 2).map(c => c.section).join(', ') }}
                      </div>
                      <div v-if="ev.count > 1" class="event-extra">
                        {{ ev.count - 1 }} more
                      </div>
                    </div>
                  </div>
                </template>

                <!-- if group length >= 3: show first 2 normally and a summary badge -->
                <template v-else>
                  <div
                    v-for="(ev) in group.slice(0, 2)" :key="ev.id" :ref="el => eventRefs.push(el as HTMLElement)"
                    class="event" :style="eventStyle(ev)"
                  >
                    <a-tooltip
                      v-if="ev.count > 1" :title="ev.classes.map(c => c.title).slice(0, 5).join('; ')"
                      placement="top"
                    >
                      <div class="event-card clickable" @click="onGroupSummaryClick(day.key, gi)">
                        <div class="event-title">
                          {{ ev.classes[0]?.title }}
                        </div>
                        <div class="event-sections">
                          {{ ev.classes.slice(0, 2).map(c => c.section).join(', ') }}
                        </div>
                        <div v-if="ev.count > 1" class="event-extra">
                          {{ ev.count - 1 }} more
                        </div>
                      </div>
                    </a-tooltip>

                    <div v-else class="event-card clickable" @click="onGroupSummaryClick(day.key, gi)">
                      <div class="event-title">
                        {{ ev.classes[0]?.title }}
                      </div>
                    </div>
                  </div>
                </template>
              </template>

              <!-- events not in any group? fallback: render flat events -->
              <template v-for="ev in dayRenderData[day.key].eventsFlat" :key="`flat-${ev.id}`">
                <!-- already rendered via groups; skip duplicates -->
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer for group / list / edit -->
    <a-drawer
      v-model:open="drawerVisible" :title="drawerTitle" placement="right" width="480" :mask-closable="true"
      @close="closeDrawer"
    >
      <!-- Modes -->
      <div v-if="drawerMode === 'edit-single' && drawerData.length">
        <h3>Edit Class</h3>
        <a-form layout="vertical">
          <a-form-item label="Title">
            <a-input v-model:value="drawerData[0].classes[0].title" />
          </a-form-item>
          <a-form-item label="Professor">
            <a-input v-model:value="drawerData[0].classes[0].professor" />
          </a-form-item>
          <a-form-item label="Room">
            <a-input v-model:value="drawerData[0].classes[0].room" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="() => { saveEditedClass(drawerData[0].classes[0]); closeDrawer(); }">
              Save
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <div v-else-if="drawerMode === 'list-single-timeslot' && drawerData.length">
        <!-- single timeslot but multiple classes: display table -->
        <a-table :data-source="drawerData[0].classes" :pagination="false" row-key="id" size="small">
          <a-table-column title="Title" data-index="title" />
          <a-table-column title="Section" :custom-render="({ record }: any) => record.section || '-'" />
          <a-table-column title="Professor" data-index="professor" />
          <a-table-column title="Room" data-index="room" />
          <a-table-column
            title="Actions"
            :custom-render="({ record }: any) => h('a', { onClick: () => openEditModalForClass(record) }, 'Edit')"
          />
        </a-table>
      </div>

      <div v-else-if="drawerMode === 'multi-timeslot' && drawerData.length">
        <a-collapse accordion>
          <a-collapse-panel
            v-for="panelEvents in drawerPanelGroups"
            :key="panelEvents.key"
            :header="panelEvents.key"
          >
            <a-table :data-source="panelEvents.classes" :pagination="false" row-key="id" size="small">
              <a-table-column title="Title" data-index="title" />
              <a-table-column title="Section" :custom-render="({ record }: any) => record.section || '-'" />
              <a-table-column title="Professor" data-index="professor" />
              <a-table-column title="Room" data-index="room" />
              <a-table-column
                title="Actions"
                :custom-render="({ record }: any) => h('a', { onClick: () => openEditModalForClass(record) }, 'Edit')"
              />
            </a-table>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </a-drawer>

    <!-- Edit modal (for editing a single class row) -->
    <a-modal
      v-model:visible="editModalVisible" title="Edit Class"
      @ok="() => { if (editModalData) saveEditedClass(editModalData); }" @cancel="() => (editModalVisible = false)"
    >
      <div v-if="editModalData">
        <a-form layout="vertical">
          <a-form-item label="Title">
            <a-input v-model:value="editModalData.title" />
          </a-form-item>
          <a-form-item label="Professor">
            <a-input v-model:value="editModalData.professor" />
          </a-form-item>
          <a-form-item label="Room">
            <a-input v-model:value="editModalData.room" />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.calendar-wrap {
  font-family:
    Inter,
    Roboto,
    system-ui,
    -apple-system,
    'Segoe UI',
    'Helvetica Neue';
  background: #1e1f25;
  border: 1px solid #2a2b31;
  border-radius: 8px;
  color: #e4e7ec;
  overflow: hidden;
}

/* header */
.calendar-header {
  display: flex;
  border-bottom: 1px solid #2f3037;
  background: #25262c;
  align-items: stretch;
}

/* body */
.calendar-body {
  display: flex;
  position: relative;
  min-height: 420px;
}

/* sticky time column */
.sticky-time-col {
  width: 80px;
  min-width: 80px;
  box-sizing: border-box;
  padding: 8px;
  background: #25262c;
  position: sticky;
  left: 0;
  z-index: 9;
  border-right: 1px solid #2f3037;
}

/* header days */
.header-days {
  display: flex;
  overflow-x: auto;
  width: 100%;
}

.day-cell {
  min-width: 220px;
  flex: 0 0 220px;
  padding: 12px 10px;
  box-sizing: border-box;
  border-right: 1px solid #2f3037;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-label {
  font-weight: 600;
  color: #e4e7ec;
}

/* time column */
.time-col {
  position: sticky;
  left: 0;
  z-index: 8;
  background: #1e1f25;
  border-right: 1px solid #2f3037;
  min-width: 80px;
  width: 80px;
  box-sizing: border-box;
  padding-top: 8px;
}

.time-slot {
  height: 30px;
  box-sizing: border-box;
  border-bottom: 1px dashed #32343a;
  position: relative;
}

.bg-slot {
  height: 30px;
  box-sizing: border-box;
  border-bottom: 1px dashed #2d2e34;
  position: relative;
}

.time-text {
  position: absolute;
  left: 8px;
  top: 4px;
  font-size: 12px;
  color: #8e93a0;
}

/* days grid scroll area */
.days-grid {
  overflow: auto;
  width: 100%;
  position: relative;
  background: #1e1f25;
}

.days-row {
  display: flex;
  min-width: calc(220px * 6);
  position: relative;
  padding-top: 8px;
  box-sizing: border-box;
}

/* each day column */
.day-column {
  min-width: 220px;
  flex: 0 0 220px;
  border-right: 1px solid #2f3037;
  position: relative;
}

/* events container */
.events-container {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 0;
  bottom: 0;
  pointer-events: none;
}

/* event box */
.event {
  position: absolute;
  background: rgba(37, 99, 235, 0.12);
  border: 1px solid rgba(37, 99, 235, 0.4);
  border-radius: 6px;
  padding: 4px;
  box-sizing: border-box;
  pointer-events: auto;
  overflow: hidden;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.event-card {
  background: #2a2b31;
  color: #e4e7ec;
  border: 1px solid #3a3b42;
  border-radius: 10px;
  padding: 8px 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  cursor: pointer;
}

.event-card.clickable {
  cursor: pointer;
}

.event-title {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
}

.event-sections {
  font-style: italic;
  font-size: 12px;
  color: #a8acb3;
  margin-top: 2px;
}

.event-extra {
  margin-top: 6px;
  font-size: 12px;
}

/* group summary badge */
.group-summary {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.18);
  border: 1px dashed rgba(59, 130, 246, 0.45);
  color: #e6ebff;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  font-weight: 600;
  font-size: 13px;
}

.summary-sub {
  display: block;
  font-size: 11px;
  color: #c6d2ff;
  margin-top: 6px;
}

.slot-pill {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: #cbd7ff;
  font-size: 11px;
}

/* hover states */
.event:hover {
  background: rgba(37, 99, 235, 0.22);
  border-color: rgba(37, 99, 235, 0.7);
}

@media (max-width: 900px) {
  .day-cell,
  .day-column {
    min-width: 180px;
    flex: 0 0 180px;
  }
}
</style>
