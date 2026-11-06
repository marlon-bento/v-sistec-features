<!--
========
Componente de card de métrica para o módulo DashboardComponents.
Exibe título, valor principal com alinhamento tabular, ícone em caixa temática suave,
variação opcional e tooltip informativo posicionado de forma segura no canto superior direito.
========
-->
<template>
  <div class="card card-sm card-metrica-analytics h-100">
    <div class="card-body d-flex flex-column justify-content-center position-relative">
      <div
        v-if="temTooltip"
        class="gatilho-tooltip-metrica"
        tabindex="0"
        aria-label="Mais informações sobre esta métrica"
      >
        <IconInfoCircle :size="18" stroke="1.8" />
        <div class="balao-tooltip-metrica" role="tooltip">
          <slot name="tooltip">
            {{ props.textoTooltip }}
          </slot>
        </div>
      </div>

      <div class="conteudo-card-metrica">
        <div
          class="icone-metrica-box flex-shrink-0"
          :style="estiloVariavelCor"
        >
          <slot name="icone">
            <component
              :is="props.icone"
              v-if="props.icone"
              :size="22"
              :stroke="2"
            />
            <span
              v-else-if="props.svg"
              class="svg-legado-wrapper d-inline-flex align-items-center justify-content-center"
              v-html="props.svg"
            ></span>
          </slot>
        </div>

        <div class="bloco-textos-metrica" :class="{ 'com-espaco-tooltip': temTooltip }">
          <div class="subheader text-secondary fw-semibold text-truncate mb-1" :title="props.titulo">
            {{ props.titulo }}
          </div>

          <div v-if="props.carregando" class="placeholder-glow">
            <span class="placeholder col-8 rounded-1"></span>
          </div>

          <div v-else class="d-flex align-items-baseline gap-2 flex-wrap">
            <div class="h2 mb-0 fw-bold numero-tabular valor-metrica text-truncate">
              {{ valorExibicao }}
            </div>

            <span
              v-if="props.variacao !== undefined && props.variacao !== ''"
              class="badge badge-variacao fw-semibold numero-tabular"
              :class="classeBadgeVariacao"
            >
              {{ props.variacao }}
            </span>
          </div>

          <div v-if="props.subtitulo" class="text-secondary small mt-1 text-truncate">
            {{ props.subtitulo }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, type Component } from 'vue';
import { IconInfoCircle } from '@tabler/icons-vue';
import type { CorCardMetrica } from '../types/cardMetrica';

const slots = useSlots();

// Propriedades declaradas diretamente para compatibilidade estrita com o vue-tsc
const props = withDefaults(defineProps<{
  titulo: string;
  valor?: string | number | null;
  subtitulo?: string;
  icone?: Component | Record<string, any> | null;
  svg?: string;
  cor?: CorCardMetrica;
  textoTooltip?: string;
  variacao?: string | number;
  sentidoVariacao?: 'alta' | 'baixa' | 'neutro';
  carregando?: boolean;
}>(), {
  valor: 0,
  subtitulo: '',
  icone: null,
  svg: '',
  cor: 'primary',
  textoTooltip: '',
  variacao: undefined,
  sentidoVariacao: 'neutro',
  carregando: false
});

// Indica se o ícone e o balão de ajuda devem ser renderizados
const temTooltip = computed(() => Boolean(props.textoTooltip || slots.tooltip));

// Formata o valor numérico ou textual garantindo retorno seguro quando vazio
const valorExibicao = computed(() => {
  if (props.valor === null || props.valor === undefined || props.valor === '') {
    return 0;
  }
  if (typeof props.valor === 'number') {
    return props.valor.toLocaleString('pt-BR');
  }
  return props.valor;
});

// Define a variável CSS com a cor semântica escolhida para o card
const estiloVariavelCor = computed<Record<string, string>>(() => ({
  '--cor-metrica-ativa': `var(--tblr-${props.cor}, var(--tblr-primary, #206bc4))`
}));

// Define as classes de cor para a pílula de variação percentual
const classeBadgeVariacao = computed(() => {
  if (props.sentidoVariacao === 'alta') return 'bg-green-lt text-green';
  if (props.sentidoVariacao === 'baixa') return 'bg-red-lt text-red';
  return 'bg-secondary-lt text-secondary';
});
</script>

<style scoped>
.card-metrica-analytics {
  border-radius: 10px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.card-metrica-analytics:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  border-color: color-mix(in srgb, var(--tblr-primary, #206bc4) 35%, var(--tblr-border-color, #e2e8f0));
}

.conteudo-card-metrica {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.bloco-textos-metrica {
  flex: 1 1 0%;
  min-width: 0;
}

.bloco-textos-metrica.com-espaco-tooltip .subheader {
  padding-right: 24px;
}

.icone-metrica-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--cor-metrica-ativa);
  background: color-mix(in srgb, var(--cor-metrica-ativa) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--cor-metrica-ativa) 24%, transparent);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.card-metrica-analytics:hover .icone-metrica-box {
  background: color-mix(in srgb, var(--cor-metrica-ativa) 20%, transparent);
}

.svg-legado-wrapper :deep(svg) {
  width: 22px;
  height: 22px;
  color: var(--cor-metrica-ativa) !important;
}

.svg-legado-wrapper :deep(.boxIconCor) {
  fill: var(--cor-metrica-ativa) !important;
}

.valor-metrica {
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.numero-tabular {
  font-variant-numeric: tabular-nums;
}

.badge-variacao {
  font-size: 0.72rem;
  padding: 0.2em 0.5em;
  border-radius: 6px;
}

.gatilho-tooltip-metrica {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--tblr-secondary, #64748b);
  padding: 3px;
  border-radius: 6px;
  transition: color 0.15s ease, background-color 0.15s ease;
  outline: none;
}

.gatilho-tooltip-metrica:hover,
.gatilho-tooltip-metrica:focus-visible {
  color: var(--tblr-primary, #206bc4);
  background: color-mix(in srgb, var(--tblr-primary, #206bc4) 12%, transparent);
}

.balao-tooltip-metrica {
  visibility: hidden;
  opacity: 0;
  transform: translateY(4px);
  width: 250px;
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  z-index: 1050;
  padding: 10px 13px;
  border-radius: 10px;
  font-size: 0.76rem;
  font-weight: 400;
  line-height: 1.45;
  text-align: left;
  color: var(--tblr-body-color, #f8fafc);
  background: color-mix(in srgb, var(--tblr-bg-surface, #1d273b) 94%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid color-mix(in srgb, var(--tblr-border-color, #ffffff) 18%, transparent);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.32);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
}

.gatilho-tooltip-metrica:hover .balao-tooltip-metrica,
.gatilho-tooltip-metrica:focus-visible .balao-tooltip-metrica {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}
</style>