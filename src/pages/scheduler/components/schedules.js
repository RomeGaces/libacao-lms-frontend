import axios from 'axios'

const API_URL = 'http://localhost:8000/api/schedules'

function getAuthHeaders() {
  const token = localStorage.getItem('authToken') || '6|npbSnXBNjKYCutBsf8JG2MwwJnnIU64RzhtFH2Eydffd3665'
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

// ✅ Check for schedule conflicts
async function checkConflict(schedule, excludeId = null) {
  try {
    const payload = {
      class_section_id: schedule.class_section_id,
      professor_id: schedule.professor_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      exclude_id: excludeId,
      room_id: schedule.room_id,
    }

    const response = await axios.post(`${API_URL}/check-conflict`, payload, getAuthHeaders())
    return response.data // { exists: true/false, message: "..." }
  }
  catch (error) {
    console.error('Conflict check failed:', error)
    return { exists: false }
  }
}

// ✅ CRUD Operations
async function fetchSchedules() {
  try {
    const response = await axios.get(API_URL, getAuthHeaders())
    return response.data
  }
  catch (error) {
    console.error('Fetching failed:', error)
    return { }
  }
}

async function fetchTimeslotSchedules(day_of_week, start_hour) {
  try {
    const response = await axios.get(`${API_URL}/timeslot/${day_of_week}/${start_hour}`, getAuthHeaders())
    return response.data
  }
  catch (error) {
    console.error('Fetching failed:', error)
    return { }
  }
}

async function createSchedule(schedule) {
  const conflict = await checkConflict(schedule)
  if (conflict.hasConflict) {
    throw Object.assign(new Error(conflict.message), {
      meta: { exists: true, message: conflict.message },
    })
  }

  const response = await axios.post(API_URL, schedule, getAuthHeaders())
  return response.data
}

async function updateSchedule(id, schedule) {
  const conflict = await checkConflict(schedule, id)
  if (conflict.hasConflict) {
    throw Object.assign(new Error(conflict.message), {
      meta: { exists: true, message: conflict.message },
    })
  }

  const response = await axios.put(`${API_URL}/${id}`, schedule, getAuthHeaders())
  return response.data
}

async function deleteSchedule(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders())
    return response.data
  }
  catch (error) {
    console.error('Delete failed:', error)
    return { exists: false }
  }
}

export default {
  fetchSchedules,
  fetchTimeslotSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  checkConflict,
}
