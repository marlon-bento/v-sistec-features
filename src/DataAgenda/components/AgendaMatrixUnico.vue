<!--
========
Este arquivo representa a visualização em matriz exclusiva para um único recurso.
Ele identifica automaticamente a agenda vinculada ao recurso informado via propriedade,
sincroniza a busca, repassa a configuração de blocos da agenda, exibe na grade apenas o recurso especificado
e expõe a lista contendo o recurso atualmente em exibição.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { computed, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useSincronizarRecursoUnico } from '../composables/useGradeCompartilhada';
import AgendaMatrixBase from './AgendaMatrixBase.vue';

const props = defineProps({
    idRecurso: { type: [Number, String], required: true },
    usaInterceptador: { type: Boolean, default: false },
    tituloPadrao: { type: String, default: '' },
    ocultarTituloModal: { type: Boolean, default: false },
    configuracaoBlocos: { type: [Array, Object], default: null }
});

const api = inject('api-instance-agenda') as any;
defineEmits(['before-save']);

const { recursosDisponiveis } = useAgenda(api);

useSincronizarRecursoUnico(api, () => props.idRecurso);

const idsVisiveis = computed(() => (props.idRecurso ? [String(props.idRecurso)] : []));

const recursosEmExibicao = computed(() => {
    if (!props.idRecurso) return [];
    const encontrado = recursosDisponiveis.value.find(
        (r: any) => Number(r.id_recurso) === Number(props.idRecurso)
    );
    return encontrado ? [encontrado] : [];
});

defineExpose({ recursosEmExibicao });
</script>

<template>
  <AgendaMatrixBase
    :ids-recursos-visiveis="idsVisiveis"
    :usa-interceptador="props.usaInterceptador"
    :titulo-padrao="props.tituloPadrao"
    :ocultar-titulo-modal="props.ocultarTituloModal"
    :configuracao-blocos="props.configuracaoBlocos"
    mensagem-vazio="Recurso não encontrado na grade desta agenda."
    @before-save="$emit('before-save',$event)"
  >
    <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
      <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
    </template>
  </AgendaMatrixBase>
</template>