<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, h, nextTick, onMounted, ref, watch } from 'vue'
import CalendarControls from './components/calendar-controls.vue'

// ------------------- INTERFACES -------------------
interface FilterInterface {
  school_year_id: string | null
  semester_id: string | null
  course_id: number | null
  professor_id: number | null
  room_id: number | null
  section_id: number | null
  student_id: number | null
  year_level: number | null
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

interface SubjectOption {
  id: number
  subject_code: string
  subject_name: string
}

interface ProfessorOption {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
}

interface RoomOption {
  id: number
  room_number: string
  building_name: string
  capacity: number
}

type BuildingOption = string
type TimeOption = string

interface EditFormInterface {
  id: number | null
  subject_id: number | undefined
  professor_id: number | undefined
  building: string | undefined
  room_id: number | undefined
  day_of_week: string | undefined
  start_time: string | undefined
  end_time: string | undefined
  section_id: number | undefined
  course_id: number | undefined
  year_level: number | undefined
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
  school_year_id: null,
  semester_id: null,
  course_id: null,
  professor_id: null,
  room_id: null,
  section_id: null,
  student_id: null,
  year_level: null,
})

const subjectOptions = ref<SubjectOption[]>([])
const professorOptions = ref<ProfessorOption[]>([])
const buildingOptions = ref<BuildingOption[]>([])
const roomOptions = ref<RoomOption[]>([])
const timeOptions = ref<TimeOption[]>([])

// drawer & modal state
const drawerVisible = ref(false)
const drawerTitle = ref('')
const drawerData = ref<CalendarEvent[]>([]) // events to show in drawer
const drawerMode = ref<'edit-single' | 'list-single-timeslot' | 'multi-timeslot'>('multi-timeslot')

const editModalVisible = ref(false)
const editModalData = ref<ClassItem | null>(null)

const editForm = ref<EditFormInterface>({
  id: null,
  subject_id: undefined,
  professor_id: undefined,
  building: undefined,
  room_id: undefined,
  day_of_week: undefined,
  start_time: undefined,
  end_time: undefined,
  section_id: undefined,
  course_id: undefined,
  year_level: undefined,
})

// compact heuristic
const eventRefs = ref<HTMLElement[]>([])

// time range
const dayStartMinute = ref(7 * 60)
const dayEndMinute = ref(18 * 60)
// const timeOptions = Array.from({ length: ((19 - 7) * 60) / 5 + 1 }, (_, i) => {
//   const totalMin = 7 * 60 + i * 5
//   const h = String(Math.floor(totalMin / 60)).padStart(2, '0')
//   const m = String(totalMin % 60).padStart(2, '0')
//   return `${h}:${m}`
// })

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
    const params: Record<string, string> = {}
    // Ensure school_year_id is set
    if (!filters.value.school_year_id) {
      const syActive = await useGet('/master/active-school-year')
      const activeId = syActive.data.data?.id

      if (activeId) {
        filters.value.school_year_id = activeId   // ← store it
      }
    }
    else {
      params.school_year_id = String(filters.value.school_year_id)
    }

    // Ensure semester_id is set
    if (!filters.value.semester_id) {
      const semActive = await useGet('/master/active-semester')
      const activeId = semActive.data.data?.id

      if (activeId) {
        filters.value.semester_id = activeId      // ← store it
      }
    }
    else {
      params.semester_id = String(filters.value.semester_id)
    }

    if (filters.value.course_id != null)
      params.course_id = String(filters.value.course_id)

    if (filters.value.professor_id != null)
      params.professor_id = String(filters.value.professor_id)

    if (filters.value.student_id != null)
      params.student_id = String(filters.value.student_id)

    if (filters.value.room_id != null)
      params.room_id = String(filters.value.room_id)

    if (filters.value.section_id != null)
      params.section_id = String(filters.value.section_id)

    if (filters.value.year_level != null)
      params.year_level = String(filters.value.year_level)


    const query = new URLSearchParams(params).toString()
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

async function loadEditFormDropdowns() {
  const sectionId = editForm.value.section_id
  const courseId = editForm.value.course_id
  const yearLevel = editForm.value.year_level

  // Load class section for semester
  const sectionRes = await useGet(`/sections/${sectionId}`)
  const semesterId = sectionRes.data.semester_id

  // Load subjects (course + sem + year level)
  const subjRes = await useGet(
    `/courses/${courseId}/filtered-subjects?semester_id=${semesterId}&year_level=${yearLevel}`
  )
  subjectOptions.value = subjRes.data.data

  // Load professors filtered by department
  const courseRes = await useGet(`/courses/${courseId}`)
  const deptId = courseRes.data.department_id

  const profRes = await useGet(`/professors/by-department/${deptId}`)
  professorOptions.value = profRes.data.data

  // Load all buildings
  const roomsRes = await useGet(`/rooms`)
  buildingOptions.value = [
    ...new Set<string>(
      roomsRes.data.data.map((r: RoomOption) => r.building_name)
    )
  ]

  // Load specific rooms when building is already set
  if (editForm.value.building) {
    const roomRes = await useGet(`/rooms/by-building/${editForm.value.building}`)
    roomOptions.value = roomRes.data.data
  }

  // Generate time list (5-minute increments)
  generateTimeOptions()
}

const editConflict = ref({
  conflict: false,
  time_conflict: false,
  capacity_conflict: false,
})

watch(
  [
    () => editForm.value.professor_id,
    () => editForm.value.room_id,
    () => editForm.value.day_of_week,
    () => editForm.value.start_time,
    () => editForm.value.end_time
  ],
  async () => {
    if (!editForm.value.start_time || !editForm.value.end_time || !editForm.value.day_of_week) return;

    const payload = {
      professor_id: editForm.value.professor_id,
      room_id: editForm.value.room_id,
      class_section_id: editForm.value.section_id,
      day_of_week: editForm.value.day_of_week,
      start_time: editForm.value.start_time,
      end_time: editForm.value.end_time,
    }

    const res = await usePost('/schedules/check-conflict', payload)
    editConflict.value = res.data
  }
)


function generateTimeOptions() {
  const list = []
  const start = 7 * 60
  const end = 19 * 60

  for (let m = start; m <= end; m += 5) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    list.push(`${hh}:${mm}`)
  }

  timeOptions.value = list
}

watch(() => editForm.value.building, async newVal => {
  if (newVal) {
    const roomRes = await useGet(`/rooms/by-building/${newVal}`)
    roomOptions.value = roomRes.data.data
  } else {
    roomOptions.value = []
  }
})

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

    const merged = events

    // // 3️⃣ Merge overlapping events
    // const merged: CalendarEvent[] = []
    // let current = { ...events[0] }

    // for (let i = 1; i < events.length; i++) {
    //   const next = events[i]
    //   // if overlaps or touches current range
    //   if (next.start < current.end) {
    //     // merge them
    //     current.end = Math.max(current.end, next.end)
    //     current.count += next.count
    //     current.classes = [...(current.classes || []), ...(next.classes || [])]
    //   }
    //   else {
    //     merged.push(current)
    //     current = { ...next }
    //   }
    // }

    //merged.push(current)

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

async function onEventClick(ev: CalendarEvent) {
  const cls = ev.classes[0] // since edit-single only triggers here

  // Load schedule details from backend
  const res = await useGet(`/schedules/${cls.id}`)
  const sched = res.data

  // Fill edit form
  editForm.value = {
    id: sched.id,
    subject_id: sched.subject_id,
    professor_id: sched.professor_id,
    building: sched.room?.building_name || null,
    room_id: sched.room_id,
    day_of_week: sched.day_of_week,
    start_time: sched.start_time?.slice(0, 5),
    end_time: sched.end_time?.slice(0, 5),
    section_id: sched.class_section_id,
    course_id: sched.class_section?.course_id,
    year_level: sched.class_section?.year_level,
  }

  await loadEditFormDropdowns()

  drawerTitle.value = `Edit — ${cls.title}`
  drawerData.value = [ev]
  drawerMode.value = 'edit-single'
  drawerVisible.value = true
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
async function saveEditedClass() {
  if (editConflict.value.conflict) {
    return message.error("Cannot save. There are schedule conflicts.")
  }

  const id = editForm.value.id

  const payload = {
    subject_id: editForm.value.subject_id,
    professor_id: editForm.value.professor_id,
    room_id: editForm.value.room_id,
    day_of_week: editForm.value.day_of_week,
    start_time: editForm.value.start_time,
    end_time: editForm.value.end_time,
    status: "Finalized",
  }

  const res = await usePut(`/schedules/${id}`, payload)

  message.success("Schedule updated." + res.data.message)
  editModalVisible.value = false
  drawerVisible.value = false

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
            <div v-for="slot in timeSlots" :key="`bg-${day.key}-${slot}`" class="bg-slot"
              :style="{ height: `${slotHeightPx}px` }" />

            <!-- Render overlap groups and events -->
            <div class="events-container">
              <!-- iterate groups to decide when to show '+N more' -->
              <template v-for="(group, gi) in dayRenderData[day.key].groups">
                <!-- if group length < 3: render each event normally -->
                <template v-if="group[0].classes.length < 3">
                  <div v-for="ev in group" :key="ev.id" :ref="el => eventRefs.push(el as HTMLElement)" class="event"
                    :style="eventStyle(ev)">
                    <a-tooltip v-if="ev.count > 1" :title="ev.classes.map(c => c.title).slice(0, 5).join('; ')"
                      placement="top">
                      <div class="event-card clickable" @click="onEventClick(ev)">
                        <div class="event-title">
                          {{ ev.classes[0]?.title }}
                        </div>
                        <div class="event-sections">
                          {{ev.classes.slice(0, 2).map(c => c.section).join(', ')}}
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
                        {{ev.classes.slice(0, 2).map(c => c.section).join(', ')}}
                      </div>
                      <div v-if="ev.count > 1" class="event-extra">
                        {{ ev.count - 1 }} more
                      </div>
                    </div>
                  </div>
                </template>

                <!-- if group length >= 3: show first 2 normally and a summary badge -->
                <template v-else>
                  <div v-for="(ev) in group.slice(0, 2)" :key="ev.id" :ref="el => eventRefs.push(el as HTMLElement)"
                    class="event" :style="eventStyle(ev)">
                    <a-tooltip v-if="ev.count > 1" :title="ev.classes.map(c => c.title).slice(0, 5).join('; ')"
                      placement="top">
                      <div class="event-card clickable" @click="onGroupSummaryClick(day.key, gi)">
                        <div class="event-title">
                          {{ ev.classes[0]?.title }}
                        </div>
                        <div class="event-sections">
                          {{ev.classes.slice(0, 2).map(c => c.section).join(', ')}}
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
    <a-drawer v-model:open="drawerVisible" :title="drawerTitle" placement="right" width="480" :mask-closable="true"
      @close="closeDrawer">
      <!-- Modes -->
      <div v-if="drawerMode === 'edit-single' && drawerData.length">

        <a-form layout="vertical">

          <a-form-item label="Subject">
            <a-select v-model:value="editForm.subject_id" style="width:100%">
              <a-select-option v-for="s in subjectOptions" :value="s.id" :key="s.id">
                {{ s.subject_code }} — {{ s.subject_name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Professor">
            <a-select v-model:value="editForm.professor_id" style="width:100%">
              <a-select-option v-for="p in professorOptions" :value="p.id" :key="p.id">
                {{ p.last_name }}, {{ p.first_name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Building">
            <a-select v-model:value="editForm.building" style="width:100%">
              <a-select-option v-for="b in buildingOptions" :value="b" :key="b">
                {{ b }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Room">
            <a-select v-model:value="editForm.room_id" style="width:100%">
              <a-select-option v-for="r in roomOptions" :key="r.id" :value="r.id">
                {{ r.room_number }} — cap: {{ r.capacity }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Day">
            <a-select v-model:value="editForm.day_of_week" style="width:100%">
              <a-select-option v-for="d in displayDays" :value="d.key" :key="d.key">
                {{ d.key }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-row :gutter="12">
            <a-col :span="12">
              <a-form-item label="Start Time">
                <a-select v-model:value="editForm.start_time">
                  <a-select-option v-for="t in timeOptions" :key="t" :value="t">
                    {{ t }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="End Time">
                <a-select v-model:value="editForm.end_time">
                  <a-select-option v-for="t in timeOptions" :key="t" :value="t">
                    {{ t }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-alert v-if="editConflict.conflict" type="error"
            :message="editConflict.capacity_conflict ? 'Room capacity exceeded.' : 'Schedule conflict detected.'"
            show-icon />

          <a-button type="primary" :disabled="editConflict.conflict" @click="saveEditedClass" block>
            Save Changes
          </a-button>

        </a-form>

      </div>



      <div v-else-if="drawerMode === 'list-single-timeslot' && drawerData.length">
        <!-- single timeslot but multiple classes: display table -->
        <a-table :data-source="drawerData[0].classes" :pagination="false" row-key="id" size="small">
          <a-table-column title="Title" data-index="title" />
          <a-table-column title="Section" :custom-render="({ record }: any) => record.section || '-'" />
          <a-table-column title="Professor" data-index="professor" />
          <a-table-column title="Room" data-index="room" />
          <a-table-column title="Actions"
            :custom-render="({ record }: any) => h('a', { onClick: () => openEditModalForClass(record) }, 'Edit')" />
        </a-table>
      </div>

      <div v-else-if="drawerMode === 'multi-timeslot' && drawerData.length">
        <a-collapse accordion>
          <a-collapse-panel v-for="panelEvents in drawerPanelGroups" :key="panelEvents.key" :header="panelEvents.key">
            <a-table :data-source="panelEvents.classes" :pagination="false" row-key="id" size="small">
              <a-table-column title="Title" data-index="title" />
              <a-table-column title="Section" :custom-render="({ record }: any) => record.section || '-'" />
              <a-table-column title="Professor" data-index="professor" />
              <a-table-column title="Room" data-index="room" />
              <a-table-column title="Actions"
                :custom-render="({ record }: any) => h('a', { onClick: () => openEditModalForClass(record) }, 'Edit')" />
            </a-table>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </a-drawer>

    <!-- Edit modal (for editing a single class row) -->
    <a-modal v-model:visible="editModalVisible" title="Edit Class"
      @ok="saveEditedClass" @cancel="() => (editModalVisible = false)">
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
          <a-form-item label="Start Time">
            <a-select v-model:value="editModalData.start_time">
              <a-select-option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="End Time">
            <a-select v-model:value="editModalData.end_time">
              <a-select-option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</a-select-option>
            </a-select>
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
