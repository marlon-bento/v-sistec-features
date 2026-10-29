/*
========
Este arquivo encapsula o estado reativo isolado por instância, as propriedades de entrada do VDataAgenda,
o controle centralizado dos modais de reserva/detalhes e a comunicação HTTP com a API nativa de agendamento.
Utiliza provide/inject sob uma chave única para permitir múltiplos componentes VDataAgenda na mesma página.
========
*/
import { ref, reactive, computed, watch, provide, inject, type InjectionKey } from 'vue';
import { extrairDataHoraLocal } from './useGradeCompartilhada';

type FormatoDataSimplesVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export interface ConfiguracaoEntradaAgenda {
    tituloObrigatorio: boolean;
    labelTituloModal: string;
    placeholderTituloModal: string;
    mensagemErroTitulo: string;
    modoLayout: 'calendario' | 'tabela' | 'tabela-horario';
    idRecursoUnico: number | string | null;
    usaInterceptador: boolean;
    usuarioLogado: string;
    tituloPadrao: string;
    ocultarTituloModal: boolean;
    configuracaoBlocos: any;
}

// Chave tipada para injeção segura do contexto da agenda na árvore de componentes.
const CHAVE_CONTEXTO_AGENDA: InjectionKey<RetornoContextoAgenda> = Symbol('contexto-v-data-agenda');

// Cria uma nova instância isolada com todos os estados reativos, modais, configurações e métodos da API de agendamento.
function criarContextoAgenda(apiInicial?: any) {
    // Armazena a instância do cliente HTTP configurada para esta agenda.
    const clienteApi = ref<any>(apiInicial || null);

    // Armazena a função de callback que dispara o evento before-save no VDataAgenda desta instância.
    let callbackAntesDeSalvar: ((evento: any) => void) | null = null;

    // Armazena a função de atualização registrada pela visão ativa no momento (calendário ou grade semanal).
    let callbackAtualizarVisaoAtiva: (() => void) | null = null;

    // Armazena a função resolve temporária do vue-cal para limpar o evento fantasma ao fechar ou salvar o modal.
    let resolverCriacaoProvisoria: ((confirmado: boolean) => void) | null = null;

    // Armazena de forma reativa todas as propriedades de configuração passadas para o VDataAgenda.
    const configEntrada = reactive<ConfiguracaoEntradaAgenda>({
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

    // Controla a visibilidade do ModalReserva centralizado no VDataAgenda.
    const modalReservaAberto = ref(false);

    // Armazena os dados iniciais enviados para o ModalReserva ao criar ou editar um agendamento.
    const dadosParaModal = ref<Record<string, any>>({});

    // Controla a visibilidade do ModalDetalhesReserva centralizado no VDataAgenda.
    const modalDetalhesAberto = ref(false);

    // Armazena o objeto da reserva atualmente selecionada para inspeção no ModalDetalhesReserva.
    const reservaSelecionadaDetalhes = ref<any>(null);

    // Armazena a lista de reservas retornadas pela rota de reservas para o modo calendário.
    const reservasBrutas = ref<any[]>([]);

    // Armazena a lista de recursos permitidos para a aplicação cliente.
    const recursosDisponiveis = ref<any[]>([]);

    // Armazena a lista de agendas associadas aos recursos carregados.
    const agendasDisponiveis = ref<any[]>([]);

    // Armazena o identificador numérico da agenda atualmente selecionada.
    const agendaSelecionada = ref<number | null>(null);

    // Armazena o identificador numérico do recurso atualmente selecionado.
    const recursoSelecionado = ref<number | null>(null);

    // Armazena a data de foco selecionada pelo usuário.
    const dataSelecionada = ref(new Date());

    // Armazena a data de referência da visualização atual do calendário.
    const dataVisao = ref(new Date());

    // Armazena o modo de exibição ativo do calendário ('day' ou 'week').
    const visaoAtiva = ref('week');

    // Armazena o limite inicial do expediente diário em minutos (padrão 08:00).
    const minutosInicio = ref(8 * 60);

    // Armazena o limite final do expediente diário em minutos (padrão 19:00).
    const minutosFim = ref(19 * 60);

    // Armazena as datas (YYYY-MM-DD) que devem ficar desabilitadas no calendário por não serem dias operacionais.
    const datasDesabilitadas = ref<FormatoDataSimplesVueCal[]>([]);

    // Armazena a estrutura de datas, recursos e slots retornada pelo endpoint de matriz do backend.
    const dadosMatrix = ref<any>({});

    // Unifica as reservas ativas para checagem de conflito no formulário, aproveitando os detalhes_reserva
    // que o backend já envia dentro de dadosMatrix nos modos de tabela sem precisar de uma segunda requisição.
    const reservasAtivas = computed(() => {
        if (configEntrada.modoLayout === 'calendario' || !dadosMatrix.value?.datas_matriz) {
            return reservasBrutas.value;
        }
        const mapaUnico = new Map<string, any>();
        dadosMatrix.value.datas_matriz.forEach((dia: any) => {
            (dia.recursos_slot || []).forEach((rec: any) => {
                (rec.horarios_slot || []).forEach((slot: any) => {
                    const det = slot.detalhes_reserva;
                    if (det?.codigo_referencia_reserva && !mapaUnico.has(det.codigo_referencia_reserva)) {
                        mapaUnico.set(det.codigo_referencia_reserva, det);
                    }
                });
            });
        });
        return Array.from(mapaUnico.values());
    });

    // Registra a função que recarrega os dados da visão ativa quando uma reserva é criada, editada ou excluída.
    const registrarAtualizadorVisao = (fn: () => void) => {
        callbackAtualizarVisaoAtiva = fn;
    };

    // Limpa a marcação provisória de criação na grade do vue-cal caso exista uma pendente.
    const encerrarCriacaoProvisoria = () => {
        if (resolverCriacaoProvisoria) {
            resolverCriacaoProvisoria(false);
            resolverCriacaoProvisoria = null;
        }
    };

    // Recebe os dados iniciais do intervalo selecionado e abre o modal de criação de reserva.
    const abrirModalCriacao = (dadosIniciais: Record<string, any>, resolverVueCal?: (confirmado: boolean) => void) => {
        resolverCriacaoProvisoria = resolverVueCal || null;
        dadosParaModal.value = dadosIniciais;
        modalReservaAberto.value = true;
    };

    // Recebe o objeto de uma reserva ocupada e abre o modal de visualização de detalhes.
    const abrirModalDetalhes = (reserva: any) => {
        if (!reserva) return;
        reservaSelecionadaDetalhes.value = reserva;
        modalDetalhesAberto.value = true;
    };

    // Fecha o modal de detalhes e abre o ModalReserva preenchido no modo de edição para a reserva informada.
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
            payload: reserva.payload
        };
        modalReservaAberto.value = true;
    };

    // Finaliza a criação provisória se houver e solicita que a visão ativa recarregue seus dados da API.
    const recarregarVisaoAtiva = () => {
        encerrarCriacaoProvisoria();
        if (callbackAtualizarVisaoAtiva) {
            callbackAtualizarVisaoAtiva();
        }
    };

    // Recebe o objeto de props do VDataAgenda e a função emit, mantendo o estado desta instância sincronizado.
    const sincronizarEntradaAgenda = (
        propsRaiz: Record<string, any>,
        emitRaiz?: (evento: 'before-save', payload: any) => void
    ) => {
        if (emitRaiz) {
            callbackAntesDeSalvar = (payload: any) => emitRaiz('before-save', payload);
        }

        watch(
            () => [
                propsRaiz.fetch,
                propsRaiz.tituloObrigatorio,
                propsRaiz.labelTituloModal,
                propsRaiz.placeholderTituloModal,
                propsRaiz.mensagemErroTitulo,
                propsRaiz.modoLayout,
                propsRaiz.idRecursoUnico,
                propsRaiz.usaInterceptador,
                propsRaiz.usuarioLogado,
                propsRaiz.tituloPadrao,
                propsRaiz.ocultarTituloModal,
                propsRaiz.configuracaoBlocos
            ],
            () => {
                if (propsRaiz.fetch) {
                    clienteApi.value = propsRaiz.fetch;
                }
                configEntrada.tituloObrigatorio = Boolean(propsRaiz.tituloObrigatorio);
                configEntrada.labelTituloModal = propsRaiz.labelTituloModal ?? 'Nome da Reserva';
                configEntrada.placeholderTituloModal = propsRaiz.placeholderTituloModal ?? 'Ex: Treinamento';
                configEntrada.mensagemErroTitulo = propsRaiz.mensagemErroTitulo ?? '';
                configEntrada.modoLayout = propsRaiz.modoLayout ?? 'calendario';
                configEntrada.idRecursoUnico = propsRaiz.idRecursoUnico ?? null;
                configEntrada.usaInterceptador = Boolean(propsRaiz.usaInterceptador);
                configEntrada.usuarioLogado = propsRaiz.usuarioLogado ?? '';
                configEntrada.tituloPadrao = propsRaiz.tituloPadrao ?? '';
                configEntrada.ocultarTituloModal = Boolean(propsRaiz.ocultarTituloModal);
                configEntrada.configuracaoBlocos = propsRaiz.configuracaoBlocos ?? null;
            },
            { immediate: true }
        );
    };

    // Recebe o payload do interceptador e dispara diretamente o evento before-save no VDataAgenda desta instância.
    const dispararAntesDeSalvar = (eventoInterceptador: any) => {
        if (callbackAntesDeSalvar) {
            callbackAntesDeSalvar(eventoInterceptador);
        }
    };

    // Recebe strings de data (YYYY-MM-DD) e hora (HH:MM) locais e devolve a string em UTC (ISO 8601 sem milissegundos).
    const converterParaUtc = (dataStr: string, horaStr: string) => {
        const d = new Date(`${dataStr}T${horaStr}:00`);
        return `${d.toISOString().slice(0, 19)}Z`;
    };

    // Recebe o ID da agenda selecionada e calcula os dias desabilitados e os limites de expediente a partir dos detalhes da agenda.
    const processarDetalhesAgenda = (idAgenda: number) => {
        const agenda = agendasDisponiveis.value.find(a => Number(a.id_agenda) === Number(idAgenda));
        if (!agenda?.detalhes) return;
        const detalhes = agenda.detalhes;

        const diaInicioPython = Number(detalhes.dia_inicio_semana_agenda ?? 0);
        const diasVisiveis = Number(detalhes.dias_visiveis_agenda ?? 7);
        const diasPermitidosPython = new Set<number>();

        for (let i = 0; i < diasVisiveis; i++) {
            const diaIndice = (diaInicioPython + i) % 7;
            const periodosDoDia = Array.isArray(detalhes.periodos_agenda)
                ? detalhes.periodos_agenda[diaIndice]
                : null;

            const possuiHorarioReservavel = Array.isArray(periodosDoDia)
                ? periodosDoDia.some((p: any) => Boolean(p.reservavel_periodo))
                : true;

            if (possuiHorarioReservavel) {
                diasPermitidosPython.add(diaIndice);
            }
        }

        const datas: FormatoDataSimplesVueCal[] = [];
        const anoAtual = new Date().getFullYear();

        for (let ano = anoAtual - 1; ano <= anoAtual + 1; ano++) {
            for (let mes = 0; mes < 12; mes++) {
                const diasNoMes = new Date(ano, mes + 1, 0).getDate();
                for (let dia = 1; dia <= diasNoMes; dia++) {
                    const dataAtual = new Date(ano, mes, dia);
                    const diaPython = (dataAtual.getDay() + 6) % 7;

                    if (!diasPermitidosPython.has(diaPython)) {
                        const anoStr = dataAtual.getFullYear();
                        const mesStr = String(dataAtual.getMonth() + 1).padStart(2, '0');
                        const diaStr = String(dataAtual.getDate()).padStart(2, '0');
                        datas.push(`${anoStr}-${mesStr}-${diaStr}` as FormatoDataSimplesVueCal);
                    }
                }
            }
        }
        datasDesabilitadas.value = datas;

        if (Array.isArray(detalhes.periodos_agenda)) {
            let menorMinuto = 24 * 60;
            let maiorMinuto = 0;

            detalhes.periodos_agenda.forEach((dia: any[]) => {
                dia.forEach((periodo: any) => {
                    if (periodo.reservavel_periodo) {
                        const [horaInicio, minInicio] = periodo.hora_inicio_periodo.split(':').map(Number);
                        const [horaFim, minFim] = periodo.hora_fim_periodo.split(':').map(Number);
                        const tempoInicio = horaInicio * 60 + minInicio;
                        const tempoFim = horaFim * 60 + minFim;
                        if (tempoInicio < menorMinuto) menorMinuto = tempoInicio;
                        if (tempoFim > maiorMinuto) maiorMinuto = tempoFim;
                    }
                });
            });

            if (menorMinuto < 24 * 60) minutosInicio.value = menorMinuto;
            if (maiorMinuto > 0) minutosFim.value = maiorMinuto;
        }
    };

    // Busca na inicialização a lista de recursos permitidos e carrega os detalhes de todas as agendas em paralelo.
    const carregarRecursosEAgendas = async () => {
        if (!clienteApi.value) return;
        try {
            const resposta = await clienteApi.value.get('/recursos/');
            const dados = resposta.data || resposta;

            if (dados?.recursos?.length > 0) {
                recursosDisponiveis.value = dados.recursos;

                if (!recursoSelecionado.value) {
                    recursoSelecionado.value = dados.recursos[0].id_recurso;
                }

                const mapaAgendas = new Map<number, { id_agenda: number; nome_agenda: string; detalhes?: any }>();

                dados.recursos.forEach((r: any) => {
                    const idAg = r.id_agenda;
                    if (idAg !== undefined && idAg !== null && !mapaAgendas.has(idAg)) {
                        mapaAgendas.set(idAg, {
                            id_agenda: idAg,
                            nome_agenda: r.nome_agenda || `Agenda ${idAg}`
                        });
                    }
                });

                await Promise.all(
                    Array.from(mapaAgendas.entries()).map(async ([idAg, agendaObj]) => {
                        try {
                            const respDetalhes = await clienteApi.value.get(`/agendas/${idAg}/detalhes/`);
                            const detalhes = respDetalhes.data || respDetalhes;
                            agendaObj.detalhes = detalhes;
                            if (detalhes?.nome_agenda) {
                                agendaObj.nome_agenda = detalhes.nome_agenda;
                            }
                        } catch (e) {
                            console.error("Erro ao buscar detalhes da agenda", idAg, e);
                        }
                    })
                );

                agendasDisponiveis.value = Array.from(mapaAgendas.values());

                if (agendasDisponiveis.value.length > 0) {
                    if (!agendaSelecionada.value) {
                        agendaSelecionada.value = agendasDisponiveis.value[0].id_agenda;
                    }
                    processarDetalhesAgenda(Number(agendaSelecionada.value));
                }
            }
        } catch (erro) {
            console.error("Erro em carregarRecursosEAgendas:", erro);
        }
    };

    watch(agendaSelecionada, (novoId) => {
        if (novoId) processarDetalhesAgenda(novoId);
    });

    watch(recursoSelecionado, (novoId) => {
        if (novoId) {
            const recurso = recursosDisponiveis.value.find(r => r.id_recurso === novoId);
            if (recurso?.id_agenda) processarDetalhesAgenda(recurso.id_agenda);
        }
    });

    // Recebe as datas de início e fim do filtro e atualiza a lista reativa reservasBrutas.
    const buscarReservas = async (dataInicio: string, dataFim: string) => {
        if (!clienteApi.value) return;
        try {
            const resposta = await clienteApi.value.get(`/reservas/?data_inicio_reserva=${dataInicio}&data_fim_reserva=${dataFim}`);
            const dados = resposta.data || resposta;
            if (dados?.reservas) reservasBrutas.value = dados.reservas;
        } catch (erro) {
            console.error("Erro em buscarReservas:", erro);
        }
    };

    // Recebe o ID da agenda e o intervalo de tempo em UTC, atualizando o estado dadosMatrix.
    const buscarSlotsMatrix = async (idAgenda: number, dataInicio: string, dataFim: string) => {
        if (!clienteApi.value) return;
        try {
            const resposta = await clienteApi.value.get(`/agendas/${idAgenda}/slots/?data_inicio_slot=${dataInicio}&data_fim_slot=${dataFim}`);
            dadosMatrix.value = resposta.data || resposta;
        } catch (erro) {
            console.error("Erro ao buscar a malha da matriz:", erro);
        }
    };

    // Recebe o objeto padronizado da reserva e devolve a resposta da API após criar o agendamento.
    const criarReserva = async (payload: any) => {
        const resposta = await clienteApi.value.post('/reservas/', payload);
        return resposta;
    };

    // Recebe o código de referência da reserva e o payload de atualização, devolvendo os dados atualizados.
    const editarReserva = async (codigoReferenciaReserva: string, payload: any) => {
        const resposta = await clienteApi.value.put(`/reservas/${codigoReferenciaReserva}/`, payload);
        return resposta.data || resposta;
    };

    // Recebe o código de referência da reserva e solicita a remoção definitiva do vínculo com o grupo de recorrência.
    const desvincularReservaGrupo = async (codigoReferenciaReserva: string) => {
        const resposta = await clienteApi.value.post(`/reservas/${codigoReferenciaReserva}/desvincular/`, {});
        return resposta.data || resposta;
    };

    // Recebe o código de referência único da reserva e devolve os dados completos vindos da API.
    const obterDetalhesReserva = async (codigoReferenciaReserva: string) => {
        const resposta = await clienteApi.value.get(`/reservas/${codigoReferenciaReserva}/`);
        return resposta.data || resposta;
    };

    // Recebe o código de referência único da reserva e a flag opcional cancelarGrupo para exclusão na API.
    const excluirReserva = async (codigoReferenciaReserva: string, cancelarGrupo = false) => {
        const sufixoQuery = cancelarGrupo ? '?cancelar_grupo=true' : '';
        return await clienteApi.value.delete(`/reservas/${codigoReferenciaReserva}/${sufixoQuery}`);
    };

    // Recebe o objeto padronizado da reserva recorrente e envia para a rota de criação em lote.
    const criarReservaRecorrente = async (payload: any) => {
        return await clienteApi.value.post('/reservas/recorrentes/', payload);
    };

    // Atualiza a instância do cliente HTTP caso seja passada posteriormente.
    const definirClienteApi = (novaApi: any) => {
        if (novaApi) {
            clienteApi.value = novaApi;
        }
    };

    return {
        configEntrada,
        sincronizarEntradaAgenda,
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
        reservasBrutas: reservasAtivas,
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
        carregarRecursosEAgendas,
        buscarReservas,
        buscarSlotsMatrix,
        criarReserva,
        editarReserva,
        desvincularReservaGrupo,
        converterParaUtc,
        obterDetalhesReserva,
        excluirReserva,
        criarReservaRecorrente
    };
}

export type RetornoContextoAgenda = ReturnType<typeof criarContextoAgenda>;

let contextoPadraoFallback: RetornoContextoAgenda | null = null;

// Provê o contexto isolado da agenda para toda a árvore de componentes filhos do VDataAgenda.
export function proverContextoAgenda(
    propsRaiz: Record<string, any>,
    emitRaiz?: (evento: 'before-save', payload: any) => void
) {
    const contexto = criarContextoAgenda(propsRaiz.fetch);
    contexto.sincronizarEntradaAgenda(propsRaiz, emitRaiz);
    provide(CHAVE_CONTEXTO_AGENDA, contexto);
    return contexto;
}

// Recupera automaticamente o contexto da instância do VDataAgenda mais próxima na árvore de componentes.
export function useAgenda(apiOpcional?: any): RetornoContextoAgenda {
    const contextoInjetado = inject(CHAVE_CONTEXTO_AGENDA, null);

    if (contextoInjetado) {
        if (apiOpcional) {
            contextoInjetado.definirClienteApi(apiOpcional);
        }
        return contextoInjetado;
    }

    if (!contextoPadraoFallback) {
        contextoPadraoFallback = criarContextoAgenda(apiOpcional);
    } else if (apiOpcional) {
        contextoPadraoFallback.definirClienteApi(apiOpcional);
    }

    return contextoPadraoFallback;
}