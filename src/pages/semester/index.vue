<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
    getSemesters,
    createSemester,
    updateSemester,
    deleteSemester
} from "@/api/setup/semester";
import { message } from "ant-design-vue";

const semesters = ref([]);
const loading = ref(false);

const modalVisible = ref(false);
const isEdit = ref(false);
const formData = ref({ id: null, name: "", is_active: false });

function loadSemesters() {
    loading.value = true;
    getSemesters().then(res => {
        semesters.value = res.data;
    }).finally(() => (loading.value = false));
}

function openCreateModal() {
    isEdit.value = false;
    formData.value = { id: null, name: "", is_active: false };
    modalVisible.value = true;
}

function openEditModal(item: any) {
    isEdit.value = true;
    formData.value = { ...item };
    modalVisible.value = true;
}

function saveSemester() {
    const action = isEdit.value
        ? updateSemester(formData.value?.id!, formData.value)
        : createSemester(formData.value);

    action.then(() => {
        message.success("Semester saved");
        modalVisible.value = false;
        loadSemesters();
    });
}

function removeSemester(id: number) {
    deleteSemester(id).then(() => {
        message.success("Semester deleted");
        loadSemesters();
    });
}

onMounted(() => loadSemesters());
</script>

<template>
    <div nam="semester-page">
        <div class="p-4">
            <a-button type="primary" @click="openCreateModal">Add Semester</a-button>

            <a-table :dataSource="semesters" :loading="loading" rowKey="id" class="mt-4">
                <a-table-column title="Name" dataIndex="name" key="name" />
                <a-table-column title="Active" key="is_active">
                    <template #default="{ record }">
                        <a-tag color="green" v-if="record.is_active">Active</a-tag>
                        <a-tag color="default" v-else>Inactive</a-tag>
                    </template>
                </a-table-column>

                <a-table-column title="Actions">
                    <template #default="{ record }">
                        <a-button type="link" @click="openEditModal(record)">Edit</a-button>
                        <a-button danger type="link" @click="removeSemester(record.id)">Delete</a-button>
                    </template>
                </a-table-column>
            </a-table>
        </div>

        <a-modal v-model:visible="modalVisible" :title="isEdit ? 'Edit Semester' : 'Add Semester'" @ok="saveSemester">
            <a-form layout="vertical">
                <a-form-item label="Semester Name">
                    <a-input v-model:value="formData.name" />
                </a-form-item>

                <a-form-item label="Is Active?" hidden>
                    <a-switch v-model:checked="formData.is_active" />
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>
