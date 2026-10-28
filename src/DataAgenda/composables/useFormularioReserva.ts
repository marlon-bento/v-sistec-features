/*
========
Este arquivo centraliza o estado reativo, os cálculos de validação de grade e as chamadas de persistência
do formulário de criação e edição de reservas. Ele separa a regra de negócio da camada visual do ModalReserva,
gerenciando edição em lote recorrente, desvinculação de grupo, ajuste automático de horários e interceptação antes de salvar.
========
*/
import { ref, computed, watch, inject } from 'vue';
import { useAgenda } from './useAgenda';
import { criarDataLocal } from './useGradeCompartilhada';

interface OpcoesFormularioReserva {
    api: any;
    obterAberto: () => boolean;
    obterDadosIniciais: () => Record<string, any>;
    obterUsaInterceptador: () => boolean;
    obterOcultarTituloModal?: () => boolean;
    aoSalvar: () => void;
    aoFecharModal: () => void;
    aoAntesDeSalvar: (eventoInterceptador: any) => void;
}

// Recebe as dependências e callbacks do componente de modal e devolve os estados reativos e funções de controle do formulário.
// É usada pelo ModalReserva para isolar a lógica de validação, manipulação de grupo e envio para a API.
export function useFormularioReserva(opcoes: OpcoesFormularioReserva) {
    const configInjetada = inject<any>('config-modal-agenda', null);

    const {
        minutosInicio,
        minutosFim,
        recursosDisponiveis,
        agendasDisponiveis,
        criarReserva,
        criarReservaRecorrente,
        editarReserva,
        desvincularReservaGrupo,
        converterParaUtc,
        reservasBrutas
    } = useAgenda(opcoes.api);

    // Indica se a requisição de salvamento ou edição está em andamento.
    const salvando = ref(false);

    // Indica se a requisição de desvinculação do grupo está em andamento.
    const desvinculando = ref(false);

    // Controla a abertura do modal de confirmação antes de retirar a reserva do grupo.
    const modalConfirmarDesvinculoAberto = ref(false);

    // Indica se o usuário alterou manualmente a data ou horário e precisa revalidar na grade.
    const precisaValidar = ref(false);

    // Controla se os campos de edição manual de data e hora estão visíveis.
    const mostrarAjusteHorario = ref(false);

    // Indica se o novo agendamento será replicado semanalmente (usado apenas na criação).
    const repetirReserva = ref(false);

    // Controla a exibição do subpainel com a listagem de horários disponíveis no dia.
    const exibirHorariosModal = ref(false);

    // Armazena a lista de strings com os intervalos de horários disponíveis para exibição.
    const horariosDisponiveisFormatados = ref<string[]>([]);

    // Armazena o estado de edição e o vínculo de grupo da reserva aberta.
    const estadoEdicao = ref({
        ativo: false,
        codigoReferencia: '',
        grupoRecorrencia: null as string | null,
        datasGrupo: [] as string[],
        foiDesvinculadaNestaSessao: false
    });

    // Armazena o estado e o conteúdo dos modais de feedback (aviso, erro e sucesso).
    const feedbackModal = ref({
        avisoAberto: false,
        perigoAberto: false,
        sucessoAberto: false,
        titulo: '',
        descricao: ''
    });

    // Armazena os dados reativos do formulário de agendamento, incluindo o objeto payload para campos customizados.
    const formReserva = ref<{
        id_recurso: string | number;
        titulo_reserva: string;
        data_inicio: string;
        hora_inicio: string;
        data_fim: string;
        hora_fim: string;
        data_limite_repeticao: string;
        payload: Record<string, any>;
    }>({
        id_recurso: '',
        titulo_reserva: '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
        data_limite_repeticao: '',
        payload: {}
    });

    // Recebe o payload bruto vindo do banco e um booleano indicando se está em edição, devolvendo um objeto isolado.
    // É usada para garantir que o objeto de campos extras esteja sempre limpo e reativo ao abrir o modal.
    const normalizarPayloadInicial = (payloadBruto: any, modoEdicao: boolean): Record<string, any> => {
        if (!modoEdicao || payloadBruto === undefined || payloadBruto === null) {
            return {};
        }
        if (typeof payloadBruto === 'string') {
            try {
                const parsed = JSON.parse(payloadBruto);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return { ...parsed };
                }
                return { valor: parsed };
            } catch {
                return { valor: payloadBruto };
            }
        }
        if (typeof payloadBruto === 'object' && !Array.isArray(payloadBruto)) {
            return JSON.parse(JSON.stringify(payloadBruto));
        }
        return {};
    };

    // Indica se o modal está operando em modo de edição de uma reserva já existente.
    const ehModoEdicao = computed(() => estadoEdicao.value.ativo);

    // Indica se a reserva sendo editada ainda pertence a um grupo de recorrência ativo.
    const editandoEmGrupo = computed(() =>
        ehModoEdicao.value && Boolean(estadoEdicao.value.grupoRecorrencia)
    );

    // Define o título dinâmico do cabeçalho do modal conforme o modo atual.
    const tituloModalPrincipal = computed(() => {
        if (!ehModoEdicao.value) return 'Nova Reserva';
        return editandoEmGrupo.value ? 'Editar Grupo de Recorrência' : 'Editar Reserva';
    });

    // Formata as datas do grupo de recorrência para exibição no painel de cuidado durante a edição.
    const datasGrupoFormatadas = computed(() => {
        return (estadoEdicao.value.datasGrupo || []).map((iso: string) => {
            const dt = criarDataLocal(iso);
            return {
                iso,
                texto: dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                ehAtual: iso === formReserva.value.data_inicio
            };
        });
    });

    // Indica se algum modal de feedback ou confirmação está aberto por cima do formulário de reserva.
    const temDialogoSecundarioAberto = computed(() =>
        feedbackModal.value.avisoAberto ||
        feedbackModal.value.perigoAberto ||
        feedbackModal.value.sucessoAberto ||
        modalConfirmarDesvinculoAberto.value
    );

    // Recebe o título e a descrição e abre o modal de aviso.
    // É usada para alertar sobre campos obrigatórios ou horários fora do expediente.
    const abrirAviso = (titulo: string, descricao: string) => {
        feedbackModal.value.titulo = titulo;
        feedbackModal.value.descricao = descricao;
        feedbackModal.value.avisoAberto = true;
    };

    // Recebe o título e a descrição e abre o modal de perigo.
    // É usada para exibir erros da API ou conflitos de agendamento.
    const abrirPerigo = (titulo: string, descricao: string) => {
        feedbackModal.value.titulo = titulo;
        feedbackModal.value.descricao = descricao;
        feedbackModal.value.perigoAberto = true;
    };

    // Recebe o título e a descrição e abre o modal de sucesso.
    // É usada para confirmar ajustes de grade ou desvinculação de grupo.
    const abrirSucesso = (titulo: string, descricao: string) => {
        feedbackModal.value.titulo = titulo;
        feedbackModal.value.descricao = descricao;
        feedbackModal.value.sucessoAberto = true;
    };

    // Converte a string de data inicial do formulário em um objeto Date local.
    const dataInicioLocal = computed(() => {
        if (!formReserva.value.data_inicio || formReserva.value.data_inicio.split('-').length !== 3) return null;
        const dt = criarDataLocal(formReserva.value.data_inicio);
        return isNaN(dt.getTime()) ? null : dt;
    });

    // Devolve o texto completo do dia selecionado com dia da semana e data formatada.
    const textoDiaSelecionado = computed(() => {
        if (!dataInicioLocal.value) return formReserva.value.data_inicio || 'Data não definida';
        const diaSemana = dataInicioLocal.value.toLocaleDateString('pt-BR', { weekday: 'long' });
        const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
        const dataBr = dataInicioLocal.value.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${diaSemanaCap}, ${dataBr}`;
    });

    // Devolve o nome do dia da semana selecionado para exibir na dica de recorrência.
    const nomeDiaSemana = computed(() => {
        return dataInicioLocal.value ? dataInicioLocal.value.toLocaleDateString('pt-BR', { weekday: 'long' }) : 'semana';
    });

    // Devolve o texto formatado com o intervalo entre a hora de início e a hora de término.
    const textoIntervaloHorario = computed(() => {
        return `Das ${formReserva.value.hora_inicio || '--:--'} até as ${formReserva.value.hora_fim || '--:--'}`;
    });

    // Alterna a visibilidade do painel de edição manual de data e horário.
    const alternarAjusteHorario = () => {
        mostrarAjusteHorario.value = !mostrarAjusteHorario.value;
    };

    // Recebe um valor booleano e atualiza o estado de repetição semanal da reserva.
    const definirRepetirReserva = (valor: boolean) => {
        repetirReserva.value = valor;
    };

    // Sincroniza a data final com a data inicial após edição manual e exige validação na grade antes de salvar.
    const marcarComoAlterado = () => {
        if (formReserva.value.data_inicio) {
            formReserva.value.data_fim = formReserva.value.data_inicio;
            if (formReserva.value.data_limite_repeticao && formReserva.value.data_limite_repeticao < formReserva.value.data_inicio) {
                formReserva.value.data_limite_repeticao = formReserva.value.data_inicio;
            }
        }
        precisaValidar.value = true;
    };

    // Recebe uma string de horário (HH:MM) e devolve o total de minutos desde o início do dia.
    const converterHoraParaMinutos = (horaStr: string) => {
        const [h, m] = horaStr.split(':').map(Number) as [number, number];
        return h * 60 + m;
    };

    // Localiza e ordena os períodos reserváveis do dia selecionado na agenda vinculada ao recurso atual.
    const obterPeriodosReservaveisDoDia = () => {
        if (!formReserva.value.id_recurso || !dataInicioLocal.value) return null;

        const recurso = recursosDisponiveis.value.find((r: any) => Number(r.id_recurso) === Number(formReserva.value.id_recurso));
        const agenda = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(recurso?.id_agenda));
        const periodosAgenda = agenda?.detalhes?.periodos_agenda;
        if (!periodosAgenda) return null;

        const diaDaSemanaPython = (dataInicioLocal.value.getDay() + 6) % 7;
        const periodosDoDia = periodosAgenda[diaDaSemanaPython] || [];

        return periodosDoDia
            .filter((s: any) => s.reservavel_periodo)
            .map((s: any) => ({
                ...s,
                inicioMin: converterHoraParaMinutos(s.hora_inicio_periodo),
                fimMin: converterHoraParaMinutos(s.hora_fim_periodo)
            }))
            .sort((a: any, b: any) => a.inicioMin - b.inicioMin);
    };

    // Verifica os horários disponíveis para a data e recurso escolhidos e abre o overlay ou modal de aviso.
    const mostrarHorariosPossiveis = () => {
        if (!formReserva.value.id_recurso || !formReserva.value.data_inicio) {
            abrirAviso('Dados incompletos', 'Selecione um recurso e uma data para ver os horários possíveis.');
            return;
        }

        const slotsReservaveis = obterPeriodosReservaveisDoDia();
        if (!slotsReservaveis) {
            abrirAviso('Grade indisponível', 'Nenhuma grade de horários foi encontrada para este recurso.');
            return;
        }

        if (slotsReservaveis.length === 0) {
            abrirAviso('Sem horários', 'Nenhum horário disponível para este dia na grade.');
            return;
        }

        horariosDisponiveisFormatados.value = slotsReservaveis.map((s: any) => `${s.hora_inicio_periodo} às ${s.hora_fim_periodo}`);
        exibirHorariosModal.value = true;
    };

    // Recebe um booleano indicando se a operação é silenciosa e encaixa os horários de início e fim nos blocos válidos da grade.
    const ajustarHorarios = (silencioso = false) => {
        if (!formReserva.value.id_recurso || !formReserva.value.data_inicio || !formReserva.value.hora_inicio || !formReserva.value.hora_fim) return;

        const slotsReservaveis = obterPeriodosReservaveisDoDia();
        if (!slotsReservaveis) return;

        if (slotsReservaveis.length === 0) {
            if (!silencioso) {
                abrirAviso('Sem horários', 'Nenhum horário disponível para este dia na grade.');
            }
            return;
        }

        const minInicio = converterHoraParaMinutos(formReserva.value.hora_inicio);
        const minFim = converterHoraParaMinutos(formReserva.value.hora_fim);

        const invertidos = [...slotsReservaveis].reverse();
        const blocoInicio = invertidos.find(b => b.inicioMin <= minInicio) || slotsReservaveis[0];
        const blocoFim = invertidos.find(b => b.inicioMin < minFim) || slotsReservaveis[0];

        const novoInicioMin = blocoInicio.inicioMin;
        const novoFimMin = blocoFim.fimMin <= novoInicioMin ? blocoInicio.fimMin : blocoFim.fimMin;

        const formatarMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

        formReserva.value.hora_inicio = formatarMin(novoInicioMin);
        formReserva.value.hora_fim = formatarMin(novoFimMin);
        formReserva.value.data_fim = formReserva.value.data_inicio;
        precisaValidar.value = false;

        if (!silencioso) {
            abrirSucesso('Horário validado', 'Horário validado e ajustado conforme a grade disponível.');
        }
    };

    // Observa a abertura do modal para hidratar o formulário com os dados iniciais (nova reserva ou edição).
    watch(opcoes.obterAberto, (aberto) => {
        const dadosIniciais = opcoes.obterDadosIniciais();
        if (aberto && dadosIniciais) {
            const dataIni = dadosIniciais.data_inicio ?? '';
            const modoEdicao = Boolean(dadosIniciais.modo_edicao && dadosIniciais.codigo_referencia_reserva);

            estadoEdicao.value = {
                ativo: modoEdicao,
                codigoReferencia: dadosIniciais.codigo_referencia_reserva ?? '',
                grupoRecorrencia: dadosIniciais.grupo_recorrencia_reserva ?? null,
                datasGrupo: Array.isArray(dadosIniciais.datas_grupo_recorrencia_reserva)
                    ? [...dadosIniciais.datas_grupo_recorrencia_reserva]
                    : [],
                foiDesvinculadaNestaSessao: false
            };

            formReserva.value = {
                id_recurso: dadosIniciais.id_recurso ?? '',
                titulo_reserva: dadosIniciais.titulo_reserva ?? '',
                data_inicio: dataIni,
                hora_inicio: dadosIniciais.hora_inicio ?? '',
                data_fim: dadosIniciais.data_fim || dataIni,
                hora_fim: dadosIniciais.hora_fim ?? '',
                data_limite_repeticao: dataIni,
                payload: normalizarPayloadInicial(dadosIniciais.payload, modoEdicao)
            };

            precisaValidar.value = false;
            mostrarAjusteHorario.value = modoEdicao;
            repetirReserva.value = false;
            exibirHorariosModal.value = false;
            ajustarHorarios(true);
        }
    });

    // Solicita na API a desvinculação da reserva do seu grupo de recorrência, liberando a edição individual.
    const confirmarRetiradaDoGrupo = async () => {
        if (!estadoEdicao.value.codigoReferencia) return;

        desvinculando.value = true;
        try {
            await desvincularReservaGrupo(estadoEdicao.value.codigoReferencia);
            estadoEdicao.value.grupoRecorrencia = null;
            estadoEdicao.value.datasGrupo = [];
            estadoEdicao.value.foiDesvinculadaNestaSessao = true;
            modalConfirmarDesvinculoAberto.value = false;
            mostrarAjusteHorario.value = true;
            opcoes.aoSalvar();
            abrirSucesso(
                'Retirada do grupo concluída',
                'Esta reserva agora é independente! Você já pode alterar sua data, horário ou título sem afetar as demais reservas do lote.'
            );
        } catch (erro: any) {
            modalConfirmarDesvinculoAberto.value = false;
            const textoErro = erro.response?.data?.mensagem?.texto
                || erro.response?.data?.detail
                || erro.response?.data?.message
                || 'Não foi possível desvincular a reserva do grupo.';
            abrirPerigo('Erro ao desvincular', textoErro);
        } finally {
            desvinculando.value = false;
        }
    };

    // Recebe o payload final da reserva e executa a chamada HTTP correspondente (criação simples, recorrente ou edição).
    const executarPersistenciaAPI = async (payloadParaEnviar: any) => {
        try {
            if (ehModoEdicao.value) {
                await editarReserva(estadoEdicao.value.codigoReferencia, payloadParaEnviar);
            } else if (repetirReserva.value) {
                await criarReservaRecorrente({
                    ...payloadParaEnviar,
                    data_limite_repeticao: formReserva.value.data_limite_repeticao
                });
            } else {
                await criarReserva(payloadParaEnviar);
            }
            opcoes.aoSalvar();
            opcoes.aoFecharModal();
        } catch (erro: any) {
            const textoErro = erro.response?.data?.mensagem?.texto
                || erro.response?.data?.message
                || erro.response?.data?.detail
                || 'Erro ao processar a reserva na API. Verifique a disponibilidade do horário.';

            abrirPerigo('Falha na operação', textoErro);
        } finally {
            salvando.value = false;
        }
    };

    // Valida os horários, checa obrigatoriedade do título e conflitos locais, e dispara o salvamento direto ou via interceptador.
    const salvarReserva = async () => {
        if (precisaValidar.value) return;

        const ocultarTitulo = Boolean(
            opcoes.obterOcultarTituloModal?.() || configInjetada?.value?.ocultarTituloModal
        );
        const tituloObrigatorio = Boolean(configInjetada?.value?.tituloObrigatorio);

        if (!ocultarTitulo && tituloObrigatorio && !formReserva.value.titulo_reserva.trim()) {
            const labelCampo = configInjetada?.value?.labelTituloModal || 'Nome da Reserva';
            const msgCustom = configInjetada?.value?.mensagemErroTitulo;
            abrirAviso(
                'Campo obrigatório',
                msgCustom || `O campo "${labelCampo}" é obrigatório para realizar o agendamento.`
            );
            return;
        }

        formReserva.value.data_fim = formReserva.value.data_inicio;

        const inicioNovaReserva = new Date(`${formReserva.value.data_inicio}T${formReserva.value.hora_inicio}`);
        const fimNovaReserva = new Date(`${formReserva.value.data_fim}T${formReserva.value.hora_fim}`);

        const minutosInicioReserva = inicioNovaReserva.getHours() * 60 + inicioNovaReserva.getMinutes();
        const minutosFimReserva = fimNovaReserva.getHours() * 60 + fimNovaReserva.getMinutes();

        if (minutosInicioReserva < minutosInicio.value || minutosFimReserva > minutosFim.value) {
            abrirAviso('Fora do expediente', 'O horário selecionado está fora do expediente da agenda.');
            return;
        }

        if (inicioNovaReserva >= fimNovaReserva) {
            abrirAviso('Horário inválido', 'O horário de início deve ser anterior ao término.');
            return;
        }

        if (!ehModoEdicao.value && repetirReserva.value) {
            if (!formReserva.value.data_limite_repeticao) {
                abrirAviso('Data obrigatória', 'Informe a data final para a repetição do agendamento.');
                return;
            }
            if (formReserva.value.data_limite_repeticao < formReserva.value.data_inicio) {
                abrirAviso('Data inválida', 'A data final da repetição deve ser igual ou posterior à data inicial do agendamento.');
                return;
            }
        }

        const conflito = reservasBrutas.value.some((reserva: any) => {
            if (Number(reserva.id_recurso) !== Number(formReserva.value.id_recurso)) return false;

            if (ehModoEdicao.value) {
                if (String(reserva.codigo_referencia_reserva) === String(estadoEdicao.value.codigoReferencia)) {
                    return false;
                }
                if (
                    estadoEdicao.value.grupoRecorrencia &&
                    String(reserva.grupo_recorrencia_reserva) === String(estadoEdicao.value.grupoRecorrencia)
                ) {
                    return false;
                }
            }

            const inicioEvento = new Date(reserva.data_inicio_reserva);
            const fimEvento = new Date(reserva.data_fim_reserva);
            return inicioNovaReserva < fimEvento && fimNovaReserva > inicioEvento;
        });

        if (conflito) {
            abrirPerigo('Conflito de horário', 'Já existe uma reserva para este recurso no horário selecionado.');
            return;
        }

        salvando.value = true;

        const payloadCustomizado = formReserva.value.payload && typeof formReserva.value.payload === 'object'
            ? { ...formReserva.value.payload }
            : {};

        const payloadBase: any = {
            id_recurso: Number(formReserva.value.id_recurso),
            titulo_reserva: formReserva.value.titulo_reserva.trim(),
            data_inicio_reserva: converterParaUtc(formReserva.value.data_inicio, formReserva.value.hora_inicio),
            data_fim_reserva: converterParaUtc(formReserva.value.data_fim, formReserva.value.hora_fim),
            payload: payloadCustomizado
        };

        if (!ehModoEdicao.value && repetirReserva.value) {
            payloadBase.data_limite_repeticao = formReserva.value.data_limite_repeticao;
        }

        if (opcoes.obterUsaInterceptador()) {
            opcoes.aoAntesDeSalvar({
                payloadBase,
                payload: payloadCustomizado,
                modoEdicao: ehModoEdicao.value,
                codigoReferenciaReserva: estadoEdicao.value.codigoReferencia || null,
                grupoRecorrenciaReserva: estadoEdicao.value.grupoRecorrencia || null,
                dadosReserva: {
                    ...formReserva.value,
                    payload: payloadCustomizado,
                    repetir_reserva: repetirReserva.value,
                    modo_edicao: ehModoEdicao.value,
                    codigo_referencia_reserva: estadoEdicao.value.codigoReferencia || null,
                    grupo_recorrencia_reserva: estadoEdicao.value.grupoRecorrencia || null
                },
                proceed: (novoPayloadModificado?: any) => {
                    executarPersistenciaAPI(novoPayloadModificado || payloadBase);
                },
                abort: (callbackAcaoCustomizada?: Function) => {
                    salvando.value = false;
                    if (typeof callbackAcaoCustomizada === 'function') callbackAcaoCustomizada();
                }
            });
        } else {
            await executarPersistenciaAPI(payloadBase);
        }
    };

    return {
        recursosDisponiveis,
        salvando,
        desvinculando,
        modalConfirmarDesvinculoAberto,
        precisaValidar,
        mostrarAjusteHorario,
        repetirReserva,
        exibirHorariosModal,
        horariosDisponiveisFormatados,
        estadoEdicao,
        feedbackModal,
        formReserva,
        ehModoEdicao,
        editandoEmGrupo,
        tituloModalPrincipal,
        datasGrupoFormatadas,
        temDialogoSecundarioAberto,
        textoDiaSelecionado,
        nomeDiaSemana,
        textoIntervaloHorario,
        alternarAjusteHorario,
        definirRepetirReserva,
        marcarComoAlterado,
        mostrarHorariosPossiveis,
        ajustarHorarios,
        confirmarRetiradaDoGrupo,
        salvarReserva
    };
}