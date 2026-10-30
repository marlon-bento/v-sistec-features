/*
========
Este arquivo mescla de forma reativa as propriedades passadas ao componente VDataAgenda com os valores padrão.
Elimina a necessidade de sincronização manual de propriedades via watchEffect no estado central.
========
*/
import { reactive, watchEffect } from 'vue';
import { padroesConfigAgenda } from '../config/agendaDefaults';
import type { ConfiguracaoEntradaAgenda } from '../types/agenda';

// Recebe as props brutas do componente VDataAgenda e devolve um objeto reativo sempre sincronizado.
// É usada pelo contexto central para ler configurações sem acoplamento direto com a instância da view.
export function useAgendaConfig(propsRaiz: Record<string, any>) {
    // Armazena a configuração ativa mesclando os padrões com as propriedades recebidas.
    const configEntrada = reactive<ConfiguracaoEntradaAgenda>({
        ...padroesConfigAgenda
    });

    watchEffect(() => {
        configEntrada.tituloObrigatorio = Boolean(propsRaiz.tituloObrigatorio ?? padroesConfigAgenda.tituloObrigatorio);
        configEntrada.labelTituloModal = propsRaiz.labelTituloModal ?? padroesConfigAgenda.labelTituloModal;
        configEntrada.placeholderTituloModal = propsRaiz.placeholderTituloModal ?? padroesConfigAgenda.placeholderTituloModal;
        configEntrada.mensagemErroTitulo = propsRaiz.mensagemErroTitulo ?? padroesConfigAgenda.mensagemErroTitulo;
        configEntrada.modoLayout = propsRaiz.modoLayout ?? padroesConfigAgenda.modoLayout;
        configEntrada.idRecursoUnico = propsRaiz.idRecursoUnico ?? padroesConfigAgenda.idRecursoUnico;
        configEntrada.usaInterceptador = Boolean(propsRaiz.usaInterceptador ?? padroesConfigAgenda.usaInterceptador);
        configEntrada.usuarioLogado = propsRaiz.usuarioLogado ?? padroesConfigAgenda.usuarioLogado;
        configEntrada.tituloPadrao = propsRaiz.tituloPadrao ?? padroesConfigAgenda.tituloPadrao;
        configEntrada.ocultarTituloModal = Boolean(propsRaiz.ocultarTituloModal ?? padroesConfigAgenda.ocultarTituloModal);
        configEntrada.configuracaoBlocos = propsRaiz.configuracaoBlocos ?? padroesConfigAgenda.configuracaoBlocos;
        configEntrada.validarCamposExtras = typeof propsRaiz.validarCamposExtras === 'function'
            ? propsRaiz.validarCamposExtras
            : null;
    });

    return { configEntrada };
}