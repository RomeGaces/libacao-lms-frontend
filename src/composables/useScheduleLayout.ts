// composables/useScheduleLayout.ts
import { ref, watch } from 'vue'
import type { CalendarEvent } from './types'
import { parseTimeToMinutes } from './utils'

const displayDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function useScheduleLayout(rawEvents: any) {
    const positionedEvents = ref<Record<string, CalendarEvent[]>>({})
    const overlapGroups = ref<Record<string, CalendarEvent[][]>>({})

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
                raw: item
            })
        }

        const positioned: Record<string, CalendarEvent[]> = {}
        const groupsMap: Record<string, CalendarEvent[][]> = {}

        for (const day of displayDays) {
            const events = (byDay[day] || []).sort((a, b) => a.start - b.start)

            if (!events.length) {
                positioned[day] = []
                groupsMap[day] = []
                continue
            }

            // Merge overlapping
            const merged: CalendarEvent[] = []
            let current = { ...events[0] }

            for (let i = 1; i < events.length; i++) {
                const next = events[i]
                if (next.start < current.end) {
                    current.end = Math.max(current.end, next.end)
                    current.count += next.count
                    current.classes = [...current.classes, ...next.classes]
                } else {
                    merged.push(current)
                    current = { ...next }
                }
            }
            merged.push(current)

            positioned[day] = merged
            groupsMap[day] = merged.map(ev => [ev])
        }

        positionedEvents.value = positioned
        overlapGroups.value = groupsMap
    }

    watch(rawEvents, computeLayout)

    return {
        positionedEvents,
        overlapGroups,
        computeLayout
    }
}
