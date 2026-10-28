// ============================================================================
// Composable utilitário que centraliza cálculos de datas semanais, formatação
// de horários, busca de matriz na API, mesclagem de reservas contínuas,
// abertura do modal em modo de edição e sincronização de recurso único.
// ============================================================================

import { ref, computed, watch, onMounted } from 'vue';
import { useAgenda } from './useAgenda';

export const SIGLAS_DIAS_JS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export const TITULOS_DIAS_CABECALHO = [
    'DOMINGO',
    '2ª FEIRA',
    '3ª FEIRA',
    '4ª FEIRA',
    '5ª FEIRA',
    '6ª FEIRA',
    'SÁBADO'
];

// Recebe uma string ISO UTC e devolve objeto com data (YYYY-MM-DD) e hora (HH:MM) locais.
export const extrairDataHoraLocal = (isoString: string) => {
    const d = new Date(isoString);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return { data: `${ano}-${mes}-${dia}`, hora: `${horas}:${min}` };
};

// Recebe uma string ISO UTC e devolve apenas o horário local formatado em HH:MM.
export const extrairHoraFormatada = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Recebe uma string YYYY-MM-DD ou Date e devolve um objeto Date local zerado no início do dia.
export const criarDataLocal = (valorData: string | Date) => {
    if (typeof valorData === 'string') {
        const [ano, mes, dia] = valorData.substring(0, 10).split('-').map(Number);
        return new Date(ano!, mes! - 1, dia!);
    }
    return new Date(valorData.getFullYear(), valorData.getMonth(), valorData.getDate());
};

// Recebe um objeto Date e devolve a string correspondente no formato YYYY-MM-DD.
export const formatarDataIso = (dt: Date) => {
    const ano = dt.getFullYear();
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const dia = String(dt.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// Recebe a data de referência e o dia inicial no formato Python (0=SEG..6=DOM) e devolve o Date do início da semana.
export const calcularDataInicioSemana = (dataRef: string | Date, diaInicioPython = 0) => {
    const d = criarDataLocal(dataRef);
    const diaInicioJs = (Number(diaInicioPython) + 1) % 7;
    const diff = (d.getDay() - diaInicioJs + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
};

// Recebe a lista de slots disponíveis de um recurso e a chave de span ('colspan' ou 'rowspan').
// Devolve a lista de células com reservas consecutivas de mesmo código mescladas.
export const mesclarSlotsReservados = (slotsBrutos: any[], chaveSpan: 'colspan' | 'rowspan') => {
    const chaveIndice = chaveSpan === 'colspan' ? 'indiceColuna' : 'indiceLinha';
    const chaveOculta = chaveSpan === 'colspan' ? 'ocultaPorColspan' : 'ocultaPorRowspan';
    const celulasMescladas: any[] = [];

    let i = 0;
    while (i < slotsBrutos.length) {
        const slotAtual = slotsBrutos[i];
        const codRef = slotAtual?.detalhes_reserva?.codigo_referencia_reserva;

        if (slotAtual?.reservado_slot && codRef) {
            let span = 1;
            while (
                i + span < slotsBrutos.length &&
                slotsBrutos[i + span]?.reservado_slot &&
                slotsBrutos[i + span]?.detalhes_reserva?.codigo_referencia_reserva === codRef
            ) {
                span++;
            }

            celulasMescladas.push({
                ...slotAtual,
                [chaveIndice]: i,
                [chaveSpan]: span,
                [chaveOculta]: false
            });

            for (let k = 1; k < span; k++) {
                celulasMescladas.push({
                    ...slotsBrutos[i + k],
                    [chaveIndice]: i + k,
                    [chaveSpan]: 1,
                    [chaveOculta]: true
                });
            }
            i += span;
        } else {
            celulasMescladas.push({
                ...slotAtual,
                [chaveIndice]: i,
                [chaveSpan]: 1,
                [chaveOculta]: false
            });
            i++;
        }
    }

    return celulasMescladas;
};

// Recebe o objeto de uma reserva existente e devolve a estrutura formatada para abrir o ModalReserva em modo de edição.
export const montarDadosModalParaEdicao = (reserva: any) => {
    const inicio = extrairDataHoraLocal(reserva.data_inicio_reserva);
    const fim = extrairDataHoraLocal(reserva.data_fim_reserva);

    return {
        modo_edicao: true,
        codigo_referencia_reserva: reserva.codigo_referencia_reserva,
        grupo_recorrencia_reserva: reserva.grupo_recorrencia_reserva || null,
        datas_grupo_recorrencia_reserva: reserva.datas_grupo_recorrencia_reserva || [],
        id_recurso: Number(reserva.id_recurso),
        titulo_reserva: reserva.titulo_reserva || '',
        data_inicio: inicio.data,
        hora_inicio: inicio.hora,
        data_fim: fim.data,
        hora_fim: fim.hora,
        payload: reserva.payload
    };
};

// Gerencia o ciclo de busca semanal da matriz, estados de modais e configuração de blocos por agenda.
export function useGradeSemanal(api: any, obterConfiguracaoBlocos?: () => any) {
    const {
        dadosMatrix,
        buscarSlotsMatrix,
        buscarReservas,
        agendasDisponiveis,
        agendaSelecionada,
        dataSelecionada,
        converterParaUtc
    } = useAgenda(api);

    const carregando = ref(false);
    const modalAberto = ref(false);
    const dadosParaModal = ref({});
    const modalDetalhesAberto = ref(false);
    const reservaSelecionadaDetalhes = ref<any>(null);

    const dispararBuscaSemanal = async () => {
        const idAgenda = agendaSelecionada.value;
        if (!idAgenda) return;

        carregando.value = true;
        const agendaObj = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(idAgenda));
        const diaInicioPython = agendaObj?.detalhes?.dia_inicio_semana_agenda ?? 0;

        const dataInicio = calcularDataInicioSemana(dataSelecionada.value || new Date(), diaInicioPython);
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);

        const strInicio = formatarDataIso(dataInicio);
        const strFim = formatarDataIso(dataFim);

        const inicioUtc = encodeURIComponent(converterParaUtc(strInicio, '00:00'));
        const fimUtc = encodeURIComponent(converterParaUtc(strFim, '23:59'));

        await buscarSlotsMatrix(idAgenda, inicioUtc, fimUtc);
        await buscarReservas(`${strInicio}T00:00:00`, `${strFim}T23:59:59`);
        carregando.value = false;
    };

    // Fecha o modal de detalhes e abre o modal de reserva preenchido no modo de edição.
    const abrirEdicaoDeReserva = (reserva: any) => {
        if (!reserva) return;
        modalDetalhesAberto.value = false;
        dadosParaModal.value = montarDadosModalParaEdicao(reserva);
        modalAberto.value = true;
    };

    onMounted(dispararBuscaSemanal);
    watch([dataSelecionada, agendaSelecionada], dispararBuscaSemanal);

    const configuracaoAgendaAtual = computed(() => {
        const configBruta = obterConfiguracaoBlocos ? obterConfiguracaoBlocos() : null;
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

    // Extrai a lista de blocos configurados para um dia específico da semana ou padrão da agenda.
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
        modalAberto,
        dadosParaModal,
        modalDetalhesAberto,
        reservaSelecionadaDetalhes,
        configuracaoAgendaAtual,
        obterBlocosDoDia,
        dispararBuscaSemanal,
        abrirEdicaoDeReserva
    };
}

// Sincroniza automaticamente o recursoSelecionado e a agendaSelecionada quando um ID de recurso fixo é informado.
export function useSincronizarRecursoUnico(api: any, obterIdRecurso: () => number | string | null | undefined) {
    const { recursosDisponiveis, agendaSelecionada, recursoSelecionado } = useAgenda(api);

    watch([obterIdRecurso, recursosDisponiveis], ([idRec]) => {
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