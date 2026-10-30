/*
========
Este arquivo centraliza todas as definições de tipos, interfaces de configuração,
estruturas de formulário e contratos de validação utilizados pelo DataAgenda.
========
*/

export type FormatoDataSimplesVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export type ModoLayoutAgenda = 'calendario' | 'tabela' | 'tabela-horario';

export interface ContextoValidacaoCamposExtras {
    payload: Record<string, any>;
    payloadRecurso: Record<string, any>;
    recursoAtual: Record<string, any> | null;
    dadosReserva: Record<string, any>;
    modoEdicao: boolean;
    errosCampos: Record<string, string>;
    definirErroCampo: (campo: string, mensagem: string) => void;
    limparErrosCampos: () => void;
    abrirAviso: (titulo: string, descricao: string) => void;
    abrirPerigo: (titulo: string, descricao: string) => void;
}

export interface RetornoValidacaoObjeto {
    valido: boolean;
    titulo?: string;
    mensagem?: string;
    erros?: Record<string, string>;
}

export type FuncaoValidarCamposExtras = (
    contexto: ContextoValidacaoCamposExtras
) => boolean | string | RetornoValidacaoObjeto | Promise<any>;

export interface ConfiguracaoEntradaAgenda {
    tituloObrigatorio: boolean;
    labelTituloModal: string;
    placeholderTituloModal: string;
    mensagemErroTitulo: string;
    modoLayout: ModoLayoutAgenda;
    idRecursoUnico: number | string | null;
    usaInterceptador: boolean;
    usuarioLogado: string;
    tituloPadrao: string;
    ocultarTituloModal: boolean;
    configuracaoBlocos: any;
    validarCamposExtras: FuncaoValidarCamposExtras | null;
}

export interface OpcoesFormularioReserva {
    obterAberto: () => boolean;
    obterDadosIniciais: () => Record<string, any>;
    aoSalvar: () => void;
    aoFecharModal: () => void;
}

export interface DadosFormularioReserva {
    id_recurso: string | number;
    titulo_reserva: string;
    data_inicio: string;
    hora_inicio: string;
    data_fim: string;
    hora_fim: string;
    data_limite_repeticao: string;
    payload: Record<string, any>;
}