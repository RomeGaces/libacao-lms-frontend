// src/composables/utils.ts

// ------------------------
// Memoized time conversion
// ------------------------
const timeCache = new Map<string, number>()

export function parseTimeToMinutes(t: string): number {
    if (timeCache.has(t)) return timeCache.get(t)!
    const [h, m = "0"] = t.split(":")
    const minutes = Number(h) * 60 + Number(m)
    timeCache.set(t, minutes)
    return minutes
}


// ------------------------
// Convert minutes → HH:mm
// ------------------------
export function minutesToTimeString(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}


// ------------------------
// Human-readable time label
// ------------------------
export function formatHour(minute: number): string {
    const h = Math.floor(minute / 60)
    const ampm = h >= 12 ? "PM" : "AM"
    const hr = ((h + 11) % 12) + 1
    return `${hr}:00 ${ampm}`
}


// ----------------------------------------------
// Format a start-end range for drawer headers
// ----------------------------------------------
export function formatTimeRange(startMin: number, endMin: number): string {
    return `${minutesToTimeString(startMin)} - ${minutesToTimeString(endMin)}`
}


// ----------------------------------------------
// Converts object to URLSearchParams cleanly
// (skips null/undefined/empty values)
// ----------------------------------------------
export function buildQueryParams(obj: Record<string, any>): string {
    const params = new URLSearchParams()

    Object.entries(obj).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
            params.append(key, String(val))
        }
    })

    return params.toString()
}

