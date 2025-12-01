// composables/useScheduleInteractions.ts
import { ref } from 'vue'
import type { CalendarEvent, ClassItem } from './types'
import { formatTimeRange } from './utils'

export function useScheduleInteractions() {
    const drawerVisible = ref(false)
    const drawerTitle = ref('')
    const drawerData = ref<CalendarEvent[]>([])
    const drawerMode = ref<'edit-single' | 'list-single-timeslot' | 'multi-timeslot'>('multi-timeslot')

    const editModalVisible = ref(false)
    const editModalData = ref<ClassItem | null>(null)

    function onEventClick(ev: CalendarEvent) {
        if (ev.classes.length === 1 && ev.count === 1) {
            drawerTitle.value = `Edit — ${ev.classes[0].title}`
            drawerData.value = [ev]
            drawerMode.value = 'edit-single'
        } else {
            drawerTitle.value = `${formatTimeRange(ev.start, ev.end)} — ${ev.classes.length} classes`
            drawerData.value = [ev]
            drawerMode.value = 'list-single-timeslot'
        }
        drawerVisible.value = true
    }

    function onGroupSummaryClick(evGroup: CalendarEvent[], day: string) {
        drawerData.value = [...evGroup]
        drawerTitle.value = `${day} — grouped events`
        drawerMode.value = 'multi-timeslot'
        drawerVisible.value = true
    }

    return {
        drawerVisible,
        drawerTitle,
        drawerData,
        drawerMode,
        editModalVisible,
        editModalData,
        onEventClick,
        onGroupSummaryClick
    }
}
