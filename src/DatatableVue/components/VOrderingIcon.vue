<template>
  <span v-if="use_ordering" @click="emit('toggle')" class="cursor-pointer">
    <svg v-if="!props.orderings_state || props.orderings_state === 'none'" xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 8 4-4 4 4"></path>
      <path d="m11 16-4 4-4-4"></path>
      <path d="M7 4v16"></path>
      <path d="M15 8h6"></path>
      <path d="M15 16h6"></path>
      <path d="M13 12h8"></path>
    </svg>

    <svg v-else-if="props.orderings_state === 'decreasing'" xmlns="http://www.w3.org/2000/svg" width="16"
      height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="m3 16 4 4 4-4"></path>
      <path d="M7 20V4"></path>
      <path d="M11 4h10"></path>
      <path d="M11 8h7"></path>
      <path d="M11 12h4"></path>
    </svg>

    <svg v-else-if="props.orderings_state === 'increasing'" xmlns="http://www.w3.org/2000/svg" width="16"
      height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="m3 8 4-4 4 4"></path>
      <path d="M7 4v16"></path>
      <path d="M11 12h4"></path>
      <path d="M11 16h7"></path>
      <path d="M11 20h10"></path>
    </svg>
  </span>
</template>

<script setup lang="ts">
/* 
========
Componente interno de uso exclusivo do VDataTable para renderizar o ícone de ordenação.
========
*/
const props = defineProps<{
  orderings_state?: 'none' | 'increasing' | 'decreasing';
  use_ordering?: boolean;
}>();

const emit = defineEmits<{
  toggle: [void];
}>();
</script>