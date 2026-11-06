<!--
========
Componente visual do card flutuante (tooltip) do mapa analítico.
Exibe o intervalo de datas, o nome do país com sua respectiva bandeira
e a contagem da métrica selecionada com acabamento translúcido moderno.
========
-->
<template>
  <div class="card card-tooltip-mapa">
    <div class="card-body p-3">
      <div class="text-secondary small fw-medium text-nowrap mb-1">
        {{ intervaloFormatado }}
      </div>
      <div class="subheader text-uppercase fw-bold mb-2 opacity-75" style="font-size: 0.68rem;">
        {{ rotuloMetrica }}
      </div>
      <div class="d-flex gap-3 align-items-center justify-content-between pt-1 border-top border-secondary-subtle">
        <div class="d-flex gap-2 align-items-center">
          <FlagIcon
            v-if="codigoBandeira"
            :key="codigoBandeira"
            :code="codigoBandeira as any"
            size="18"
            class="rounded-1 shadow-xs"
          />
          <span class="text-nowrap fw-semibold">{{ dados.pais }}</span>
        </div>
        <span class="badge bg-primary-lt fw-bold fs-5 numero-tabular">
          {{ Number(dados.usuariosAtivos).toLocaleString('pt-BR') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FlagIcon from 'vue3-flag-icons';
import 'vue3-flag-icons/styles';
import type { DadosTooltipMapa } from '../types/map';

// Propriedades de entrada com os dados reativos do país ativo e o título da métrica
const props = withDefaults(defineProps<{
  dados: DadosTooltipMapa;
  rotuloMetrica?: string;
}>(), {
  rotuloMetrica: 'Usuários ativos'
});

// Código do país normalizado em letras minúsculas para compatibilidade com o vue3-flag-icons
const codigoBandeira = computed(() => {
  if (!props.dados.codigo || props.dados.codigo.startsWith('_')) {
    return '';
  }
  return String(props.dados.codigo).trim().toLowerCase();
});

// Recebe o identificador do período e a data base e devolve a string do intervalo formatado em português
function formatarIntervalo(periodo: string, dataBase = new Date()): string {
  const nomesMes = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  const formatarData = (data: Date) => `${data.getDate()} de ${nomesMes[data.getMonth()]}`;

  let inicio = new Date(dataBase);
  let fim = new Date(dataBase);

  const diasAtras: Record<string, number> = {
    '365daysAgo': 365,
    '90daysAgo': 90,
    '30daysAgo': 30,
    '14daysAgo': 14,
    '7daysAgo': 7
  };

  if (periodo === 'lastYear') {
    const anoAnterior = dataBase.getFullYear() - 1;
    inicio = new Date(anoAnterior, 0, 1);
    fim = new Date(anoAnterior, 11, 31);
  } else if (diasAtras[periodo]) {
    inicio.setDate(inicio.getDate() - diasAtras[periodo]);
  }

  if (inicio.getFullYear() === fim.getFullYear()) {
    return `${formatarData(inicio)} – ${formatarData(fim)} de ${fim.getFullYear()}`;
  }
  return `${formatarData(inicio)} de ${inicio.getFullYear()} – ${formatarData(fim)} de ${fim.getFullYear()}`;
}

// Intervalo de datas pronto para exibição no cabeçalho do tooltip
const intervaloFormatado = computed(() => formatarIntervalo(props.dados.periodo));
</script>

<style scoped>
.card-tooltip-mapa {
  min-width: 215px;
  pointer-events: none;
  background: color-mix(in srgb, var(--tblr-bg-surface, #1d273b) 92%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid color-mix(in srgb, var(--tblr-border-color, #ffffff) 14%, transparent);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.numero-tabular {
  font-variant-numeric: tabular-nums;
}
</style>