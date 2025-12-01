import { message } from 'ant-design-vue'
import axios from 'axios'

// ✅ Create axios instance
const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // adjust if your backend runs elsewhere
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
})

// ✅ Hardcoded token (temporary for demo)
const TOKEN = '6|npbSnXBNjKYCutBsf8JG2MwwJnnIU64RzhtFH2Eydffd3665'

// Automatically attach token
instance.interceptors.request.use(
  (config) => {
    if (TOKEN) {
      config.headers.Authorization = `Bearer ${TOKEN}`
    }
    return config
  },
  error => Promise.reject(error),
)

// ✅ Handle basic errors
instance.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        message.error('Unauthorized: Please check your token.')
      }
      else if (status === 404) {
        message.warning('Resource not found.')
      }
      else if (status >= 500) {
        message.error('Server error. Please try again later.')
      }
      else {
        message.error(data?.message || 'Request failed.')
      }
    }
    else {
      message.error('Network error. Please check your connection.')
    }
    return Promise.reject(error)
  },
)

export default instance
