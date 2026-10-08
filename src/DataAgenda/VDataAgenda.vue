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





const mudarVisao = (novaVisao: string) => { 
    agendaVueCalRef.value?.mudarVisao(novaVisao); 
};
</script>

<template>
  <div  
  >
    <div class="painel-agenda-unificado">
      <header class="painel-header-topo">
        <HeaderCalendario
          v-if="props.modoLayout === 'calendario'"
          :alternarMenu="alternarMenu"
          :irParaHoje="irParaHoje"
          :mudarVisao="mudarVisao"
        />

        <HeaderTabela
          v-else
          :alternarMenu="alternarMenu"
          :irParaHoje="irParaHoje"

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
    

  </div>
</template>
<style lang="scss">
// importa o main.scss
@use '../assets/scss/main.scss';

</style>
<style scoped>
/* Os estilos continuam 100% iguais */

.painel-agenda-unificado { 
    background: var(--bg-primary); 
    border-radius: 16px; 
    box-shadow: var(--shadow-float); 
    border: 1px solid var(--border-light); 
    flex-grow: 1; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden; 
}
.painel-header-topo { 
    height: 60px; 
    background-color: var(--bg-primary); 
    border-bottom: 1px solid var(--border-light); 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    padding: 0 20px; 
    flex-shrink: 0; 
}
.corpo-principal { display: flex; flex-grow: 1; overflow: hidden; }
.barra-lateral { 
    width: 300px; 
    background-color: var(--bg-primary); 
    border-right: 1px solid var(--border-light); 
    transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s; 
    overflow: hidden; 
    flex-shrink: 0; 
}
.barra-lateral.oculta { width: 0; border-right: none; opacity: 0; }
.conteudo-lateral-fixo { width: 300px; padding: 15px; }
.secao-mini-cal { width: 100%; }
.area-calendario { 
    flex-grow: 1; 
    overflow: hidden; 
    background-color: var(--bg-primary); 
    display: flex; 
    flex-direction: column; 
}

.calendario-mini { border: none !important; box-shadow: none !important; background-color: transparent !important; }
:deep(.calendario-mini .vuecal__header), :deep(.calendario-mini .vuecal__title-bar) { background-color: transparent !important; border: none !important; padding-bottom: 5px; }
:deep(.calendario-mini .vuecal__title), :deep(.calendario-mini .vuecal__arrow) { 
    font-size: 1rem; 
    font-weight: 600; 
    color: var(--color-brand) !important; 
    background: transparent !important; 
}
:deep(.calendario-mini .vuecal__heading) { border: none !important; background-color: transparent !important; font-weight: 600; color: var(--text-secondary); padding-bottom: 4px; }
:deep(.calendario-mini .vuecal__cell) { border: none !important; background-color: transparent !important; height: 32px !important; min-height: 32px !important; aspect-ratio: auto !important; }
:deep(.calendario-mini .vuecal__cell::before) { display: none !important; content: none !important; }
:deep(.calendario-mini .vuecal__cell-content) { height: 32px !important; min-height: 32px !important; padding: 0 !important; margin: 0 !important; justify-content: center !important; align-items: center !important; }
:deep(.calendario-mini .vuecal__cell-date) { width: 24px !important; height: 24px !important; font-size: 12px !important; line-height: 24px !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; margin: 0 auto !important; border-radius: 50% !important; border: 2px solid transparent !important; box-sizing: border-box !important; transition: all 0.2s ease; }
:deep(.calendario-mini .vuecal__cell--selected) { background-color: transparent !important; }
:deep(.calendario-mini .vuecal__cell--selected .vuecal__cell-date) { 
    background-color: var(--color-brand) !important; 
    color: var(--text-inverse) !important; 
    border-color: var(--color-brand) !important; 
}
:deep(.vuecal__body) { padding: 0; gap: 0; margin: 0; }
:deep(.calendario-mini .vuecal__cell--today) { background-color: transparent !important; }
:deep(.calendario-mini .vuecal__cell-date){ background-color: transparent !important; color: var(--text-primary); }
:deep(.calendario-mini .vuecal__cell--today:not(.vuecal__cell--selected) .vuecal__cell-date) { 
    background-color: var(--color-brand-light) !important; 
    border-color: transparent !important; 
    color: var(--color-brand) !important; 
}
:deep(.calendario-mini .vuecal__views-bar) { display: none !important; }
:deep(.calendario-mini .vuecal__nav--next), :deep(.calendario-mini .vuecal__nav--prev) { color: var(--text-primary) !important; }
:deep(.calendario-mini .vuecal__body){ height: 0%!important; }
:deep(.calendario-mini .vuecal__scrollable-wrap){ background-color: transparent!important; }


/* Remove o fundo branco forçado dos dias da semana no mini-calendário */
:deep(.calendario-mini .vuecal__weekdays-headings),
:deep(.calendario-mini .vuecal__weekday) {
    background-color: transparent !important;
    border: none !important;
    color: var(--text-secondary) !important;
}



:deep(.calendario-mini .vuecal__weekdays-headings) {
    background: transparent !important;
    background-color: transparent !important;
    border-bottom: 1px solid var(--border-light) !important;
}

/* Aplica o fundo transparente e a cor correta a cada dia individualmente e seus filhos */
:deep(.calendario-mini .vuecal__heading),
:deep(.calendario-mini .vuecal__weekday),
:deep(.calendario-mini .vuecal__heading *) {
    background: transparent !important;
    background-color: transparent !important;
    color: var(--text-secondary) !important;
    font-weight: 600 !important;
    border: none !important;
}

:deep(.calendario-mini .vuecal__header),
:deep(.calendario-mini .vuecal__weekdays-headings) {
    background: var(--bg-primary) !important;
    background-color: var(--bg-primary) !important;
    border-bottom: 1px solid var(--border-light) !important;
}

/* Garante que os itens individuais e o texto adotem o fundo escuro e texto legível */
:deep(.calendario-mini .vuecal__heading),
:deep(.calendario-mini .vuecal__weekday),
:deep(.calendario-mini .vuecal__weekday-name),
:deep(.calendario-mini .vuecal__heading *) {
    background: var(--bg-primary) !important;
    background-color: var(--bg-primary) !important;
    color: var(--text-secondary) !important;
    font-weight: 600 !important;
    border: none !important;
}
</style>