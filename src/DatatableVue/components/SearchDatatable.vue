<template>


    <a @click.prevent v-if="item_use.includes(2)" href="#" class="btn dropdown-toggle" data-bs-toggle="dropdown"
        title="Pesquisas Prédefinidas">
        <!-- filter -->
        <component :is="icons.search.filter" />
    </a>
    <div class="input-icon">
        <input type="text" class="form-control ms-1" id="inputSearchVDataTable" v-model="modelSearch"
            @keyup.enter="searchEnter" :placeholder="placeholder_search">

        <span v-if="modelSearch" @click="cleanSearch()" class=" inputClose" title="Limpar pesquisa">
            <!-- clear -->
            <component :is="icons.search.clear" />
        </span>
        <span v-else class="input-icon-addon">
            <!-- lupa -->
            <component :is="icons.search.loupe" />
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


</template>
<script setup lang="ts">
import { computed, watch } from 'vue';
import {buildIcons} from '@/utils/svgFactory'
import { svgs } from '@/DatatableVue/style/svgs'
const icons = buildIcons(svgs)
interface SearchProps {
    search: string;
    filter?: string;
    list_filter?: any[];
    item_use?: number[];
    placeholder_search?: string;
    deactivate_search_on_clear?: boolean;
    deactivate_search_empty?: boolean;

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