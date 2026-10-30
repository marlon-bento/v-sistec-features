/*
========
Este ficheiro centraliza o estado reativo, os cálculos de encaixe na grelha e o fluxo de gravação
do modal de reservas. Gere a criação simples, lotes recorrentes, desvinculação de grupo,
validação reativa nativa com v-required e interceção de dados antes do envio para a API.
========
*/
import { ref, computed, watch } from 'vue';
import { initVrequired } from 'v-required/validation';
import { useAgenda } from './useAgenda';
import {
    criarDataLocal,
    converterParaUtc,
    converterHoraParaMinutos,
    formatarMinutosParaHora
} from '../utils/datasAgenda';
import type { OpcoesFormularioReserva, DadosFormularioReserva } from '../types/agenda';

// Recebe qualquer valor bruto de payload e devolve um objeto plano e desacoplado de referências antigas.
function normalizarObjetoPayload(payloadBruto: any): Record<string, any> {
    if (payloadBruto == null) return {};

    if (typeof payloadBruto === 'string') {
        try {
            const parsed = JSON.parse(payloadBruto);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? { ...parsed }
                : { valor: parsed };
        } catch {
            return { valor: payloadBruto };
        }
    }

    if (typeof payloadBruto === 'object' && !Array.isArray(payloadBruto)) {
        return JSON.parse(JSON.stringify(payloadBruto));
    }

    return {};
}

// Extrai a mensagem de erro amigável devolvida pelo backend nas respostas de falha da API.
function extrairMensagemErroApi(erro: any, mensagemPadrao: string): string {
    return erro?.response?.data?.mensagem?.texto
        || erro?.response?.data?.detail
        || erro?.response?.data?.message
        || mensagemPadrao;
}

// Controla o ciclo de vida, validações de grelha, v-required e persistência do formulário de reservas.
export function useFormularioReserva(opcoes: OpcoesFormularioReserva) {
    const {
        configEntrada,
        dispararAntesDeSalvar,
        minutosInicio,
        minutosFim,
        recursosDisponiveis,
        agendasDisponiveis,
        criarReserva,
        criarReservaRecorrente,
        editarReserva,
        desvincularReservaGrupo
    } = useAgenda();

    // Inicializa o provedor central do v-required para todos os componentes filhos e slots do modal.
    const { haveError, rules, config } = initVrequired();
    const activeError = ref(false);

    // Flags de carregamento e controlo de modais secundários de confirmação e horários.
    const salvando = ref(false);
    const desvinculando = ref(false);
    const modalConfirmarDesvinculoAberto = ref(false);
    const precisaValidar = ref(false);
    const mostrarAjusteHorario = ref(false);
    const repetirReserva = ref(false);
    const exibirHorariosModal = ref(false);
    const horariosDisponiveisFormatados = ref<string[]>([]);

    // Mapa de erros manual mantido apenas para retrocompatibilidade com validarCamposExtras.
    const errosCampos = ref<Record<string, string>>({});

    // Estado de controlo da reserva quando o modal opera em modo de edição.
    const estadoEdicao = ref({
        ativo: false,
        codigoReferencia: '',
        grupoRecorrencia: null as string | null,
        datasGrupo: [] as string[],
        foiDesvinculadaNestaSessao: false
    });

    // Estado unificado para os modais de feedback visual (Aviso, Perigo e Sucesso).
    const feedbackModal = ref({
        avisoAberto: false,
        perigoAberto: false,
        sucessoAberto: false,
        titulo: '',
        descricao: ''
    });

    // Dados preenchidos nos campos do formulário da reserva.
    const formReserva = ref<DadosFormularioReserva>({
        id_recurso: '',
        titulo_reserva: '',
        data_inicio: '',
        hora_inicio: '',
        data_fim: '',
        hora_fim: '',
        data_limite_repeticao: '',
        payload: {}
    });

    // Objeto completo do recurso selecionado atualmente no formulário.
    const recursoAtual = computed<Record<string, any> | null>(() => {
        if (!formReserva.value.id_recurso) return null;
        return recursosDisponiveis.value.find(
            (r: any) => Number(r.id_recurso) === Number(formReserva.value.id_recurso)
        ) || null;
    });

    // Objeto payload configurado no recurso atual para leitura de regras específicas no ecrã.
    const payloadRecurso = computed<Record<string, any>>(() => {
        const bruto = recursoAtual.value?.payload_recurso
            ?? recursoAtual.value?.payload
            ?? opcoes.obterDadosIniciais()?.payload_recurso;
        return normalizarObjetoPayload(bruto);
    });

    const ehModoEdicao = computed(() => estadoEdicao.value.ativo);

    const editandoEmGrupo = computed(() =>
        ehModoEdicao.value && Boolean(estadoEdicao.value.grupoRecorrencia)
    );

    const tituloModalPrincipal = computed(() => {
        if (!ehModoEdicao.value) return 'Nova Reserva';
        return editandoEmGrupo.value ? 'Editar Grupo de Recorrência' : 'Editar Reserva';
    });

    const datasGrupoFormatadas = computed(() =>
        (estadoEdicao.value.datasGrupo || []).map((iso: string) => ({
            iso,
            texto: criarDataLocal(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            ehAtual: iso === formReserva.value.data_inicio
        }))
    );

    const temDialogoSecundarioAberto = computed(() =>
        feedbackModal.value.avisoAberto ||
        feedbackModal.value.perigoAberto ||
        feedbackModal.value.sucessoAberto ||
        modalConfirmarDesvinculoAberto.value
    );

    const dataInicioLocal = computed(() => {
        if (!formReserva.value.data_inicio || formReserva.value.data_inicio.split('-').length !== 3) return null;
        const dt = criarDataLocal(formReserva.value.data_inicio);
        return isNaN(dt.getTime()) ? null : dt;
    });

    const textoDiaSelecionado = computed(() => {
        if (!dataInicioLocal.value) return formReserva.value.data_inicio || 'Data não definida';
        const diaSemana = dataInicioLocal.value.toLocaleDateString('pt-BR', { weekday: 'long' });
        const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
        const dataBr = dataInicioLocal.value.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${diaCap}, ${dataBr}`;
    });

    const nomeDiaSemana = computed(() =>
        dataInicioLocal.value ? dataInicioLocal.value.toLocaleDateString('pt-BR', { weekday: 'long' }) : 'semana'
    );

    const textoIntervaloHorario = computed(() =>
        `Das ${formReserva.value.hora_inicio || '--:--'} até as ${formReserva.value.hora_fim || '--:--'}`
    );

    const definirErroCampo = (campo: string, mensagem: string) => {
        if (!mensagem) delete errosCampos.value[campo];
        else errosCampos.value[campo] = mensagem;
    };

    const limparErroCampo = (campo: string) => { delete errosCampos.value[campo]; };
    const limparErrosCampos = () => {
        errosCampos.value = {};
        activeError.value = false;
    };

    const abrirAviso = (titulo: string, descricao: string) => {
        Object.assign(feedbackModal.value, { titulo, descricao, avisoAberto: true });
    };

    const abrirPerigo = (titulo: string, descricao: string) => {
        Object.assign(feedbackModal.value, { titulo, descricao, perigoAberto: true });
    };

    const abrirSucesso = (titulo: string, descricao: string) => {
        Object.assign(feedbackModal.value, { titulo, descricao, sucessoAberto: true });
    };

    const alternarAjusteHorario = () => { mostrarAjusteHorario.value = !mostrarAjusteHorario.value; };
    const definirRepetirReserva = (valor: boolean) => { repetirReserva.value = valor; };

    const marcarComoAlterado = () => {
        if (formReserva.value.data_inicio) {
            formReserva.value.data_fim = formReserva.value.data_inicio;
            if (formReserva.value.data_limite_repeticao && formReserva.value.data_limite_repeticao < formReserva.value.data_inicio) {
                formReserva.value.data_limite_repeticao = formReserva.value.data_inicio;
            }
        }
        precisaValidar.value = true;
    };

    const obterPeriodosReservaveisDoDia = () => {
        if (!formReserva.value.id_recurso || !dataInicioLocal.value) return null;

        const recurso = recursosDisponiveis.value.find((r: any) => Number(r.id_recurso) === Number(formReserva.value.id_recurso));
        const agenda = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(recurso?.id_agenda));
        const periodosAgenda = agenda?.detalhes?.periodos_agenda;
        if (!periodosAgenda) return null;

        const diaPython = (dataInicioLocal.value.getDay() + 6) % 7;
        const periodosDoDia = periodosAgenda[diaPython] || [];

        return periodosDoDia
            .filter((s: any) => s.reservavel_periodo)
            .map((s: any) => ({
                ...s,
                inicioMin: converterHoraParaMinutos(s.hora_inicio_periodo),
                fimMin: converterHoraParaMinutos(s.hora_fim_periodo)
            }))
            .sort((a: any, b: any) => a.inicioMin - b.inicioMin);
    };

    const mostrarHorariosPossiveis = () => {
        if (!formReserva.value.id_recurso || !formReserva.value.data_inicio) {
            return abrirAviso('Dados incompletos', 'Selecione um recurso e uma data para ver os horários possíveis.');
        }

        const slots = obterPeriodosReservaveisDoDia();
        if (!slots) return abrirAviso('Grade indisponível', 'Nenhuma grade de horários foi encontrada para este recurso.');
        if (slots.length === 0) return abrirAviso('Sem horários', 'Nenhum horário disponível para este dia na grade.');

        horariosDisponiveisFormatados.value = slots.map((s: any) => `${s.hora_inicio_periodo} às ${s.hora_fim_periodo}`);
        exibirHorariosModal.value = true;
    };

    const ajustarHorarios = (silencioso = false) => {
        const { id_recurso, data_inicio, hora_inicio, hora_fim } = formReserva.value;
        if (!id_recurso || !data_inicio || !hora_inicio || !hora_fim) return;

        const slots = obterPeriodosReservaveisDoDia();
        if (!slots) return;

        if (slots.length === 0) {
            if (!silencioso) abrirAviso('Sem horários', 'Nenhum horário disponível para este dia na grade.');
            return;
        }

        const minInicio = converterHoraParaMinutos(hora_inicio);
        const minFim = converterHoraParaMinutos(hora_fim);
        const invertidos = [...slots].reverse();

        const blocoInicio = invertidos.find(b => b.inicioMin <= minInicio) || slots[0];
        const blocoFim = invertidos.find(b => b.inicioMin < minFim) || slots[0];

        const novoInicioMin = blocoInicio.inicioMin;
        const novoFimMin = blocoFim.fimMin <= novoInicioMin ? blocoInicio.fimMin : blocoFim.fimMin;

        formReserva.value.hora_inicio = formatarMinutosParaHora(novoInicioMin);
        formReserva.value.hora_fim = formatarMinutosParaHora(novoFimMin);
        formReserva.value.data_fim = formReserva.value.data_inicio;
        precisaValidar.value = false;

        if (!silencioso) {
            abrirSucesso('Horário validado', 'Horário validado e ajustado conforme a grade disponível.');
        }
    };

    // Hidrata o formulário e reinicia o activeError sempre que o modal é aberto.
    watch(opcoes.obterAberto, (aberto) => {
        const iniciais = opcoes.obterDadosIniciais();
        if (!aberto || !iniciais) return;

        const dataIni = iniciais.data_inicio ?? '';
        const modoEdicao = Boolean(iniciais.modo_edicao && iniciais.codigo_referencia_reserva);

        estadoEdicao.value = {
            ativo: modoEdicao,
            codigoReferencia: iniciais.codigo_referencia_reserva ?? '',
            grupoRecorrencia: iniciais.grupo_recorrencia_reserva ?? null,
            datasGrupo: Array.isArray(iniciais.datas_grupo_recorrencia_reserva)
                ? [...iniciais.datas_grupo_recorrencia_reserva]
                : [],
            foiDesvinculadaNestaSessao: false
        };

        formReserva.value = {
            id_recurso: iniciais.id_recurso ?? '',
            titulo_reserva: iniciais.titulo_reserva ?? '',
            data_inicio: dataIni,
            hora_inicio: iniciais.hora_inicio ?? '',
            data_fim: iniciais.data_fim || dataIni,
            hora_fim: iniciais.hora_fim ?? '',
            data_limite_repeticao: dataIni,
            payload: !modoEdicao && iniciais.payload == null ? {} : normalizarObjetoPayload(iniciais.payload)
        };

        limparErrosCampos();
        precisaValidar.value = false;
        mostrarAjusteHorario.value = modoEdicao;
        repetirReserva.value = false;
        exibirHorariosModal.value = false;
        ajustarHorarios(true);
    });

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
            abrirPerigo('Erro ao desvincular', extrairMensagemErroApi(erro, 'Não foi possível desvincular a reserva do grupo.'));
        } finally {
            desvinculando.value = false;
        }
    };

    // Valida primeiro as regras declarativas do v-required (<VRequired> / <VRule>) e depois validarCamposExtras (se existir).
    const validarRegrasCustomizadas = async (): Promise<boolean> => {
        errosCampos.value = {};
        activeError.value = true;

        // 1. Verifica automaticamente todos os <VRequired> / <VRule> montados dentro do modal
        if (haveError()) {
            return false;
        }

        // 2. Suporte opcional caso o utilizador também passe uma função validarCamposExtras
        if (typeof configEntrada.validarCamposExtras !== 'function') return true;

        const resultado = await configEntrada.validarCamposExtras({
            payload: formReserva.value.payload,
            payloadRecurso: payloadRecurso.value,
            recursoAtual: recursoAtual.value,
            dadosReserva: formReserva.value,
            modoEdicao: ehModoEdicao.value,
            errosCampos: errosCampos.value,
            definirErroCampo,
            limparErrosCampos,
            abrirAviso,
            abrirPerigo
        });

        if (typeof resultado === 'string' && resultado.trim()) {
            abrirAviso('Verifique os campos', resultado.trim());
            return false;
        }

        if (resultado && typeof resultado === 'object' && resultado.valido === false) {
            if (resultado.erros) errosCampos.value = { ...errosCampos.value, ...resultado.erros };
            const msg = resultado.mensagem || Object.values(errosCampos.value)[0] || 'Verifique os campos informados.';
            abrirAviso(resultado.titulo || 'Verifique os campos', msg);
            return false;
        }

        const primeiroErroRegistrado = Object.values(errosCampos.value)[0];
        if (resultado === false || primeiroErroRegistrado) {
            if (primeiroErroRegistrado && !feedbackModal.value.avisoAberto && !feedbackModal.value.perigoAberto) {
                abrirAviso('Verifique os campos', primeiroErroRegistrado);
            }
            return false;
        }

        return true;
    };

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
            const msgPadrao = 'Erro ao processar a reserva na API. Verifique a disponibilidade do horário.';
            abrirPerigo('Falha na operação', extrairMensagemErroApi(erro, msgPadrao));
        } finally {
            salvando.value = false;
        }
    };

    const salvarReserva = async () => {
        if (precisaValidar.value) return;

        if (!configEntrada.ocultarTituloModal && configEntrada.tituloObrigatorio && !formReserva.value.titulo_reserva.trim()) {
            const label = configEntrada.labelTituloModal || 'Nome da Reserva';
            return abrirAviso('Campo obrigatório', configEntrada.mensagemErroTitulo || `O campo "${label}" é obrigatório para realizar o agendamento.`);
        }

        formReserva.value.data_fim = formReserva.value.data_inicio;

        const minIni = converterHoraParaMinutos(formReserva.value.hora_inicio);
        const minFim = converterHoraParaMinutos(formReserva.value.hora_fim);

        if (minIni < minutosInicio.value || minFim > minutosFim.value) {
            return abrirAviso('Fora do expediente', 'O horário selecionado está fora do expediente da agenda.');
        }

        if (minIni >= minFim) {
            return abrirAviso('Horário inválido', 'O horário de início deve ser anterior ao término.');
        }

        if (!ehModoEdicao.value && repetirReserva.value) {
            if (!formReserva.value.data_limite_repeticao) {
                return abrirAviso('Data obrigatória', 'Informe a data final para a repetição do agendamento.');
            }
            if (formReserva.value.data_limite_repeticao < formReserva.value.data_inicio) {
                return abrirAviso('Data inválida', 'A data final da repetição deve ser igual ou posterior à data inicial do agendamento.');
            }
        }

        const camposExtrasValidos = await validarRegrasCustomizadas();
        if (!camposExtrasValidos) return;

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

        if (!configEntrada.usaInterceptador) {
            await executarPersistenciaAPI(payloadBase);
            return;
        }

        dispararAntesDeSalvar({
            payloadBase,
            payload: payloadCustomizado,
            payloadRecurso: payloadRecurso.value,
            recursoAtual: recursoAtual.value,
            activeError: activeError.value,
            errosCampos: errosCampos.value,
            definirErroCampo,
            limparErroCampo,
            limparErrosCampos,
            abrirAviso,
            abrirPerigo,
            modoEdicao: ehModoEdicao.value,
            codigoReferenciaReserva: estadoEdicao.value.codigoReferencia || null,
            grupoRecorrenciaReserva: estadoEdicao.value.grupoRecorrencia || null,
            dadosReserva: {
                ...formReserva.value,
                payload: payloadCustomizado,
                payload_recurso: payloadRecurso.value,
                repetir_reserva: repetirReserva.value,
                modo_edicao: ehModoEdicao.value,
                codigo_referencia_reserva: estadoEdicao.value.codigoReferencia || null,
                grupo_recorrencia_reserva: estadoEdicao.value.grupoRecorrencia || null
            },
            proceed: (novoPayloadModificado?: any) => {
                executarPersistenciaAPI(novoPayloadModificado || payloadBase);
            },
            abort: (acaoOuMensagem?: Function | string, tituloOpcional?: string) => {
                salvando.value = false;
                if (typeof acaoOuMensagem === 'function') {
                    acaoOuMensagem();
                } else if (typeof acaoOuMensagem === 'string' && acaoOuMensagem.trim()) {
                    abrirAviso(tituloOpcional || 'Verifique os campos', acaoOuMensagem.trim());
                }
            }
        });
    };

    return {
        configEntrada,
        recursosDisponiveis,
        recursoAtual,
        payloadRecurso,
        activeError,
        haveError,
        rules,
        config,
        errosCampos,
        definirErroCampo,
        limparErroCampo,
        limparErrosCampos,
        abrirAviso,
        abrirPerigo,
        abrirSucesso,
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