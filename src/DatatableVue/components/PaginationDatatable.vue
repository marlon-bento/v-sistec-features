<script setup lang="ts">
import { computed } from "vue";

// =======================================================
// 1. DEFINIÇÃO DE TIPOS E INTERFACES 
// =======================================================
interface PaginationObject {
  current_page: number;
  count: number;
  limit_per_page: number;
}
interface PaginationProps {
  pagination: PaginationObject;
  filtering?: boolean;
}

// =======================================================
// 2. PROPS E EMITS 
// =======================================================
const props = withDefaults(defineProps<PaginationProps>(), {
  filtering: false,
});
const emit = defineEmits<{
  (e: 'tradePage'): void
}>();

// =======================================================
// 3. LÓGICA REATIVA (Computeds e Funções)
// =======================================================
const total_pages = computed<number>(() => {
  if (!props.pagination.limit_per_page) return 0;
  return Math.ceil(props.pagination.count / props.pagination.limit_per_page);
});

const next = computed(() => {
  return props.pagination.current_page + 1 < total_pages.value
    ? props.pagination.current_page + 1
    : null;
});

// Funções de navegação 
const nextPage = (): void => {
  props.pagination.current_page++;
  emit("tradePage");
};
const setPage = (newPage: number): void => {
  props.pagination.current_page = newPage - 1;
  emit("tradePage");
};
const lastPage = (): void => {
  props.pagination.current_page = total_pages.value - 1;
  emit("tradePage");
};
const firstPage = (): void => {
  props.pagination.current_page = 0;
  emit("tradePage");
};
const prevPage = (): void => {
  if (props.pagination.current_page > 0) {
    props.pagination.current_page--;
    emit("tradePage");
  }
};

// =======================================================
// 4. LÓGICA DE GERAÇÃO DE PÁGINAS
// =======================================================

/**
 * @description Computa um array com os números das páginas e as reticências a serem exibidas.
 * Ex: [1, 2, '...', 10, 11, 12, '...', 33, 34]
 */
const paginasParaExibir = computed(() => {
  // Se houver 7 páginas ou menos, mostre todas.
  if (total_pages.value <= 7) {
    return Array.from({ length: total_pages.value }, (_, i) => i + 1);
  }

  const paginaAtual = props.pagination.current_page + 1;
  const total = total_pages.value;

  // O conjunto de páginas visíveis sempre inclui as 2 primeiras, 2 últimas,
  // a atual e suas duas vizinhas. O Set cuida de remover duplicatas.
  const paginasEssenciais = new Set([
    1, 2,                           // Sempre mostra as 2 primeiras
    paginaAtual - 1, paginaAtual, paginaAtual + 1, // Mostra a atual e vizinhas
    total - 1, total                // Sempre mostra as 2 últimas
  ]);

  const resultado: (number | string)[] = [];
  let ultimoNumeroAdicionado = 0;

  // Ordena os números e itera sobre eles para inserir as reticências
  Array.from(paginasEssenciais).sort((a, b) => a - b).forEach(num => {
    // Ignora números inválidos (como página 0 ou menores, ou maiores que o total)
    if (num < 1 || num > total) return;

    // Se houver um buraco entre o último número adicionado e o atual, insere "..."
    if (num > ultimoNumeroAdicionado + 1) {
      resultado.push('...');
    }

    resultado.push(num);
    ultimoNumeroAdicionado = num;
  });


  return resultado;
});
const svg_duas_setas =`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-left">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M11 7l-5 5l5 5" />
                <path d="M17 7l-5 5l5 5" />
              </svg>
`
const svg_uma_seta = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M15 6l-6 6l6 6" />
              </svg>
`

</script>

<template>
  <div class="d-flex align-items-center justify-content-between w-100" v-if="props.pagination.count > 0">
    <span>
      Mostrando de
      {{
        props.pagination.count !== 0
          ? props.pagination.limit_per_page * props.pagination.current_page + 1
          : 0
      }}
      até
      {{
        props.pagination.limit_per_page * (props.pagination.current_page + 1) < props.pagination.count ?
          props.pagination.limit_per_page * (props.pagination.current_page + 1) : props.pagination.count }} de {{
          props.pagination.count }} registros </span>
        <div class="d-flex align-items-center p-2 gap-2" v-if="total_pages > 0">
          <div class="d-flex">
            <button class="btn btn-estilo" @click.prevent="firstPage" :disabled="props.pagination.current_page === 0" v-html="svg_duas_setas">
            </button>
            <button class="btn btn-estilo" @click.prevent="prevPage" :disabled="props.pagination.current_page === 0" v-html="svg_uma_seta">
            </button>
          </div>

          <div class="d-flex  gap-2">
            <template v-for="(pagina, index) in paginasParaExibir" :key="index">
              <button v-if="typeof pagina === 'number'"
                :class="props.pagination.current_page + 1 == pagina ? 'page-select' : ''" class="page-estilo"
                @click.prevent="setPage(pagina)" :disabled="props.pagination.current_page + 1 == pagina">
                {{ pagina }}
              </button>
              <span v-else class="m-0 p-0">...</span>
            </template>
          </div>
          <div class="d-flex">
            <button @click.prevent="nextPage" class="btn btn-estilo rotate-180" :disabled="!next" v-html="svg_uma_seta">
            </button>
            <button @click.prevent="lastPage" class="btn btn-estilo rotate-180" :disabled="!next" v-html="svg_duas_setas">
            </button>
          </div>

        </div>
  </div>
</template>
<style lang="scss" scoped>
.rotate-180 {
  :deep(svg) {
  transform: rotate(180deg);
  }
  
}
.page-select {
  background-color: var(--tblr-primary) !important;
  color: white !important;
  border: none !important;
}

.page-estilo {
  border: none;
  --cor-escurecida: color-mix(in srgb, var(--tblr-primary), #000 25%);
  //border: 2px solid var(--cor-escurecida);
  background: transparent;
  padding: 1px 10px;
  border-radius: 7px;
  margin: 0 !important;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;

  &:hover {
    background: var(--cor-escurecida);
    color: white;
  }
}

.btn{
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
:deep(.btn-estilo) {
  svg {
    padding: 0px !important;
    margin: 0px !important;
  }
  &:hover svg {
    stroke: var(--tblr-primary);
  }
}

.icon-tabler {
  margin: 0 !important;
  padding: 0 !important;
}
</style>
