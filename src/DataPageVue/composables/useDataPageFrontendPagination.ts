import { computed, watch, type ComputedRef, type Ref } from 'vue';
import type { PaginationObject, DataPagePropsWithDefaults } from '../types/v-data-page';

/*
========
Resumo do Arquivo (useDataPageFrontendPagination.ts)
Este composable cuida exclusivamente da lógica de filtragem e paginação em memória (no navegador),
além do modo sem paginação (quando o dev quer apenas exibir todos os dados retornados de uma vez).

Responsabilidades:
1. Verificar se a paginação interna está desativada (`disable_pagination` ou `type_fetch === 'none'`).
2. Filtrar o array bruto (`raw_items`) usando a função customizada do dev (`custom_frontend_filter`)
   ou a busca textual padrão (`pagination.search`).
3. Atualizar automaticamente o total de itens (`pagination.count`) e corrigir a página atual caso o
   usuário filtre e o número total de páginas diminua.
4. Fatiar (`slice`) o array filtrado para entregar apenas os itens da página atual quando
   `frontend_pagination` estiver ativo, ou devolver a lista inteira quando `disable_pagination` estiver ativo.
========
*/
export function useDataPageFrontendPagination<T extends Record<string, any>>(
    propsValue: ComputedRef<DataPagePropsWithDefaults>,
    pagination: Ref<PaginationObject>,
    raw_items: Ref<T[]>
) {
    /*
    Indica se a paginação interna foi desligada pelo desenvolvedor.
    Quando verdadeiro, o VDataPage não fatia os itens, oculta a barra de paginação
    e não envia `page` nem `page_size` nos parâmetros padrão da API.
    */
    const isPaginationDisabled = computed<boolean>(() => {
        return Boolean(propsValue.value.disable_pagination || propsValue.value.type_fetch === 'none');
    });

    /*
    Lista de itens após passar pelo filtro do frontend (se houver).
    Se nem `frontend_pagination` nem `custom_frontend_filter` estiverem em uso,
    devolve diretamente os itens brutos vindos da API sem custo de processamento.
    */
    const filtered_items = computed<T[]>(() => {
        const shouldFilterOnFrontend = Boolean(
            propsValue.value.frontend_pagination ||
            propsValue.value.custom_frontend_filter
        );

        if (!shouldFilterOnFrontend) {
            return raw_items.value;
        }

        let listaFiltrada = raw_items.value;
        const customFilterFn = propsValue.value.custom_frontend_filter;

        // 1º Caso: O desenvolvedor passou uma função própria de filtro (ex: filtrar por data + texto)
        if (customFilterFn && typeof customFilterFn === 'function') {
            listaFiltrada = listaFiltrada.filter(item =>
                customFilterFn(item, pagination.value.search, pagination.value.filter)
            );
        }
        // 2º Caso: Filtro padrão por texto simples em todas as propriedades do objeto
        else if (pagination.value.search) {
            const termoBusca = pagination.value.search.toLowerCase();
            listaFiltrada = listaFiltrada.filter(item => {
                return Object.values(item).some(valor =>
                    valor !== null &&
                    valor !== undefined &&
                    String(valor).toLowerCase().includes(termoBusca)
                );
            });
        }

        return listaFiltrada;
    });

    /*
    Sempre que a lista filtrada mudar no modo frontend (ou no modo sem paginação),
    atualizamos o contador total (`pagination.count`) e garantimos que a página atual
    não fique "órfã" além do novo limite máximo de páginas.
    */
    watch(filtered_items, (novaLista) => {
        if (propsValue.value.frontend_pagination || isPaginationDisabled.value) {
            pagination.value.count = novaLista.length;

            if (!isPaginationDisabled.value && propsValue.value.frontend_pagination) {
                const totalPaginas = Math.ceil(novaLista.length / pagination.value.limit_per_page);
                const ultimaPaginaValida = propsValue.value.page_starts_at + totalPaginas - 1;

                if (
                    pagination.value.current_page > ultimaPaginaValida &&
                    ultimaPaginaValida >= propsValue.value.page_starts_at
                ) {
                    pagination.value.current_page = ultimaPaginaValida;
                }
            }
        }
    }, { immediate: true });

    /*
    Lista final de itens que será renderizada no template (#body).
    - Se a paginação estiver desativada: exibe todos os itens (já filtrados, se houver filtro local).
    - Se for paginação pelo backend: exibe os itens brutos da página que a API devolveu.
    - Se for paginação pelo frontend: calcula a fatia (início e fim) da página atual.
    */
    const items = computed<T[]>(() => {
        if (isPaginationDisabled.value) {
            return filtered_items.value;
        }

        if (!propsValue.value.frontend_pagination) {
            return raw_items.value;
        }

        const indicePaginaBaseZero = Math.max(0, pagination.value.current_page - propsValue.value.page_starts_at);
        const indiceInicial = indicePaginaBaseZero * pagination.value.limit_per_page;
        const indiceFinal = indiceInicial + pagination.value.limit_per_page;

        return filtered_items.value.slice(indiceInicial, indiceFinal);
    });

    return {
        isPaginationDisabled,
        filtered_items,
        items,
    };
}