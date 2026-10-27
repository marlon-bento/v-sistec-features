/*
==========================================================================
Plugin principal do Sistec atualizado.
Realiza a configuração global das dependências na aplicação consumidora
através de iteração.
==========================================================================
*/

import type { App } from 'vue';
import '@tabler/core/dist/css/tabler.min.css';
import '@tabler/core/dist/css/tabler-themes.min.css';
import * as Tabler from '@tabler/core/dist/js/tabler.min.js';
import vRequired from "v-required";
import '../assets/v-required-style.css';
import Toast, { type PluginOptions as ToastPluginOptions } from "vue-toastification";
import "vue-toastification/dist/index.css";


import { DATA_TABLE_CONFIG, type DataTableGlobalConfig } from '@/DatatableVue/config/datatableConfig';

export interface OpcoesSistec {
  dataTable?: DataTableGlobalConfig;
  toast?: ToastPluginOptions;
}

// Configuração padrão base para mesclar com as opções recebidas pelo plugin
const opcoesPadraoToast: ToastPluginOptions = {
  transition: "Vue-Toastification__bounce",
  maxToasts: 20,
  newestOnTop: true,
  toastClassName: "custom-toast-class",
};

const SistecPlugin = {
  /*
  Função: install
  Recebe: aplicativo (instância do Vue), opcoes (configurações do usuário)
  Devolve: Nada
  Por que é usada: Injeta os plugins, configurações e varre os objetos de 
  componentes e diretivas do Bootstrap para registrá-los um por um no 
  escopo global.
  */
  install: (app: App, opcoes: OpcoesSistec = {}) => {
    (window as any).bootstrap = Tabler;

    app.directive('required', vRequired);

    const opcoesFinaisToast = { ...opcoesPadraoToast, ...opcoes.toast };
    app.use(Toast, opcoesFinaisToast);

    const configuracaoTabela = opcoes.dataTable || {};
    app.provide(DATA_TABLE_CONFIG, configuracaoTabela);

    
  }
};

export { SistecPlugin };