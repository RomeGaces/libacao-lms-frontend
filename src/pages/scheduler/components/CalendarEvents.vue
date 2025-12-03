<script setup lang="ts">
import EventCard from "./EventCard.vue";

interface CalendarEvent {
  id: string;
  label: string;
  start: number;
  end: number;
  count: number;
  col: number;
  groupCols: number;
  classes: any[];
  raw: any;
}

const {
  day,
  dayRenderData,
  eventLoadingId,
  eventStyle,
  onEventClick,
  onGroupSummaryClick,
  eventRefs
} = defineProps<{
  day: string;
  dayRenderData: Record<string, {
    groups: CalendarEvent[][];
    eventsFlat: CalendarEvent[];
  }>;
  eventStyle: (ev: CalendarEvent) => any;
  onEventClick: (ev: CalendarEvent) => void;
  onGroupSummaryClick: (day: string, groupIndex: number) => void;
  eventRefs: HTMLElement[];
  eventLoadingId: number | null;
}>();
</script>

<template>
  <template v-if="dayRenderData[day]">
    <template
      v-for="(group, gi) in dayRenderData[day].groups"
      :key="`group-${day}-${gi}`"
    >
      <!-- IF FEW EVENTS -->
      <template v-if="group[0].classes.length == 1">
        <div
          v-for="ev in group"
          :key="ev.id"
          class="event-wrapper"
          :style="eventStyle(ev)"
          :ref="el => eventRefs.push(el as HTMLElement)"
          @click="() => onEventClick(ev)"
        >
          <EventCard :event="ev" :event-loading-id="eventLoadingId"/>
        </div>
      </template>

      <!-- IF MANY EVENTS -->
      <template v-else>
        <div
          v-for="ev in group.slice(0,2)"
          :key="ev.id"
          class="event-wrapper"
          :style="eventStyle(ev)"
          :ref="el => eventRefs.push(el as HTMLElement)"
          @click="() => onGroupSummaryClick(day, gi)"
        >
          <EventCard :event="ev" summary-mode :event-loading-id="eventLoadingId" />
        </div>
      </template>
    </template>
  </template>
</template>

<style scoped>
.event-wrapper {
  position: absolute;
  border: 1px solid rgba(37,99,235,0.4);
  background: rgba(37,99,235,0.12);
  border-radius: 6px;
  pointer-events: auto;
}
</style>
