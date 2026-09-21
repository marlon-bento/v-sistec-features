<!--
========
O layout raiz que orquestra a interface com cabeçalhos modulares separados.
Utiliza as propriedades nativas de visão e seleção do Vue 3 para manter tudo em sincronia.
Atua como o ponto de entrada da biblioteca, repassando as configurações de usuário, layout e o cliente HTTP para os filhos.
========
-->
<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';
import { useAgenda } from './composables/useAgenda.ts';
import AgendaVueCal from './components/AgendaVueCal.vue';
import AgendaMatrix from './components/AgendaMatrix.vue';
import HeaderCalendario from './components/HeaderCalendario.vue';
import HeaderTabela from './components/HeaderTabela.vue';

const props = withDefaults(defineProps<{
    modoLayout?: 'calendario' | 'tabela',
    usaInterceptador?: boolean,
    usuarioLogado?: string,
    fetch: any, // Recebe a instância do v-api-fetch do projeto consumidor


}>(), {
    modoLayout: 'calendario',
    usaInterceptador: false,
    usuarioLogado: ''
});
provide('api-instance-agenda', props.fetch); // Fornece a instância do v-api-fetch para os componentes filhos

const emit = defineEmits(['before-save']);

// Armazena as referências e funções do composable de agenda para manipulação global.
const { dataSelecionada, dataVisao, carregarRecursosEAgendas } = useAgenda(props.fetch);

// Controla o estado de abertura da barra lateral (menu) contendo o minicalendário.
const menuAberto = ref(true);

// Armazena a referência da instância do componente vue-cal em sua versão miniatura.
const calendarioMiniRef = ref<any>(null);

// Armazena a referência da instância principal do componente AgendaVueCal.
const agendaVueCalRef = ref<any>(null);

onMounted(() => { carregarRecursosEAgendas(); });

const alternarMenu = () => { menuAberto.value = !menuAberto.value; };

const irParaHoje = () => { 
    const hoje = new Date();
    dataSelecionada.value = hoje; 
    dataVisao.value = hoje;
    if (props.modoLayout === 'calendario') agendaVueCalRef.value?.irParaHoje();
    if (calendarioMiniRef.value) calendarioMiniRef.value.view.goToToday();
};

const periodoAnterior = () => { 
    if (props.modoLayout === 'calendario') {
        agendaVueCalRef.value?.periodoAnterior(); 
    } else {
        const d = new Date(dataVisao.value);
        d.setDate(d.getDate() - 7);
        dataVisao.value = d;
    }
};

const periodoProximo = () => { 
    if (props.modoLayout === 'calendario') {
        agendaVueCalRef.value?.periodoProximo(); 
    } else {
        const d = new Date(dataVisao.value);
        d.setDate(d.getDate() + 7);
        dataVisao.value = d;
    }
};

const mudarVisao = (novaVisao: string) => { 
    agendaVueCalRef.value?.mudarVisao(novaVisao); 
};
</script>

<template>
  <div class="layout-app">
    <div class="painel-agenda-unificado">
      <header class="painel-header-topo">
        <HeaderCalendario
          v-if="props.modoLayout === 'calendario'"
          :alternarMenu="alternarMenu"
          :irParaHoje="irParaHoje"
          :periodoAnterior="periodoAnterior"
          :periodoProximo="periodoProximo"
          :mudarVisao="mudarVisao"
        />

        <HeaderTabela
          v-else
          :alternarMenu="alternarMenu"
          :irParaHoje="irParaHoje"
          :periodoAnterior="periodoAnterior"
          :periodoProximo="periodoProximo"
        />
      </header>

      <div class="corpo-principal">
        <aside class="barra-lateral" :class="{ 'oculta': !menuAberto }">
          <div class="conteudo-lateral-fixo">
            <div class="secao-mini-cal">
              <vue-cal
                ref="calendarioMiniRef"
                class="calendario-mini vuecal--blue-theme"
                small
                active-view="month"
                :views="['month']"
                :time="false"
                hide-view-selector
                :click-to-navigate="false"
                locale="pt-br"
                v-model:selected-date="dataSelecionada"
                :view-date="dataVisao"
                @update:selected-date="dataVisao = $event"
              >
                <template #views-bar></template>
                <template #today-button></template>
              </vue-cal>
            </div>
          </div>
        </aside>

        <main class="area-calendario">
          <AgendaVueCal
            v-if="props.modoLayout === 'calendario'"
            ref="agendaVueCalRef"
            :usa-interceptador="props.usaInterceptador"
            :usuario-logado="props.usuarioLogado"
            @before-save="$emit('before-save', $event)"
          >
            <template #campos-extras>
              <slot name="campos-extras"></slot>
            </template>
          </AgendaVueCal>

          <AgendaMatrix
            v-if="props.modoLayout === 'tabela'"
            :usa-interceptador="props.usaInterceptador"
            @before-save="$emit('before-save', $event)"
          >
            <template #campos-extras>
              <slot name="campos-extras"></slot>
            </template>
          </AgendaMatrix>
        </main>
      </div>
    </div>
    
    <footer class="rodape">
      <p>Gerenciamento de Agendas LibreBooking</p>
    </footer>
  </div>
</template>

<style scoped>
/* Os estilos continuam 100% iguais */
.layout-app { display: flex; flex-direction: column; height: 100vh; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 35px; }
.rodape { height: 30px; background-color: transparent; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666; }
.painel-agenda-unificado { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #ebebeb; flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
.painel-header-topo { height: 60px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; flex-shrink: 0; }
.corpo-principal { display: flex; flex-grow: 1; overflow: hidden; }
.barra-lateral { width: 300px; background-color: #ffffff; border-right: 1px solid #e0e0e0; transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s; overflow: hidden; flex-shrink: 0; }
.barra-lateral.oculta { width: 0; border-right: none; opacity: 0; }
.conteudo-lateral-fixo { width: 300px; padding: 15px; }
.secao-mini-cal { width: 100%; }
.area-calendario { flex-grow: 1; overflow: hidden; background-color: #ffffff; display: flex; flex-direction: column; }
.calendario-mini { border: none !important; box-shadow: none !important; background-color: transparent !important; }
:deep(.calendario-mini .vuecal__header), :deep(.calendario-mini .vuecal__title-bar) { background-color: transparent !important; border: none !important; padding-bottom: 5px; }
:deep(.calendario-mini .vuecal__title), :deep(.calendario-mini .vuecal__arrow) { font-size: 1rem; font-weight: 600; color: #003366 !important; background: transparent !important; }
:deep(.calendario-mini .vuecal__heading) { border: none !important; background-color: transparent !important; font-weight: 600; color: #555; padding-bottom: 4px; }
:deep(.calendario-mini .vuecal__cell) { border: none !important; background-color: transparent !important; height: 32px !important; min-height: 32px !important; aspect-ratio: auto !important; }
:deep(.calendario-mini .vuecal__cell::before) { display: none !important; content: none !important; }
:deep(.calendario-mini .vuecal__cell-content) { height: 32px !important; min-height: 32px !important; padding: 0 !important; margin: 0 !important; justify-content: center !important; align-items: center !important; }
:deep(.calendario-mini .vuecal__cell-date) { width: 24px !important; height: 24px !important; font-size: 12px !important; line-height: 24px !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 0 auto !important; border-radius: 50% !important; border: 2px solid transparent !important; box-sizing: border-box !important; transition: all 0.2s ease; }
:deep(.calendario-mini .vuecal__cell--selected) { background-color: transparent !important; }
:deep(.calendario-mini .vuecal__cell--selected .vuecal__cell-date) { background-color: #c2e7ff !important; color: #001d35 !important; border-color: #c2e7ff !important; }
:deep(.vuecal__body) { padding: 0; gap: 0; margin: 0; }
:deep(.calendario-mini .vuecal__cell--today) { background-color: transparent !important; }
:deep(.calendario-mini .vuecal__cell-date){ background-color: transparent !important; }
:deep(.calendario-mini .vuecal__cell--today:not(.vuecal__cell--selected) .vuecal__cell-date) { background-color: #eaf1fb !important; border-color: transparent !important; color: #1a73e8 !important; }
:deep(.calendario-mini .vuecal__views-bar) { display: none !important; }
:deep(.calendario-mini .vuecal__nav--next), :deep(.calendario-mini .vuecal__nav--prev) { color: black !important; }
:deep(.calendario-mini .vuecal__body){ height: 0%!important; }
:deep(.calendario-mini .vuecal__scrollable-wrap){ background-color: transparent!important; }
</style>