/*
========
Este arquivo centraliza os valores padrão de todas as propriedades opcionais do componente VDataAgenda.
Segue o mesmo padrão arquitetural do DatatableVue para manter a inicialização limpa e previsível.
========
*/
import type { ConfiguracaoEntradaAgenda } from '../types/agenda';

// Objeto constante com a configuração inicial padrão da agenda.
export const padroesConfigAgenda: ConfiguracaoEntradaAgenda = {
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
    configuracaoBlocos: null,
    validarCamposExtras: null
};