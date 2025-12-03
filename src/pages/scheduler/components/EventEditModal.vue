<script setup lang="ts">
/**
 * Props
 * - visible: boolean (v-model)
 * - data: ClassItem | null (the single class to edit)
 * - timeOptions: string[] (generated 5-minute interval times)
 */
const {
    visible,
    data,
    timeOptions
} = defineProps<{
    visible: boolean;
    data: any | null;
    timeOptions: string[];
}>()

const emit = defineEmits(["update:visible", "save"]);

// Change modal visibility
function updateVisible(v: boolean) {
    emit("update:visible", v);
}
</script>

<template>
    <a-modal :visible="visible" title="Edit Class" @ok="emit('save')" @cancel="updateVisible(false)">
        <div v-if="data">
            <a-form layout="vertical">

                <a-form-item label="Title">
                    <a-input v-model:value="data.title" />
                </a-form-item>

                <a-form-item label="Professor">
                    <a-input v-model:value="data.professor" />
                </a-form-item>

                <a-form-item label="Room">
                    <a-input v-model:value="data.room" />
                </a-form-item>

                <a-form-item label="Start Time">
                    <a-select v-model:value="data.start_time">
                        <a-select-option v-for="t in timeOptions" :key="t" :value="t">
                            {{ t }}
                        </a-select-option>
                    </a-select>
                </a-form-item>

                <a-form-item label="End Time">
                    <a-select v-model:value="data.end_time">
                        <a-select-option v-for="t in timeOptions" :key="t" :value="t">
                            {{ t }}
                        </a-select-option>
                    </a-select>
                </a-form-item>

            </a-form>
        </div>
    </a-modal>
</template>

<style scoped>
/* No custom styling needed */
</style>
