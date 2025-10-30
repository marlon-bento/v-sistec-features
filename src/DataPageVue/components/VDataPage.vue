<template>
    <div>
        <div v-if="type_fetch === 'pagination'" class="" :class="props.class_container">
            <template v-for="item in items" :key="item[props.item_key]">
                <slot name="body" :item="item">

                </slot>
            </template>
        </div>
        <div v-else-if="type_fetch === 'infinite-scroll'" :class="props.class_container">

            <InfiniteLoading :identifier="topLoaderId" direction="top" @infinite="carregarPaginaTop">
                <template #complete><span></span></template>
                <template #spinner><span></span></template>
            </InfiniteLoading>
            <template v-for="item in items_infinite" :key="item[props.item_key]">
                <slot name="body" :item="item">
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
        <slot v-if="type_fetch === 'pagination'" name="pagination" :pagination="pagination"
            :tradePage="fetchDataWithDelay" :error="error">
            <div v-if="!error && pagination.count > 0" class="px-3" :class="props.class_pagination">
                <PaginationDatatable :filtering="true" :pagination="pagination" @tradePage="fetchDataWithDelay" />
            </div>
        </slot>
    </div>

</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { readonly, ref, isRef, computed, watch, onMounted, nextTick, type Component, type Ref, type WatchSource } from 'vue';
import InfiniteLoading from "v3-infinite-loading";
import PaginationDatatable from './PaginationDatatable.vue';
// import Search from './SearchDatatable.vue';

interface VDataPageProps {
    /* configuração do useApiFetch */
    fetch: Function;
    fetch_name?: string;
    endpoint: string;
    /* tipos de loading pré-definidos*/
    type_loading?: 'placeholder' | 'spiner-table' | 'spiner';
    type_fetch?: 'pagination' | 'infinite-scroll' | 'none';

    /*recebe um component para loading*/
    custom_loading?: Component | null;
    /* retira os params default da requisição */
    deactivate_default_params?: boolean;
    /* nomes dos parâmetros para passar para o backend */
    filter_param_name?: string;
    search_param_name?: string;
    page_param_name?: string;
    page_size_param_name?: string;
    add_params?: Object | Function;

    /* usado para pegar os dados do useApiFetch */
    data_key?: string;
    total_key?: string;

    /* filtros que irão ser usados */
    list_filter?: any[];
    /* mudar o que está escrito no select de mudança de items_per_page*/
    first_text_page_size?: string;
    second_text_page_size?: string;


    /* props para estilizar o vdatatable */
    class_container?: string;
    class_pagination?: string;
    class_filters?: string;

    /*
    * tempo mínimo em ms para mostrar o loading para evitar telas piscando
  */
    min_loading_delay?: number;
    /* 
    - Número de tentativas automáticas em caso de falha.
    - 1 significa que a requisição será feita apenas uma vez, sem retentativas.
    - Valor padrão é 3.
    */
    retry_attempts?: number;
    // Atraso em milissegundos entre cada tentativa
    retry_delay?: number;

    // Ativa a funcionalidade de seleção com checkboxes
    use_checkbox?: boolean;
    // Define qual propriedade do item será usada como chave única para a seleção.
    item_key?: string;

    limit_per_page?: number;

    next_page_response_name?: string;
    page_starts_at: number;
    element_id?: string;
    watch?: WatchSource[]
}

interface ExposedFunctions {
    execute: () => void;
    pagination: Ref<PaginationObject>;
    default_params: Record<string, any>;
    set_limit_per_page: (newLimit: number) => void;
    set_search: (newSearch: string) => void;
    set_filter: (newFilter: string) => void;
    set_page: (newPage: number) => void;
}

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
    watch: () => []
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

interface PaginationObject {
    current_page: number;
    count: number;
    limit_per_page: number;
    search: string;
    filter: string;
}

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
const { data: response, pending: _pending, error, execute, attempt: _attempt } = props.fetch(props.endpoint, {
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
// const item_use = computed<number[]>(() => {
//     let use = [1]
//     if (props.list_filter.length > 0) {
//         use.push(2)
//     }
//     return use;
// });

const default_params = computed<Record<string, any>>(() => ({
    [props.page_param_name]: pagination.value.current_page + 1,
    [props.page_size_param_name]: pagination.value.limit_per_page,
    [props.search_param_name]: pagination.value.search || "",
    [props.filter_param_name]: pagination.value.filter || "",
}));

// para controlar a exibição do loading
// const showLoadingState = computed<boolean>(() => {
//     return (pending.value || isDelaying.value)
// });



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

    return execute(); // Executa a busca de dados original do useApiFetch
}
async function initDataInfinite() {
    items.value = [];
    items_infinite.value = [];

    pagination.value.current_page = props.page_starts_at;

    await fetchDataWithDelay();

    nextTick(() => {
        items_infinite.value.push(...items.value);
        dadosInicializados.value = true;
        bottomLoaderId.value++;
        topLoaderId.value++;
    });
}


// function reSearch(): void {
//     pagination.value.current_page = 0;
//     fetchDataWithDelay();
// }

// const changePageSize = (event: Event): void => {
//     const target = event.target as HTMLInputElement;
//     const newSize = parseInt(target.value, 10);
//     if (newSize > 0) {
//         pagination.value.limit_per_page = newSize;
//         pagination.value.limit_per_page = newSize; // Atualiza o limite de itens por página
//         pagination.value.current_page = 0;
//         fetchDataWithDelay();
//     }
// };



// =======================================================
// 7. EXPOSE E CICLO DE VIDA
// =======================================================
function set_limit_per_page(newLimit: number): void {
    if (newLimit > 0) {
        pagination.value.limit_per_page = newLimit;
        pagination.value.current_page = 0;
        fetchDataWithDelay();
    } else {
        console.warn("O limite deve ser um número maior que zero.");
    }
}
function set_search(newSearch: string): void {
    pagination.value.search = newSearch;
    pagination.value.current_page = 0;
    fetchDataWithDelay();
}
function set_filter(newFilter: string): void {
    pagination.value.filter = newFilter;
    pagination.value.current_page = 0;
    fetchDataWithDelay();
}
function set_page(newPage: number): void {
    if (newPage >= 1 && newPage <= Math.ceil(pagination.value.count / pagination.value.limit_per_page)) {
        pagination.value.current_page = newPage - 1;
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
    default_params
});

onMounted(() => {
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

    items_infinite.value.push(...novosItens);

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
    if (novosItens.length === 0 && items.value.length > 0) {
        $state.loaded();
        return; // Evita adicionar duplicatas
    }

    items_infinite.value.unshift(...novosItens);

    if (items_infinite.value && items_infinite.value.length > pagination.value.limit_per_page * 2) {
        items_infinite.value.splice(-pagination.value.limit_per_page, pagination.value.limit_per_page);
    }
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
if (watchSources.length > 0) {
    if (props.type_fetch === 'pagination') {
        watch(watchSources, () => {
            pagination.value.current_page = props.page_starts_at;
            fetchDataWithDelay();
        }, { deep: true });
    } else if (props.type_fetch === 'infinite-scroll') {
        watch(watchSources, () =>{
            dadosInicializados.value = false;
            initDataInfinite();
        } , { deep: true });
    }

}

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