// composables/useCompactMode.ts
import { nextTick } from 'vue'

export function useCompactMode(positionedEvents: any) {
    function updateCompactView() {
        nextTick(() => {
            const all = Object.values(positionedEvents.value).flat()

            all.forEach((ev: any) => {
                const el = document.querySelector(`[data-event-id="${ev.id}"]`) as HTMLElement
                if (el) {
                    ev._isCompact = el.offsetHeight < 56 || el.offsetWidth < 100
                }
            })
        })
    }

    return { updateCompactView }
}
