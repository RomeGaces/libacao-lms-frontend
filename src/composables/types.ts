// src/composables/types.ts

// -----------------------------
// Filters used by the calendar
// -----------------------------
export interface FilterInterface {
  academic_year: string
  semester: string
  course_id: number | null
  professor_id: number | null
  room_id: number | null
  section_id: number | null
  student_id: number | null
  year_level: number | null
}


// ----------------------------------------
// Backend schedule item returned by query
// ----------------------------------------
export interface ClassItem {
  id: number
  title: string
  professor: string
  room: string
  section?: string
  capacity_status?: string
  start_time: string
  end_time: string
}


// -------------------------------------------------
// Raw schedule payload from backend per timeslot/day
// -------------------------------------------------
export interface BackendSchedule {
  day_of_week: string      // "Monday"
  start_time: string       // "07:30"
  end_time: string         // "09:00"
  count: number            // number of classes merged
  label: string            // custom label if any
  classes: ClassItem[]     // individual schedule items
}


// ---------------------------------------------
// Calendar event after layout processing
// ---------------------------------------------
export interface CalendarEvent {
  id: string
  label: string
  start: number          // minutes from midnight
  end: number
  count: number
  col: number            // for multi-column layouts (future use)
  groupCols: number
  classes: ClassItem[]
  raw: BackendSchedule
  _isCompact?: boolean
  [key: string]: any
}


// ---------------------------------------------
// Internal dictionary types
// ---------------------------------------------
export type DayEventsMap = Record<string, CalendarEvent[]>
export type DayGroupsMap = Record<string, CalendarEvent[][]>

