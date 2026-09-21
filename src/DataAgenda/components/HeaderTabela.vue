<script setup lang="ts">
/*
========
Componente de cabeçalho do modo Tabela, contendo o alternador de menu lateral, 
controles de navegação semanal e seletor de agendamentos.
========
*/
import { computed, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
const api = inject('api-instance-agenda') as any
const props = defineProps<{
    alternarMenu: () => void;
    irParaHoje: () => void;
    periodoAnterior: () => void;
    periodoProximo: () => void;
}>();

const { dataSelecionada, agendasDisponiveis, agendaSelecionada } = useAgenda(api);

const textoPeriodoTabela = computed(() => {
    if (!dataSelecionada.value) return '';
    const inicio = new Date(dataSelecionada.value);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    
    const strInicio = inicio.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    const strFim = fim.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${strInicio} até ${strFim}`;
});
</script>

<template>
  <div class="bloco-esquerda">
    <button class="btn-toggle" @click="props.alternarMenu" title="Alternar Menu">
      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
      </svg>
    </button>

    <div class="navegacao-topo">
      <button class="btn-hoje" @click="props.irParaHoje">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"></path>
          <path d="M16 3l0 4"></path>
          <path d="M8 3l0 4"></path>
          <path d="M4 11l16 0"></path>
          <path d="M8 15h2v2h-2l0 -2"></path>
        </svg>
        Hoje
      </button>

      <div class="grupo-setas">
        <button @click="props.periodoAnterior" title="Semana Anterior">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M15 6l-6 6l6 6"></path>
          </svg>
        </button>

        <button @click="props.periodoProximo" title="Próxima Semana">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M9 6l6 6l-6 6"></path>
          </svg>
        </button>
      </div>

      <span class="titulo-periodo">{{ textoPeriodoTabela }}</span>
    </div>
  </div>

  <div class="bloco-direita">
    <div class="seletor-recurso">
      <label for="agenda-tab">Agenda:</label>
      <select id="agenda-tab" v-model="agendaSelecionada">
        <option v-for="agenda in agendasDisponiveis" :key="agenda.id" :value="agenda.id">
          {{ agenda.nome }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.bloco-esquerda, .bloco-direita { display: flex; align-items: center; gap: 16px; }
.btn-toggle { background: transparent; border: none; cursor: pointer; color: #555; display: flex; align-items: center; justify-content: center; padding: 8px; border-radius: 50%; transition: background 0.2s; }
.btn-toggle:hover { background: #f0f2f5; }
.navegacao-topo { display: flex; align-items: center; gap: 12px; }
.btn-hoje { background: transparent; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: #003366; display: flex; align-items: center; gap: 6px; transition: background 0.2s; }
.btn-hoje:hover { background: #eaf1fb; }
.grupo-setas { display: flex; gap: 4px; }
.grupo-setas button { background: transparent; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: #444746; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; }
.grupo-setas button:hover { background: #eaf1fb; color: #1a73e8; }
.titulo-periodo { font-weight: 600; font-size: 1.1rem; color: #333; text-transform: capitalize; margin-left: 8px; }
.seletor-recurso { display: flex; align-items: center; font-size: 14px; color: #555; }
.seletor-recurso select { margin-left: 10px; padding: 6px 12px; border: 1px solid #ccc; border-radius: 8px; background-color: #fff; cursor: pointer; }
</style>