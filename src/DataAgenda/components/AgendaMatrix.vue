<!--
========
Este arquivo concentra o controlador unificado da visão em matriz horizontal ('tabela').
Atende automaticamente tanto o modo de múltiplos recursos (com dropdown de filtro de salas)
quanto o modo de recurso único (quando idRecursoUnico é fornecido), processando os blocos
e alimentando diretamente o componente visual GradeMatrix.
========
-->
<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useCoresAgenda } from '../composables/useCoresAgenda';
import {
    SIGLAS_DIAS_JS,
    extrairDataHoraLocal,
    extrairHoraFormatada,
    criarDataLocal,
    mesclarSlotsReservados,
    calcularEstruturaDeBlocos,
    useGradeSemanal,
    useSincronizarRecursoUnico
} from '../composables/useGradeCompartilhada';
import GradeMatrix from './Grades/GradeMatrix.vue';

const {
    configEntrada,
    agendaSelecionada,
    recursosDisponiveis,
    abrirModalCriacao,
    abrirModalDetalhes
} = useAgenda();
const { obterCoresBloco } = useCoresAgenda();

// Sincroniza automaticamente a agenda caso idRecursoUnico esteja definido.
useSincronizarRecursoUnico();

const {
    dadosMatrix,
    carregando,
    obterBlocosDoDia
} = useGradeSemanal();

// Armazena os IDs selecionados no dropdown quando opera no modo de múltiplos recursos.
const recursosSelecionadosFiltro = ref<string[]>([]);

// Armazena o ID da agenda para saber quando reiniciar o filtro com todas as salas marcadas.
const idAgendaFiltroInicializado = ref<number | null>(null);

// Controla a abertura do menu dropdown de filtro de salas.
const menuFiltroAberto = ref(false);

// Indica se a matriz está travada na visualização de um único recurso.
const ehModoRecursoUnico = computed(() => Boolean(configEntrada.idRecursoUnico));

// Lista todos os recursos presentes na matriz retornada pela API para a agenda atual.
const recursosPermitidosNaMatriz = computed(() => {
    return dadosMatrix.value?.datas_matriz?.[0]?.recursos_slot || [];
});

watch(recursosPermitidosNaMatriz, (novosRecursos) => {
    if (novosRecursos.length === 0) {
        recursosSelecionadosFiltro.value = [];
        return;
    }

    const todosIds = novosRecursos.map((r: any) => String(r.id_recurso));

    if (idAgendaFiltroInicializado.value !== agendaSelecionada.value) {
        recursosSelecionadosFiltro.value = todosIds;
        idAgendaFiltroInicializado.value = agendaSelecionada.value;
    } else {
        recursosSelecionadosFiltro.value = recursosSelecionadosFiltro.value.filter(id => todosIds.includes(id));
    }
}, { immediate: true });

// Define a lista final de IDs de recursos que devem aparecer nas linhas da GradeMatrix.
const idsRecursosVisiveis = computed(() => {
    if (ehModoRecursoUnico.value) {
        return [String(configEntrada.idRecursoUnico)];
    }
    return recursosSelecionadosFiltro.value;
});

// Define a mensagem exibida caso nenhuma linha resulte da filtragem atual.
const mensagemVazio = computed(() =>
    ehModoRecursoUnico.value
        ? 'Recurso não encontrado na grade desta agenda.'
        : 'Nenhuma sala selecionada.'
);

// Expõe para o componente pai VDataAgenda a lista de objetos completos dos recursos visíveis no momento.
const recursosEmExibicao = computed(() => {
    if (ehModoRecursoUnico.value) {
        const encontrado = recursosDisponiveis.value.find(
            (r: any) => Number(r.id_recurso) === Number(configEntrada.idRecursoUnico)
        );
        return encontrado ? [encontrado] : [];
    }

    if (recursosSelecionadosFiltro.value.length === 0) return [];

    return recursosPermitidosNaMatriz.value
        .filter((recMatriz: any) => recursosSelecionadosFiltro.value.includes(String(recMatriz.id_recurso)))
        .map((recMatriz: any) => {
            return recursosDisponiveis.value.find(
                (r: any) => Number(r.id_recurso) === Number(recMatriz.id_recurso)
            ) || {
                id_recurso: recMatriz.id_recurso,
                nome_recurso: recMatriz.nome_recurso,
                id_agenda: agendaSelecionada.value
            };
        });
});

defineExpose({ recursosEmExibicao });

// Marca todas as salas disponíveis no dropdown de filtro.
const selecionarTodos = () => {
    recursosSelecionadosFiltro.value = recursosPermitidosNaMatriz.value.map((r: any) => String(r.id_recurso));
};

// Desmarca todas as salas no dropdown de filtro.
const limparFiltros = () => {
    recursosSelecionadosFiltro.value = [];
};

// Abre o modal central de nova reserva preenchido com o intervalo arrastado na GradeMatrix.
const aoSelecionarIntervalo = (itensSelecionados: any[]) => {
    const primeiro = itensSelecionados[0];
    const ultimo = itensSelecionados[itensSelecionados.length - 1];
    if (!primeiro?.slot || !ultimo?.slot) return;

    const inicio = extrairDataHoraLocal(primeiro.slot.data_inicio_slot);
    const fim = extrairDataHoraLocal(ultimo.slot.data_fim_slot);

    abrirModalCriacao({
        id_recurso: Number(primeiro.idRecurso),
        titulo_reserva: '',
        data_inicio: inicio.data,
        hora_inicio: inicio.hora,
        data_fim: fim.data,
        hora_fim: fim.hora
    });
};

// Recebe uma data ISO (YYYY-MM-DD) e devolve o texto por extenso para a barra superior do dia.
const formatarData = (isoData: string) => {
    return criarDataLocal(isoData).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Gera a lista ordenada de dias operacionais com cabeçalhos e células mescladas por colspan para enviar à GradeMatrix.
const diasProcessados = computed(() => {
    if (!dadosMatrix.value?.datas_matriz) return [];

    const resultado: any[] = [];

    dadosMatrix.value.datas_matriz.forEach((dia: any) => {
        if (dia.dia_operacional_slot === false) return;

        const recursosFiltrados = (dia.recursos_slot || []).filter((res: any) =>
            idsRecursosVisiveis.value.includes(String(res.id_recurso))
        );
        if (recursosFiltrados.length === 0) return;

        const slotsValidosBase = (recursosFiltrados[0].horarios_slot || []).filter((s: any) => !s.bloqueado_slot);
        if (slotsValidosBase.length === 0) return;

        const definicaoColunas = slotsValidosBase.map((s: any) => ({
            horaInicio: extrairHoraFormatada(s.data_inicio_slot),
            horaFim: extrairHoraFormatada(s.data_fim_slot)
        }));

        const siglaDia = SIGLAS_DIAS_JS[criarDataLocal(dia.data_slot).getDay()] || 'SEG';
        const infoBlocos = calcularEstruturaDeBlocos(
            definicaoColunas,
            obterBlocosDoDia(siglaDia),
            obterCoresBloco,
            null,
            'Bloco'
        );

        const recursosProcessados = recursosFiltrados.map((rec: any) => {
            const slotsBrutos = (rec.horarios_slot || []).filter((s: any) => !s.bloqueado_slot);
            return {
                id_recurso: rec.id_recurso,
                nome_recurso: rec.nome_recurso,
                slotsBrutos,
                horarios_slot: mesclarSlotsReservados(slotsBrutos, 'colspan')
            };
        });

        resultado.push({
            data_slot: dia.data_slot,
            dataFormatada: formatarData(dia.data_slot),
            colunasHorarios: definicaoColunas,
            temBlocos: infoBlocos.temBlocos,
            temSubblocos: infoBlocos.temSubblocos,
            blocosPrincipais: infoBlocos.blocosPrincipais,
            subblocos: infoBlocos.subblocos,
            metadadosColunas: infoBlocos.metadadosSlots,
            recursos_slot: recursosProcessados
        });
    });

    return resultado;
});
</script>

<template>
  <div class="matriz-container">
    <GradeMatrix
      :dias="diasProcessados"
      :carregando="carregando"
      :titulo-padrao="configEntrada.tituloPadrao"
      :mensagem-vazio="mensagemVazio"
      @selecionar-intervalo="aoSelecionarIntervalo"
      @clicar-reserva="abrirModalDetalhes"
    >
      <template #topo>
        <div class="barra-filtros" v-if="!ehModoRecursoUnico && recursosPermitidosNaMatriz.length > 0">
          <div class="dropdown-container">
            <button class="btn-dropdown" @click="menuFiltroAberto = !menuFiltroAberto">
              <span class="texto-btn">
                Filtro de Salas ({{ recursosSelecionadosFiltro.length }}/{{ recursosPermitidosNaMatriz.length }})
              </span>
              <svg
                class="icone-seta"
                :class="{ 'girado': menuFiltroAberto }"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <div class="backdrop-invisivel" v-if="menuFiltroAberto" @click="menuFiltroAberto = false"></div>

            <div class="dropdown-menu" v-if="menuFiltroAberto">
              <div class="dropdown-acoes">
                <button class="btn-acao" @click="selecionarTodos">Todos</button>
                <button class="btn-acao" @click="limparFiltros">Nenhum</button>
              </div>

              <div class="dropdown-lista">
                <label
                  class="dropdown-item"
                  v-for="rec in recursosPermitidosNaMatriz"
                  :key="rec.id_recurso"
                  :class="{ 'ativo': recursosSelecionadosFiltro.includes(String(rec.id_recurso)) }"
                >
                  <input
                    class="checkbox-estiloso"
                    type="checkbox"
                    :value="String(rec.id_recurso)"
                    v-model="recursosSelecionadosFiltro"
                  />
                  <span>{{ rec.nome_recurso }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </template>
    </GradeMatrix>
  </div>
</template>

<style scoped>
.matriz-container {
    width: 100%;
    height: 100%;
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    user-select: none;
}

.barra-filtros { padding: 12px 24px; background-color: var(--bg-primary); border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
.dropdown-container { position: relative; display: inline-block; }
.btn-dropdown { display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 8px; color: var(--text-primary); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
.btn-dropdown:hover { background: var(--bg-hover); border-color: var(--border-editor); }
.icone-seta { transition: transform 0.2s ease; }
.icone-seta.girado { transform: rotate(180deg); }
.backdrop-invisivel { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 40; }
.dropdown-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; width: 260px; background: var(--bg-modal); border: 1px solid var(--border-light); border-radius: 10px; box-shadow: var(--shadow-float); z-index: 50; display: flex; flex-direction: column; overflow: hidden; }
.dropdown-acoes { display: flex; border-bottom: 1px solid var(--border-light); background: var(--bg-secondary); }
.btn-acao { flex: 1; padding: 10px; background: transparent; border: none; font-size: 12px; font-weight: 600; color: var(--color-brand); cursor: pointer; transition: background 0.2s; }
.btn-acao:hover { background: var(--color-brand-light); }
.btn-acao:first-child { border-right: 1px solid var(--border-light); }
.dropdown-lista { max-height: 250px; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-primary); transition: background 0.2s; }
.dropdown-item:hover { background: var(--bg-hover); }
.dropdown-item.ativo { background: var(--color-brand-light); color: var(--color-brand); }
.checkbox-estiloso { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; border: 2px solid var(--border-editor); border-radius: 4px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; background: var(--bg-primary); flex-shrink: 0; }
.dropdown-item.ativo .checkbox-estiloso { background: var(--color-brand); border-color: var(--color-brand); }
.checkbox-estiloso::before { content: ""; width: 10px; height: 10px; transform: scale(0); transition: 0.12s transform ease-in-out; background-color: var(--text-inverse); clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
.dropdown-item.ativo .checkbox-estiloso::before { transform: scale(1); }
</style>