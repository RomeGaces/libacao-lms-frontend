// composables/useScheduleFetch.ts
import { ref } from 'vue'
import { message } from 'ant-design-vue'

import type { BackendSchedule } from './types'

export function useScheduleFetch(filters: any) {
    const rawEvents = ref<BackendSchedule[]>([])
    const isLoading = ref(false)

    async function fetchSchedules() {
        isLoading.value = true

        try {
            const params: Record<string, string> = {}

            for (const key in filters.value) {
                const val = filters.value[key]
                if (val !== null && val !== undefined && val !== '') {
                    params[key] = String(val)
                }
            }

            const query = new URLSearchParams(params).toString()

            const res = await useGet(`/schedules/query?${query}`)
            rawEvents.value = res?.data ?? []
        } catch (err) {
            message.warning('Failed to fetch schedules')
            rawEvents.value = []
        }

        isLoading.value = false
    }

    return {
        rawEvents,
        isLoading,
        fetchSchedules
    }
}
