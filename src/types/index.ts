export interface EditConflictInterface {
    conflict: boolean;
    room_conflict: boolean;
    professor_conflict: boolean;
    class_conflict: boolean;
    room_capacity_conflict: boolean;
}

export interface RoomInterface {
    id: number;
    room_number: string;
    building_name: string;
    capacity: number;
    type: string;
}

export interface SelectInterface {
    value: number | string;
    label: string;
}

export interface FilterInterface {
    school_year_id: number | undefined
    semester_id: number | undefined
    course_id: number | undefined
    professor_id: number | undefined
    room_id: number | undefined
    section_id: number | undefined
    student_id: number | undefined
    year_level: number | undefined
}
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
export interface BackendSchedule {
    day_of_week: string
    start_time: string
    end_time: string
    count: number
    label: string
    classes: ClassItem[]
}
export interface CalendarEvent {
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

export interface ProfessorInterface{
   id: number,
   first_name: string,
   last_name: string,
   middle_name: string
}