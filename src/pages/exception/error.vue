<script setup lang="ts">
const router = useRouter()
function back() {
  router.replace({
    path: '/',
  })
}
</script>

<template>
  <a-result status="404" title="404" sub-title="Sorry, the page you are currently visiting does not exist!">
    <template #extra>
      <a-button type="primary" @click="back">
        Return to home page
      </a-button>
    </template>
  </a-result>
</template>
