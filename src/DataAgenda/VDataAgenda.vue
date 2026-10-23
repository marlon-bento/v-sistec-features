<!--
========
O layout raiz que orquestra a interface com cabeçalhos modulares separados.
Suporta os modos 'calendario', 'tabela' (matriz horizontal) e 'tabela-horario' (grade vertical de horários por turno).
Repassa as configurações de usuário, layout, recurso único opcional, blocos por agenda e o cliente HTTP para os filhos,
além de destacar a semana operacional ativa, bloquear dias inativos no minicalendário lateral e expor a lista de
recursos atualmente em exibição no modelo ativo.
========
-->
<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';
import { useAgenda } from './composables/useAgenda';
import { calcularDataInicioSemana, formatarDataIso } from './composables/useGradeCompartilhada';
import AgendaVueCal from './components/AgendaVueCal.vue';
import AgendaMatrix from './components/AgendaMatrix.vue';
import AgendaMatrixUnico from './components/AgendaMatrixUnico.vue';
import AgendaTabelaHorario from './components/AgendaTabelaHorario.vue';
import HeaderCalendario from './components/HeaderCalendario.vue';
import HeaderTabela from './components/HeaderTabela.vue';

const props = withDefaults(defineProps<{
  modoLayout?: 'calendario' | 'tabela' | 'tabela-horario',
  idRecursoUnico?: number | string | null,
  usaInterceptador?: boolean,
  usuarioLogado?: string,
  tituloPadrao?: string,
  ocultarTituloModal?: boolean,
  configuracaoBlocos?: any,
  fetch: any,
}>(), {
  modoLayout: 'calendario',
  idRecursoUnico: null,
  usaInterceptador: false,
  usuarioLogado: '',
  tituloPadrao: '',
  ocultarTituloModal: false,
  configuracaoBlocos: null
});

provide('api-instance-agenda', props.fetch);
defineEmits(['before-save']);

const {
  dataSelecionada,
  dataVisao,
  agendasDisponiveis,
  agendaSelecionada,
  datasDesabilitadas,
  carregarRecursosEAgendas
} = useAgenda(props.fetch);

const menuAberto = ref(true);
const calendarioMiniRef = ref<any>(null);
const modeloAtivoRef = ref<any>(null);

const componenteModeloAtivo = computed(() => {
  if (props.modoLayout === 'calendario') return AgendaVueCal;
  if (props.modoLayout === 'tabela-horario') return AgendaTabelaHorario;
  if (props.modoLayout === 'tabela' && props.idRecursoUnico) return AgendaMatrixUnico;
  return AgendaMatrix;
});

const propriedadesModeloAtivo = computed(() => {
  const base = {
    usaInterceptador: props.usaInterceptador,
    tituloPadrao: props.tituloPadrao,
    ocultarTituloModal: props.ocultarTituloModal
  };

  if (props.modoLayout === 'calendario') {
    return { ...base, usuarioLogado: props.usuarioLogado };
  }
  if (props.modoLayout === 'tabela-horario') {
    return { ...base, idRecursoUnico: props.idRecursoUnico, configuracaoBlocos: props.configuracaoBlocos };
  }
  if (props.modoLayout === 'tabela' && props.idRecursoUnico) {
    return { ...base, idRecurso: props.idRecursoUnico, configuracaoBlocos: props.configuracaoBlocos };
  }
  return { ...base, configuracaoBlocos: props.configuracaoBlocos };
});

const recursosEmExibicao = computed(() => modeloAtivoRef.value?.recursosEmExibicao ?? []);

defineExpose({ recursosEmExibicao });

onMounted(() => { carregarRecursosEAgendas(); });

const obterDataDaCelula = (cell: any): Date | null => {
  if (!cell) return null;
  if (cell instanceof Date) return cell;
  if (cell.start) return new Date(cell.start);
  return null;
};

const conjuntoDatasDesabilitadas = computed(() => new Set<string>(datasDesabilitadas.value));

const datasVisiveisNaSemana = computed(() => {
  const visiveis = new Set<string>();
  if (props.modoLayout !== 'tabela-horario' || !dataSelecionada.value || !agendaSelecionada.value) {
    return visiveis;
  }

  const agendaObj = agendasDisponiveis.value.find(
    (a: any) => Number(a.id_agenda) === Number(agendaSelecionada.value)
  );
  if (!agendaObj?.detalhes) return visiveis;

  const inicioSemana = calcularDataInicioSemana(
    dataSelecionada.value,
    Number(agendaObj.detalhes.dia_inicio_semana_agenda ?? 0)
  );
  const diasVisiveis = Number(agendaObj.detalhes.dias_visiveis_agenda ?? 6);

  for (let i = 0; i < diasVisiveis; i++) {
    const diaCorrente = new Date(inicioSemana);
    diaCorrente.setDate(inicioSemana.getDate() + i);
    visiveis.add(formatarDataIso(diaCorrente));
  }

  return visiveis;
});

const ehDiaBloqueadoNoMini = (cell: any): boolean => {
  const data = obterDataDaCelula(cell);
  if (!data || props.modoLayout !== 'tabela-horario') return false;
  return conjuntoDatasDesabilitadas.value.has(formatarDataIso(data));
};

const ehDiaVisivelNaGrade = (cell: any): boolean => {
  const data = obterDataDaCelula(cell);
  if (!data || props.modoLayout !== 'tabela-horario') return false;
  return datasVisiveisNaSemana.value.has(formatarDataIso(data));
};

const alternarMenu = () => { menuAberto.value = !menuAberto.value; };

const irParaHoje = () => {
  const hoje = new Date();
  dataSelecionada.value = hoje;
  dataVisao.value = hoje;
  if (props.modoLayout === 'calendario') modeloAtivoRef.value?.irParaHoje?.();
  if (calendarioMiniRef.value) calendarioMiniRef.value.view.goToToday();
};

const mudarVisao = (novaVisao: string) => {
  modeloAtivoRef.value?.mudarVisao?.(novaVisao);
};
</script>

<template>
  <div>
    <div class="painel-agenda-unificado">
      <header class="painel-header-topo">
        <HeaderCalendario
          v-if="props.modoLayout === 'calendario'"
          :alternarMenu="alternarMenu"
          :irParaHoje="irParaHoje"
          :mudarVisao="mudarVisao"
        />

        <HeaderTabela
          v-else
          :alternarMenu="alternarMenu"
          :irParaHoje="irParaHoje"
          :ocultarSeletorAgenda="Boolean(props.idRecursoUnico)"
        />
      </header>

      <div class="corpo-principal">
        <aside class="barra-lateral" :class="{ 'oculta': !menuAberto }">
          <div class="conteudo-lateral-fixo">
            <div class="secao-mini-cal">
              <vue-cal
                ref="calendarioMiniRef"
                class="calendario-mini vuecal--blue-theme"
                :class="{ 'modo-mini-tabela-horario': props.modoLayout === 'tabela-horario' }"
                small
                active-view="month"
                :views="['month']"
                :time="false"
                hide-view-selector
                :click-to-navigate="false"
                locale="pt-br"
                :disable-days="props.modoLayout === 'tabela-horario' ? datasDesabilitadas : []"
                v-model:selected-date="dataSelecionada"
                :view-date="dataVisao"
                @update:selected-date="dataVisao = $event"
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
                    @mousedown.stop="
                      (ehDiaVisivelNaGrade(cell) || ehDiaBloqueadoNoMini(cell))
                        ? $event.preventDefault()
                        : null
                    "
                    @click.stop="
                      (!ehDiaVisivelNaGrade(cell) && !ehDiaBloqueadoNoMini(cell))
                        ? (dataSelecionada = obterDataDaCelula(cell) || dataSelecionada, dataVisao = obterDataDaCelula(cell) || dataVisao)
                        : null
                    "
                  >
                    {{ cell.content }}
                  </div>
                </template>
              </vue-cal>
            </div>
          </div>
        </aside>

        <main class="area-calendario">
          <component
            :is="componenteModeloAtivo"
            ref="modeloAtivoRef"
            v-bind="propriedadesModeloAtivo"
            @before-save="$emit('before-save', $event)"
          >
            <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
              <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
            </template>
          </component>
        </main>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use '../assets/scss/main.scss';
</style>

<style scoped>
.painel-agenda-unificado { background: var(--bg-primary); border-radius: 16px; box-shadow: var(--shadow-float); border: 1px solid var(--border-light); flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
.painel-header-topo { height: 60px; background-color: var(--bg-primary); border-bottom: 1px solid var(--border-light); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
.corpo-principal { display: flex; flex-grow: 1; overflow: hidden; }
.barra-lateral { width: 300px; background-color: var(--bg-primary); border-right: 1px solid var(--border-light); transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s; overflow: hidden; flex-shrink: 0; }
.barra-lateral.oculta { width: 0; border-right: none; opacity: 0; }
.conteudo-lateral-fixo { width: 300px; padding: 15px; }
.secao-mini-cal { width: 100%; }
.area-calendario { flex-grow: 1; overflow: hidden; background-color: var(--bg-primary); display: flex; flex-direction: column; }
.calendario-mini { border: none !important; box-shadow: none !important; background-color: transparent !important; }
:deep(.calendario-mini .vuecal__header), :deep(.calendario-mini .vuecal__title-bar) { background-color: var(--bg-primary) !important; border: none !important; padding-bottom: 5px; }
:deep(.calendario-mini .vuecal__title), :deep(.calendario-mini .vuecal__arrow) { font-size: 1rem; font-weight: 600; color: var(--color-brand) !important; background: transparent !important; }
:deep(.calendario-mini .vuecal__weekdays-headings) { background-color: var(--bg-primary) !important; border-bottom: 1px solid var(--border-light) !important; }
:deep(.calendario-mini .vuecal__heading), :deep(.calendario-mini .vuecal__weekday), :deep(.calendario-mini .vuecal__weekday-name), :deep(.calendario-mini .vuecal__heading *) { background-color: var(--bg-primary) !important; color: var(--text-secondary) !important; font-weight: 600 !important; border: none !important; padding-bottom: 4px; }
:deep(.calendario-mini .vuecal__cell) { border: none !important; background-color: transparent !important; height: 32px !important; min-height: 32px !important; aspect-ratio: auto !important; }
:deep(.calendario-mini .vuecal__cell::before) { display: none !important; content: none !important; }
:deep(.calendario-mini .vuecal__cell-content) { height: 32px !important; min-height: 32px !important; padding: 0 !important; margin: 0 !important; justify-content: center !important; align-items: center !important; width: 100% !important; }
:deep(.calendario-mini .vuecal__cell-date) { width: 26px !important; height: 26px !important; font-size: 12px !important; line-height: 26px !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 0 auto !important; border-radius: 50% !important; border: 2px solid transparent !important; box-sizing: border-box !important; transition: all 0.2s ease; cursor: pointer; background-color: transparent !important; color: var(--text-primary); }
:deep(.calendario-mini .vuecal__cell--selected), :deep(.calendario-mini .vuecal__cell--today) { background-color: transparent !important; }
:deep(.calendario-mini:not(.modo-mini-tabela-horario) .vuecal__cell--selected .vuecal__cell-date) { background-color: var(--color-brand) !important; color: var(--text-inverse) !important; border-color: var(--color-brand) !important; }
:deep(.calendario-mini .vuecal__cell--today:not(.vuecal__cell--selected) .vuecal__cell-date:not(.dia-semana-visivel)) { background-color: var(--color-brand-light) !important; border-color: transparent !important; color: var(--color-brand) !important; }
:deep(.vuecal__body) { padding: 0; gap: 0; margin: 0; }
:deep(.calendario-mini .vuecal__views-bar) { display: none !important; }
:deep(.calendario-mini .vuecal__nav--next), :deep(.calendario-mini .vuecal__nav--prev) { color: var(--text-primary) !important; }
:deep(.calendario-mini .vuecal__body) { height: 0% !important; }
:deep(.calendario-mini .vuecal__scrollable-wrap) { background-color: transparent !important; }
:deep(.calendario-mini.modo-mini-tabela-horario .vuecal__cell--disabled) { pointer-events: none !important; cursor: not-allowed !important; }
:deep(.calendario-mini.modo-mini-tabela-horario .vuecal__cell-date.dia-coluna-inativa) { opacity: 0.22 !important; color: var(--text-secondary) !important; background-color: transparent !important; border-color: transparent !important; cursor: not-allowed !important; pointer-events: none !important; text-decoration: line-through; }
:deep(.calendario-mini.modo-mini-tabela-horario .vuecal__cell-date.dia-semana-visivel) { background-color: var(--color-brand) !important; color: var(--text-inverse) !important; border-color: var(--color-brand) !important; font-weight: 700 !important; width: 92% !important; border-radius: 6px !important; cursor: default !important; box-shadow: var(--shadow-sm); }
</style>