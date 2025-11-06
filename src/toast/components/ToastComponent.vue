<template>
  <div class="t-container">
    <div class="d-flex flex-column gap-1">
      <h1 class="m-0 p-0 fs-3 bold">{{ props.content.title }}</h1>
      <p class="m-0 p-0 text-white" v-html="props.content.body"></p>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps(["content"]);
</script>
<style>
.t-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}
</style>
