<!--
========
Este arquivo encapsula o componente visual do mini calendário mensal (agendinha lateral).
Ele isola todas as customizações de estilo sobre o vue-cal e as regras visuais de destaque de semana
e bloqueio de clique em dias inativos, recebendo apenas as datas por propriedades e emitindo a seleção.
========
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';
import { formatarDataIso } from '../../composables/useGradeCompartilhada';

type FormatoDataSimplesVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

const props = withDefaults(defineProps<{
  dataSelecionada: Date;
  dataVisao: Date;
  modoGradeSemanal?: boolean;
  datasDesabilitadas?: (Date | FormatoDataSimplesVueCal)[];
  datasVisiveisSemana?: Set<string> | string[];
}>(), {
  modoGradeSemanal: false,
  datasDesabilitadas: () => [],
  datasVisiveisSemana: () => []
});

const emit = defineEmits<{
  (e: 'update:dataSelecionada', valor: Date): void;
  (e: 'update:dataVisao', valor: Date): void;
}>();

// Referência interna da instância do VueCal para navegação direta até a data atual.
const calendarioMiniRef = ref<any>(null);

// Converte a lista de datas desabilitadas em um Set de strings ISO para busca rápida durante a renderização de cada célula.
const conjuntoDesabilitadas = computed(() =>
  new Set<string>(
    props.datasDesabilitadas.map(d => (d instanceof Date ? formatarDataIso(d) : String(d)))
  )
);

// Converte a coleção de datas visíveis da semana ativa em um Set para destaque visual na grade.
const conjuntoVisiveis = computed(() =>
  props.datasVisiveisSemana instanceof Set
    ? props.datasVisiveisSemana
    : new Set<string>(props.datasVisiveisSemana)
);

// Recebe o objeto bruto da célula do vue-cal e devolve a instância de Date correspondente.
const obterDataDaCelula = (cell: any): Date | null => {
  if (!cell) return null;
  if (cell instanceof Date) return cell;
  if (cell.start) return new Date(cell.start);
  return null;
};

// Recebe a célula do dia e devolve verdadeiro caso ela pertença a um dia de coluna inativa na semana.
const ehDiaBloqueadoNoMini = (cell: any): boolean => {
  const data = obterDataDaCelula(cell);
  if (!data || !props.modoGradeSemanal) return false;
  return conjuntoDesabilitadas.value.has(formatarDataIso(data));
};

// Recebe a célula do dia e devolve verdadeiro caso ela faça parte da semana atualmente aberta na tabela.
const ehDiaVisivelNaGrade = (cell: any): boolean => {
  const data = obterDataDaCelula(cell);
  if (!data || !props.modoGradeSemanal) return false;
  return conjuntoVisiveis.value.has(formatarDataIso(data));
};

// Recebe a célula clicada pelo usuário e emite a nova data caso o dia esteja liberado para seleção.
const selecionarCelula = (cell: any) => {
  if (ehDiaVisivelNaGrade(cell) || ehDiaBloqueadoNoMini(cell)) return;
  const novaData = obterDataDaCelula(cell);
  if (novaData) {
    emit('update:dataSelecionada', novaData);
    emit('update:dataVisao', novaData);
  }
};

// Posiciona a visualização do mini calendário de volta no mês atual.
const irParaHoje = () => {
  calendarioMiniRef.value?.view?.goToToday();
};

defineExpose({ irParaHoje });
</script>

<template>
  <div class="secao-mini-cal">
    <vue-cal
      ref="calendarioMiniRef"
      class="calendario-mini vuecal--blue-theme"
      :class="{ 'modo-mini-tabela-horario': props.modoGradeSemanal }"
      small
      active-view="month"
      :views="['month']"
      :time="false"
      hide-view-selector
      :click-to-navigate="false"
      locale="pt-br"
      :disable-days="props.modoGradeSemanal ? props.datasDesabilitadas : []"
      :selected-date="props.dataSelecionada"
      :view-date="props.dataVisao"
      @update:selected-date="emit('update:dataSelecionada', $event); emit('update:dataVisao', $event)"
    >
      <template #views-bar></template>
      <template #today-button></template>

      <template #cell-content="{ cell }">
        <div
          class="vuecal__cell-date"
          :class="{
            'dia-semana-visivel': ehDiaVisivelNaGrade(cell),
            'dia-coluna-inativa': ehDiaBloqueadoNoMini(cell)
          }"
          @mousedown.stop="(ehDiaVisivelNaGrade(cell) || ehDiaBloqueadoNoMini(cell)) ? $event.preventDefault() : null"
          @click.stop="selecionarCelula(cell)"
        >
          {{ cell.content }}
        </div>
      </template>
    </vue-cal>
  </div>
</template>

<style scoped>
.secao-mini-cal {
  width: 100%;
}

.calendario-mini {
  border: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

:deep(.calendario-mini .vuecal__header),
:deep(.calendario-mini .vuecal__title-bar) {
  background-color: var(--bg-primary) !important;
  border: none !important;
  padding-bottom: 5px;
}

:deep(.calendario-mini .vuecal__title),
:deep(.calendario-mini .vuecal__arrow) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-brand) !important;
  background: transparent !important;
}

:deep(.calendario-mini .vuecal__weekdays-headings) {
  background-color: var(--bg-primary) !important;
  border-bottom: 1px solid var(--border-light) !important;
}

:deep(.calendario-mini .vuecal__heading),
:deep(.calendario-mini .vuecal__weekday),
:deep(.calendario-mini .vuecal__weekday-name),
:deep(.calendario-mini .vuecal__heading *) {
  background-color: var(--bg-primary) !important;
  color: var(--text-secondary) !important;
  font-weight: 600 !important;
  border: none !important;
  padding-bottom: 4px;
}

:deep(.calendario-mini .vuecal__cell) {
  border: none !important;
  background-color: transparent !important;
  height: 32px !important;
  min-height: 32px !important;
  aspect-ratio: auto !important;
}

:deep(.calendario-mini .vuecal__cell::before) {
  display: none !important;
  content: none !important;
}

:deep(.calendario-mini .vuecal__cell-content) {
  height: 32px !important;
  min-height: 32px !important;
  padding: 0 !important;
  margin: 0 !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
}

:deep(.calendario-mini .vuecal__cell-date) {
  width: 26px !important;
  height: 26px !important;
  font-size: 12px !important;
  line-height: 26px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 auto !important;
  border-radius: 50% !important;
  border: 2px solid transparent !important;
  box-sizing: border-box !important;
  transition: all 0.2s ease;
  cursor: pointer;
  background-color: transparent !important;
  color: var(--text-primary);
}

:deep(.calendario-mini .vuecal__cell--selected),
:deep(.calendario-mini .vuecal__cell--today) {
  background-color: transparent !important;
}

:deep(.calendario-mini:not(.modo-mini-tabela-horario) .vuecal__cell--selected .vuecal__cell-date) {
  background-color: var(--color-brand) !important;
  color: var(--text-inverse) !important;
  border-color: var(--color-brand) !important;
}

:deep(.calendario-mini .vuecal__cell--today:not(.vuecal__cell--selected) .vuecal__cell-date:not(.dia-semana-visivel)) {
  background-color: var(--color-brand-light) !important;
  border-color: transparent !important;
  color: var(--color-brand) !important;
}

:deep(.vuecal__body) {
  padding: 0;
  gap: 0;
  margin: 0;
}

:deep(.calendario-mini .vuecal__views-bar) {
  display: none !important;
}

:deep(.calendario-mini .vuecal__nav--next),
:deep(.calendario-mini .vuecal__nav--prev) {
  color: var(--text-primary) !important;
}

:deep(.calendario-mini .vuecal__body) {
  height: 0% !important;
}

:deep(.calendario-mini .vuecal__scrollable-wrap) {
  background-color: transparent !important;
}

:deep(.calendario-mini.modo-mini-tabela-horario .vuecal__cell--disabled) {
  pointer-events: none !important;
  cursor: not-allowed !important;
}

:deep(.calendario-mini.modo-mini-tabela-horario .vuecal__cell-date.dia-coluna-inativa) {
  opacity: 0.22 !important;
  color: var(--text-secondary) !important;
  background-color: transparent !important;
  border-color: transparent !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  text-decoration: line-through;
}

:deep(.calendario-mini.modo-mini-tabela-horario .vuecal__cell-date.dia-semana-visivel) {
  background-color: var(--color-brand) !important;
  color: var(--text-inverse) !important;
  border-color: var(--color-brand) !important;
  font-weight: 700 !important;
  width: 92% !important;
  border-radius: 6px !important;
  cursor: default !important;
  box-shadow: var(--shadow-sm);
}
</style>