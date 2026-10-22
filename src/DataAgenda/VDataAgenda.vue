<!--
========
O layout raiz que orquestra a interface com cabeçalhos modulares separados.
Suporta os modos 'calendario', 'tabela' (matriz horizontal) e 'tabela-horario' (grade vertical de horários por turno).
Repassa as configurações de usuário, layout, recurso único opcional, blocos por agenda e o cliente HTTP para os filhos,
além de destacar a semana operacional ativa e bloquear dias inativos no minicalendário lateral.
========
-->
<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';
import { useAgenda } from './composables/useAgenda.ts';
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

const emit = defineEmits(['before-save']);

// Armazena as referências e funções do composable de agenda para manipulação global.
const {
    dataSelecionada,
    dataVisao,
    agendasDisponiveis,
    agendaSelecionada,
    datasDesabilitadas,
    carregarRecursosEAgendas
} = useAgenda(props.fetch);

// Controla o estado de abertura da barra lateral (menu) contendo o minicalendário.
const menuAberto = ref(true);

// Armazena a referência da instância do componente vue-cal em sua versão miniatura.
const calendarioMiniRef = ref<any>(null);

// Armazena a referência da instância principal do componente AgendaVueCal.
const agendaVueCalRef = ref<any>(null);

// Executa o carregamento inicial de recursos ao montar o componente na tela.
onMounted(() => { carregarRecursosEAgendas(); });

// Extrai de forma segura o objeto de data embutido na célula customizada do vue-cal.
const obterDataDaCelula = (cell: any): Date | null => {
    if (!cell) return null;
    if (cell instanceof Date) return cell;
    if (cell.start) return new Date(cell.start);
    return null;
};

// Recebe um objeto Date e devolve a string formatada em YYYY-MM-DD local.
const formatarDataIsoCurta = (data: Date): string => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// Devolve um Set para consulta rápida contendo todas as datas desabilitadas da agenda atual.
const conjuntoDatasDesabilitadas = computed(() => {
    return new Set<string>(datasDesabilitadas.value);
});

// Calcula e devolve um Set com as strings (YYYY-MM-DD) dos dias operacionais que já estão visíveis na grade tabela-horario.
const datasVisiveisNaSemana = computed(() => {
    const visiveis = new Set<string>();
    if (props.modoLayout !== 'tabela-horario' || !dataSelecionada.value || !agendaSelecionada.value) {
        return visiveis;
    }

    const agendaObj = agendasDisponiveis.value.find(
        (a: any) => Number(a.id_agenda) === Number(agendaSelecionada.value)
    );
    if (!agendaObj || !agendaObj.detalhes) return visiveis;

    const diaInicioPython = Number(agendaObj.detalhes.dia_inicio_semana_agenda ?? 0);
    const diasVisiveis = Number(agendaObj.detalhes.dias_visiveis_agenda ?? 6);
    const diaInicioJs = (diaInicioPython + 1) % 7;

    let dataBase: Date;
    if (typeof dataSelecionada.value === 'string') {
        const apenasData = String(dataSelecionada.value).substring(0, 10);
        const [ano, mes, dia] = apenasData.split('-').map(Number);
        dataBase = new Date(ano!, mes! - 1, dia!);
    } else {
        const d = new Date(dataSelecionada.value);
        dataBase = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const diff = (dataBase.getDay() - diaInicioJs + 7) % 7;
    const inicioSemana = new Date(dataBase);
    inicioSemana.setDate(dataBase.getDate() - diff);

    for (let i = 0; i < diasVisiveis; i++) {
        const diaCorrente = new Date(inicioSemana);
        diaCorrente.setDate(inicioSemana.getDate() + i);
        visiveis.add(formatarDataIsoCurta(diaCorrente));
    }

    return visiveis;
});

// Recebe a célula do minicalendário e devolve true se aquele dia da semana não funcionar na agenda.
const ehDiaBloqueadoNoMini = (cell: any): boolean => {
    const data = obterDataDaCelula(cell);
    if (!data || props.modoLayout !== 'tabela-horario') return false;
    return conjuntoDatasDesabilitadas.value.has(formatarDataIsoCurta(data));
};

// Recebe a célula do minicalendário e devolve true se ela já estiver sendo exibida na tabela atual.
const ehDiaVisivelNaGrade = (cell: any): boolean => {
    const data = obterDataDaCelula(cell);
    if (!data || props.modoLayout !== 'tabela-horario') return false;
    return datasVisiveisNaSemana.value.has(formatarDataIsoCurta(data));
};

// Recebe nada. Devolve nada.
// É usada para retrair ou expandir a aba esquerda de navegação rápida.
const alternarMenu = () => { menuAberto.value = !menuAberto.value; };

// Recebe nada. Devolve nada.
// É usada para devolver o usuário à data atual do sistema nas visualizações principais e no mini-calendário.
const irParaHoje = () => { 
    const hoje = new Date();
    dataSelecionada.value = hoje; 
    dataVisao.value = hoje;
    if (props.modoLayout === 'calendario') agendaVueCalRef.value?.irParaHoje();
    if (calendarioMiniRef.value) calendarioMiniRef.value.view.goToToday();
};

// Recebe o identificador em string do modo de visualização. Devolve nada.
// É usada para trocar a apresentação do calendário grande entre visão de dias singulares e a semana expandida.
const mudarVisao = (novaVisao: string) => { 
    agendaVueCalRef.value?.mudarVisao(novaVisao); 
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
          <AgendaVueCal
            v-if="props.modoLayout === 'calendario'"
            ref="agendaVueCalRef"
            :usa-interceptador="props.usaInterceptador"
            :usuario-logado="props.usuarioLogado"
            :titulo-padrao="props.tituloPadrao"
            :ocultar-titulo-modal="props.ocultarTituloModal"
            @before-save="$emit('before-save', $event)"
          >
            <template #campos-extras>
              <slot name="campos-extras"></slot>
            </template>
          </AgendaVueCal>

          <AgendaTabelaHorario
            v-else-if="props.modoLayout === 'tabela-horario'"
            :id-recurso-unico="props.idRecursoUnico"
            :usa-interceptador="props.usaInterceptador"
            :titulo-padrao="props.tituloPadrao"
            :ocultar-titulo-modal="props.ocultarTituloModal"
            :configuracao-blocos="props.configuracaoBlocos"
            @before-save="$emit('before-save', $event)"
          >
            <template #campos-extras>
              <slot name="campos-extras"></slot>
            </template>
          </AgendaTabelaHorario>

          <AgendaMatrixUnico
            v-else-if="props.modoLayout === 'tabela' && props.idRecursoUnico"
            :id-recurso="props.idRecursoUnico"
            :usa-interceptador="props.usaInterceptador"
            :titulo-padrao="props.tituloPadrao"
            :ocultar-titulo-modal="props.ocultarTituloModal"
            :configuracao-blocos="props.configuracaoBlocos"
            @before-save="$emit('before-save', $event)"
          >
            <template #campos-extras>
              <slot name="campos-extras"></slot>
            </template>
          </AgendaMatrixUnico>

          <AgendaMatrix
            v-else-if="props.modoLayout === 'tabela'"
            :usa-interceptador="props.usaInterceptador"
            :titulo-padrao="props.tituloPadrao"
            :ocultar-titulo-modal="props.ocultarTituloModal"
            :configuracao-blocos="props.configuracaoBlocos"
            @before-save="$emit('before-save', $event)"
          >
            <template #campos-extras>
              <slot name="campos-extras"></slot>
            </template>
          </AgendaMatrix>
        </main>
      </div>
    </div>
  </div>
</template>
<style lang="scss">
@use '../assets/scss/main.scss';
</style>

<style scoped>
.painel-agenda-unificado { 
    background: var(--bg-primary); 
    border-radius: 16px; 
    box-shadow: var(--shadow-float); 
    border: 1px solid var(--border-light); 
    flex-grow: 1; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
}
.painel-header-topo { 
    height: 60px; 
    background-color: var(--bg-primary); 
    border-bottom: 1px solid var(--border-light); 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 20px; 
    flex-shrink: 0; 
}
.corpo-principal { display: flex; flex-grow: 1; overflow: hidden; }
.barra-lateral { 
    width: 300px; 
    background-color: var(--bg-primary); 
    border-right: 1px solid var(--border-light); 
    transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s; 
    overflow: hidden; 
    flex-shrink: 0; 
}
.barra-lateral.oculta { width: 0; border-right: none; opacity: 0; }
.conteudo-lateral-fixo { width: 300px; padding: 15px; }
.secao-mini-cal { width: 100%; }
.area-calendario { 
    flex-grow: 1; 
    overflow: hidden; 
    background-color: var(--bg-primary); 
    display: flex; 
    flex-direction: column; 
}

.calendario-mini { border: none !important; box-shadow: none !important; background-color: transparent !important; }
:deep(.calendario-mini .vuecal__header), :deep(.calendario-mini .vuecal__title-bar) { background-color: transparent !important; border: none !important; padding-bottom: 5px; }
:deep(.calendario-mini .vuecal__title), :deep(.calendario-mini .vuecal__arrow) { 
    font-size: 1rem; 
    font-weight: 600; 
    color: var(--color-brand) !important; 
    background: transparent !important; 
}
:deep(.calendario-mini .vuecal__heading) { border: none !important; background-color: transparent !important; font-weight: 600; color: var(--text-secondary); padding-bottom: 4px; }
:deep(.calendario-mini .vuecal__cell) { border: none !important; background-color: transparent !important; height: 32px !important; min-height: 32px !important; aspect-ratio: auto !important; }
:deep(.calendario-mini .vuecal__cell::before) { display: none !important; content: none !important; }
:deep(.calendario-mini .vuecal__cell-content) { height: 32px !important; min-height: 32px !important; padding: 0 !important; margin: 0 !important; justify-content: center !important; align-items: center !important; width: 100% !important; }
:deep(.calendario-mini .vuecal__cell-date) { width: 26px !important; height: 26px !important; font-size: 12px !important; line-height: 26px !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 0 auto !important; border-radius: 50% !important; border: 2px solid transparent !important; box-sizing: border-box !important; transition: all 0.2s ease; cursor: pointer; }
:deep(.calendario-mini .vuecal__cell--selected) { background-color: transparent !important; }
:deep(.calendario-mini:not(.modo-mini-tabela-horario) .vuecal__cell--selected .vuecal__cell-date) { 
    background-color: var(--color-brand) !important; 
    color: var(--text-inverse) !important; 
    border-color: var(--color-brand) !important; 
}
:deep(.vuecal__body) { padding: 0; gap: 0; margin: 0; }
:deep(.calendario-mini .vuecal__cell--today) { background-color: transparent !important; }
:deep(.calendario-mini .vuecal__cell-date){ background-color: transparent !important; color: var(--text-primary); }
:deep(.calendario-mini .vuecal__cell--today:not(.vuecal__cell--selected) .vuecal__cell-date:not(.dia-semana-visivel)) { 
    background-color: var(--color-brand-light) !important; 
    border-color: transparent !important; 
    color: var(--color-brand) !important; 
}
:deep(.calendario-mini .vuecal__views-bar) { display: none !important; }
:deep(.calendario-mini .vuecal__nav--next), :deep(.calendario-mini .vuecal__nav--prev) { color: var(--text-primary) !important; }
:deep(.calendario-mini .vuecal__body){ height: 0%!important; }
:deep(.calendario-mini .vuecal__scrollable-wrap){ background-color: transparent!important; }

/* Estilização específica para o modo tabela-horario no minicalendário */
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

:deep(.calendario-mini .vuecal__weekdays-headings),
:deep(.calendario-mini .vuecal__weekday) {
    background-color: transparent !important;
    border: none !important;
    color: var(--text-secondary) !important;
}

:deep(.calendario-mini .vuecal__weekdays-headings) {
    background: transparent !important;
    background-color: transparent !important;
    border-bottom: 1px solid var(--border-light) !important;
}

:deep(.calendario-mini .vuecal__heading),
:deep(.calendario-mini .vuecal__weekday),
:deep(.calendario-mini .vuecal__heading *) {
    background: transparent !important;
    background-color: transparent !important;
    color: var(--text-secondary) !important;
    font-weight: 600 !important;
    border: none !important;
}

:deep(.calendario-mini .vuecal__header),
:deep(.calendario-mini .vuecal__weekdays-headings) {
    background: var(--bg-primary) !important;
    background-color: var(--bg-primary) !important;
    border-bottom: 1px solid var(--border-light) !important;
}

:deep(.calendario-mini .vuecal__heading),
:deep(.calendario-mini .vuecal__weekday),
:deep(.calendario-mini .vuecal__weekday-name),
:deep(.calendario-mini .vuecal__heading *) {
    background: var(--bg-primary) !important;
    background-color: var(--bg-primary) !important;
    color: var(--text-secondary) !important;
    font-weight: 600 !important;
    border: none !important;
}
</style>