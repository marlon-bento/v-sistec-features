<template>
    <div class="dropdown d-flex">
        <slot name="search-field">
            <a v-if="item_use.includes(2)" href="#" class="btn dropdown-toggle" data-bs-toggle="dropdown"
                title="Pesquisas Prédefinidas">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-filter" width="24"
                    height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path
                        d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z">
                    </path>
                </svg>
            </a>
            <div class="input-icon">
                <input type="text" class="form-control ms-1" id="inputSearchVDataTable" v-model="modelSearch"
                    @keyup.enter="searchEnter" :placeholder="placeholder_search">

                <span v-if="modelSearch" @click="cleanSearch()" class=" inputClose" title="Limpar pesquisa">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="icon icon-tabler icons-tabler-outline icon-tabler-x">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M18 6l-12 12" />
                        <path d="M6 6l12 12" />
                    </svg>
                </span>
                <span v-else class="input-icon-addon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="icon">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
                        <path d="M21 21l-6 -6"></path>
                    </svg>
                </span>
            </div>
            <div v-if="item_use.includes(2)" class="dropdown-menu">
                <template v-for="(filter, index) in props.list_filter" :key="index">
                    <router-link
                        v-if="('type' in filter ? filter.type === 1 : false) && ('visible' in filter ? filter.visible : true)"
                        :to="filter?.to" class="dropdown-item cursor-pointer">
                        {{ filter.text }}
                    </router-link>
                    <a v-else-if="('type' in filter ? filter.type === 2 : true) && ('visible' in filter ? filter.visible : true)"
                        @click.prevent="tradeFilter(String(filter.value))" class="dropdown-item cursor-pointer"
                        :class="modelFilter === filter?.value ? 'bg-info text-dark selected' : ''">
                        {{ filter.text }}
                    </a>
                    <a v-else-if="('type' in filter ? filter.type === 3 : true) && ('visible' in filter ? filter.visible : true)"
                        @click.prevent="clickItem(filter)" class="dropdown-item cursor-pointer"
                        :class="filter?.active ? 'bg-info text-dark selected' : ''">
                        {{ filter.text }}
                    </a>
                </template>
            </div>

            <div v-if="use_column_manager" class="dropdown d-inline-block ms-2">
                <button class="btn  dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"
                    title="Gerenciar Colunas visíveis">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-columns" width="24"
                        height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 6l5.5 0" />
                        <path d="M4 10l5.5 0" />
                        <path d="M4 14l5.5 0" />
                        <path d="M4 18l5.5 0" />
                        <path d="M14.5 6l5.5 0" />
                        <path d="M14.5 10l5.5 0" />
                        <path d="M14.5 14l5.5 0" />
                        <path d="M14.5 18l5.5 0" />
                    </svg>
                </button>
                <div class="dropdown-menu dropdown-menu-end p-3 shadow-sm" style="min-width: 220px; z-index: 1050;">
                    <h6 class="dropdown-header text-uppercase fw-bold mb-2">Exibir Colunas</h6>
                    <div class="d-flex flex-column gap-2">
                        <label v-for="coluna in columns_list" :key="coluna.id" class="form-check cursor-pointer m-0">
                            <input class="form-check-input" type="checkbox" :checked="coluna.visible"
                                :disabled="coluna.locked" @change="toggleColumnVisibility(coluna.id)">
                            <span class="form-check-label user-select-none">{{ coluna.header }}</span>
                        </label>
                    </div>
                </div>
            </div>
        </slot>

        <slot name="extra-actions">

        </slot>
    </div>
</template>
<script setup lang="ts">
import { computed, watch } from 'vue';
interface SearchProps {
    search: string;
    filter?: string;
    list_filter?: any[];
    item_use?: number[];
    placeholder_search?: string;
    deactivate_search_on_clear?: boolean;
    deactivate_search_empty?: boolean;
    columns_list?: any[];
    use_column_manager?: boolean;
    toggleColumnVisibility?: (columnId: string) => void;
}
const props = withDefaults(defineProps<SearchProps>(), {
    filter: "",
    /**
         * Estrutura do array de filtro:
         * [
         *   {
         *     type: number 
         *     text: string,
         *     select: string, // opcional, se for um filtro selecionavel
         *     to: string // opcional, se for um router-link
         *   },
         *   ...
         * ]
         * 
         * type:
         * - tipo de item ex: "router-link", "a" etc.. 
         * - caso não seja passado, assume que é um link
         * - 1 - router-link
         * - 2 - a (link)
         * text:
         * - texto do item
         * - ex: "Todas as notícias"
         * select:
         * - Valor do filtro selecionado
         * 
         * **/
    list_filter: () => [],
    // se não for passado, assume que é para todos os itens
    // até o momento existem 2 items: 1 (search) e 2 (filter)
    item_use: () => [1, 2], // se não for passado, assume que é para todos os itens
    // até o momento existem 2 items: 1 (search) e 2 (filter)
    placeholder_search: "Buscar...",
    click: null,
    deactivate_search_on_clear: false,
    deactivate_search_empty: false,
    columns_list: () => [],
    use_column_manager: false,
    toggleColumnVisibility: () => { }
});

const emit = defineEmits(['update:search', 'update:filter', "search", "clickedClearSearch"]);

const modelSearch = computed({
    get: () => props.search,
    set: (value) => emit('update:search', value)
});
const modelFilter = computed({
    get: () => props.filter,
    set: (value) => emit('update:filter', value)
});
watch(modelFilter, () => {
    // emite o evento de busca quando o filtro é alterado
    emit('search');
});
watch(
    () => props.list_filter,
    (newFilter) => {
        // valida os filtros para garantir que são válidos, caso não retorna erro explicando qual foi
        // exemplo se for um filtro router-link e não tiver o to
        if (Array.isArray(newFilter)) {
            newFilter.forEach((filter, index) => {
                if (filter?.type === 1 && !filter.to) {
                    console.error(`Filtro na posição ${index} é do tipo 'router-link' mas não possui a propriedade 'to'.`);
                }
            });
            // se ele optou por ter filtros e não passou nenhum, retorna erro
            if (props.item_use.includes(2) && newFilter.length === 0) {
                console.error("Nenhum filtro foi passado. Certifique-se de que o array de filtros não está vazio.");
            }
        } else {
            console.error("list_filter deve ser um array.");
        }
    },
    { immediate: true, deep: true }
);
function tradeFilter(newFilter: string): void {
    // troca o filtro entre os disponíveis e caso já esteja selecionado, limpa o filtro
    if (modelFilter.value === newFilter) {
        modelFilter.value = "";
    } else {
        modelFilter.value = newFilter;
    }
}

function cleanSearch(): void {
    modelSearch.value = ""
    if (!props.deactivate_search_on_clear) {
        emit('search'); // emite o evento de busca para atualizar a lista
    }
    emit('clickedClearSearch');
}

function clickItem(filter: any): void {
    if (filter.click && typeof filter.click === 'function') {
        filter.click();
    } else {
        console.error("O filtro selecionado não possui uma função de clique válida.");
    }
}
function searchEnter(): void {
    // emite o evento de busca quando o enter é pressionado
    if (props.deactivate_search_empty && modelSearch.value.trim() === "") {
        return;
    }
    emit('search');
}
</script>
<style scoped>
.inputClose {
    color: var(--tblr-icon-color);
    z-index: 10;
    position: absolute;
    top: 50%;
    right: 0;

    transform: translateY(-50%);
    font-size: 1.2em;
    min-width: 2.5rem;
    display: flex;
    justify-content: center;
}

.inputClose:hover {
    cursor: pointer;
}

.selected:hover {
    background-color: rgb(176, 42, 42) !important;
    color: white !important;
}
</style>