<script setup>
import { ref } from 'vue';
import {
  LeftOutlined,
  TeamOutlined,
  TabletOutlined,
  LaptopOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  SendOutlined,
  SoundOutlined,
} from '@ant-design/icons-vue';

// State to manage the currently selected menu item
// We set 'lessons' as the initial key based on the screenshot
const selectedKeys = ref(['lessons']);

// Handler for menu item clicks (optional, for demonstration)
const handleClick = (e) => {
  console.log('Menu item clicked:', e.key);
  // In a real application, this would trigger navigation
};
</script>

<template>
  <!-- Main container styled to mimic the sidebar card look -->
 

    <!-- Ant Design Menu Component -->
    <a-menu
      v-model:selectedKeys="selectedKeys"
      mode="inline"
      class="border-none"
      @click="handleClick"
    >
      <!-- Menu Item: Back (Styled to look like a special action) -->
      <a-menu-item key="back" class="!my-1">
        <template #icon>
          <LeftOutlined />
        </template>
        Back
      </a-menu-item>

      <!-- Divider (Optional visual separation after the "Back" button) -->
      <a-menu-divider class="!my-2" />

      <!-- Standard Navigation Items -->
      
      <a-menu-item key="student" class="!my-1">
        <template #icon>
          <TeamOutlined />
        </template>
        Student
      </a-menu-item>

      <a-menu-item key="course" class="!my-1">
        <template #icon>
          <TabletOutlined />
        </template>
        Course Overview
      </a-menu-item>

      <!-- The selected item is highlighted blue by Ant Design's styling when its key is in selectedKeys -->
      <a-menu-item key="lessons" class="!my-1">
        <template #icon>
          <LaptopOutlined />
        </template>
        Lessons
      </a-menu-item>

      <a-menu-item key="assessment" class="!my-1">
        <template #icon>
          <FileTextOutlined />
        </template>
        Assessment
      </a-menu-item>
      
      <a-menu-item key="gradebook" class="!my-1">
        <template #icon>
          <UnorderedListOutlined />
        </template>
        Gradebook
      </a-menu-item>
      
      <a-menu-item key="submission" class="!my-1">
        <template #icon>
          <SendOutlined />
        </template>
        Submission of Grades
      </a-menu-item>
      
      <a-menu-item key="announcement" class="!my-1">
        <template #icon>
          <SoundOutlined />
        </template>
        Announcement
      </a-menu-item>

    </a-menu>
</template>

<style scoped>
/*
  Custom styling to override default Ant Design margins and ensure a clean, compact look.
  The !important flag is sometimes needed for full Ant Design override in component scopes.
*/

/* Remove default Antd padding/margin from the menu for a tighter integration */
:deep(.ant-menu) {
  padding: 0;
}

/* Ensure selected item styling is consistent */
:deep(.ant-menu-item-selected) {
  /* Set background color for selected item if needed, but Antd default is usually fine */
  /* background-color: #e6f7ff !important; */
  color: #1890ff !important; /* Blue text for selected */
  font-weight: 500;
}

/* Customize padding/margin for menu items */
:deep(.ant-menu-item) {
  margin-top: 4px;
  margin-bottom: 4px;
  /* Use padding-left for icon alignment with the custom header */
  padding-left: 16px !important; 
  height: 40px; /* Give it a comfortable height */
  line-height: 40px;
}

/* Adjust the icon margin slightly for visual spacing */
:deep(.ant-menu-item .anticon) {
  margin-right: 12px;
  /* Ensures the icon itself is not distorted */
  vertical-align: middle; 
}

/* Remove border from the menu divider to match the simple aesthetic */
:deep(.ant-menu-divider) {
  border-bottom: 1px solid #f0f0f0;
}
</style>
