<!--
========
Este arquivo representa a visualização em matriz para múltiplos recursos com suporte a filtragem.
Ele utiliza o AgendaMatrixBase para renderizar a grade, repassa a configuração de blocos da agenda,
gerencia o dropdown de seleção de salas preservando os filtros ativos ao mudar a data e expõe a lista
de recursos atualmente em exibição (já filtrada).
========
-->
<script setup lang="ts">
import { computed, watch, ref, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import AgendaMatrixBase from './AgendaMatrixBase.vue';

const props = defineProps({
    usaInterceptador: { type: Boolean, default: false },
    tituloPadrao: { type: String, default: '' },
    ocultarTituloModal: { type: Boolean, default: false },
    configuracaoBlocos: { type: [Array, Object], default: null }
});

const api = inject('api-instance-agenda') as any;
defineEmits(['before-save']);

const { dadosMatrix, agendaSelecionada, recursosDisponiveis } = useAgenda(api);

const recursosVisiveisIds = ref<string[]>([]);
const idAgendaFiltroInicializado = ref<number | null>(null);
const menuFiltroAberto = ref(false);

const recursosPermitidosNaMatriz = computed(() => {
    return dadosMatrix.value?.datas_matriz?.[0]?.recursos_slot || [];
});

watch(recursosPermitidosNaMatriz, (novosRecursos) => {
    if (novosRecursos.length === 0) {
        recursosVisiveisIds.value = [];
        return;
    }

    const todosIds = novosRecursos.map((r: any) => String(r.id_recurso));

    if (idAgendaFiltroInicializado.value !== agendaSelecionada.value) {
        recursosVisiveisIds.value = todosIds;
        idAgendaFiltroInicializado.value = agendaSelecionada.value;
    } else {
        recursosVisiveisIds.value = recursosVisiveisIds.value.filter(id => todosIds.includes(id));
    }
}, { immediate: true });

const recursosEmExibicao = computed(() => {
    if (recursosVisiveisIds.value.length === 0) return [];

    return recursosPermitidosNaMatriz.value
        .filter((recMatriz: any) => recursosVisiveisIds.value.includes(String(recMatriz.id_recurso)))
        .map((recMatriz: any) => {
            return recursosDisponiveis.value.find(
                (r: any) => Number(r.id_recurso) === Number(recMatriz.id_recurso)
            ) || {
                id_recurso: recMatriz.id_recurso,
                nome_recurso: recMatriz.nome_recurso,
                id_agenda: agendaSelecionada.value
            };
        });
});

const selecionarTodos = () => {
    recursosVisiveisIds.value = recursosPermitidosNaMatriz.value.map((r: any) => String(r.id_recurso));
};

const limparFiltros = () => {
    recursosVisiveisIds.value = [];
};

defineExpose({ recursosEmExibicao });
</script>

<template>
  <AgendaMatrixBase
    :ids-recursos-visiveis="recursosVisiveisIds"
    :usa-interceptador="props.usaInterceptador"
    :titulo-padrao="props.tituloPadrao"
    :ocultar-titulo-modal="props.ocultarTituloModal"
    :configuracao-blocos="props.configuracaoBlocos"
    mensagem-vazio="Nenhuma sala selecionada."
    @before-save="$emit('before-save',$event)"
  >
    <template #topo>
      <div class="barra-filtros" v-if="recursosPermitidosNaMatriz.length > 0">
        <div class="dropdown-container">
          <button class="btn-dropdown" @click="menuFiltroAberto = !menuFiltroAberto">
            <span class="texto-btn">
              Filtro de Salas ({{ recursosVisiveisIds.length }}/{{ recursosPermitidosNaMatriz.length }})
            </span>
            <svg
              class="icone-seta"
              :class="{ 'girado': menuFiltroAberto }"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div class="backdrop-invisivel" v-if="menuFiltroAberto" @click="menuFiltroAberto = false"></div>

          <div class="dropdown-menu" v-if="menuFiltroAberto">
            <div class="dropdown-acoes">
              <button class="btn-acao" @click="selecionarTodos">Todos</button>
              <button class="btn-acao" @click="limparFiltros">Nenhum</button>
            </div>

            <div class="dropdown-lista">
              <label
                class="dropdown-item"
                v-for="rec in recursosPermitidosNaMatriz"
                :key="rec.id_recurso"
                :class="{ 'ativo': recursosVisiveisIds.includes(String(rec.id_recurso)) }"
              >
                <input
                  class="checkbox-estiloso"
                  type="checkbox"
                  :value="String(rec.id_recurso)"
                  v-model="recursosVisiveisIds"
                />
                <span>{{ rec.nome_recurso }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
      <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
    </template>
  </AgendaMatrixBase>
</template>

<style scoped>
.barra-filtros { padding: 12px 24px; background-color: var(--bg-primary); border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
.dropdown-container { position: relative; display: inline-block; }
.btn-dropdown { display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 8px; color: var(--text-primary); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
.btn-dropdown:hover { background: var(--bg-hover); border-color: var(--border-editor); }
.icone-seta { transition: transform 0.2s ease; }
.icone-seta.girado { transform: rotate(180deg); }
.backdrop-invisivel { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 40; }
.dropdown-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; width: 260px; background: var(--bg-modal); border: 1px solid var(--border-light); border-radius: 10px; box-shadow: var(--shadow-float); z-index: 50; display: flex; flex-direction: column; overflow: hidden; }
.dropdown-acoes { display: flex; border-bottom: 1px solid var(--border-light); background: var(--bg-secondary); }
.btn-acao { flex: 1; padding: 10px; background: transparent; border: none; font-size: 12px; font-weight: 600; color: var(--color-brand); cursor: pointer; transition: background 0.2s; }
.btn-acao:hover { background: var(--color-brand-light); }
.btn-acao:first-child { border-right: 1px solid var(--border-light); }
.dropdown-lista { max-height: 250px; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-primary); transition: background 0.2s; }
.dropdown-item:hover { background: var(--bg-hover); }
.dropdown-item.ativo { background: var(--color-brand-light); color: var(--color-brand); }
.checkbox-estiloso { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; border: 2px solid var(--border-editor); border-radius: 4px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; background: var(--bg-primary); flex-shrink: 0; }
.dropdown-item.ativo .checkbox-estiloso { background: var(--color-brand); border-color: var(--color-brand); }
.checkbox-estiloso::before { content: ""; width: 10px; height: 10px; transform: scale(0); transition: 0.12s transform ease-in-out; background-color: var(--text-inverse); clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
.dropdown-item.ativo .checkbox-estiloso::before { transform: scale(1); }
</style>