/*
========
Este arquivo gerencia o ciclo reativo de busca semanal da matriz de horários e a sincronização
de recurso único, além de reexportar as funções utilitárias de datas e cálculo de blocos para os componentes.
========
*/
import { ref, computed, watch } from 'vue';
import { useAgenda } from './useAgenda';
import {
    SIGLAS_DIAS_JS,
    TITULOS_DIAS_CABECALHO,
    extrairDataHoraLocal,
    extrairHoraFormatada,
    criarDataLocal,
    formatarDataIso,
    calcularDataInicioSemana,
    converterParaUtc
} from '../utils/datasAgenda';
import {
    mesclarSlotsReservados,
    calcularEstruturaDeBlocos
} from '../utils/calculoGrade';

export {
    SIGLAS_DIAS_JS,
    TITULOS_DIAS_CABECALHO,
    extrairDataHoraLocal,
    extrairHoraFormatada,
    criarDataLocal,
    formatarDataIso,
    calcularDataInicioSemana,
    converterParaUtc,
    mesclarSlotsReservados,
    calcularEstruturaDeBlocos
};

// Controla a busca semanal da matriz de slots na API e lê a configuração de blocos da agenda ativa.
// É usada pelas visões baseadas em tabela (AgendaMatrix e AgendaTabelaHorario).
export function useGradeSemanal() {
    const {
        configEntrada,
        dadosMatrix,
        buscarSlotsMatrix,
        agendasDisponiveis,
        agendaSelecionada,
        dataSelecionada,
        registrarAtualizadorVisao
    } = useAgenda();

    // Indica se a requisição da malha semanal de slots está em andamento.
    const carregando = ref(false);

    // Calcula o início e o fim da semana ativa e busca a matriz de slots no backend.
    const dispararBuscaSemanal = async () => {
        const idAgenda = agendaSelecionada.value;
        if (!idAgenda) return;

        carregando.value = true;
        const agendaObj = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(idAgenda));
        const diaInicioPython = agendaObj?.detalhes?.dia_inicio_semana_agenda ?? 0;

        const dataInicio = calcularDataInicioSemana(dataSelecionada.value || new Date(), diaInicioPython);
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);

        const inicioUtc = encodeURIComponent(converterParaUtc(formatarDataIso(dataInicio), '00:00'));
        const fimUtc = encodeURIComponent(converterParaUtc(formatarDataIso(dataFim), '23:59'));

        await buscarSlotsMatrix(idAgenda, inicioUtc, fimUtc);
        carregando.value = false;
    };

    registrarAtualizadorVisao(dispararBuscaSemanal);
    watch([dataSelecionada, agendaSelecionada], dispararBuscaSemanal, { immediate: true });

    // Localiza o objeto de configuração de blocos pertencente à agenda selecionada no momento.
    const configuracaoAgendaAtual = computed(() => {
        const configBruta = configEntrada.configuracaoBlocos;
        if (!configBruta || !agendaSelecionada.value) return null;
        const idAtual = Number(agendaSelecionada.value);

        if (Array.isArray(configBruta)) {
            return configBruta.find((c: any) => Number(c.id_agenda) === idAtual) || null;
        }
        if (typeof configBruta === 'object') {
            if (Number(configBruta.id_agenda) === idAtual) return configBruta;
            if (configBruta[idAtual]) return configBruta[idAtual];
        }
        return null;
    });

    // Recebe a sigla do dia da semana (ex: 'SEG') e devolve a lista de blocos configurada para aquele dia.
    const obterBlocosDoDia = (siglaDia: string): any[] | null => {
        const cfg = configuracaoAgendaAtual.value;
        if (!cfg) return null;
        if (cfg.por_dia && cfg.por_dia[siglaDia]) return cfg.por_dia[siglaDia];
        if (Array.isArray(cfg.blocos)) return cfg.blocos;
        return null;
    };

    return {
        dadosMatrix,
        carregando,
        configuracaoAgendaAtual,
        obterBlocosDoDia,
        dispararBuscaSemanal
    };
}

// Mantém o recursoSelecionado e a agendaSelecionada sincronizados quando a prop idRecursoUnico é utilizada.
export function useSincronizarRecursoUnico() {
    const { configEntrada, recursosDisponiveis, agendaSelecionada, recursoSelecionado } = useAgenda();

    watch([() => configEntrada.idRecursoUnico, recursosDisponiveis], ([idRec]) => {
        if (!idRec || recursosDisponiveis.value.length === 0) return;

        const encontrado = recursosDisponiveis.value.find(
            (r: any) => Number(r.id_recurso) === Number(idRec)
        );

        if (encontrado) {
            recursoSelecionado.value = Number(encontrado.id_recurso);
            if (encontrado.id_agenda && agendaSelecionada.value !== encontrado.id_agenda) {
                agendaSelecionada.value = encontrado.id_agenda;
            }
        }
    }, { immediate: true });
}