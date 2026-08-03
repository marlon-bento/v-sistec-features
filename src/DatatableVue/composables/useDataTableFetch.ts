import { ref, computed, type Ref, watch, unref } from 'vue';
import type { PaginationObject, DataTablePropsWithDefaults } from '../types/v-data-table'; // Ajuste o caminho conforme necessário
import { type ColumnConfiguration } from '../keys';


export function useDataTableFetch<T extends Record<string, any>>(
    /* para manter a reatividade a prop agora precisa usar unref*/
    props: Ref<DataTablePropsWithDefaults>,
    pagination: Ref<PaginationObject>,
    columns: Ref<ColumnConfiguration[]>,
    orderings_state: Ref<Record<string, 'none' | 'increasing' | 'decreasing'>>,
    emit: (event: 'beforeFetch' | 'afterFetch') => void,
    close_all_expanded_items: () => void

) {
    // Estado para armazenar o retorno bruto da API
    const raw_items = ref<T[]>([]) as Ref<T[]>;


    const propsValue = computed(() => unref(props));
    const urlReativa = computed(() => {
        return propsValue.value.endpoint;
    });


    const default_params = computed<Record<string, any>>(() => ({
        [propsValue.value.page_param_name]: pagination.value.current_page + 1,
        [propsValue.value.page_size_param_name]: pagination.value.limit_per_page,
        [propsValue.value.search_param_name]: pagination.value.search || "",
        [propsValue.value.filter_param_name]: pagination.value.filter || "",
    }));

    const params_ordering = computed(() => {
        const objectOrdering: Record<string, any> = {};
        for (const col of columns.value) {
            if (col.use_ordering) {
                if (orderings_state.value[col.id] === 'increasing') {
                    objectOrdering[col.param_ordering] = col.increasing_value || 'increasing';
                } else if (orderings_state.value[col.id] === 'decreasing') {
                    objectOrdering[col.param_ordering] = col.decreasing_value || 'decreasing';
                }
            }
        }

        return objectOrdering;
    });
    const { data: response, pending, error, execute, attempt } = propsValue.value.fetch(urlReativa, {
        disable_request: () => propsValue.value.disable_request,
        params: () => {
            /*add_params*/
            const addParamsIsFunction = typeof propsValue.value.add_params === 'function';
            let extraAddParams = {};
            /*silent_params*/
            const silentParamsIsFunction = typeof propsValue.value.silent_params === 'function';
            let extraSilentParams = {};
            /*add_params_keep_page*/
            const addParamsKeepPageIsFunction = typeof propsValue.value.add_params_keep_page === 'function';
            let extraAddParamsKeepPage = {};




            if (addParamsIsFunction) {
                const getParams = propsValue.value.add_params as () => Record<string, any>;
                extraAddParams = getParams();
            } else {
                extraAddParams = propsValue.value.add_params || {};
            }

            if (silentParamsIsFunction) {
                const getParams = propsValue.value.silent_params as () => Record<string, any>;
                extraSilentParams = getParams();
            } else {
                extraSilentParams = propsValue.value.silent_params || {};
            }

            if (addParamsKeepPageIsFunction) {
                const getParams = propsValue.value.add_params_keep_page as () => Record<string, any>;
                extraAddParamsKeepPage = getParams();
            } else {
                extraAddParamsKeepPage = propsValue.value.add_params_keep_page || {};
            }


            if (propsValue.value.deactivate_default_params) {
                return {
                    ...extraAddParams,
                    ...extraSilentParams,
                    ...extraAddParamsKeepPage,
                    ...params_ordering.value
                };
            }
            return {
                ...default_params.value,
                ...extraAddParams,
                ...extraSilentParams,
                ...extraAddParamsKeepPage,
                ...params_ordering.value
            };
        },
        retry: propsValue.value.retry_attempts,
        retryDelay: propsValue.value.retry_delay,
        paramsReactives: false,
        immediate: false,
    }, propsValue.value.fetch_name);

    const filtered_items = computed<T[]>(() => {
        if (!propsValue.value.frontend_pagination) {
            return raw_items.value;
        }

        let filtered = raw_items.value;
        const customFilterFn = propsValue.value.custom_frontend_filter;

        if (customFilterFn && typeof customFilterFn === 'function') {
            filtered = filtered.filter(item =>
                customFilterFn(item, pagination.value.search, pagination.value.filter)
            );
        } else if (pagination.value.search) {
            const searchLower = pagination.value.search.toLowerCase();
            filtered = filtered.filter(item => {
                return Object.values(item).some(val =>
                    val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
                );
            });
        }

        return filtered;
    });

    watch(filtered_items, (newVal) => {
        if (propsValue.value.frontend_pagination) {
            pagination.value.count = newVal.length;

            const maxPage = Math.ceil(newVal.length / pagination.value.limit_per_page) - 1;
            if (pagination.value.current_page > maxPage && maxPage >= 0) {
                pagination.value.current_page = maxPage;
            }
        }
    }, { immediate: true });

    const items = computed<T[]>(() => {
        if (!propsValue.value.frontend_pagination) {
            return raw_items.value;
        }

        const start = pagination.value.current_page * pagination.value.limit_per_page;
        const end = start + pagination.value.limit_per_page;

        return filtered_items.value.slice(start, end);
    });

    const isDelaying = ref<boolean>(false);
    const delayTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const first_fetch = ref<boolean>(false);
    // para controlar a exibição do loading
    const showLoadingState = computed<boolean>(() => {
        return (pending.value || isDelaying.value)
    });
    // Função que gerencia o delay e a chamada da API
    async function fetchDataWithDelay(): Promise<void> {
        // agora já fez pelo menos a primeira busca então marca como true
        if (!first_fetch.value) first_fetch.value = true;

        // Limpa timer anterior, se houver
        if (delayTimer.value) clearTimeout(delayTimer.value);

        isDelaying.value = true;

        delayTimer.value = setTimeout(() => {
            isDelaying.value = false;
        }, propsValue.value.min_loading_delay);

        close_all_expanded_items();
        emit('beforeFetch');
        if (!propsValue.value.frontend_pagination || raw_items.value.length === 0) {
            await execute(); // Executa a busca de dados original do useApiFetch
        }

        emit('afterFetch');
    }

    function reSearch(): void {
        pagination.value.current_page = propsValue.value.page_starts_at;

        fetchDataWithDelay();
    }


    watch(response, (newResponse: any) => {
        if (newResponse) {
            let fetchedData = [];

            // Aceitação de dados direto da raiz do objeto quando data_key for string vazia
            if (!propsValue.value.data_key) {
                fetchedData = Array.isArray(newResponse) ? newResponse : [newResponse];
            } else {
                fetchedData = newResponse[propsValue.value.data_key] || [];
            }

            raw_items.value = fetchedData;

            // O count é operado pelo frontend se a prop estiver ativa
            if (!propsValue.value.frontend_pagination) {
                pagination.value.count = newResponse[propsValue.value.total_key] || 0;
            }

        } else {
            raw_items.value = [];
            pagination.value.count = 0;
        }
    }, { immediate: true });

    watch(
        () => {
            const params = typeof propsValue.value.add_params === 'function'
                ? propsValue.value.add_params()
                : propsValue.value.add_params;
            return JSON.stringify(params);
        },
        (newVal, oldVal) => {
            if (newVal !== oldVal && oldVal !== undefined) {
                reSearch();
            }
        }
    );
    watch(
        () => {
            const params = typeof propsValue.value.add_params_keep_page === 'function'
                ? propsValue.value.add_params_keep_page()
                : propsValue.value.add_params_keep_page;
            return JSON.stringify(params);
        },
        (newVal, oldVal) => {
            if (newVal !== oldVal && oldVal !== undefined) {
                fetchDataWithDelay();
            }
        }
    );

    /* 
    ========
    Observa mudanças no endpoint.
    Caso a rota da API mude dinamicamente, ele reseta a tabela para a página inicial com segurança.
    ========
    */
    watch(
        () => propsValue.value.endpoint,
        (newVal, oldVal) => {
            if (newVal !== oldVal && oldVal !== undefined) {
                pagination.value.current_page = propsValue.value.page_starts_at;
            }
        }
    );
    return {
        items,
        pending,
        error,
        execute,
        response,
        attempt,
        default_params,
        fetchDataWithDelay,
        reSearch,
        showLoadingState,
        first_fetch

    };
}