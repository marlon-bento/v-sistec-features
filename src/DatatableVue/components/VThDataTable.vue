<template>
  <th :class="class_all">
    <div :class="{ 'header-ordering': use_ordering }">

      <component v-if="hasCustomHeader" :is="col.colHeaderSlot"
        v-bind="{ col: props.col, locked: props.locked, OrderingComponent }"></component>

      <template v-else>
        <div class="d-flex justify-content-between align-items-center">
          <span>
            {{ props.header }}
          </span>

          <component v-if="col.colHeaderMidleSlot" :is="col.colHeaderMidleSlot"
            v-bind="{ col: props.col, locked: props.locked }"></component>

          <component :is="OrderingComponent" />
        </div>

      </template>

    </div>
  </th>
</template>

<script setup lang="ts">
import { computed, Comment, Fragment, Text, h } from 'vue';
import VOrderingIcon from './VOrderingIcon.vue';
const props = defineProps<{
  header: string;
  class_column: string;
  locked: boolean;
  use_ordering: boolean;
  orderings_state: 'none' | 'increasing' | 'decreasing';
  col: any;
}>();
const OrderingComponent = () => h(VOrderingIcon, {
  orderings_state: props.orderings_state,
  use_ordering: props.use_ordering,
  onToggle: () => emit('toggleOrderingState')
});
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