<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'

/* ---------------- TYPES ---------------- */
interface Course {
  id: number
  course_code: string
  course_name: string
}

interface StudentForm {
  id?: number
  student_number: string
  first_name: string
  middle_name?: string
  last_name: string
  gender?: string
  email?: string
  course_id?: number
  year_level: number
}

/* ---------------- PROPS & EMITS ---------------- */
const props = defineProps<{
  visible: boolean
  editData: StudentForm | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

/* ---------------- STATE ---------------- */
const loading = ref(false)        // 🔥 NEW
const courses = ref<Course[]>([])
const originalForm = ref<StudentForm | null>(null)

const form = ref<StudentForm>({
  student_number: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: '',
  email: '',
  course_id: undefined,
  year_level: 1,
})

/* ---------------- DIRTY CHECK ---------------- */
const isDirty = computed(() => {
  return JSON.stringify(form.value) !== JSON.stringify(originalForm.value)
})

/* ---------------- LOAD COURSES ---------------- */
const loadCourses = async () => {
  const { data } = await useGet('/courses')
  courses.value = data.data ?? []
}

/* ---------------- FETCH NEXT STUDENT NUMBER ---------------- */
const generateSequentialId = async () => {
  const { data } = await useGet<string>('/students/next-number')
  return data
}

/* ---------------- EMAIL FORMAT BUILDER ---------------- */
const buildEmailBase = () => {
  const first = form.value.first_name.trim().toLowerCase().replace(/\s+/g, '')
  const last = form.value.last_name.trim().toLowerCase().replace(/\s+/g, '')
  const mid = form.value.middle_name?.trim().charAt(0)?.toLowerCase() || ''
  return `${first}.${mid}.${last}`.replace(/\.\./g, '.')
}

/* ---------------- CHECK EMAIL AVAILABILITY ---------------- */
const checkEmailAvailable = async (email: string) => {
  const { data } = await useGet(
    `/students/check-email?email=${encodeURIComponent(email)}`
  )
  return data?.available ?? false
}

/* ---------------- AUTO-GENERATE EMAIL ---------------- */
const updateEmail = async () => {
  if (!form.value.first_name || !form.value.last_name) return

  const base = buildEmailBase()
  let email = `${base}@libacao.edu.ph`

  if (await checkEmailAvailable(email)) {
    form.value.email = email
    return
  }

  let counter = 1
  while (true) {
    const attempt = `${base}${counter}@libacao.edu.ph`
    if (await checkEmailAvailable(attempt)) {
      form.value.email = attempt
      return
    }
    counter++
  }
}

/* ---------------- WATCH FIELDS FOR EMAIL REGEN ---------------- */
watch(() => [
  form.value.first_name,
  form.value.middle_name,
  form.value.last_name
], () => updateEmail())

/* ---------------- WATCH MODAL OPEN ---------------- */
watch(
  () => props.visible,
  async (open) => {
    if (!open) return

    loading.value = true   // 🔥 START LOADING

    await loadCourses()

    if (props.editData) {
      form.value = {
        ...props.editData,
        course_id: props.editData.course_id
          ? Number(props.editData.course_id)
          : undefined,
      }
      originalForm.value = JSON.parse(JSON.stringify(form.value))
    } else {
      const nextId = await generateSequentialId()
      form.value = {
        student_number: nextId ?? '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        email: '',
        course_id: undefined,
        year_level: 1,
      }
      originalForm.value = JSON.parse(JSON.stringify(form.value))
    }

    loading.value = false   // 🔥 DONE LOADING
  }
)

/* ---------------- SAVE HANDLER ---------------- */
const save = async () => {
  try {
    if (loading.value) return  // 🔥 PREVENT SAVE WHILE LOADING

    if (!form.value.first_name || !form.value.last_name)
      return message.error("First & Last name are required.")

    if (!form.value.email)
      return message.error("Email is required.")

    const emailRegex = /^[a-z]+\.[a-z]?\.[a-z]+[0-9]*@libacao\.edu\.ph$/
    if (!emailRegex.test(form.value.email))
      return message.error("Email format is invalid.")

    if (!form.value.course_id)
      return message.error("Course is required.")

    const payload = {
      ...form.value,
      course_id: form.value.course_id ? Number(form.value.course_id) : null,
    }

    if (props.editData?.id)
      await usePut(`/students/${props.editData.id}`, payload)
    else
      await usePost('/students', payload)

    message.success("Saved!")
    emit("update:visible", false)
    emit("saved")

  } catch {
    message.error("Save failed. Email or student number may be already taken.")
  }
}
</script>

<template>
  <a-modal
    :open="visible"
    title="Student Information"
    :confirmLoading="loading"     
    @cancel="() => emit('update:visible', false)"
    @ok="save"
  >

    <!-- LOADING OVERLAY -->
    <a-spin :spinning="loading">

      <!-- DIRTY WARNING -->
      <div v-if="isDirty" class="text-yellow-400 mb-2">
        • You have unsaved changes.
      </div>

      <a-form layout="vertical">

        <!-- Student Number -->
        <a-form-item label="Student Number" required>
          <a-input v-model:value="form.student_number" disabled />
        </a-form-item>

        <a-form-item label="First Name" required>
          <a-input v-model:value="form.first_name" :disabled="loading" />
        </a-form-item>

        <a-form-item label="Middle Name">
          <a-input v-model:value="form.middle_name" :disabled="loading" />
        </a-form-item>

        <a-form-item label="Last Name" required>
          <a-input v-model:value="form.last_name" :disabled="loading" />
        </a-form-item>

        <a-form-item label="Gender">
          <a-select v-model:value="form.gender" allow-clear :disabled="loading">
            <a-select-option value="Male">Male</a-select-option>
            <a-select-option value="Female">Female</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Email" required>
          <a-input v-model:value="form.email" :disabled="loading" />
        </a-form-item>

        <a-form-item label="Course" required>
          <a-select v-model:value="form.course_id" :disabled="loading">
            <a-select-option
              v-for="c in courses"
              :key="c.id"
              :value="c.id"
            >
              {{ c.course_code }} - {{ c.course_name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Year Level" required>
          <a-select v-model:value="form.year_level" :disabled="loading">
            <a-select-option :value="1">1st Year</a-select-option>
            <a-select-option :value="2">2nd Year</a-select-option>
            <a-select-option :value="3">3rd Year</a-select-option>
            <a-select-option :value="4">4th Year</a-select-option>
          </a-select>
        </a-form-item>

      </a-form>

    </a-spin>
  </a-modal>
</template>
