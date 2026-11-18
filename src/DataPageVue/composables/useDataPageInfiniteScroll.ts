import { ref, computed, nextTick, type ComputedRef, type Ref } from 'vue';
import type { PaginationObject, DataPagePropsWithDefaults } from '../types/v-data-page';

/*
========
Resumo do Arquivo (useDataPageInfiniteScroll.ts)
Este composable concentra exclusivamente a lógica de rolagem infinita (`type_fetch === 'infinite-scroll'`).
Separar esse comportamento deixa o arquivo principal de fetch limpo e fácil de dar manutenção.

Responsabilidades:
1. Gerenciar a lista acumulada do scroll infinito (`items_infinite`) e os identificadores dos loaders de topo e rodapé.
2. Evitar condições de corrida (race conditions) ao reiniciar a lista com `init_id`.
3. Carregar novos blocos ao rolar para baixo (`carregarPaginaBottom`) e para cima (`carregarPaginaTop`),
   filtrando duplicatas, mantendo uma janela máxima de itens no DOM e preservando a posição do scroll.
========
*/
export function useDataPageInfiniteScroll<T extends Record<string, any>>(
    propsValue: ComputedRef<DataPagePropsWithDefaults>,
    pagination: Ref<PaginationObject>,
    raw_items: Ref<T[]>,
    items: ComputedRef<T[]>,
    filtered_items: ComputedRef<T[]>,
    isPaginationDisabled: ComputedRef<boolean>,
    response: Ref<any>,
    error: Ref<any>,
    execute: () => Promise<void>,
    fetchDataWithDelay: () => Promise<void>,
    emit: (event: 'tradePage' | 'beforeFetch' | 'afterFetch') => void
) {
    // Lista acumulada de itens renderizados durante o scroll infinito
    const items_infinite = ref<T[]>([]) as Ref<T[]>;

    // Identificadores reativos para forçar o reset do componente v3-infinite-loading quando necessário
    const bottomLoaderId = ref<number>(Date.now());
    const topLoaderId = ref<number>(Date.now());
    const dadosInicializados = ref<boolean>(false);

    // Contador incremental para descartar respostas antigas caso duas inicializações ocorram quase juntas
    let init_id = 0;

    /*
    Verifica se existe uma próxima página disponível para carregar ao rolar para baixo.
    Funciona tanto com resposta do backend (`next_page_response_name`) quanto com `frontend_pagination`.
    */
    const proxima_pagina = computed(() => {
        if (isPaginationDisabled.value) {
            return null;
        }
        if (propsValue.value.frontend_pagination) {
            const indicePaginaBaseZero = Math.max(0, pagination.value.current_page - propsValue.value.page_starts_at);
            const proximoIndiceInicial = (indicePaginaBaseZero + 1) * pagination.value.limit_per_page;
            return proximoIndiceInicial < filtered_items.value.length ? pagination.value.current_page + 1 : null;
        }
        return response.value?.[propsValue.value.next_page_response_name] || null;
    });

    /*
    Função auxiliar interna: adiciona a flag temporária `loading: true` nos itens recém-inseridos
    no scroll infinito e remove após `min_loading_delay`, permitindo exibir o skeleton por item.
    */
    function aplicarLoadingTemporarioNosItens(novosItens: any[]): void {
        const hashLoteAtual = crypto.randomUUID();

        novosItens.forEach((item: any) => {
            item.loading = true;
            item.idhashInfiniteLoading = hashLoteAtual;
        });

        setTimeout(() => {
            items_infinite.value.forEach((item: any) => {
                if (item.idhashInfiniteLoading === hashLoteAtual) {
                    item.loading = false;
                    delete item.idhashInfiniteLoading;
                }
            });
        }, propsValue.value.min_loading_delay);
    }

    /*
    Inicializa (ou reinicia) os dados quando o componente está em modo `infinite-scroll`.
    */
    async function initDataInfinite(): Promise<void> {
        init_id++;
        const idExecucaoAtual = init_id;

        if (!propsValue.value.frontend_pagination) {
            raw_items.value = [];
        }
        items_infinite.value = [];

        pagination.value.current_page = propsValue.value.page_starts_at;

        emit('beforeFetch');
        await fetchDataWithDelay();
        emit('afterFetch');

        // Se outra chamada de initDataInfinite começou enquanto aguardávamos a requisição, abortamos esta
        if (idExecucaoAtual !== init_id) {
            return;
        }

        nextTick(() => {
            if (idExecucaoAtual !== init_id) {
                return;
            }

            const loteInicial = items.value.map((item: any) => ({ ...item }));
            aplicarLoadingTemporarioNosItens(loteInicial);
            items_infinite.value.push(...loteInicial);

            dadosInicializados.value = true;
            bottomLoaderId.value++;
            topLoaderId.value++;
        });
    }

    /*
    Acionada automaticamente pelo componente InfiniteLoading quando o usuário chega ao fim da lista.
    */
    async function carregarPaginaBottom($state: any): Promise<void> {
        if (!dadosInicializados.value || isPaginationDisabled.value) return;

        if (!proxima_pagina.value) {
            $state.complete();
            return;
        }

        pagination.value.current_page += 1;

        if (!propsValue.value.frontend_pagination) {
            await execute();
        }

        if (error.value) {
            $state.error();
            return;
        }

        if (!items.value || items.value.length === 0) {
            $state.complete();
            return;
        }

        // Filtra apenas os itens que ainda não estão presentes na lista visível
        const chaveUnica = propsValue.value.item_key;
        const novosItens = items.value
            .filter(
                (novoItem: any) =>
                    !items_infinite.value.some(itemExistente => itemExistente[chaveUnica] === novoItem[chaveUnica])
            )
            .map((item: any) => ({ ...item }));

        if (novosItens.length === 0 && items.value.length > 0) {
            $state.loaded();
            return;
        }

        aplicarLoadingTemporarioNosItens(novosItens);
        items_infinite.value.push(...novosItens);

        nextTick(() => {
            // Mantém no máximo 2 páginas na memória do DOM para não pesar a tela em listas longas
            const limiteJanelaDom = pagination.value.limit_per_page * 2;
            if (items_infinite.value.length > limiteJanelaDom) {
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

    /*
    Acionada automaticamente pelo componente InfiniteLoading quando o usuário rola de volta para o topo.
    */
    async function carregarPaginaTop($state: any): Promise<void> {
        if (!dadosInicializados.value || isPaginationDisabled.value) return;

        if (pagination.value.current_page <= propsValue.value.page_starts_at) {
            $state.complete();
            return;
        }

        const primeiroItemVisivel = items_infinite.value[0];
        if (!primeiroItemVisivel) return;

        const chaveUnica = propsValue.value.item_key;
        const idPrimeiroItem = primeiroItemVisivel[chaveUnica];

        if (!idPrimeiroItem) {
            $state.error();
            return;
        }

        pagination.value.current_page -= 1;

        if (!propsValue.value.frontend_pagination) {
            await execute();
        }

        if (error.value) {
            $state.error();
            return;
        }

        if (!items.value || items.value.length === 0) {
            $state.loaded();
            return;
        }

        // Filtra duplicatas antes de inserir no topo
        const novosItens = items.value
            .filter(
                (novoItem: any) =>
                    !items_infinite.value.some(itemExistente => itemExistente[chaveUnica] === novoItem[chaveUnica])
            )
            .map((item: any) => ({ ...item }));

        if (novosItens.length === 0 && items.value.length > 0) {
            $state.loaded();
            return;
        }

        aplicarLoadingTemporarioNosItens(novosItens);
        items_infinite.value.unshift(...novosItens);

        // Remove o excesso do final da lista caso ultrapasse a janela de 2 páginas
        const limiteJanelaDom = pagination.value.limit_per_page * 2;
        if (items_infinite.value.length > limiteJanelaDom) {
            items_infinite.value.splice(-pagination.value.limit_per_page, pagination.value.limit_per_page);
        }

        nextTick(() => {
            const elementoAlvo = document.getElementById(propsValue.value.element_id + idPrimeiroItem);
            if (elementoAlvo) {
                elementoAlvo.scrollIntoView({ behavior: 'auto', block: 'start' });
            } else {
                console.warn(
                    "Elemento não encontrado para manter a posição do scroll. Verifique se a propriedade 'element_id' foi definida."
                );
            }
            bottomLoaderId.value++;
            $state.loaded();
        });
    }

    return {
        items_infinite,
        bottomLoaderId,
        topLoaderId,
        dadosInicializados,
        proxima_pagina,
        initDataInfinite,
        carregarPaginaBottom,
        carregarPaginaTop,
    };
}