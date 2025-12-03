<script setup lang="ts">
import { reactive } from "vue";
import { useDebounceFn } from "@vueuse/core";

const emit = defineEmits(["update:modelValue", "filters-change"]);

const {
  modelValue,
  options
} = defineProps<{
  modelValue: {
    school_year_id: number | undefined;
    semester_id: number | undefined;
    course_id: number | undefined;
    professor_id: number | undefined;
    room_id: number | undefined;
    section_id: number | undefined;
    student_id: number | undefined;
    year_level: number | undefined;
  };
  options: {
    schoolYears: any[];
    semesters: any[];
    courses: any[];
    sections: any[];
    professorOptions: any[];
    allRooms: any[];
    yearLevels: number[];
  };
}>();

// Make a local editable version of filters
const filters = reactive({ ...modelValue });

// Debounce updates
const emitDebounced = useDebounceFn(() => {
  emit("update:modelValue", { ...filters });
  emit("filters-change", { ...filters });
}, 200);

function updateFilter(key: keyof typeof filters, value: any) {
  filters[key] = value;
  emitDebounced();
}

function resetAll() {
  Object.keys(filters).forEach((k) => {
    filters[k as keyof typeof filters] = undefined;
  });
  emitDebounced();
}
</script>

<template>
  <div class="controls">
    <!-- School Year -->
    <a-select v-model:value="filters.school_year_id" placeholder="School Year" style="width: 150px"
      @change="val => updateFilter('school_year_id', val)">
      <a-select-option v-for="sy in options.schoolYears" :key="sy.id" :value="sy.id">
        {{ sy.year_start }} - {{ sy.year_end }}
      </a-select-option>
    </a-select>

    <!-- Semester -->
    <a-select v-model:value="filters.semester_id" placeholder="Semester" style="width: 150px"
      @change="val => updateFilter('semester_id', val)">
      <a-select-option v-for="s in options.semesters" :key="s.id" :value="s.id">
        {{ s.name }}
      </a-select-option>
    </a-select>

    <!-- Course -->
    <a-select v-model:value="filters.course_id" placeholder="Course" style="width: 260px" allow-clear
      @change="val => updateFilter('course_id', val)">
      <a-select-option v-for="c in options.courses" :key="c.id" :value="c.id">
        {{ c.course_code }} — {{ c.course_name }}
      </a-select-option>
    </a-select>

    <!-- Year Level -->
    <a-select v-model:value="filters.year_level" placeholder="Year Level" allow-clear style="width: 150px"
      @change="val => updateFilter('year_level', val)">
      <a-select-option v-for="lvl in options.yearLevels" :key="lvl" :value="lvl">
        {{ lvl }}
      </a-select-option>
    </a-select>

    <!-- Section -->
    <a-select v-model:value="filters.section_id" placeholder="Section" allow-clear style="width: 200px"
      @change="val => updateFilter('section_id', val)">
      <a-select-option v-for="s in options.sections" :key="s.id" :value="s.id">
        {{ s.section_name }}
      </a-select-option>
    </a-select>

    <!-- Professor -->
    <a-select v-model:value="filters.professor_id" placeholder="Professor" allow-clear style="width: 220px"
      @change="val => updateFilter('professor_id', val)">
      <a-select-option v-for="p in options.professorOptions" :key="p.id" :value="p.id">
        {{ p.label }}
      </a-select-option>
    </a-select>


    <!-- Room -->
    <a-select v-model:value="filters.room_id" placeholder="Room" allow-clear style="width: 180px"
      @change="val => updateFilter('room_id', val)">
      <a-select-option v-for="r in options.allRooms" :key="r.id" :value="r.id">
        {{ r.room_number }} — {{ r.building_name }}
      </a-select-option>
    </a-select>

    <a-button @click="resetAll">Reset</a-button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
</style>
