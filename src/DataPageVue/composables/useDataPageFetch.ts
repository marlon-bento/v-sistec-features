import { ref, computed, watch, isRef, unref, type Ref, type WatchSource } from 'vue';
import type { PaginationObject, DataPagePropsWithDefaults } from '../types/v-data-page';
import { useDataPageFrontendPagination } from './useDataPageFrontendPagination';
import { useDataPageInfiniteScroll } from './useDataPageInfiniteScroll';

/*
========
Resumo do Arquivo (useDataPageFetch.ts)
Este é o composable orquestrador de dados do VDataPage.
Para manter o código limpo e fácil de entender, ele delega responsabilidades específicas para dois composables menores:
  - `useDataPageFrontendPagination`: cuida da filtragem local, fatiamento de páginas no frontend e modo `disable_pagination`.
  - `useDataPageInfiniteScroll`: cuida do carregamento sob demanda ao rolar a página (topo e base).

Este arquivo foca apenas em:
1. Montar os parâmetros da requisição (`default_params`, `add_params`, `add_params_keep_page`, `silent_params`).
2. Executar a chamada à API com controle de tempo mínimo de carregamento (`min_loading_delay`) para a tela não piscar.
3. Reagir a mudanças na resposta da API, nos parâmetros ou na rota (`endpoint`).
========
*/
export function useDataPageFetch<T extends Record<string, any>>(
    props: Ref<DataPagePropsWithDefaults> | DataPagePropsWithDefaults,
    pagination: Ref<PaginationObject>,
    emit: (event: 'tradePage' | 'beforeFetch' | 'afterFetch') => void
) {
    const propsValue = computed(() => unref(props));

    // Armazena a lista bruta retornada pela API antes de qualquer filtro ou fatiamento local
    const raw_items = ref<T[]>([]) as Ref<T[]>;

    // Controle do tempo mínimo de loading (evita que o skeleton pisque rápido demais)
    const isDelaying = ref<boolean>(false);
    const delayTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const first_fetch = ref<boolean>(false);

    const urlReativa = computed(() => propsValue.value.endpoint);

    // =======================================================
    // 1. COMPOSABLE DE PAGINAÇÃO NO FRONTEND & MODO SEM PAGINAÇÃO
    // =======================================================
    const {
        isPaginationDisabled,
        filtered_items,
        items,
    } = useDataPageFrontendPagination<T>(propsValue, pagination, raw_items);

    // =======================================================
    // 2. MONTAGEM DOS PARÂMETROS E CONFIGURAÇÃO DO FETCH
    // =======================================================

    /*
    Função auxiliar para extrair um objeto de parâmetros,
    seja ele passado como objeto estático `{}` ou como função `() => ({})`.
    */
    function resolverParametrosExtras(
        parametro?: Record<string, any> | (() => Record<string, any>)
    ): Record<string, any> {
        if (!parametro) return {};
        if (typeof parametro === 'function') {
            return parametro() || {};
        }
        return parametro;
    }

    /*
    Parâmetros padrão gerados pelo componente.
    Quando `disable_pagination` (ou `type_fetch === 'none'`) está ativo, omitimos `page` e `page_size`
    para não interferir na requisição nem sobrescrever parâmetros personalizados do desenvolvedor.
    */
    const default_params = computed<Record<string, any>>(() => {
        const paramsBase: Record<string, any> = {
            [propsValue.value.search_param_name]: pagination.value.search || '',
            [propsValue.value.filter_param_name]: pagination.value.filter || '',
        };

        if (!isPaginationDisabled.value) {
            paramsBase[propsValue.value.page_param_name] = pagination.value.current_page + 1;
            paramsBase[propsValue.value.page_size_param_name] = pagination.value.limit_per_page;
        }

        return paramsBase;
    });

    const { data: response, pending, error, execute, attempt } = propsValue.value.fetch(
        urlReativa,
        {
            disable_request: () => propsValue.value.disable_request,
            params: () => {
                const extraAddParams = resolverParametrosExtras(propsValue.value.add_params);
                const extraSilentParams = resolverParametrosExtras(propsValue.value.silent_params);
                const extraKeepPageParams = resolverParametrosExtras(propsValue.value.add_params_keep_page);

                const todosParametrosExtras = {
                    ...extraAddParams,
                    ...extraSilentParams,
                    ...extraKeepPageParams,
                };

                if (propsValue.value.deactivate_default_params) {
                    return todosParametrosExtras;
                }

                return {
                    ...default_params.value,
                    ...todosParametrosExtras,
                };
            },
            retry: propsValue.value.retry_attempts,
            retryDelay: propsValue.value.retry_delay,
            paramsReactives: false,
            immediate: false,
        },
        propsValue.value.fetch_name
    );

    // Exibe o estado de loading enquanto a API responde OU enquanto o tempo mínimo visual não terminou
    const showLoadingState = computed<boolean>(() => {
        return pending.value || isDelaying.value;
    });

    // =======================================================
    // 3. EXECUÇÃO DE BUSCA E COMPOSABLE DE INFINITE SCROLL
    // =======================================================

    /*
    Executa a busca respeitando o delay mínimo visual (`min_loading_delay`).
    Se `frontend_pagination` estiver ativo e os dados já tiverem sido carregados uma vez,
    apenas aplica o efeito visual e evita bater na API novamente ao trocar de página.
    */
    async function fetchDataWithDelay(): Promise<void> {
        if (!first_fetch.value) first_fetch.value = true;

        if (delayTimer.value) clearTimeout(delayTimer.value);

        isDelaying.value = true;
        delayTimer.value = setTimeout(() => {
            isDelaying.value = false;
        }, propsValue.value.min_loading_delay);

        const precisaBuscarNaApi = !propsValue.value.frontend_pagination || raw_items.value.length === 0;

        if (propsValue.value.type_fetch === 'infinite-scroll' && !isPaginationDisabled.value) {
            if (precisaBuscarNaApi) {
                await execute();
            }
            return;
        }

        emit('beforeFetch');
        if (precisaBuscarNaApi) {
            await execute();
        }
        emit('afterFetch');
    }

    const {
        items_infinite,
        bottomLoaderId,
        topLoaderId,
        dadosInicializados,
        proxima_pagina,
        initDataInfinite,
        carregarPaginaBottom,
        carregarPaginaTop,
    } = useDataPageInfiniteScroll<T>(
        propsValue,
        pagination,
        raw_items,
        items,
        filtered_items,
        isPaginationDisabled,
        response,
        error,
        execute,
        fetchDataWithDelay,
        emit
    );

    /*
    Volta para a página inicial e dispara uma nova busca.
    */
    function reSearch(): void {
        if (!isPaginationDisabled.value) {
            pagination.value.current_page = propsValue.value.page_starts_at;
        }

        if (propsValue.value.type_fetch === 'infinite-scroll' && !isPaginationDisabled.value) {
            dadosInicializados.value = false;
            initDataInfinite();
        } else {
            fetchDataWithDelay();
        }
    }

    // =======================================================
    // 4. WATCHERS (RESPOSTA DA API, PARÂMETROS E ENDPOINT)
    // =======================================================

    /*
    Processa o retorno da API sempre que `response` é atualizado.
    Suporta tanto respostas paginadas `{ results: [...], count: 10 }` quanto arrays puros `[...]` na raiz.
    */
    watch(response, (newResponse: any) => {
        if (!newResponse) {
            raw_items.value = [];
            pagination.value.count = 0;
            return;
        }

        let dadosExtraidos: T[] = [];

        if (!propsValue.value.data_key || Array.isArray(newResponse)) {
            dadosExtraidos = Array.isArray(newResponse) ? newResponse : [newResponse];
        } else {
            dadosExtraidos = newResponse[propsValue.value.data_key] || [];
        }

        raw_items.value = dadosExtraidos;

        if (isPaginationDisabled.value) {
            pagination.value.count = filtered_items.value.length;
        } else if (!propsValue.value.frontend_pagination) {
            pagination.value.count = newResponse[propsValue.value.total_key] ?? dadosExtraidos.length;
        }
    }, { immediate: true });

    /*
    Observa `add_params`: quando os filtros mudam, limpa o cache local (se estiver paginando no front),
    volta para a página 1 e refaz a busca na API.
    */
    watch(
        () => JSON.stringify(resolverParametrosExtras(propsValue.value.add_params)),
        (novoValor, valorAnterior) => {
            if (novoValor !== valorAnterior && valorAnterior !== undefined) {
                if (propsValue.value.frontend_pagination) {
                    raw_items.value = [];
                }
                reSearch();
            }
        }
    );

    /*
    Observa `add_params_keep_page`: quando alterado, refaz a busca na API mantendo a página atual.
    */
    watch(
        () => JSON.stringify(resolverParametrosExtras(propsValue.value.add_params_keep_page)),
        (novoValor, valorAnterior) => {
            if (novoValor !== valorAnterior && valorAnterior !== undefined) {
                if (propsValue.value.frontend_pagination) {
                    raw_items.value = [];
                }
                fetchDataWithDelay();
            }
        }
    );

    /*
    Observa mudanças no `endpoint`: reseta a página inicial e limpa os itens anteriores.
    */
    watch(
        () => propsValue.value.endpoint,
        (novoEndpoint, endpointAnterior) => {
            if (novoEndpoint !== endpointAnterior && endpointAnterior !== undefined) {
                if (!isPaginationDisabled.value) {
                    pagination.value.current_page = propsValue.value.page_starts_at;
                }
                if (propsValue.value.frontend_pagination) {
                    raw_items.value = [];
                }
            }
        }
    );

    /*
    Observa fontes externas passadas na propriedade `watch` do VDataPage.
    */
    const watchSources: WatchSource[] = [];
    if (propsValue.value.watch && Array.isArray(propsValue.value.watch)) {
        propsValue.value.watch.forEach(source => {
            if (isRef(source) || typeof source === 'function') {
                watchSources.push(source);
            }
        });
    }

    if (watchSources.length > 0) {
        watch(watchSources, () => {
            if (propsValue.value.frontend_pagination) {
                raw_items.value = [];
            }
            reSearch();
        }, { deep: true });
    }

    return {
        items,
        raw_items,
        items_infinite,
        isPaginationDisabled,
        pending,
        error,
        execute,
        response,
        attempt,
        default_params,
        fetchDataWithDelay,
        reSearch,
        initDataInfinite,
        carregarPaginaBottom,
        carregarPaginaTop,
        showLoadingState,
        first_fetch,
        bottomLoaderId,
        topLoaderId,
        dadosInicializados,
        proxima_pagina,
    };
}