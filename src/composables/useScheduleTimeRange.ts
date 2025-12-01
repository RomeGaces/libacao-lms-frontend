// composables/useScheduleTimeRange.ts
import { computed, ref, watch } from 'vue'
import { parseTimeToMinutes } from './utils'

export function useScheduleTimeRange(rawEvents: any, slotMinutes = 30) {
    const dayStartMinute = ref(7 * 60)
    const dayEndMinute = ref(18 * 60)

    function computeRange() {
        if (!rawEvents.value.length) return

        let minStart = Infinity
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

    watch(rawEvents, computeRange)

    const timeSlots = computed(() => {
        const arr: number[] = []
        for (let m = dayStartMinute.value; m < dayEndMinute.value; m += slotMinutes) {
            arr.push(m)
        }
        return arr
    })

    return {
        dayStartMinute,
        dayEndMinute,
        timeSlots
    }
}
