// src/pages/scheduler/composables/useCalendarData.ts
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { EditConflictInterface, RoomInterface, SelectInterface, FilterInterface, ClassItem, BackendSchedule, CalendarEvent, ProfessorInterface } from "~@/types";

/**
 * Performance-tuned composable for the class scheduling page.
 * - Debounced fetching
 * - Minimized watchers (explicit triggers)
 * - ResizeObserver for container height
 * - Batched DOM reads/writes via nextTick
 * - Deterministic eventRefs handling (caller must clear/replace array each render)
 */

/* -------------------- Types -------------------- */


/* -------------------- Config / State -------------------- */
const slotMinutes = 30
const displayDays = [
    { key: 'Monday', label: 'Mon' },
    { key: 'Tuesday', label: 'Tue' },
    { key: 'Wednesday', label: 'Wed' },
    { key: 'Thursday', label: 'Thu' },
    { key: 'Friday', label: 'Fri' },
    { key: 'Saturday', label: 'Sat' },
]

export default function useCalendarData() {
    // data from backend
    const rawEvents = ref<BackendSchedule[]>([])
    const positionedEvents = ref<Record<string, CalendarEvent[]>>({})
    const overlapGroups = ref<Record<string, CalendarEvent[][]>>({})

    // ui state
    const isLoading = ref(true)
    const filters = ref<FilterInterface>({
        school_year_id: undefined,
        semester_id: undefined,
        course_id: undefined,
        professor_id: undefined,
        room_id: undefined,
        section_id: undefined,
        student_id: undefined,
        year_level: undefined,
    })

    // dropdowns
    const subjectOptions = ref<SelectInterface[]>([])
    const professorOptions = ref<SelectInterface[]>([])
    const buildingOptions = ref<SelectInterface[]>([])
    const allRooms = ref<RoomInterface[]>([])
    const timeOptions = ref<string[]>([])
    const schoolYears = ref<any[]>([])   // fill these based on your backend later
    const semesters = ref<any[]>([])
    const courses = ref<any[]>([])
    const sections = ref<any[]>([])
    const yearLevels = ref<number[]>([1, 2, 3, 4])

    // drawer & modal
    const drawerVisible = ref(false)
    const drawerTitle = ref('')
    const drawerData = ref<CalendarEvent[]>([])
    const drawerMode = ref<'edit-single' | 'list-single-timeslot' | 'multi-timeslot'>('multi-timeslot')

    const isSaving = ref(false)

    const editModalVisible = ref(false)
    const editModalData = ref<ClassItem | null>(null)
    const editForm = reactive({
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

    const editConflict = ref<EditConflictInterface>({
        conflict: false,
        room_conflict: false,
        professor_conflict: false,
        class_conflict: false,
        room_capacity_conflict: false,
    })

    // layout & sizing
    const eventRefs = ref<HTMLElement[]>([]) // caller pushes refs; this is intentionally simple
    const daysGridRef = ref<HTMLElement | null>(null)
    const headerDaysRef = ref<HTMLElement | null>(null)
    const containerHeightPx = ref<number>(600)
    const dayStartMinute = ref(7 * 60)
    const dayEndMinute = ref(18 * 60)
    const eventLoadingId = ref<number | null>(null);

    // computed sizes
    const hourHeight = computed(() => {
        const minutes = Math.max(60, dayEndMinute.value - dayStartMinute.value)
        const hours = minutes / 60
        const h = containerHeightPx.value ? containerHeightPx.value / hours : 62
        return Math.max(40, h)
    })
    const slotHeightPx = computed(() => (hourHeight.value * (slotMinutes / 60)))
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

    /* -------------------- Derived dayRenderData -------------------- */
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

    /* -------------------- Utilities -------------------- */
    function parseTimeToMinutes(t: string): number {
        if (!t) return 0
        const [h, m = '0'] = t.split(':')
        return Number(h) * 60 + Number(m)
    }

    /* -------------------- Event style (pure function) -------------------- */
    function eventStyle(ev: CalendarEvent) {
        const startFromTopMin = Math.max(ev.start, dayStartMinute.value) - dayStartMinute.value
        const endFromTopMin = Math.min(ev.end, dayEndMinute.value) - dayStartMinute.value
        const topPx = (startFromTopMin / 60) * hourHeight.value
        const heightPx = Math.max(((endFromTopMin - startFromTopMin) / 60) * hourHeight.value, 6)
        const widthPercent = 100 / (ev.groupCols || 1)
        const leftPercent = (ev.col || 0) * widthPercent

        return {
            top: `${topPx}px`,
            height: `${heightPx}px`,
            left: `${leftPercent}%`,
            width: `calc(${widthPercent}% - 6px)`,
        }
    }

    /* -------------------- Fetch schedules (debounced) -------------------- */
    let fetchTimer: number | undefined
    const FETCH_DEBOUNCE_MS = 160 // tuned

    async function doFetchSchedules() {
        isLoading.value = true
        try {
            const params: Record<string, string> = {}

            // ensure school year / semester set (minimal behavior)
            if (!filters.value.school_year_id) {
                const syActive = await useGet('/master/active-school-year')
                const activeId = syActive.data?.data?.id
                if (activeId) filters.value.school_year_id = activeId
            } else params.school_year_id = String(filters.value.school_year_id)

            if (!filters.value.semester_id) {
                const semActive = await useGet('/master/active-semester')
                const activeId = semActive.data?.data?.id
                if (activeId) filters.value.semester_id = activeId
            } else params.semester_id = String(filters.value.semester_id)

            if (filters.value.course_id != null) params.course_id = String(filters.value.course_id)
            if (filters.value.professor_id != null) params.professor_id = String(filters.value.professor_id)
            if (filters.value.student_id != null) params.student_id = String(filters.value.student_id)
            if (filters.value.room_id != null) params.room_id = String(filters.value.room_id)
            if (filters.value.section_id != null) params.section_id = String(filters.value.section_id)
            if (filters.value.year_level != null) params.year_level = String(filters.value.year_level)

            const query = new URLSearchParams(params).toString()
            const res = await useGet(`/schedules/query?${query}`)
            if (!res || !res.data) {
                throw new Error('Failed to fetch schedules')
            }
            rawEvents.value = res.data
        } catch (err) {
            message.warning('Could not fetch schedules, using sample payload')
            rawEvents.value = []
        } finally {
            // recompute derived values (throttled/work-batched)
            computeTimeRange()
            computeLayout()
            isLoading.value = false
        }
    }

    function fetchSchedulesDebounced() {
        if (fetchTimer) window.clearTimeout(fetchTimer)
        // @ts-ignore - window.setTimeout returns number
        fetchTimer = window.setTimeout(() => {
            void doFetchSchedules()
        }, FETCH_DEBOUNCE_MS)
    }

    /* -------------------- Compute time range & layout (optimized) -------------------- */
    function computeTimeRange() {
        if (!rawEvents.value?.length) return
        let minStart = 24 * 60
        let maxEnd = 0
        for (const e of rawEvents.value) {
            const s = parseTimeToMinutes(e.start_time)
            const en = parseTimeToMinutes(e.end_time)
            if (s < minStart) minStart = s
            if (en > maxEnd) maxEnd = en
        }
        dayStartMinute.value = Math.max(6 * 60, Math.floor(minStart / 60) * 60)
        dayEndMinute.value = Math.min(22 * 60, Math.ceil(maxEnd / 60) * 60)
    }

    /**
     * computeLayout is optimized: we avoid deep reactive operations.
     * It is deterministic and uses only rawEvents as source of truth.
     */
    function computeLayout() {
        const byDay: Record<string, CalendarEvent[]> = {}

        for (const item of rawEvents.value) {
            const day = item.day_of_week
            if (!byDay[day]) byDay[day] = []

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

        for (const day of displayDays) {
            const events = (byDay[day.key] || []).slice()
            if (!events.length) {
                positioned[day.key] = []
                groupsMap[day.key] = []
                continue
            }

            // sort by start, then end
            events.sort((a, b) => a.start - b.start || a.end - b.end)

            // For now we treat each entry as its own group (matches original)
            const positionedDay: CalendarEvent[] = []
            const groups: CalendarEvent[][] = []

            for (const ev of events) {
                positionedDay.push({ ...ev, col: 0, groupCols: 1 })
                groups.push([ev])
            }

            positioned[day.key] = positionedDay
            groupsMap[day.key] = groups
        }

        positionedEvents.value = positioned
        overlapGroups.value = groupsMap
    }

    function formatTimeRange(start: number, end: number) {
        const hhmm = (m: number) =>
            `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
        return `${hhmm(start)} - ${hhmm(end)}`
    }

    /* -------------------- Drawer / interactions -------------------- */
    async function onEventClick(ev: CalendarEvent) {
        try {
            const cls = ev.classes[0]
            eventLoadingId.value = cls.id;
            const res = await useGet(`/schedules/${cls.id}`)
            const sched = res.data
            editForm.id = sched.id
            editForm.subject_id = sched.subject_id
            editForm.professor_id = sched.professor_id
            editForm.building = sched.room?.building_name || null
            editForm.room_id = sched.room_id
            editForm.day_of_week = sched.day_of_week
            editForm.start_time = sched.start_time?.slice(0, 5)
            editForm.end_time = sched.end_time?.slice(0, 5)
            editForm.section_id = sched.class_section_id
            editForm.course_id = sched.class_section?.course_id
            editForm.year_level = sched.class_section?.year_level
            await loadEditFormDropdowns()
            drawerTitle.value = `Edit — ${cls.title}`
            drawerData.value = [ev]
            drawerMode.value = 'edit-single'
            drawerVisible.value = true
        } catch (e) {
            console.error(e);
        } finally {
            eventLoadingId.value = null;
        }

    }

    function onGroupSummaryClick(dayKey: string, groupIndex: number) {
        const group = overlapGroups.value[dayKey]?.[groupIndex] || []
        if (!group.length) return
        drawerData.value = group.slice()
        drawerTitle.value = `${dayKey} — ${formatTimeRange(Math.min(...group.map(g => g.start)), Math.max(...group.map(g => g.end)))}`
        drawerMode.value = 'multi-timeslot'
        drawerVisible.value = true
    }

    function closeDrawer() {
        drawerVisible.value = false
        drawerData.value = []
    }

    function openEditModalForClass(c: ClassItem) {
        editModalData.value = c
        editModalVisible.value = true
    }

    async function saveEditedClass() {
        if (isSaving.value) return
        isSaving.value = true


        if (editConflict.value.conflict) {
            return message.error('Cannot save. There are schedule conflicts.')
        }
        const id = editForm.id
        const payload = {
            subject_id: Number(editForm.subject_id),
            professor_id: Number(editForm.professor_id),
            room_id: Number(editForm.room_id),
            day_of_week: editForm.day_of_week,
            start_time: editForm.start_time,
            end_time: editForm.end_time,
            status: 'Finalized',
        }
        const res = await usePut(`/schedules/${id}`, payload)
        message.success('Schedule updated.' + (res.data?.message || ''))
        editModalVisible.value = false
        drawerVisible.value = false
        fetchSchedulesDebounced()
        isSaving.value = false
    }

    /* -------------------- Edit form watchers (debounced) -------------------- */
    let conflictTimer: number | undefined
    function scheduleConflictCheckerDebounced() {
        if (conflictTimer) window.clearTimeout(conflictTimer)
        // small debounce so multiple edits don't spam API
        // @ts-ignore
        conflictTimer = window.setTimeout(async () => {
            if (!editForm.start_time || !editForm.end_time || !editForm.day_of_week) return
            const payload = {
                professor_id: Number(editForm.professor_id),
                room_id: Number(editForm.room_id),
                class_section_id: Number(editForm.section_id),
                day_of_week: editForm.day_of_week,
                start_time: editForm.start_time,
                end_time: editForm.end_time,
            }
            const res = await usePost('/schedules/check-conflict', payload)
            editConflict.value = res.data
        }, 220)
    }

    // attach minimal watcher for editForm relevant fields
    const stopEditFormWatcher = watch(
        [
            () => editForm.professor_id,
            () => editForm.room_id,
            () => editForm.day_of_week,
            () => editForm.start_time,
            () => editForm.end_time,
        ],
        scheduleConflictCheckerDebounced,
        { flush: 'post' }
    )

    watch(() => filters.value.course_id, async (newCourseId) => {
        if (!newCourseId) {
            professorOptions.value = [];
            return;
        }

        // Fetch department of course
        const courseRes = await useGet(`/courses/${newCourseId}`);
        const deptId = courseRes.data.department_id;

        // Fetch professors for that department
        const profRes = await useGet(`/professors/by-department/${deptId}`);
        professorOptions.value = profRes.data.data.map((p: ProfessorInterface) => ({
            id: p.id,
            label: `${p.last_name}, ${p.first_name}`,
        }));

    });

    /* -------------------- Dropdown loaders -------------------- */
    async function loadEditFormDropdowns() {
        const sectionId = Number(editForm.section_id)
        const courseId = Number(editForm.course_id)
        const yearLevel = Number(editForm.year_level)

        const sectionRes = await useGet(`/sections/${sectionId}`)
        const semesterId = sectionRes.data.semester_id

        const subjRes = await useGet(`/courses/${courseId}/filtered-subjects?semester_id=${semesterId}&year_level=${yearLevel}`)
        subjectOptions.value = subjRes.data.data.map((s: { id: any; subject_code: any; subject_name: any }) => ({
            value: s.id,
            label: `${s.subject_code} - ${s.subject_name}`
        })) || []

        const courseRes = await useGet(`/courses/${courseId}`)
        const deptId = Number(courseRes.data.department_id)

        const profRes = await useGet(`/professors/by-department/${deptId}`)
        professorOptions.value = profRes.data.data.map((s: { id: any; last_name: any; first_name: any }) => ({
            value: s.id,
            label: `${s.last_name}, ${s.first_name}`
        })) || []

        const roomsRes = await useGet(`/rooms`)
        allRooms.value = roomsRes.data.data;
        const uniqueBuildings = [
            ...new Set(roomsRes.data.data.map((r: any) => r.building_name))
        ];

        buildingOptions.value = uniqueBuildings.map((b: any) => ({
            value: b,
            label: b
        }));

        generateTimeOptions()
    }

    function generateTimeOptions() {
        const list: string[] = []
        const start = 7 * 60
        const end = 19 * 60
        for (let m = start; m <= end; m += 5) {
            const hh = String(Math.floor(m / 60)).padStart(2, '0')
            const mm = String(m % 60).padStart(2, '0')
            list.push(`${hh}:${mm}`)
        }
        timeOptions.value = list
    }

    /* -------------------- Scroll sync -------------------- */
    function onScroll(e: Event) {
        const target = e.target as HTMLElement
        if (headerDaysRef.value) headerDaysRef.value.scrollLeft = target.scrollLeft
    }

    /* -------------------- ResizeObserver (single) -------------------- */
    let ro: ResizeObserver | null = null
    function setupResizeObserver() {
        if (daysGridRef.value && typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(entries => {
                for (const ent of entries) {
                    const h = ent.contentRect.height
                    if (h > 0) containerHeightPx.value = h
                }
                // recompute layout-related derived sizes on nextTick
                nextTick(() => {
                    // allow computed hourHeight -> slotHeightPx to update
                })
            })
            ro.observe(daysGridRef.value)
        }
    }

    function teardownResizeObserver() {
        if (ro && daysGridRef.value) {
            try { ro.unobserve(daysGridRef.value) } catch (e) { /* ignore */ }
            ro = null
        }
    }

    /* -------------------- Init / Lifecycle -------------------- */
    onMounted(async () => {
        fetchSchedulesDebounced()
        setupResizeObserver()
        generateTimeOptions()


        const roomsRes = await useGet(`/rooms`)
        allRooms.value = roomsRes.data.data;

        // NEW — Load dropdown base data
        const syRes = await useGet('/master/school-years')
        schoolYears.value = syRes.data.data

        const semRes = await useGet('/master/semesters')
        semesters.value = semRes.data.data

        const courseRes = await useGet('/courses')
        courses.value = courseRes.data.data

        const sectionRes = await useGet('/sections')
        sections.value = sectionRes.data.data
    })
    onBeforeUnmount(() => {
        if (fetchTimer) window.clearTimeout(fetchTimer)
        if (conflictTimer) window.clearTimeout(conflictTimer)
        teardownResizeObserver()
        stopEditFormWatcher()
    })

    /* -------------------- Public API (returned) -------------------- */
    return {
        // state
        filters,
        isLoading,
        displayDays,
        timeSlots,
        hourHeight,
        slotHeightPx,
        totalGridHeight,
        dayColumnWidth,
        dayRenderData,

        // refs
        daysGridRef,
        headerDaysRef,
        drawerVisible,
        drawerTitle,
        drawerData,
        drawerMode,
        editModalVisible,
        editModalData,
        subjectOptions,
        professorOptions,
        allRooms,
        buildingOptions,
        timeOptions,
        eventRefs,
        eventLoadingId,
        isSaving,

        // options for CalendarControls
        schoolYears,
        semesters,
        courses,
        sections,
        yearLevels,
        editForm,
        editConflict,

        // actions
        handleFilters: async (data: FilterInterface) => {
            filters.value = data
            fetchSchedulesDebounced()
            await nextTick()
            if (daysGridRef.value) daysGridRef.value.scrollTop = 0
        },
        fetchSchedules: fetchSchedulesDebounced,
        onScroll,
        eventStyle,
        onEventClick,
        onGroupSummaryClick,
        closeDrawer,
        openEditModalForClass,
        saveEditedClass,
    }

}
