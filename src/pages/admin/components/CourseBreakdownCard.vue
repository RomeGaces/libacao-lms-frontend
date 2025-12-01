<script setup lang="ts">
interface CourseSummary {
  id: number
  name: string
  student_count: number
  section_count: number
  year_levels: number
}
const props = defineProps<{
  course: CourseSummary
}>()
</script>

<template>
  <a-card :title="props.course.name">
    <p><b>Students:</b> {{ props.course.student_count }}</p>
    <p><b>Sections:</b> {{ props.course.section_count }}</p>
    <p><b>Year Levels:</b> {{ props.course.year_levels }}</p>
  </a-card>
</template>
