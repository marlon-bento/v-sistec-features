<template>
  <span v-if="use_ordering" @click="emit('toggle')" class="cursor-pointer">
    <component v-if="!props.orderings_state || props.orderings_state === 'none'" :is="icons.ordering.default" />
    <component v-else-if="props.orderings_state === 'decreasing'" :is="icons.ordering.decreasing" />
    <component v-else-if="props.orderings_state === 'increasing'" :is="icons.ordering.increasing" />
  </span>
</template>

<script setup lang="ts">
/* 
========
Componente interno de uso exclusivo do VDataTable para renderizar o ícone de ordenação.
========
*/
import { buildIcons } from '@/utils/svgFactory'
import { svgs } from '@/DatatableVue/style/svgs'
const icons = buildIcons(svgs)

const props = defineProps<{
  orderings_state?: 'none' | 'increasing' | 'decreasing';
  use_ordering?: boolean;
}>();

const emit = defineEmits<{
  toggle: [void];
}>();
</script>