<script setup lang="ts">
import { ref, defineExpose } from "vue";

/* Strongly typed props */
const props = defineProps<{
    displayDays: { key: string; label: string }[];
    timeSlots: number[];
    slotHeightPx: number;
    totalGridHeight: number;
    dayColumnWidth: number;
}>();

const emit = defineEmits<{
    (e: "scroll", ev: Event): void;
}>();

const localHeaderRef = ref<HTMLElement | null>(null);
const localDaysGridRef = ref<HTMLElement | null>(null);

/* Expose refs to parent for scroll-sync */
defineExpose({
    localHeaderRef,
    localDaysGridRef,
});
</script>

<template>
    <div class="calendar-container">

        <!-- HEADER -->
        <div class="calendar-header">
            <div class="sticky-time-col"></div>

            <div ref="localHeaderRef" class="header-days" :style="{ minWidth: `${220 * props.displayDays.length}px` }">
                <div v-for="day in props.displayDays" :key="day.key" class="day-cell">
                    {{ day.label }}
                </div>
            </div>
        </div>

        <div class="calendar-body">
            <!-- TIME COLUMN -->
            <div class="time-col sticky-time-col">
                <div v-for="slot in props.timeSlots" :key="slot" class="time-slot"
                    :style="{ height: `${props.slotHeightPx}px` }">
                    <div v-if="slot % 60 === 0" class="time-text">
                        {{ formatHour(slot) }}
                    </div>
                </div>
            </div>

            <!-- MAIN GRID -->
            <div ref="localDaysGridRef" class="days-grid" @scroll="($event) => emit('scroll', $event)">
                <div class="days-row" :style="{
                    height: `${props.totalGridHeight}px`,
                    minWidth: `${220 * props.displayDays.length}px`
                }">
                    <!-- DAY COLUMN -->
                    <div v-for="day in props.displayDays" :key="day.key" class="day-column">
                        <!-- BG SLOTS -->
                        <div v-for="slot in props.timeSlots" :key="`bg-${day.key}-${slot}`" class="bg-slot"
                            :style="{ height: `${props.slotHeightPx}px` }" />

                        <!-- EVENTS SLOT -->
                        <div class="events-container">
                            <slot name="events" :day="day.key"></slot>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </div>
</template>

<script lang="ts">
export function formatHour(minute: number) {
    const h = Math.floor(minute / 60);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = ((h + 11) % 12) + 1;
    return `${hr}:00 ${ampm}`;
}
</script>

<style scoped>
.calendar-container {
    background: #1e1f25;
    border: 1px solid #2a2b31;
    border-radius: 8px;
}

.calendar-header {
    display: flex;
    background: #25262c;
}

.header-days {
    display: flex;
    overflow-x: auto;
}

.day-cell {
    min-width: 220px;
    padding: 12px;
    border-right: 1px solid #2f3037;
    text-align: center;
    font-weight: 600;
    color: white;
}

.calendar-body {
    display: flex;
}

.sticky-time-col {
    width: 80px;
    min-width: 80px;
    background: #25262c;
    border-right: 1px solid #2f3037;
}

.time-slot {
    border-bottom: 1px dashed #32343a;
    position: relative;
}

.time-text {
    position: absolute;
    left: 8px;
    top: 4px;
}

.days-grid {
    overflow: auto;
    width: 100%;
}

.days-row {
    display: flex;
    padding-top: 8px;
}

.day-column {
    min-width: 220px;
    flex: 0 0 220px;
    border-right: 1px solid #2f3037;
    position: relative;
}

.bg-slot {
    border-bottom: 1px dashed #2d2e34;
}

.events-container {
    position: absolute;
    left: 6px;
    right: 6px;
    top: 0;
    bottom: 0;
}
</style>
