import { ref, computed, type Ref } from 'vue';
import type { PaginationObject, DataTablePropsWithDefaults } from '../types/v-data-table'; // Ajuste o caminho conforme necessário
import { type ColumnConfiguration } from '../keys';


export function useDataTableFetch<T>(
    props: DataTablePropsWithDefaults,
    pagination: Ref<PaginationObject>,
    columns: Ref<ColumnConfiguration[]>,
    orderings_state: Ref<Record<string, 'none' | 'increasing' | 'decreasing'>>,
    emit: (event: 'beforeFetch' | 'afterFetch') => void,
    close_all_expanded_items: () => void

) {
    const items = ref<T[]>([]) as Ref<T[]>;

    const urlReativa = computed(() => {
        return props.endpoint;
    });
    
    const default_params = computed<Record<string, any>>(() => ({
        [props.page_param_name]: pagination.value.current_page + 1,
        [props.page_size_param_name]: pagination.value.limit_per_page,
        [props.search_param_name]: pagination.value.search || "",
        [props.filter_param_name]: pagination.value.filter || "",
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
    const { data: response, pending, error, execute, attempt } = props.fetch(urlReativa, {
        disable_request: () => props.disable_request,
        params: () => {
            const isFunction = typeof props.add_params === 'function';
            let extraParams = {};

            if (isFunction) {
                const getParams = props.add_params as () => Record<string, any>;
                extraParams = getParams();
            } else {
                extraParams = props.add_params || {};
            }
            if (props.deactivate_default_params) {
                return {
                    ...extraParams,
                    ...params_ordering.value
                };
            }
            return {
                ...default_params.value,
                ...props.add_params,
                ...params_ordering.value
            };
        },
        retry: props.retry_attempts,
        retryDelay: props.retry_delay,
        paramsReactives: false,
        immediate: false,
    }, props.fetch_name);

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
        }, props.min_loading_delay);
        close_all_expanded_items();
        emit('beforeFetch');
        await execute(); // Executa a busca de dados original do useApiFetch
        emit('afterFetch');
    }

    function reSearch(): void {
        pagination.value.current_page = props.page_starts_at;
        fetchDataWithDelay();
    }
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