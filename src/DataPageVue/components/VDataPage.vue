<template>
    <div>
        <template v-if="type_fetch === 'pagination'" class="">

            <template v-if="showLoadingState">
                <div :class="props.class_loading_container">
                    <template v-for="n in pagination.limit_per_page" :key="'placeholder-' + n">
                        <slot name="loading" :n="n">

                        </slot>
                    </template>
                </div>
            </template>
            <template v-else-if="error">
                <slot name="error" :error="error">
                    <div class="alert alert-danger" role="alert">
                        Ocorreu um erro ao carregar os dados.
                    </div>
                </slot>
            </template>
            <template v-else-if="pagination.count === 0">
                <slot name="empty">
                    <div class="alert alert-info" role="alert">
                        Nenhum registro encontrado.
                    </div>
                </slot>
            </template>
            <div v-else :class="props.class_container">
                <template v-for="(item, index) in items" :key="item[props.item_key]">
                    <slot name="body" :item="item" :index="index">

                    </slot>
                </template>
            </div>
        </template>
        <div v-else-if="type_fetch === 'infinite-scroll'" :class="props.class_container">

            <InfiniteLoading :identifier="topLoaderId" direction="top" @infinite="carregarPaginaTop">
                <template #complete><span></span></template>
                <template #spinner><span></span></template>
            </InfiniteLoading>
            <template v-for="item in items_infinite" :key="item[props.item_key]">
                <slot v-if="!item.loading" name="body" :item="item">
                </slot>
                <slot v-else name="loading">

                </slot>
            </template>
            <InfiniteLoading :identifier="bottomLoaderId" @infinite="carregarPaginaBottom">
                <template #complete>
                    <slot name="scroll-finish">
                        <span class="scroll-finish-style">
                            Fim dos registros</span>
                    </slot>
                </template>
            </InfiniteLoading>
        </div>

        <Teleport :to="props.pagination_teleport || 'body'" :disabled="!props.pagination_teleport">
            <slot v-if="type_fetch === 'pagination'" name="pagination" :pagination="pagination"
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
import { readonly, ref, isRef, computed, watch, nextTick, type Ref, type WatchSource } from 'vue';
import InfiniteLoading from "v3-infinite-loading";
import Pagination from '@/Pagination/Pagination.vue';

import type { VDataPageProps, ExposedFunctions, PaginationObject } from '../types/v-data-page.ts';
// import Search from './SearchDatatable.vue';


const emit = defineEmits(['tradePage', 'beforeFetch', 'afterFetch']);

// =======================================================
// 1. DEFINIÇÃO DE PROPS COM VALORES PADRÃO
// =======================================================

const props = withDefaults(defineProps<VDataPageProps>(), {
    fetch_name: '',
    type_loading: 'placeholder',
    custom_loading: null,
    deactivate_default_params: false,
    filter_param_name: 'filter',
    search_param_name: 'search',
    page_param_name: 'page',
    page_size_param_name: 'page_size',

    next_page_response_name: 'next_page',
    add_params: () => ({}),
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
    disable_request: false,
    pagination_teleport: null,
});


// =======================================================
// 2. ESTADO REATIVO PRINCIPAL
// =======================================================
const first_fetch = ref<boolean>(true);
const bottomLoaderId = ref(Date.now());
const topLoaderId = ref(Date.now());

const items = ref<T[]>([]) as Ref<T[]>;
const items_infinite = ref<T[]>([]) as Ref<T[]>;

const totalItems = ref<number>(0);
const isDelaying = ref<boolean>(false);
const delayTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const dadosInicializados = ref<boolean>(false)



/*--------- definição de páginação ---------------*/
const pagination = ref<PaginationObject>({
    current_page: props.page_starts_at, // pagina atual
    count: 0,  // total de itens
    limit_per_page: props.limit_per_page, // limite de itens por página
    search: '', // termo de busca
    filter: '', // filtro selecionado

})

// =======================================================
// 3. LÓGICA DA API (useFetch)
// =======================================================
const { data: response, pending: pending, error, execute, attempt: _attempt } = props.fetch(props.endpoint, {
    disable_request: () => props.disable_request,
    params: () => {

        if (props.deactivate_default_params) {
            if (props.add_params && typeof props.add_params === 'function') {
                return props.add_params();
            }
            return {
                ...props.add_params,
            };
        }
        else if (props.add_params && typeof props.add_params === 'function') {
            return {
                ...default_params.value,
                ...props.add_params(),
            }
        }
        return {
            ...default_params.value,
            ...props.add_params,
        };
    },
    retry: props.retry_attempts,
    retryDelay: props.retry_delay,
    paramsReactives: false,
    immediate: false,
}, props.fetch_name);

// =======================================================
// 4. PROPRIEDADES COMPUTADAS
// =======================================================

const default_params = computed<Record<string, any>>(() => ({
    [props.page_param_name]: pagination.value.current_page + 1,
    [props.page_size_param_name]: pagination.value.limit_per_page,
    [props.search_param_name]: pagination.value.search || "",
    [props.filter_param_name]: pagination.value.filter || "",
}));

// para controlar a exibição do loading
const showLoadingState = computed<boolean>(() => {
    return (pending.value || isDelaying.value)
});



// =======================================================
// 5. WATCHERS (Observadores)
// =======================================================



watch(response, (newResponse: any) => {
    if (newResponse) {
        items.value = newResponse[props.data_key] || [];
        totalItems.value = newResponse[props.total_key] || 0;
        pagination.value.count = totalItems.value;
    } else {
        items.value = [];
        totalItems.value = 0;
    }
}, { immediate: true });

function reSearch() {
    pagination.value.current_page = props.page_starts_at;
    fetchDataWithDelay();
}
// =======================================================
// 6. MÉTODOS
// =======================================================

// Função que gerencia o delay e a chamada da API
async function fetchDataWithDelay(): Promise<void> {
    // Limpa timer anterior, se houver
    if (delayTimer.value) clearTimeout(delayTimer.value);

    isDelaying.value = true;

    delayTimer.value = setTimeout(() => {
        isDelaying.value = false;
    }, props.min_loading_delay);
    if (props.type_fetch === 'infinite-scroll') {
        return execute();
    } else if (props.type_fetch === 'pagination') {
        emit("beforeFetch")
        await execute();
        emit("afterFetch")
    }

}
// Função para inicializar dados no infinite scroll e evitar condições de corrida
let init_id = 0;
async function initDataInfinite() {
    init_id++;
    const current_init_id = init_id;

    items.value = [];
    items_infinite.value = [];

    pagination.value.current_page = props.page_starts_at;
    emit("beforeFetch")
    await fetchDataWithDelay();
    emit("afterFetch")

    if (current_init_id !== init_id) {
        return;
    }

    nextTick(() => {
        if (current_init_id !== init_id) {
            return;
        }
        let idhashInfiniteLoading = crypto.randomUUID();
        items.value.forEach((item: any) => {
            item.loading = true;
            item.idhashInfiniteLoading = idhashInfiniteLoading;
        });
        items_infinite.value.push(...items.value);
        setTimeout(() => {
            items_infinite.value.forEach((item: any) => {
                if (item.idhashInfiniteLoading === idhashInfiniteLoading) {
                    item.loading = false;
                    delete item.idhashInfiniteLoading;
                }
            });
        }, props.min_loading_delay)
        dadosInicializados.value = true;
        bottomLoaderId.value++;
        topLoaderId.value++;
    });
}


// =======================================================
// 7. EXPOSE E CICLO DE VIDA
// =======================================================
function set_limit_per_page(newLimit: number): void {
    if (newLimit > 0) {
        pagination.value.limit_per_page = newLimit;
        reSearch();
    } else {
        console.warn("O limite deve ser um número maior que zero.");
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
    if (newPage >= 0 && newPage <= Math.ceil(pagination.value.count / pagination.value.limit_per_page)) {
        pagination.value.current_page = newPage;
        fetchDataWithDelay();
    } else {
        console.warn("Número de página inválido.");
    }
}

defineExpose<
    ExposedFunctions
>({
    execute: fetchDataWithDelay,
    pagination: readonly(pagination),
    set_limit_per_page: set_limit_per_page,
    set_search: set_search,
    set_filter: set_filter,
    set_page: set_page,
    reSearch: reSearch,
    default_params
});

const proxima_pagina = computed(() => {
    return response.value?.[props.next_page_response_name] || null
})


async function carregarPaginaBottom($state: any) {
    if (!dadosInicializados.value) return;


    if (!proxima_pagina.value) {
        $state.complete();
        return;
    }
    pagination.value.current_page += 1;
    // paginaAtual.value += 1;
    await execute();

    if (error.value) {
        $state.error();
        return;
    }
    if (!items.value || items.value.length === 0) {
        $state.complete();
        return;
    }

    // --- FILTRAR DUPLICATAS ---
    const novosItens = items.value.filter(
        (novoItem: any) => !items_infinite.value.some(itemExistente => itemExistente[props.item_key] === novoItem[props.item_key])
    );
    if (novosItens.length === 0 && items.value.length > 0) {
        $state.loaded();
        return;
    }
    const idhashInfiniteLoading = crypto.randomUUID();
    novosItens.forEach((item: any) => {
        item.loading = true;
        item.idhashInfiniteLoading = idhashInfiniteLoading;
    });
    items_infinite.value.push(...novosItens);
    setTimeout(() => {
        items_infinite.value.forEach((item: any) => {
            if (item.idhashInfiniteLoading === idhashInfiniteLoading) {
                item.loading = false;
                delete item.idhashInfiniteLoading;
            }
        });
    }, props.min_loading_delay)

    nextTick(() => {
        if (items_infinite.value && items_infinite.value.length > pagination.value.limit_per_page * 2) {
            items_infinite.value.splice(0, pagination.value.limit_per_page);
        }
        if (proxima_pagina.value) {
            $state.loaded();
        } else {
            $state.complete();
        }
        topLoaderId.value++;
    });
}
async function carregarPaginaTop($state: any) {
    if (!dadosInicializados.value) return;

    if (pagination.value.current_page <= props.page_starts_at) {
        $state.complete();
        return;
    }
    const primeiro_item = items_infinite.value[0];
    if (!primeiro_item) return;

    const id_primeiro_artigo = primeiro_item[props.item_key];

    if (!id_primeiro_artigo) {
        $state.error();
        return
    };
    pagination.value.current_page -= 1;
    await execute();

    if (error.value) {
        $state.error();
        return;
    }

    if (!items.value || items.value.length === 0) {
        $state.loaded();
        return;
    }

    // --- FILTRAR DUPLICATAS ---
    const novosItens = items.value.filter(
        (novoItem: any) => !items_infinite.value.some(itemExistente => itemExistente[props.item_key] === novoItem[props.item_key])
    );
    const idhashInfiniteLoading = crypto.randomUUID();
    novosItens.forEach((item: any) => {
        item.loading = true;
        item.idhashInfiniteLoading = idhashInfiniteLoading;
    });

    if (novosItens.length === 0 && items.value.length > 0) {
        $state.loaded();
        return; // Evita adicionar duplicatas
    }

    items_infinite.value.unshift(...novosItens);

    if (items_infinite.value && items_infinite.value.length > pagination.value.limit_per_page * 2) {
        items_infinite.value.splice(-pagination.value.limit_per_page, pagination.value.limit_per_page);
    }
    setTimeout(() => {
        items_infinite.value.forEach((item: any) => {
            if (item.idhashInfiniteLoading === idhashInfiniteLoading) {
                item.loading = false;
                delete item.idhashInfiniteLoading;
            }
        });
    }, props.min_loading_delay)
    nextTick(() => {

        const elementoAlvo = document.getElementById(props.element_id + id_primeiro_artigo);
        if (elementoAlvo) {
            elementoAlvo.scrollIntoView({ behavior: 'auto', block: 'start' });
        } else {
            console.warn(`
            Elemento não encontrado para scroll verifique se a propriedade 'element_id' está correta ou não foi definida.
            `);
        }
        bottomLoaderId.value++;
        $state.loaded();
    });
}


const watchSources: WatchSource[] = [];

if (props.watch && Array.isArray(props.watch)) {
    props.watch.forEach(source => {
        if (isRef(source) || typeof source === 'function') {
            watchSources.push(source);
        }
    });
}
watch(() => pagination.value.current_page, () => {
    emit("tradePage")
});
if (watchSources.length > 0) {
    if (props.type_fetch === 'pagination') {
        watch(watchSources, () => {
            reSearch();
        }, { deep: true });
    } else if (props.type_fetch === 'infinite-scroll') {
        watch(watchSources, () => {
            dadosInicializados.value = false;
            initDataInfinite();
        }, { deep: true });
    }

}
function tradePageEmit() {
    emit("tradePage");
    fetchDataWithDelay();
}
// watch(() => showLoadingState.value, (newVal) => {

// });

watch(
    () => props.add_params,
    () => {
        if (first_fetch.value) {

            nextTick(() => {
                /* 
                * executar dentro do nextTick para garantir que o pai já tem acesso ao 
                * ref que foi exposto
                */
                if (first_fetch.value && props.type_fetch === 'infinite-scroll') {
                    initDataInfinite();
                    first_fetch.value = false;
                } else if (first_fetch.value && props.type_fetch === 'pagination') {
                    fetchDataWithDelay();
                    first_fetch.value = false;
                }
            })
        } else {
            if (props.type_fetch === 'pagination') {
                reSearch();
            } else if (props.type_fetch === 'infinite-scroll') {
                dadosInicializados.value = false;
                initDataInfinite();
            }
        }
    },
    { deep: true, immediate: true }
)
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