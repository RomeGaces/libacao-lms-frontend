<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import Quizzes from '../quiz-maker/index.vue'
import ClassMenu from './components/ClassMenu.vue'

const panes = ref<{ title: string, content: string, key: string, closable?: boolean }[]>(
  Array.from({ length: 1 }).fill(null).map((_, index) => {
    const id = String(index + 1)
    return { title: `Lessons`, content: `Content of Tab Pane ${id}`, key: id }
  }),
)
const activeKey = ref(panes.value[0].key)
// const newTabIndex = ref(0)

// const add = () => {
//   activeKey.value = `newTab${newTabIndex.value++}`;
//   panes.value.push({
//     title: `New Tab ${activeKey.value}`,
//     content: `Content of new Tab ${activeKey.value}`,
//     key: activeKey.value,
//   });
// };

// function remove(targetKey: string) {
//   let lastIndex = 0
//   panes.value.forEach((pane, i) => {
//     if (pane.key === targetKey) {
//       lastIndex = i - 1
//     }
//   })
//   panes.value = panes.value.filter(pane => pane.key !== targetKey)
//   if (panes.value.length && activeKey.value === targetKey) {
//     if (lastIndex >= 0) {
//       activeKey.value = panes.value[lastIndex].key
//     }
//     else {
//       activeKey.value = panes.value[0].key
//     }
//   }
// }

// const onEdit = (targetKey: string) => {
//   remove(targetKey);
// };

const headerStyle: CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 50,
}

const contentStyle: CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
}

// const siderStyle: CSSProperties = {
//   textAlign: 'center',
//   lineHeight: '120px',
//   color: '#fff',
//   backgroundColor: '#3ba0e9',
// };

// const footerStyle: CSSProperties = {
//   textAlign: 'center',
//   color: '#fff',
//   backgroundColor: '#7dbcea',
// };
</script>

<template>
  <a-layout>
    <a-layout-header :style="headerStyle">
      Class Ref # : 15459 | Fiscal Year : 2025-2026 | Semester : 1st Semester |
      Section : I-EEd3 | Course : ITE 101 - Living in the IT Era
    </a-layout-header>
    <a-layout>
      <a-layout-sider>
        <ClassMenu />
      </a-layout-sider>
      <a-layout-content :style="contentStyle">
        <a-tabs v-model:active-key="activeKey" hide-add type="editable-card" class="m-4">
          <a-tab-pane v-for="pane in panes" :key="pane.key" :tab="pane.title" :closable="pane.closable">
            <Quizzes />
          </a-tab-pane>
        </a-tabs>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
