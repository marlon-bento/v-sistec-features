<!--
========
O layout raiz que orquestra a interface com cabeçalhos modulares separados.
Suporta os modos 'calendario', 'tabela' (matriz horizontal) e 'tabela-horario' (grade vertical de horários por turno).
Provê o contexto isolado da agenda para toda a árvore de componentes filhos, permitindo múltiplos calendários
independentes na mesma página sem necessidade de repasse manual de propriedades (prop drilling).
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { ref, computed, onMounted } from 'vue';
import { proverContextoAgenda } from './composables/useAgenda';
import { calcularDataInicioSemana, formatarDataIso } from './composables/useGradeCompartilhada';
import GradeMiniCalendario from './components/Grades/GradeMiniCalendario.vue';
import AgendaVueCal from './components/AgendaVueCal.vue';
import AgendaMatrix from './components/AgendaMatrix.vue';
import AgendaMatrixUnico from './components/AgendaMatrixUnico.vue';
import AgendaTabelaHorario from './components/AgendaTabelaHorario.vue';
import HeaderCalendario from './components/HeaderCalendario.vue';
import HeaderTabela from './components/HeaderTabela.vue';

const props = withDefaults(defineProps<{
  tituloObrigatorio?: boolean;
  labelTituloModal?: string;
  placeholderTituloModal?: string;
  mensagemErroTitulo?: string;
  modoLayout?: 'calendario' | 'tabela' | 'tabela-horario';
  idRecursoUnico?: number | string | null;
  usaInterceptador?: boolean;
  usuarioLogado?: string;
  tituloPadrao?: string;
  ocultarTituloModal?: boolean;
  configuracaoBlocos?: any;
  fetch: any;
}>(), {
  tituloObrigatorio: false,
  labelTituloModal: 'Nome da Reserva',
  placeholderTituloModal: 'Ex: Treinamento',
  mensagemErroTitulo: '',
  modoLayout: 'calendario',
  idRecursoUnico: null,
  usaInterceptador: false,
  usuarioLogado: '',
  tituloPadrao: '',
  ocultarTituloModal: false,
  configuracaoBlocos: null
});

const emit = defineEmits(['before-save']);

// Cria e provê o contexto isolado da agenda para esta instância.
const {
  dataSelecionada,
  dataVisao,
  agendasDisponiveis,
  agendaSelecionada,
  datasDesabilitadas,
  carregarRecursosEAgendas
} = proverContextoAgenda(props, emit);

const menuAberto = ref(true);
const calendarioMiniRef = ref<any>(null);
const modeloAtivoRef = ref<any>(null);

const ehModoGradeSemanal = computed(() =>
  props.modoLayout === 'tabela' || props.modoLayout === 'tabela-horario'
);

const componenteModeloAtivo = computed(() => {
  if (props.modoLayout === 'calendario') return AgendaVueCal;
  if (props.modoLayout === 'tabela-horario') return AgendaTabelaHorario;
  if (props.modoLayout === 'tabela' && props.idRecursoUnico) return AgendaMatrixUnico;
  return AgendaMatrix;
});

const recursosEmExibicao = computed(() => modeloAtivoRef.value?.recursosEmExibicao ?? []);

defineExpose({ recursosEmExibicao });

onMounted(() => { carregarRecursosEAgendas(); });

// Calcula o conjunto de datas (YYYY-MM-DD) que compõem a semana visível na tabela ativa.
const datasVisiveisNaSemana = computed(() => {
  const visiveis = new Set<string>();
  if (!ehModoGradeSemanal.value || !dataSelecionada.value || !agendaSelecionada.value) {
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

const alternarMenu = () => { menuAberto.value = !menuAberto.value; };

const irParaHoje = () => {
  const hoje = new Date();
  dataSelecionada.value = hoje;
  dataVisao.value = hoje;
  if (props.modoLayout === 'calendario') modeloAtivoRef.value?.irParaHoje?.();
  calendarioMiniRef.value?.irParaHoje?.();
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
        />
      </header>

      <div class="corpo-principal">
        <aside class="barra-lateral" :class="{ 'oculta': !menuAberto }">
          <div class="conteudo-lateral-fixo">
            <GradeMiniCalendario
              ref="calendarioMiniRef"
              v-model:data-selecionada="dataSelecionada"
              v-model:data-visao="dataVisao"
              :modo-grade-semanal="ehModoGradeSemanal"
              :datas-desabilitadas="datasDesabilitadas"
              :datas-visiveis-semana="datasVisiveisNaSemana"
            />
          </div>
        </aside>

        <main class="area-calendario">
          <component :is="componenteModeloAtivo" ref="modeloAtivoRef">
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

.corpo-principal {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.barra-lateral {
  width: 300px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-light);
  transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s;
  overflow: hidden;
  flex-shrink: 0;
}

.barra-lateral.oculta {
  width: 0;
  border-right: none;
  opacity: 0;
}

.conteudo-lateral-fixo {
  width: 300px;
  padding: 15px;
}

.area-calendario {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--bg-primary);
  display: flex;
  flex-direction: column;
}
</style>