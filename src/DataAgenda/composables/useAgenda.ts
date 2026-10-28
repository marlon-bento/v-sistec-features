/*
========
Este arquivo encapsula o estado reativo isolado por instância, as propriedades de entrada do VDataAgenda
e a comunicação HTTP com a API nativa de agendamento. Utiliza provide/inject sob uma chave única para
permitir múltiplos componentes VDataAgenda na mesma página sem conflito de estado e sem prop drilling.
========
*/
import { ref, reactive, watch, provide, inject, type InjectionKey } from 'vue';

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

// Cria uma nova instância isolada com todos os estados reativos, configurações e métodos da API de agendamento.
// É usada internamente para garantir que cada VDataAgenda na tela tenha seu próprio escopo independente.
function criarContextoAgenda(apiInicial?: any) {
    // Armazena a instância do cliente HTTP configurada para esta agenda.
    const clienteApi = ref<any>(apiInicial || null);

    // Armazena a função de callback que dispara o evento before-save no VDataAgenda desta instância.
    let callbackAntesDeSalvar: ((evento: any) => void) | null = null;

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

    // Armazena a lista de reservas retornadas pela API para o período visível.
    const reservasBrutas = ref<any[]>([]);

    // Armazena a lista de recursos permitidos para a aplicação cliente.
    const recursosDisponiveis = ref<any[]>([]);

    // Armazena a lista de agendas associadas aos recursos carregados.
    const agendasDisponiveis = ref<any[]>([]);

    // Armazena o identificador numérico da agenda atualmente selecionada no modo tabela.
    const agendaSelecionada = ref<number | null>(null);

    // Armazena o identificador numérico do recurso atualmente selecionado no modo calendário.
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

    // Armazena a estrutura de datas, recursos e slots para renderização da visão em matriz.
    const dadosMatrix = ref<any>({});

    // Armazena a matriz semanal de períodos de uma agenda específica.
    const periodsAgenda = ref<any[]>([]);

    // Recebe o objeto de props do VDataAgenda e a função emit, mantendo o estado desta instância sincronizado.
    // É usada pelo VDataAgenda na montagem para vincular reativamente suas entradas.
    const sincronizarEntradaAgenda = (
        propsRaiz: Record<string, any>,
        emitRaiz?: (evento: 'before-save', payload: any) => void
    ) => {
        if (emitRaiz) {
            callbackAntesDeSalvar = (payload: any) => emitRaiz('before-save', payload);
        }

        watch(
            () => propsRaiz,
            (novasProps) => {
                if (novasProps.fetch) {
                    clienteApi.value = novasProps.fetch;
                }
                configEntrada.tituloObrigatorio = Boolean(novasProps.tituloObrigatorio);
                configEntrada.labelTituloModal = novasProps.labelTituloModal ?? 'Nome da Reserva';
                configEntrada.placeholderTituloModal = novasProps.placeholderTituloModal ?? 'Ex: Treinamento';
                configEntrada.mensagemErroTitulo = novasProps.mensagemErroTitulo ?? '';
                configEntrada.modoLayout = novasProps.modoLayout ?? 'calendario';
                configEntrada.idRecursoUnico = novasProps.idRecursoUnico ?? null;
                configEntrada.usaInterceptador = Boolean(novasProps.usaInterceptador);
                configEntrada.usuarioLogado = novasProps.usuarioLogado ?? '';
                configEntrada.tituloPadrao = novasProps.tituloPadrao ?? '';
                configEntrada.ocultarTituloModal = Boolean(novasProps.ocultarTituloModal);
                configEntrada.configuracaoBlocos = novasProps.configuracaoBlocos ?? null;
            },
            { immediate: true, deep: true }
        );
    };

    // Recebe o payload do interceptador e dispara diretamente o evento before-save no VDataAgenda desta instância.
    // É usada pelo composable do formulário de reserva quando usaInterceptador está ativo.
    const dispararAntesDeSalvar = (eventoInterceptador: any) => {
        if (callbackAntesDeSalvar) {
            callbackAntesDeSalvar(eventoInterceptador);
        }
    };

    // Recebe strings de data (YYYY-MM-DD) e hora (HH:MM) locais e devolve a string em UTC (ISO 8601).
    // É usada para converter os horários escolhidos pelo usuário antes de enviar para o backend.
    const converterParaUtc = (dataStr: string, horaStr: string) => {
        const d = new Date(`${dataStr}T${horaStr}:00`);
        const ano = d.getUTCFullYear();
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const horas = String(d.getUTCHours()).padStart(2, '0');
        const minutos = String(d.getUTCMinutes()).padStart(2, '0');
        const segundos = String(d.getUTCSeconds()).padStart(2, '0');
        return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}Z`;
    };

    // Recebe o ID da agenda selecionada e não devolve retorno.
    // É usada para calcular os dias da semana desabilitados e os limites de horário a partir dos detalhes da agenda.
    const processarDetalhesAgenda = (idAgenda: number) => {
        const agenda = agendasDisponiveis.value.find(a => a.id_agenda === idAgenda);
        if (!agenda || !agenda.detalhes) return;
        const detalhes = agenda.detalhes;

        if (detalhes.dia_inicio_semana_agenda !== undefined && detalhes.dias_visiveis_agenda !== undefined) {
            const diaInicioPython = parseInt(detalhes.dia_inicio_semana_agenda);
            const diasVisiveis = parseInt(detalhes.dias_visiveis_agenda);
            const diasPermitidosPython = new Set<number>();

            for (let i = 0; i < diasVisiveis; i++) {
                diasPermitidosPython.add((diaInicioPython + i) % 7);
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
        }

        if (detalhes.periodos_agenda && Array.isArray(detalhes.periodos_agenda)) {
            let menorMinuto = 24 * 60;
            let maiorMinuto = 0;

            detalhes.periodos_agenda.forEach((dia: any[]) => {
                dia.forEach((periodo: any) => {
                    if (periodo.reservavel_periodo) {
                        const [horaInicio, minInicio] = periodo.hora_inicio_periodo.split(':');
                        const [horaFim, minFim] = periodo.hora_fim_periodo.split(':');
                        const tempoInicio = parseInt(horaInicio) * 60 + parseInt(minInicio);
                        const tempoFim = parseInt(horaFim) * 60 + parseInt(minFim);
                        if (tempoInicio < menorMinuto) menorMinuto = tempoInicio;
                        if (tempoFim > maiorMinuto) maiorMinuto = tempoFim;
                    }
                });
            });

            if (menorMinuto < 24 * 60) minutosInicio.value = menorMinuto;
            if (maiorMinuto > 0) minutosFim.value = maiorMinuto;
        }
    };

    // Não recebe parâmetros e devolve uma Promise.
    // É usada na inicialização para buscar a lista de recursos permitidos e os detalhes de cada agenda vinculada.
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

                const mapaAgendas = new Map<number, { id_agenda: number, nome_agenda: string, detalhes?: any }>();

                dados.recursos.forEach((r: any) => {
                    const idAg = r.id_agenda;
                    if (idAg !== undefined && idAg !== null) {
                        const nomeAgenda = r.nome_agenda || `Agenda ${idAg}`;
                        if (!mapaAgendas.has(idAg)) {
                            mapaAgendas.set(idAg, { id_agenda: idAg, nome_agenda: nomeAgenda });
                        }
                    }
                });

                for (const [idAg, agendaObj] of mapaAgendas.entries()) {
                    try {
                        const respDetalhes = await clienteApi.value.get(`/agendas/${idAg}/detalhes/`);
                        const detalhes = respDetalhes.data || respDetalhes;
                        agendaObj.detalhes = detalhes;

                        if (detalhes && detalhes.nome_agenda) {
                            agendaObj.nome_agenda = detalhes.nome_agenda;
                        }
                    } catch (e) {
                        console.error("Erro ao buscar detalhes da agenda", idAg);
                    }
                }

                agendasDisponiveis.value = Array.from(mapaAgendas.values());

                if (agendasDisponiveis.value.length > 0 && !agendaSelecionada.value) {
                    agendaSelecionada.value = agendasDisponiveis.value[0].id_agenda;
                    processarDetalhesAgenda(agendasDisponiveis.value[0].id_agenda);
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
            const idAg = recurso?.id_agenda;
            if (idAg) processarDetalhesAgenda(idAg);
        }
    });

    // Recebe as datas de início e fim do filtro e atualiza a lista reativa reservasBrutas.
    // É usada para buscar todas as reservas ativas dentro da janela de visualização do usuário.
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
    // É usada pelos componentes de grade semanal para montar a malha de horários e recursos.
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
        try {
            const resposta = await clienteApi.value.post('/reservas/', payload);
            return resposta;
        } catch (erro) {
            console.error("Erro na API ao criar reserva:", erro);
            throw erro;
        }
    };

    // Recebe o código de referência da reserva e o payload de atualização, devolvendo os dados atualizados.
    const editarReserva = async (codigoReferenciaReserva: string, payload: any) => {
        try {
            const resposta = await clienteApi.value.put(`/reservas/${codigoReferenciaReserva}/`, payload);
            return resposta.data || resposta;
        } catch (erro) {
            console.error("Erro na API ao editar reserva:", erro);
            throw erro;
        }
    };

    // Recebe o código de referência da reserva e solicita a remoção definitiva do vínculo com o grupo de recorrência.
    const desvincularReservaGrupo = async (codigoReferenciaReserva: string) => {
        try {
            const resposta = await clienteApi.value.post(`/reservas/${codigoReferenciaReserva}/desvincular/`, {});
            return resposta.data || resposta;
        } catch (erro) {
            console.error("Erro na API ao desvincular reserva do grupo:", erro);
            throw erro;
        }
    };

    // Recebe o ID da agenda e armazena seus períodos em periodsAgenda.
    const buscarPeriodosAgenda = async (idAgenda: number | string) => {
        if (!clienteApi.value) return;
        try {
            const resposta = await clienteApi.value.get(`/agendas/${idAgenda}/detalhes/`);
            const dados = resposta.data || resposta;
            periodsAgenda.value = dados.periodos_agenda || [];
        } catch (e) {
            console.error("Erro ao buscar períodos da agenda:", e);
            periodsAgenda.value = [];
        }
    };

    // Recebe o código de referência único da reserva e devolve os dados completos vindos da API.
    const obterDetalhesReserva = async (codigoReferenciaReserva: string) => {
        try {
            const resposta = await clienteApi.value.get(`/reservas/${codigoReferenciaReserva}/`);
            return resposta.data || resposta;
        } catch (erro) {
            console.error("Erro ao buscar detalhes da reserva:", erro);
            throw erro;
        }
    };

    // Recebe o código de referência único da reserva e a flag opcional cancelarGrupo para exclusão na API.
    const excluirReserva = async (codigoReferenciaReserva: string, cancelarGrupo = false) => {
        try {
            const sufixoQuery = cancelarGrupo ? '?cancelar_grupo=true' : '';
            const resposta = await clienteApi.value.delete(`/reservas/${codigoReferenciaReserva}/${sufixoQuery}`);
            return resposta;
        } catch (erro) {
            console.error("Erro ao excluir reserva:", erro);
            throw erro;
        }
    };

    // Recebe o objeto padronizado da reserva recorrente e envia para a rota de criação em lote.
    const criarReservaRecorrente = async (payload: any) => {
        try {
            const resposta = await clienteApi.value.post('/reservas/recorrentes/', payload);
            return resposta;
        } catch (erro) {
            console.error("Erro na API ao criar reserva recorrente:", erro);
            throw erro;
        }
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
        carregarRecursosEAgendas,
        buscarReservas,
        buscarSlotsMatrix,
        criarReserva,
        editarReserva,
        desvincularReservaGrupo,
        converterParaUtc,
        periodsAgenda,
        buscarPeriodosAgenda,
        obterDetalhesReserva,
        excluirReserva,
        criarReservaRecorrente
    };
}

export type RetornoContextoAgenda = ReturnType<typeof criarContextoAgenda>;

// Instância de segurança caso useAgenda seja chamado fora de uma árvore VDataAgenda.
let contextoPadraoFallback: RetornoContextoAgenda | null = null;

// Recebe as props e o emit do componente raiz VDataAgenda, cria uma instância isolada, provê para todos os filhos e a devolve.
// É usada exclusivamente no setup do VDataAgenda.vue para permitir múltiplos calendários independentes na mesma tela.
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
// É usada por todos os subcomponentes e composables filhos sem precisar repassar propriedades.
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