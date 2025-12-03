<script setup lang="ts">
import { h } from "vue";
import type { EditConflictInterface, RoomInterface } from "~@/types";

const allTimes = [
    "07:00", "07:05", "07:10", "07:15", "07:20", "07:25", "07:30", "07:35", "07:40", "07:45", "07:50", "07:55",
    "08:00", "08:05", "08:10", "08:15", "08:20", "08:25", "08:30", "08:35", "08:40", "08:45", "08:50", "08:55",
    "09:00", "09:05", "09:10", "09:15", "09:20", "09:25", "09:30", "09:35", "09:40", "09:45", "09:50", "09:55",
    "10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45", "10:50", "10:55",
    "11:00", "11:05", "11:10", "11:15", "11:20", "11:25", "11:30", "11:35", "11:40", "11:45", "11:50", "11:55",
    "12:00", "12:05", "12:10", "12:15", "12:20", "12:25", "12:30", "12:35", "12:40", "12:45", "12:50", "12:55",
    "13:00", "13:05", "13:10", "13:15", "13:20", "13:25", "13:30", "13:35", "13:40", "13:45", "13:50", "13:55",
    "14:00", "14:05", "14:10", "14:15", "14:20", "14:25", "14:30", "14:35", "14:40", "14:45", "14:50", "14:55",
    "15:00", "15:05", "15:10", "15:15", "15:20", "15:25", "15:30", "15:35", "15:40", "15:45", "15:50", "15:55",
    "16:00", "16:05", "16:10", "16:15", "16:20", "16:25", "16:30", "16:35", "16:40", "16:45", "16:50", "16:55",
    "17:00", "17:05", "17:10", "17:15", "17:20", "17:25", "17:30", "17:35", "17:40", "17:45", "17:50", "17:55",
    "18:00", "18:05", "18:10", "18:15", "18:20", "18:25", "18:30", "18:35", "18:40", "18:45", "18:50", "18:55",
    "19:00"
]

const endTimeOptions = ref(allTimes)

interface EditFormInterface {
    id: number | null;
    subject_id: number | undefined;
    professor_id: number | undefined;
    building: string | undefined;
    room_id: number | undefined;
    day_of_week: string | undefined;
    start_time: string | undefined;
    end_time: string | undefined;
    section_id: number | undefined;
    course_id: number | undefined;
    year_level: number | undefined;
}

// Props
const {
    visible,
    title,
    mode,
    drawerData,
    subjectOptions,
    professorOptions,
    buildingOptions,
    allRooms,
    timeOptions,
    editForm,
    editConflict,
    isSaving,
} = defineProps<{
    visible: boolean;
    title: string;
    mode: "edit-single" | "list-single-timeslot" | "multi-timeslot";
    drawerData: any[];
    subjectOptions: any[];
    professorOptions: any[];
    buildingOptions: any[];
    allRooms: RoomInterface[];
    timeOptions: string[];
    editForm: EditFormInterface;
    editConflict: EditConflictInterface,
    isSaving: boolean;
}>()

const roomOptions = ref<{ value: any; label: any }[]>([])
// Emits
const emit = defineEmits(["update:visible", "close", "open-edit", "save"]);

// Two-way binding for drawer visibility
function updateVisible(v: boolean) {
    emit("update:visible", v);
    if (!v) emit("close");
}

// Format helper
function formatTimeRange(start: string, end: string) {
    return `${start} – ${end}`;
}

let isInitializingRooms = false;
async function loadRoomsForBuilding(buildingName: string) {
  // Option: if you DO have allRooms and it is populated, use it:
  if (Array.isArray(allRooms) && allRooms.length > 0) {
    roomOptions.value = allRooms
      .filter(r => r.building_name === buildingName)
      .map(r => ({ value: r.id, label: r.room_number }))
    return
  }

  // Otherwise fetch from backend
  try {
    const res = await useGet(`/rooms/by-building/${encodeURIComponent(buildingName)}`)
    roomOptions.value = (res.data?.data || []).map((r: any) => ({ value: r.id, label: r.room_number }))
  } catch (err) {
    console.error('Failed to load rooms for building', buildingName, err)
    roomOptions.value = []
  }
}
watch(
    () => editForm.building,
    async (newBuilding) => {
        if (!allRooms) return

        if (!isInitializingRooms) {
            // 1) Fetch the single room to get its building (endpoint: /rooms/{id})
            if (!editForm.room_id) return
            const resRoom = await useGet(`/rooms/${encodeURIComponent(editForm.room_id)}`)
            const room = resRoom.data?.data || resRoom.data // adjust to your API shape
            if (!room) {
                console.warn('Room not found for id', editForm.room_id)
                isInitializingRooms = false
                return
            }

            // 2) Set building on editForm (normalize field name)
            editForm.building = room.building_name || room.building || editForm.building

            // 3) Load all rooms for that building (either from allRooms or backend)
            if (editForm.building) {
                await loadRoomsForBuilding(editForm.building)
            }

            isInitializingRooms = true
            return
        }

        if (newBuilding === null || newBuilding === undefined) {
            roomOptions.value = []
            editForm.room_id = undefined
            return
        }

        roomOptions.value = allRooms
            .filter((r: { building_name: string }) => r.building_name === newBuilding)
            .map((r: { id: any; room_number: any }) => ({
                value: r.id,
                label: r.room_number
            }))

        editForm.room_id = undefined
    }
)
watch(
    () => editForm.start_time,
    (newStart) => {
        if (!newStart) {
            endTimeOptions.value = allTimes
            return
        }

        // Only times strictly greater than the selected start
        endTimeOptions.value = allTimes.filter(t => t > newStart)

        // Reset end_time if it's no longer valid
        if (editForm.end_time && editForm.end_time <= newStart) {
            editForm.end_time = undefined
        }
    }
)

</script>

<template>


    <a-drawer :open="visible" :title="title" placement="right" width="480" :mask-closable="true"
        @close="updateVisible(false)">
        <!-- =========================== -->
        <!-- MODE: EDIT-SINGLE           -->
        <!-- =========================== -->
        <div v-if="mode === 'edit-single' && drawerData.length">
            <a-form layout="vertical">
                <a-alert v-if="editConflict.room_conflict"
                    message="Another class is scheduled to use that room at that time." type="error" />
                <a-alert v-if="editConflict.professor_conflict"
                    message="The professor is teaching another class at that time." type="warning" />
                <a-alert v-if="editConflict.class_conflict"
                    message="The class section already has a subject at that time." type="warning" />
                <a-alert v-if="editConflict.room_capacity_conflict" message="Number of students exceeded room capacity."
                    type="warning" />

                <a-form-item label="Subject" name="subject_id" hidden>
                    <a-select v-model:value="editForm.subject_id" style="width:100%" :options="subjectOptions"
                        option-filter-prop="label" />
                </a-form-item>

                <a-form-item label="Professor" name="professor_id">
                    <a-select v-model:value="editForm.professor_id" style="width:100%" :options="professorOptions" />
                </a-form-item>

                <a-form-item label="Building" name="building">
                    <a-select v-model:value="editForm.building" style="width:100%" :options="buildingOptions"
                        option-filter-prop="label" />
                </a-form-item>

                <a-form-item label="Room" name="room_id">
                    <a-select v-model:value="editForm.room_id" style="width:100%" :options="roomOptions"
                        option-filter-prop="label" />
                </a-form-item>

                <a-form-item label="Day" name="day_of_week">
                    <a-select v-model:value="editForm.day_of_week" style="width:100%">
                        <a-select-option
                            v-for="d in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']" :key="d"
                            :value="d">
                            {{ d }}
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <a-row :gutter="12">
                    <a-col :span="12">
                        <a-form-item label="Start Time">
                            <a-select v-model:value="editForm.start_time">
                                <a-select-option v-for="t in timeOptions" :key="t" :value="t">
                                    {{ t }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>

                    <a-col :span="12">
                        <a-form-item label="End Time">
                            <a-select v-model:value="editForm.end_time" placeholder="Select End Time">
                                <a-select-option v-for="t in endTimeOptions" :key="t" :value="t">
                                    {{ t }}
                                </a-select-option>
                            </a-select>
                        </a-form-item>
                    </a-col>
                </a-row>



                <a-button type="primary" block :disabled="editConflict.conflict || isSaving" @click="$emit('save')">
                    <template v-if="!isSaving">
                        Save
                    </template>
                    <template v-else>
                        Saving...
                    </template>
                </a-button>
            </a-form>
        </div>

        <!-- =========================== -->
        <!-- MODE: LIST-SINGLE-TIMESLOT  -->
        <!-- =========================== -->
        <div v-else-if="mode === 'list-single-timeslot' && drawerData.length">
            <a-table :data-source="drawerData[0].classes" :pagination="false" row-key="id" size="small">
                <a-table-column title="Title" data-index="title" />
                <a-table-column title="Section" :custom-render="({ record }: any) => record.section || '-'" />
                <a-table-column title="Professor" data-index="professor" />
                <a-table-column title="Room" data-index="room" />
                <a-table-column title="Actions" :custom-render="({ record }: any) =>
                    h('a', { onClick: () => emit('open-edit', record) }, 'Edit')" />
            </a-table>
        </div>

        <!-- =========================== -->
        <!-- MODE: MULTI-TIMESLOT        -->
        <!-- =========================== -->
        <div v-else-if="mode === 'multi-timeslot' && drawerData.length">
            <a-collapse accordion>
                <a-collapse-panel v-for="groupEvents in drawerData" :key="groupEvents.id" :header="formatTimeRange(
                    groupEvents.classes[0].start_time,
                    groupEvents.classes[0].end_time
                )">
                    <a-table :data-source="groupEvents.classes" :pagination="false" row-key="id" size="small">
                        <a-table-column title="Title" data-index="title" />
                        <a-table-column title="Section" :custom-render="({ record }: any) => record.section || '-'" />
                        <a-table-column title="Professor" data-index="professor" />
                        <a-table-column title="Room" data-index="room" />
                        <a-table-column title="Actions" :custom-render="({ record }: any) =>
                            h('a', { onClick: () => emit('open-edit', record) }, 'Edit')" />
                    </a-table>
                </a-collapse-panel>
            </a-collapse>
        </div>

    </a-drawer>
</template>
