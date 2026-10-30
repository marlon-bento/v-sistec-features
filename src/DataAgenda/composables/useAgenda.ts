/*
========
Este arquivo gerencia o estado reativo central de cada instância do VDataAgenda,
o controle de abertura dos modais de criação/detalhes e o cálculo de expediente da agenda.
Utiliza provide/inject para permitir múltiplos calendários independentes na mesma página.
========
*/
import { ref, watch, provide, inject, type InjectionKey } from 'vue';
import { extrairDataHoraLocal, formatarDataIso, converterParaUtc, converterHoraParaMinutos } from '../utils/datasAgenda';
import { useAgendaApi } from './useAgendaApi';
import { useAgendaConfig } from './useAgendaConfig';
import { padroesConfigAgenda } from '../config/agendaDefaults';
import type {
    ConfiguracaoEntradaAgenda,
    FormatoDataSimplesVueCal,
    FuncaoValidarCamposExtras,
    ContextoValidacaoCamposExtras
} from '../types/agenda';

export type { ConfiguracaoEntradaAgenda, FuncaoValidarCamposExtras, ContextoValidacaoCamposExtras };

// Chave única para injeção segura do contexto da agenda nos componentes filhos.
const CHAVE_CONTEXTO_AGENDA: InjectionKey<RetornoContextoAgenda> = Symbol('contexto-v-data-agenda');

// Recebe os detalhes da agenda e devolve o conjunto de dias da semana (padrão Python 0=Seg..6=Dom) que possuem horários reserváveis.
function obterDiasSemanaPermitidos(detalhes: any): Set<number> {
    const diaInicioPython = Number(detalhes.dia_inicio_semana_agenda ?? 0);
    const diasVisiveis = Number(detalhes.dias_visiveis_agenda ?? 7);
    const permitidos = new Set<number>();

    for (let i = 0; i < diasVisiveis; i++) {
        const diaIndice = (diaInicioPython + i) % 7;
        const periodosDoDia = Array.isArray(detalhes.periodos_agenda)
            ? detalhes.periodos_agenda[diaIndice]
            : null;

        const possuiHorario = Array.isArray(periodosDoDia)
            ? periodosDoDia.some((p: any) => Boolean(p.reservavel_periodo))
            : true;

        if (possuiHorario) {
            permitidos.add(diaIndice);
        }
    }
    return permitidos;
}

// Recebe a matriz de períodos da agenda e devolve o menor horário inicial e o maior horário final em minutos.
function calcularLimitesExpediente(periodosAgenda: any[][]): { inicio: number; fim: number } | null {
    let menorMinuto = 24 * 60;
    let maiorMinuto = 0;

    for (const dia of periodosAgenda) {
        for (const periodo of dia) {
            if (!periodo.reservavel_periodo) continue;
            const inicio = converterHoraParaMinutos(periodo.hora_inicio_periodo);
            const fim = converterHoraParaMinutos(periodo.hora_fim_periodo);

            if (inicio < menorMinuto) menorMinuto = inicio;
            if (fim > maiorMinuto) maiorMinuto = fim;
        }
    }

    if (menorMinuto >= 24 * 60 || maiorMinuto <= 0) return null;
    return { inicio: menorMinuto, fim: maiorMinuto };
}

// Cria uma instância isolada contendo os estados reativos, controle de modais e métodos da API da agenda.
function criarContextoAgenda(
    propsRaiz: Record<string, any> = padroesConfigAgenda,
    emitRaiz?: (evento: 'before-save', payload: any) => void
) {
    // Instância do cliente HTTP usada pelas requisições desta agenda.
    const clienteApi = ref<any>(propsRaiz.fetch || null);

    // Configuração reativa mesclada automaticamente com os padrões da agenda.
    const { configEntrada } = useAgendaConfig(propsRaiz);

    // Função registrada pela visão ativa para recarregar a tela após criar, editar ou excluir reservas.
    let callbackAtualizarVisaoAtiva: (() => void) | null = null;

    // Função resolve temporária do vue-cal usada para limpar o bloco fantasma ao fechar o modal.
    let resolverCriacaoProvisoria: ((confirmado: boolean) => void) | null = null;

    // Estados de controle dos modais centralizados de reserva e de visualização de detalhes.
    const modalReservaAberto = ref(false);
    const dadosParaModal = ref<Record<string, any>>({});
    const modalDetalhesAberto = ref(false);
    const reservaSelecionadaDetalhes = ref<any>(null);

    // Listas de dados vindos da API e seleções ativas de agenda e recurso.
    const reservasBrutas = ref<any[]>([]);
    const recursosDisponiveis = ref<any[]>([]);
    const agendasDisponiveis = ref<any[]>([]);
    const agendaSelecionada = ref<number | null>(null);
    const recursoSelecionado = ref<number | null>(null);
    const dadosMatrix = ref<any>({});

    // Estados de navegação temporal e limites visuais do calendário.
    const dataSelecionada = ref(new Date());
    const dataVisao = ref(new Date());
    const visaoAtiva = ref('week');
    const minutosInicio = ref(8 * 60);
    const minutosFim = ref(19 * 60);
    const datasDesabilitadas = ref<FormatoDataSimplesVueCal[]>([]);

    // Atualiza os limites de expediente e calcula as datas sem expediente para a agenda informada.
    const processarDetalhesAgenda = (idAgenda: number) => {
        const agenda = agendasDisponiveis.value.find(a => Number(a.id_agenda) === Number(idAgenda));
        if (!agenda?.detalhes) return;

        const detalhes = agenda.detalhes;
        const diasPermitidos = obterDiasSemanaPermitidos(detalhes);
        const anoBase = (dataVisao.value || new Date()).getFullYear();
        const datasInativas: FormatoDataSimplesVueCal[] = [];

        for (let ano = anoBase - 1; ano <= anoBase + 1; ano++) {
            const cursorData = new Date(ano, 0, 1);
            while (cursorData.getFullYear() === ano) {
                const diaPython = (cursorData.getDay() + 6) % 7;
                if (!diasPermitidos.has(diaPython)) {
                    datasInativas.push(formatarDataIso(cursorData) as FormatoDataSimplesVueCal);
                }
                cursorData.setDate(cursorData.getDate() + 1);
            }
        }
        datasDesabilitadas.value = datasInativas;

        if (Array.isArray(detalhes.periodos_agenda)) {
            const limites = calcularLimitesExpediente(detalhes.periodos_agenda);
            if (limites) {
                minutosInicio.value = limites.inicio;
                minutosFim.value = limites.fim;
            }
        }
    };

    const servicoApi = useAgendaApi(
        clienteApi,
        recursosDisponiveis,
        recursoSelecionado,
        agendasDisponiveis,
        agendaSelecionada,
        reservasBrutas,
        dadosMatrix,
        processarDetalhesAgenda
    );

    watch(() => propsRaiz.fetch, (novaApi) => {
        if (novaApi) clienteApi.value = novaApi;
    });

    watch(agendaSelecionada, (novoId) => {
        if (novoId) processarDetalhesAgenda(novoId);
    });

    watch(recursoSelecionado, (novoId) => {
        if (!novoId) return;
        const recurso = recursosDisponiveis.value.find(r => r.id_recurso === novoId);
        if (recurso?.id_agenda) processarDetalhesAgenda(recurso.id_agenda);
    });

    // Registra o callback da visão ativa que deve ser executado quando reservas forem salvas ou excluídas.
    const registrarAtualizadorVisao = (fn: () => void) => {
        callbackAtualizarVisaoAtiva = fn;
    };

    // Remove a marcação provisória criada pelo arrasto no vue-cal caso o modal seja fechado.
    const encerrarCriacaoProvisoria = () => {
        if (resolverCriacaoProvisoria) {
            resolverCriacaoProvisoria(false);
            resolverCriacaoProvisoria = null;
        }
    };

    // Abre o modal de criação preenchido com o intervalo de data e hora selecionado na grade.
    const abrirModalCriacao = (dadosIniciais: Record<string, any>, resolverVueCal?: (confirmado: boolean) => void) => {
        resolverCriacaoProvisoria = resolverVueCal || null;
        dadosParaModal.value = dadosIniciais;
        modalReservaAberto.value = true;
    };

    // Abre o modal de inspeção de detalhes para a reserva clicada.
    const abrirModalDetalhes = (reserva: any) => {
        if (!reserva) return;
        reservaSelecionadaDetalhes.value = reserva;
        modalDetalhesAberto.value = true;
    };

    // Fecha o modal de detalhes e abre o modal de formulário configurado para editar a reserva selecionada.
    const abrirModalEdicao = (reserva: any) => {
        if (!reserva) return;
        const inicio = extrairDataHoraLocal(reserva.data_inicio_reserva);
        const fim = extrairDataHoraLocal(reserva.data_fim_reserva);

        modalDetalhesAberto.value = false;
        dadosParaModal.value = {
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
            payload: reserva.payload,
            payload_recurso: reserva.payload_recurso
        };
        modalReservaAberto.value = true;
    };

    // Limpa estados provisórios do calendário e dispara a recarga da visão atual.
    const recarregarVisaoAtiva = () => {
        encerrarCriacaoProvisoria();
        callbackAtualizarVisaoAtiva?.();
    };

    // Dispara o evento before-save no componente VDataAgenda quando o modo interceptador está ativo.
    const dispararAntesDeSalvar = (eventoInterceptador: any) => {
        emitRaiz?.('before-save', eventoInterceptador);
    };

    // Atualiza manualmente a instância do cliente HTTP.
    const definirClienteApi = (novaApi: any) => {
        if (novaApi) clienteApi.value = novaApi;
    };

    return {
        configEntrada,
        dispararAntesDeSalvar,
        definirClienteApi,
        modalReservaAberto,
        dadosParaModal,
        modalDetalhesAberto,
        reservaSelecionadaDetalhes,
        registrarAtualizadorVisao,
        abrirModalCriacao,
        abrirModalDetalhes,
        abrirModalEdicao,
        encerrarCriacaoProvisoria,
        recarregarVisaoAtiva,
        reservasBrutas,
        recursosDisponiveis,
        recursoSelecionado,
        agendasDisponiveis,
        agendaSelecionada,
        dataSelecionada,
        dataVisao,
        visaoAtiva,
        minutosInicio,
        minutosFim,
        datasDesabilitadas,
        dadosMatrix,
        converterParaUtc,
        ...servicoApi
    };
}

export type RetornoContextoAgenda = ReturnType<typeof criarContextoAgenda>;

let contextoPadraoFallback: RetornoContextoAgenda | null = null;

// Instancia e provê o contexto isolado da agenda para a árvore de componentes do VDataAgenda.
export function proverContextoAgenda(
    propsRaiz: Record<string, any>,
    emitRaiz?: (evento: 'before-save', payload: any) => void
) {
    const contexto = criarContextoAgenda(propsRaiz, emitRaiz);
    provide(CHAVE_CONTEXTO_AGENDA, contexto);
    return contexto;
}

// Recupera o contexto da instância do VDataAgenda mais próxima na árvore de componentes.
export function useAgenda(apiOpcional?: any): RetornoContextoAgenda {
    const contextoInjetado = inject(CHAVE_CONTEXTO_AGENDA, null);

    if (contextoInjetado) {
        if (apiOpcional) contextoInjetado.definirClienteApi(apiOpcional);
        return contextoInjetado;
    }

    if (!contextoPadraoFallback) {
        contextoPadraoFallback = criarContextoAgenda({ fetch: apiOpcional });
    } else if (apiOpcional) {
        contextoPadraoFallback.definirClienteApi(apiOpcional);
    }

    return contextoPadraoFallback;
}