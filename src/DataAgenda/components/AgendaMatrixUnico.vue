<!--
========
Este arquivo representa a visualização em matriz exclusiva para um único recurso.
Ele lê o idRecursoUnico diretamente da configuração global do useAgenda, sincroniza a agenda vinculada,
exibe na grade apenas o recurso especificado e expõe a lista contendo o recurso atualmente em exibição.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { computed } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useSincronizarRecursoUnico } from '../composables/useGradeCompartilhada';
import AgendaMatrixBase from './AgendaMatrixBase.vue';

const { configEntrada, recursosDisponiveis } = useAgenda();

useSincronizarRecursoUnico();

const idsVisiveis = computed(() =>
    configEntrada.idRecursoUnico ? [String(configEntrada.idRecursoUnico)] : []
);

const recursosEmExibicao = computed(() => {
    if (!configEntrada.idRecursoUnico) return [];
    const encontrado = recursosDisponiveis.value.find(
        (r: any) => Number(r.id_recurso) === Number(configEntrada.idRecursoUnico)
    );
    return encontrado ? [encontrado] : [];
});

defineExpose({ recursosEmExibicao });
</script>

<template>
  <AgendaMatrixBase
    :ids-recursos-visiveis="idsVisiveis"
    mensagem-vazio="Recurso não encontrado na grade desta agenda."
  >
    <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
      <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
    </template>
  </AgendaMatrixBase>
</template>