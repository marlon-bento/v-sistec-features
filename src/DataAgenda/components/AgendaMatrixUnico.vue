<!--
========
Este arquivo representa a visualização em matriz exclusiva para um único recurso.
Ele identifica automaticamente a agenda vinculada ao recurso informado via propriedade,
sincroniza a busca, repassa a configuração de blocos da agenda e exibe na grade apenas o recurso especificado.
========
-->
<script setup lang="ts">
import { computed, watch, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import AgendaMatrixBase from './AgendaMatrixBase.vue';

const props = defineProps({
    idRecurso: { type: [Number, String], required: true },
    usaInterceptador: { type: Boolean, default: false },
    tituloPadrao: { type: String, default: '' },
    ocultarTituloModal: { type: Boolean, default: false },
    configuracaoBlocos: { type: [Array, Object], default: null }
});

const api = inject('api-instance-agenda') as any;
const emit = defineEmits(['before-save']);

const { recursosDisponiveis, agendaSelecionada, recursoSelecionado } = useAgenda(api);

// Sincroniza a agenda selecionada e o recurso selecionado com base no idRecurso recebido via prop.
const sincronizarAgendaDoRecurso = () => {
    if (!props.idRecurso || recursosDisponiveis.value.length === 0) return;

    const recursoEncontrado = recursosDisponiveis.value.find(
        (r: any) => Number(r.id_recurso) === Number(props.idRecurso)
    );

    if (recursoEncontrado) {
        recursoSelecionado.value = Number(recursoEncontrado.id_recurso);
        if (recursoEncontrado.id_agenda && agendaSelecionada.value !== recursoEncontrado.id_agenda) {
            agendaSelecionada.value = recursoEncontrado.id_agenda;
        }
    }
};

watch([() => props.idRecurso, recursosDisponiveis], () => {
    sincronizarAgendaDoRecurso();
}, { immediate: true });

// Devolve a lista contendo exclusivamente o ID do recurso único em formato string para a base.
const idsVisiveis = computed(() => {
    if (!props.idRecurso) return [];
    return [String(props.idRecurso)];
});
</script>

<template>
  <AgendaMatrixBase
    :ids-recursos-visiveis="idsVisiveis"
    :usa-interceptador="props.usaInterceptador"
    :titulo-padrao="props.tituloPadrao"
    :ocultar-titulo-modal="props.ocultarTituloModal"
    :configuracao-blocos="props.configuracaoBlocos"
    mensagem-vazio="Recurso não encontrado na grade desta agenda."
    @before-save="$emit('before-save', $event)"
  >
    <template #campos-extras>
      <slot name="campos-extras"></slot>
    </template>
  </AgendaMatrixBase>
</template>