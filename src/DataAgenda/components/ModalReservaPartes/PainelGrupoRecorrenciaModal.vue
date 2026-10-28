<!--
========
Subcomponente do ModalReserva que exibe o alerta amarelo de edição em lote recorrente
ou o banner verde informando que a reserva foi desvinculada nesta sessão.
========
-->
<script setup lang="ts">
defineProps<{
    editandoEmGrupo: boolean;
    foiDesvinculadaNestaSessao: boolean;
    ehModoEdicao: boolean;
    datasGrupoFormatadas: { iso: string; texto: string; ehAtual: boolean }[];
    desvinculando: boolean;
    salvando: boolean;
}>();

defineEmits<{
    (e: 'solicitar-desvinculo'): void;
}>();
</script>

<template>
  <div class="painel-cuidado-grupo" v-if="editandoEmGrupo">
    <div class="cabecalho-cuidado-grupo">
      <span class="badge-alerta-grupo">Edição em Lote Recorrente ({{ datasGrupoFormatadas.length }} dias)</span>
    </div>

    <p class="descricao-cuidado-grupo">
      Por padrão, qualquer alteração de horário ou título feita aqui <strong>será replicada para todas as reservas deste grupo</strong>.
      Para mudar a data ou editar somente este dia sem afetar os outros, retire esta reserva do grupo primeiro.
    </p>

    <div class="lista-chips-grupo-edicao" v-if="datasGrupoFormatadas.length > 0">
      <span
        v-for="item in datasGrupoFormatadas"
        :key="item.iso"
        class="chip-data-edicao"
        :class="{ 'atual': item.ehAtual }"
      >
        {{ item.texto }}
      </span>
    </div>

    <button
      type="button"
      class="btn-desvincular-grupo"
      @click="$emit('solicitar-desvinculo')"
      :disabled="desvinculando || salvando"
    >
      {{ desvinculando ? 'Retirando do grupo...' : 'Retirar do grupo para editar separadamente' }}
    </button>
  </div>

  <div class="banner-desvinculada" v-else-if="ehModoEdicao && foiDesvinculadaNestaSessao">
    Esta reserva foi retirada do grupo de recorrência. As alterações abaixo afetarão somente este agendamento.
  </div>
</template>

<style scoped>
.painel-cuidado-grupo { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 8px; background: color-mix(in srgb, var(--bg-secondary) 90%, #f59e0b); border: 1px solid rgba(245, 158, 11, 0.45); flex-shrink: 0; }
.cabecalho-cuidado-grupo { display: flex; align-items: center; justify-content: space-between; }
.badge-alerta-grupo { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: #d97706; }
.descricao-cuidado-grupo { margin: 0; font-size: 12.5px; color: var(--text-primary); line-height: 1.45; }
.lista-chips-grupo-edicao { display: flex; flex-wrap: wrap; gap: 6px; max-height: 95px; overflow-y: auto; padding: 2px 0; }
.chip-data-edicao { font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 5px; background: var(--bg-primary); border: 1px solid var(--border-light); color: var(--text-primary); }
.chip-data-edicao.atual { background: var(--color-brand); color: var(--text-inverse); border-color: var(--color-brand); }
.btn-desvincular-grupo { align-self: flex-start; margin-top: 2px; background: var(--bg-primary); border: 1px solid #d97706; color: #d97706; font-weight: 700; font-size: 12.5px; padding: 7px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.btn-desvincular-grupo:hover:not(:disabled) { background: rgba(245, 158, 11, 0.14); }
.btn-desvincular-grupo:disabled { opacity: 0.5; cursor: not-allowed; }
.banner-desvinculada { padding: 10px 14px; border-radius: 8px; background: rgba(16, 185, 129, 0.12); border: 1px solid var(--color-success); color: var(--color-success); font-size: 12.5px; font-weight: 600; }
</style>