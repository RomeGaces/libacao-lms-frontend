<script setup lang="ts">
import ClassCard from '~/pages/my-class/components/class-card.vue'

const courses = [
  {
    code: 'ITE 101',
    ref: '15459',
    section: 'I-Ed3',
    title: 'Living in the IT Era',
    units: 3,
    students: 38,
    schedules: [
      '5:00 PM - 6:00 PM | TUE | ONLINE',
      '7:00 PM - 8:00 PM | FRI | ONLINE',
    ],
  },
  {
    code: 'ITE 101',
    ref: '15475',
    section: 'I-Ed5',
    title: 'Living in the IT Era with Security Awareness',
    units: 3,
    students: 37,
    schedules: [
      '9:00 AM - 10:00 AM | SAT | ONLINE',
      '6:00 PM - 7:00 PM | TUE | ONLINE',
    ],
  },
  {
    code: 'IAS 301',
    ref: '16695',
    section: 'III-IT8',
    title: 'Advanced Information Assurance & Security',
    units: 3,
    students: 23,
    schedules: ['10:00 AM - 11:00 AM | SAT | ONLINE'],
  },
  {
    code: 'IAS 301',
    ref: '16711',
    section: 'III-IT9',
    title: 'Advanced Information Assurance & Security',
    units: 3,
    students: 27,
    schedules: ['6:00 PM - 7:00 PM | WED | ONLINE'],
  },
]
</script>

<template>
  <a-row :gutter="[24, 24]" type="flex" justify="start">
    <a-col v-for="cls in courses" :key="cls.ref" :xs="24" :sm="12" :md="12" :lg="6">
      <ClassCard :course="cls" />
    </a-col>
  </a-row>
</template>
