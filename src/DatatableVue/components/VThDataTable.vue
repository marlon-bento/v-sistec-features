<template>
  <th :class="class_all">
    <div :class="{ 'header-ordering': use_ordering }">
      
      <component
        v-if="hasCustomHeader"
        :is="col.colHeaderSlot"
        v-bind="{ col: props.col, locked: props.locked }"
      ></component>
      
      <template v-else>
        <span>
          {{ props.header }}
        </span>

        <component
          v-if="col.colHeaderMidleSlot"
          :is="col.colHeaderMidleSlot"
          v-bind="{ col: props.col, locked: props.locked }"
        ></component>

        <span v-if="use_ordering" @click="emit('toggleOrderingState')" class="ms-2 cursor-pointer">
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

    </div>
  </th>
</template>

<script setup lang="ts">
import { computed, Comment, Fragment, Text } from 'vue';

const props = defineProps<{
  header: string;
  class_column: string;
  locked: boolean;
  use_ordering: boolean;
  orderings_state: 'none' | 'increasing' | 'decreasing';
  col: any;
}>();

const class_all = computed(() => {
  return {
    'header-draggable': !props.locked,
    'header-locked': props.locked,
    [props.class_column]: true,
  }
})

const emit = defineEmits<{
  toggleOrderingState: [void];
}>();

// Função robusta para verificar se todos os nós gerados são apenas comentários (v-if false)
// para evitar falsos positivos, também verifica se são nós de texto vazios ou apenas espaços em branco, e trata recursivamente fragmentos
// quando isso for vazio significa que não tem nada no slot então ele mostra a versão padrão do header
// se tiver algo ele sobrescreve o header padrão
const isEmptySlot = (vnodes: any[]): boolean => {
  if (!vnodes || vnodes.length === 0) return true;
  return vnodes.every(vnode => {
    if (vnode.type === Comment) return true;
    if (vnode.type === Text && typeof vnode.children === 'string' && !vnode.children.trim()) return true;
    if (vnode.type === Fragment || vnode.type === Symbol.for('v-fgt') || String(vnode.type) === 'Symbol(Fragment)') {
      return isEmptySlot(vnode.children as any[]);
    }
    return false;
  });
};

const hasCustomHeader = computed(() => {
  if (!props.col || !props.col.colHeaderSlot) return false;
  // Executa a função do slot original e analisa a árvore
  const vnodes = props.col.colHeaderSlot({ col: props.col, locked: props.locked });
  return !isEmptySlot(vnodes);
});
</script>
<style scoped></style>