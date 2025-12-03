<script setup lang="ts">
interface ClassItem {
    id: number;
    title: string;
    professor: string;
    room: string;
    section?: string;
}

interface CalendarEvent {
    id: string;
    label: string;
    classes: ClassItem[];
    count: number;
    _isCompact?: boolean;
}

const {
    event,
    summaryMode,
    eventLoadingId
} = defineProps<{
    event: CalendarEvent;
    summaryMode?: boolean;
    eventLoadingId: Number | null;
}>()

const emit = defineEmits(["click"]);
</script>

<template>
    <div class="event-card clickable" @click="emit('click')"
        :class="{ 'is-loading': eventLoadingId === event.classes[0].id }">
        <a-spin v-if="eventLoadingId === event.classes[0].id" size="small" />
        <template v-else>
            <!-- Title -->
            <div class="event-title" :class="{ compact: event._isCompact }">
                {{ event.classes[0]?.title }}
            </div>

            <!-- Sections list (shows first two) -->
            <div class="event-sections" :class="{ compact: event._isCompact }">
                {{event.classes.slice(0, 2).map(c => c.section).join(', ')}}
            </div>

            <!-- Extra count -->
            <template v-if="event.count > 1">
                <div class="event-extra">
                    <!-- If summaryMode: “+N more classes” -->
                    <template v-if="summaryMode">
                        {{ event.count - 1 }} more
                    </template>

                    <!-- Normal mode: “N more classes” -->
                    <template v-else>
                        {{ event.count - 1 }} more {{ event.count - 1 === 1 ? 'class' : 'classes' }}
                    </template>
                </div>
            </template>
        </template>
    </div>
</template>

<style scoped>
.event-card {
    background: #2a2b31;
    color: #e4e7ec;
    border: 1px solid #3a3b42;
    border-radius: 10px;
    padding: 8px 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    cursor: pointer;
}

.event-card.clickable {
    cursor: pointer;
}

.event-title {
    font-weight: 600;
    font-size: 13px;
    line-height: 1.2;
}

.event-title.compact {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.1;
}

.event-sections {
    font-style: italic;
    font-size: 12px;
    color: #a8acb3;
    margin-top: 2px;
}

.event-sections.compact {
    font-size: 10px;
    margin-top: 1px;
}

.event-extra {
    margin-top: 6px;
    font-size: 12px;
    opacity: 0.85;
}
</style>
