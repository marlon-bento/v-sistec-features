<template>
    <div>
        <template v-if="props.type_fetch === 'pagination' || isPaginationDisabled">
            <template v-if="showLoadingState">
                <div :class="props.class_loading_container">
                    <template v-for="(n, index) in pagination.limit_per_page" :key="'placeholder-' + n">
                        <slot name="loading" :n="n" :index="index"></slot>
                    </template>
                </div>
            </template>
            <template v-else-if="error">
                <slot name="error" :error="error" :attempt="attempt" :retry="fetchDataWithDelay">
                    <div class="alert alert-danger" role="alert">
                        Ocorreu um erro ao carregar os dados.
                    </div>
                </slot>
            </template>
            <template v-else-if="items.length === 0">
                <slot name="empty">
                    <div class="alert alert-info" role="alert">
                        Nenhum registro encontrado.
                    </div>
                </slot>
            </template>
            <div v-else :class="props.class_container">
                <template v-for="(item, index) in items" :key="item[props.item_key] ?? index">
                    <slot name="body" :item="item" :index="index"></slot>
                </template>
            </div>
        </template>

        <div v-else-if="props.type_fetch === 'infinite-scroll'" :class="props.class_container">
            <InfiniteLoading :identifier="topLoaderId" direction="top" @infinite="carregarPaginaTop">
                <template #complete><span></span></template>
                <template #spinner><span></span></template>
            </InfiniteLoading>

            <template v-for="(item, index) in items_infinite" :key="item[props.item_key] ?? index">
                <slot v-if="!item.loading" name="body" :item="item" :index="index"></slot>
                <slot v-else name="loading" :index="index"></slot>
            </template>

            <InfiniteLoading :identifier="bottomLoaderId" @infinite="carregarPaginaBottom">
                <template #complete>
                    <slot name="scroll-finish">
                        <span class="scroll-finish-style">Fim dos registros</span>
                    </slot>
                </template>
            </InfiniteLoading>
        </div>

        <Teleport v-if="isMounted && !isPaginationDisabled" :to="props.pagination_teleport || 'body'" :disabled="!props.pagination_teleport">
            <slot v-if="props.type_fetch === 'pagination'" name="pagination" :pagination="pagination"
                :tradePage="fetchDataWithDelay" :error="error">
                <div v-if="!error && pagination.count > 0" class="px-3" :class="props.class_pagination">
                    <Pagination :filtering="true" :page_starts_at="props.page_starts_at" :pagination="pagination"
                        @tradePage="tradePageEmit" />
                </div>
            </slot>
        </Teleport>
    </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { readonly, ref, computed, watch, nextTick, onMounted } from 'vue';
import InfiniteLoading from 'v3-infinite-loading';
import Pagination from '@/Pagination/Pagination.vue';
import { useDataPageFetch } from '../composables/useDataPageFetch';
import type { VDataPageProps, DataPagePropsWithDefaults, ExposedFunctions, PaginationObject } from '../types/v-data-page.ts';

const emit = defineEmits(['tradePage', 'beforeFetch', 'afterFetch']);

/*
Variável responsável por indicar se o componente já foi totalmente montado no DOM.
Impede que o Teleport tente enviar elementos para um alvo que ainda não foi renderizado.
*/
const isMounted = ref(false);

// =======================================================
// 1. DEFINIÇÃO DE PROPS COM VALORES PADRÃO
// =======================================================
const props = withDefaults(defineProps<VDataPageProps>(), {
    fetch_name: '',
    type_loading: 'placeholder',
    custom_loading: null,
    deactivate_default_params: false,
    disable_pagination: false,
    frontend_pagination: false,
    custom_frontend_filter: null,
    filter_param_name: 'filter',
    search_param_name: 'search',
    page_param_name: 'page',
    page_size_param_name: 'page_size',
    next_page_response_name: 'next_page',
    add_params: () => ({}),
    add_params_keep_page: () => ({}),
    silent_params: () => ({}),
    data_key: 'results',
    total_key: 'count',
    list_filter: () => [],
    class_container: '',
    class_pagination: '',
    class_filters: '',
    min_loading_delay: 600,
    retry_attempts: 3,
    retry_delay: 2000,
    use_checkbox: false,
    item_key: 'id',
    first_text_page_size: 'Mostrar',
    second_text_page_size: 'registros',
    limit_per_page: 5,
    type_fetch: 'pagination',
    page_starts_at: 0,
    element_id: '',
    class_loading_container: '',
    watch: () => [],
    immediate: true,
    disable_request: false,
    pagination_teleport: null,
});

const options = computed(() => props as DataPagePropsWithDefaults);

// =======================================================
// 2. ESTADO REATIVO DE PAGINAÇÃO E COMPOSABLE DE FETCH
// =======================================================
const pagination = ref<PaginationObject>({
    current_page: props.page_starts_at,
    count: 0,
    limit_per_page: props.limit_per_page,
    search: '',
    filter: '',
});

const {
    items,
    raw_items,
    items_infinite,
    isPaginationDisabled,
    error,
    attempt,
    default_params,
    fetchDataWithDelay,
    reSearch,
    initDataInfinite,
    carregarPaginaBottom,
    carregarPaginaTop,
    showLoadingState,
    bottomLoaderId,
    topLoaderId,
} = useDataPageFetch<T>(options, pagination, emit);

// =======================================================
// 3. MÉTODOS DE CONTROLE E EVENTOS
// =======================================================
function set_limit_per_page(newLimit: number): void {
    if (newLimit > 0) {
        pagination.value.limit_per_page = newLimit;
        reSearch();
    } else {
        console.warn('O limite deve ser um número maior que zero.');
    }
}

function set_search(newSearch: string): void {
    pagination.value.search = newSearch;
    reSearch();
}

function set_filter(newFilter: string): void {
    pagination.value.filter = newFilter;
    reSearch();
}

function set_page(newPage: number): void {
    if (isPaginationDisabled.value) {
        pagination.value.current_page = newPage;
        fetchDataWithDelay();
        return;
    }

    const maxPages = Math.ceil(pagination.value.count / pagination.value.limit_per_page);
    if (newPage >= 0 && newPage <= maxPages) {
        pagination.value.current_page = newPage;
        fetchDataWithDelay();
    } else {
        console.warn('Número de página inválido.');
    }
}

function tradePageEmit(): void {
    emit('tradePage');
    fetchDataWithDelay();
}

watch(() => pagination.value.current_page, () => {
    emit('tradePage');
});

// =======================================================
// 4. EXPOSE E CICLO DE VIDA
// =======================================================
defineExpose<ExposedFunctions<T>>({
    execute: fetchDataWithDelay,
    reSearch: reSearch,
    pagination: readonly(pagination),
    set_limit_per_page: set_limit_per_page,
    set_search: set_search,
    set_filter: set_filter,
    set_page: set_page,
    default_params,
    items: readonly(items),
    results: readonly(raw_items),
});

onMounted(() => {
    isMounted.value = true;
    if (props.immediate) {
        nextTick(() => {
            if (props.type_fetch === 'infinite-scroll' && !isPaginationDisabled.value) {
                initDataInfinite();
            } else {
                reSearch();
            }
        });
    }
});
</script>

<style lang="scss" scoped>
.scroll-finish-style {
    color: #6c757d;
    display: block;
    text-align: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
}
</style>
