<!--
========
Este arquivo encapsula o componente visual do calendário principal baseado no vue-cal.
Ele concentra toda a estilização customizada, renderização do cabeçalho dos dias da semana e
configuração de expediente, recebendo a lista de eventos já pronta e emitindo as interações do usuário.
========
-->
<script setup lang="ts">
import { ref, computed } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';

type FormatoDataSimplesVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

const props = defineProps<{
  eventos: any[];
  visaoAtiva: string;
  dataSelecionada: Date;
  dataVisao: Date;
  minutosInicio: number;
  minutosFim: number;
  datasDesabilitadas: (Date | FormatoDataSimplesVueCal)[];
}>();

const emit = defineEmits<{
  (e: 'update:visaoAtiva', valor: string): void;
  (e: 'update:dataSelecionada', valor: Date): void;
  (e: 'update:dataVisao', valor: Date): void;
  (e: 'pronto', payload: any): void;
  (e: 'mudar-periodo', payload: any): void;
  (e: 'criar-evento', payload: any): void;
  (e: 'clicar-evento', payload: any): void;
}>();

// Referência interna para acionar métodos de navegação da instância do VueCal.
const calendarioRef = ref<any>(null);

// Calcula os intervalos fora do expediente para aplicar o bloqueio visual nativo em todos os dias da semana.
const horasBloqueadasNativas = computed(() => {
  const bloqueios = [
    { from: 0, to: props.minutosInicio, allowEvents: false, class: 'fora-do-expediente' },
    { from: props.minutosFim, to: 24 * 60, allowEvents: false, class: 'fora-do-expediente' }
  ];
  return { mon: bloqueios, tue: bloqueios, wed: bloqueios, thu: bloqueios, fri: bloqueios, sat: bloqueios, sun: bloqueios };
});

// Verifica se a data do cabeçalho corresponde ao dia atualmente selecionado pelo usuário.
const ehDataSelecionada = (data: any) => {
  if (!props.dataSelecionada || !data) return false;
  return new Date(data).toDateString() === new Date(props.dataSelecionada).toDateString();
};

// Recebe um objeto Date e devolve a abreviação de três letras do dia da semana.
const obterNomeDiaCurto = (data: Date) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];

// Seleciona o dia clicado no cabeçalho superior da coluna.
const selecionarDiaCabecalho = (date: Date) => {
  emit('update:dataSelecionada', date);
  emit('update:dataVisao', date);
};

defineExpose({
  irParaHoje: () => calendarioRef.value?.view?.goToToday(),
  periodoAnterior: () => calendarioRef.value?.view?.previous(),
  periodoProximo: () => calendarioRef.value?.view?.next(),
  mudarVisao: (v: string) => {
    emit('update:visaoAtiva', v);
    calendarioRef.value?.view?.switch(v);
  }
});
</script>

<template>
  <vue-cal
    ref="calendarioRef"
    class="calendario-principal vuecal--blue-theme"
    :events="props.eventos"
    :active-view="props.visaoAtiva"
    :selected-date="props.dataSelecionada"
    :view-date="props.dataVisao"
    @update:active-view="emit('update:visaoAtiva', $event)"
    @update:selected-date="emit('update:dataSelecionada', $event)"
    @update:view-date="emit('update:dataVisao', $event)"
    :views="['day', 'week']"
    :hide-view-selector="true"
    :hide-title-bar="true"
    :click-to-navigate="false"
    locale="pt-br"
    :time-from="props.minutosInicio"
    :time-to="props.minutosFim"
    :disable-days="props.datasDesabilitadas"
    :special-hours="horasBloqueadasNativas"
    :snap-to-interval="15"
    :start-week-on-sunday="true"
    :editable-events="{ drag: true, resize: true, delete: true, create: true }"
    @ready="emit('pronto', $event)"
    @view-change="emit('mudar-periodo', $event)"
    @event-create="emit('criar-evento', $event)"
    @event-click="emit('clicar-evento', $event)"
  >
    <template #weekday-heading="{ date }">
      <div class="cabecalho-dia-customizado" @click="selecionarDiaCabecalho(date)">
        <span class="nome-dia">{{ obterNomeDiaCurto(date) }}</span>
        <span
          class="numero-dia"
          :class="{
            'dia-hoje': date.toDateString() === new Date().toDateString(),
            'dia-selecionado': ehDataSelecionada(date)
          }"
        >
          {{ date.getDate() }}
        </span>
      </div>
    </template>
  </vue-cal>
</template>

<style scoped>
.calendario-principal {
  --vuecal-weekday-bar-size: 75px !important;
  background: var(--bg-primary);
  flex-grow: 1;
  height: 100%;
  overflow: hidden;
  border-radius: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(.vuecal__header),
:deep(.vuecal__title-bar) {
  display: none !important;
}

:deep(.vuecal__weekdays-headings) {
  border-bottom: 1px solid var(--border-light);
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

:deep(.vuecal__weekday) {
  background-color: var(--bg-primary);
  justify-content: center;
  border-right: 1px solid var(--border-light);
  padding: 0;
}

:deep(.vuecal__weekday:last-child) {
  border-right: none;
}

.cabecalho-dia-customizado {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 8px 0;
  cursor: pointer;
}

.nome-dia {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 2px;
  font-weight: 500;
}

.numero-dia {
  font-size: 22px;
  color: var(--text-primary);
  font-weight: 400;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.numero-dia.dia-hoje {
  background-color: var(--bg-hover);
  border-color: transparent;
  color: var(--color-brand);
}

.numero-dia.dia-hoje.dia-selecionado {
  background-color: var(--color-brand-light);
  color: var(--color-brand);
}

.numero-dia:not(.dia-hoje).dia-selecionado {
  background-color: var(--bg-secondary);
  border-color: transparent;
  color: var(--text-primary);
}

:deep(.vuecal__scrollable-wrap),
:deep(.vuecal__scrollable) {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

:deep(.vuecal__cell--disabled) {
  background-color: var(--bg-secondary) !important;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.02) 10px, rgba(0, 0, 0, 0.02) 20px) !important;
  cursor: not-allowed !important;
  pointer-events: none;
  border: 1px solid var(--border-light);
}

:deep(.vuecal__special-hours.fora-do-expediente) {
  background-color: var(--bg-secondary);
  background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.02) 10px, rgba(0, 0, 0, 0.02) 20px);
  pointer-events: none;
}

:deep(.vuecal__cell--selected) {
  background-color: var(--color-brand-light) !important;
}

:deep(.vuecal__cell--today) {
  background-color: var(--bg-hover) !important;
}

:deep(.vuecal__event) {
  background-color: var(--color-brand) !important;
  color: var(--text-inverse) !important;
  border: 1px solid var(--border-focus) !important;
  border-radius: 4px;
  box-shadow: var(--shadow-sm);
  padding: 4px;
  transition: all 0.2s ease;
  cursor: pointer !important;
}

:deep(.vuecal__event:hover),
:deep(.vuecal__event--focus) {
  box-shadow: var(--shadow-float);
  filter: brightness(1.1);
}

:deep(.vuecal__event.reserva-minha) {
  background-color: var(--color-success) !important;
  border-color: var(--color-success) !important;
  color: var(--text-inverse) !important;
}

:deep(.vuecal__event.reserva-bloqueada) {
  background-color: var(--border-editor) !important;
  border-color: var(--border-light) !important;
  color: var(--text-primary) !important;
  font-weight: bold;
  opacity: 0.75;
  cursor: pointer !important;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.1) 10px, rgba(0, 0, 0, 0.1) 20px) !important;
}

:deep(.vuecal__time-column) {
  background-color: var(--bg-primary) !important;
  border-right: 1px solid var(--border-editor) !important;
}

:deep(.vuecal__time-cell) {
  color: var(--text-secondary) !important;
}

:deep(.vuecal__time-cell-line::before) {
  border-color: var(--border-editor) !important;
}

:deep(.vuecal__cell) {
  background-color: transparent !important;
  border-right: 1px solid var(--border-editor) !important;
}

:deep(.vuecal__now-line),
:deep(.vuecal__now-line span) {
  color: var(--text-primary) !important;
}

:deep(.vuecal__cell::before) {
  border-color: var(--border-light) !important;
}
</style>