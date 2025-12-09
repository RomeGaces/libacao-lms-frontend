<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";

const fileMap = reactive({});
const results = reactive({});

const previewVisible = ref(false);
const previewData = ref("");
const previewTitle = ref("");

const openPreview = (title: string, data: string) => {
  previewTitle.value = title;
  previewData.value = data;
  previewVisible.value = true;
};

// modules
const modules = [
  {
    key: "students",
    label: "Students CSV",
    description: "Upload student masterlist for the school year.",
    template: "/templates/students_template.csv",
    instructions: [
      "student_number must be unique (example: 2025-00001).",
      "course_code must match an existing course (e.g., BSIT).",
      "middle_name can be blank.",
      "year_level is used for reporting but TOR determines actual progress.",
    ],
    sample: `student_number,first_name,middle_name,last_name,gender,birth_date,course_code,year_level,email,phone_number,address
2025-00001,Juan,Santos,Dela Cruz,M,2005-03-12,BSIT,1,juan.delacruz@example.com,09171234567,Brgy. Sampaloc
2025-00002,Maria,Cruz,Gonzales,F,2005-07-18,BSIT,1,maria.gonzales@example.com,09181234567,Brgy. Banaba
2025-00003,Ronald,,Garcia,M,2004-11-22,BSHM,2,ronald.garcia@example.com,09191234567,Brgy. San Roque`,
  },
  {
    key: "professors",
    label: "Professors CSV",
    description: "Upload list of teaching faculty.",
    template: "/templates/professors_template.csv",
    instructions: [
      "email must be unique per professor.",
      "department_code must exist in the departments table.",
      "system will auto-create user accounts for new professors.",
    ],
    sample: `first_name,middle_name,last_name,gender,email,phone_number,hire_date,specialization,status,department_code
Jose,,Reyes,M,jose.reyes@example.com,09170000001,2020-01-15,IT Programming,active,CCS
Ana,Lopez,Santos,F,ana.santos@example.com,09170000002,2019-06-20,Mathematics,active,CAS
Michael,,De Leon,M,michael.deleon@example.com,09170000003,2022-03-10,Hospitality Management,inactive,CHTM`,
  },
  {
    key: "curriculum",
    label: "Curriculum / Subjects CSV",
    description: "Upload all subjects under each course.",
    template: "/templates/curriculum_template.csv",
    instructions: [
      "course_code must match existing courses.",
      "subject_code must be unique.",
      "subject_prerequisite_code must be another subject_code in the same curriculum.",
      "If no prerequisite, leave the field blank.",
    ],
    sample: `course_code,subject_code,subject_name,units,year_level,semester_id,subject_prerequisite_code,type,hours_per_week,description
BSIT,IT101,Introduction to IT,3,1,1,,Lecture,3,Overview of IT industry
BSIT,IT102,Programming 1,3,1,1,,Lecture,3,Basics of programming
BSIT,IT201,Programming 2,3,2,1,IT102,Lecture,3,Continuation of programming 1`,
  },
  {
    key: "tor",
    label: "TOR (Transcript of Records) CSV",
    description: "Upload completed subjects for each student.",
    template: "/templates/tor_template.csv",
    instructions: [
      "student_number must exist in the student masterlist.",
      "subject_code must exist in curriculum.",
      "grade is required and determines if subject is Completed.",
      "After upload, the system automatically assigns next required subjects.",
    ],
    sample: `student_number,subject_code,grade,remark
2025-00001,IT101,1.5,Passed
2025-00001,ENG101,2.0,Passed
2025-00002,IT101,2.5,Passed`,
  },
];

// file handler
function onFileChange(key: string, file: any) {
  fileMap[key] = file;
  message.success("File selected: " + file.name);
}

async function upload(key: string) {
  if (!fileMap[key]) {
    message.error("Please select a CSV file first.");
    return;
  }

  const form = new FormData();
  form.append("file", fileMap[key]);

  const endpoints: any = {
    students: "/import/students",
    professors: "/import/professors",
    curriculum: "/import/curriculum",
    tor: "/import/tor",
  };

  results[key] = "Uploading...";

  try {
    const res = await usePost(endpoints[key], form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    results[key] = JSON.stringify(res.data, null, 2);
    message.success("Upload completed!");
  } catch (err: any) {
    results[key] = JSON.stringify(err.response?.data || err, null, 2);
    message.error("Upload failed.");
  }
}
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Data Import Center</h1>

    <a-divider />

    <!-- One card per module -->
    <a-card v-for="mod in modules" :key="mod.key" class="mb-6 shadow-sm">
      <div class="flex justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold">{{ mod.label }}</h2>
          <p class="text-gray-600">{{ mod.description }}</p>
        </div>

        <div class="flex flex-col gap-2 items-end">
          <!-- <a-button type="default" @click="openPreview(mod.label + ' Template', mod.sample)">
            Preview Sample
          </a-button> -->

          <a-button type="default">
            <a :href="mod.template" download>Download Template</a>
          </a-button>

          <a-upload :before-upload="(file) => { onFileChange(mod.key, file); return false; }" accept=".csv"
            maxCount="1">
            <a-button>Select File</a-button>
          </a-upload>

          <a-button type="primary" @click="upload(mod.key)">Upload CSV</a-button>
        </div>
      </div>

      <!-- Instructions -->
      <a-alert type="info" show-icon class="mb-4" message="How to fill this template:" />
      <ul class="list-disc pl-6 text-sm text-gray-700 mb-4">
        <li v-for="line in mod.instructions" :key="line">{{ line }}</li>
      </ul>

      <!-- Upload result -->
      <div v-if="results[mod.key]" class="upload-result">
        <h3 class="font-semibold mb-2">Upload Result</h3>
        <pre class="text-sm whitespace-pre-wrap">{{ results[mod.key] }}</pre>
      </div>
    </a-card>

    <!-- <a-modal v-model:visible="previewVisible" :title="previewTitle" width="900px"
             :body-style="{ background: '#1e1e1e', padding: '20px' }" footer="">
      <pre class="csv-preview">{{ previewData }}</pre>
    </a-modal> -->

  </div>
</template>

<style scoped>
.csv-preview {
  background: #2d2d2d;
  color: #e6e6e6;
  padding: 20px;
  border-radius: 6px;
  font-size: 14px;
  max-height: 500px;
  overflow-y: auto;
  white-space: pre;
  line-height: 1.5;
  width: 100%;
  display: block;
  border: 1px solid #444;
}

.upload-result {
  background: #1e1e1e;
  /* dark background */
  color: #e6e6e6;
  /* light readable text */
  padding: 20px;
  border: 1px solid #333;
  border-radius: 6px;
  margin-top: 10px;
}

.result-pre {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.5;
  background: #2a2a2a;
  color: #f0f0f0;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}
</style>
