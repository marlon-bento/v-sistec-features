import type { Ref, Component, WatchSource, MaybeRefOrGetter, DeepReadonly } from 'vue';

/*
========
Tipagem para configurações de API do DataPage.
Por que é usada: Isola as propriedades responsáveis por buscar e interpretar os dados do backend,
alinhando o contrato com o padrão do VDataTable.
========
*/
export interface DataPageApiProps {
    /* configuração do useApiFetch */
    fetch: Function;
    endpoint: string;
    fetch_name?: string;

    /* usado para pegar os dados do useApiFetch */
    data_key?: string;
    total_key?: string;
    next_page_response_name?: string;

    /* nomes dos parâmetros para passar para o backend */
    filter_param_name?: string;
    search_param_name?: string;
    page_param_name?: string;
    page_size_param_name?: string;

    /*
    Parâmetros reativos: dispara um novo fetch e reseta para a página inicial sempre que sofrer mutação.
    Ideal para buscas e filtros primários.
    */
    add_params?: Record<string, any> | (() => Record<string, any>);

    /*
    Parâmetros de recarregamento suave: dispara um novo fetch quando alterados, mas NÃO reseta a página atual.
    Ideal para ordenação externa ou filtros que não devem interromper a navegação.
    */
    add_params_keep_page?: Record<string, any> | (() => Record<string, any>);

    /*
    Parâmetros silenciosos: injeta dados na requisição sem disparar um fetch automático.
    Ideal para injeção de paginação manual ou tokens.
    */
    silent_params?: Record<string, any> | (() => Record<string, any>);

    /* retira os params default da requisição */
    deactivate_default_params?: boolean;
    disable_request?: MaybeRefOrGetter<boolean>;
}

/*
========
Tipagem para classes CSS e estrutura visual do DataPage.
========
*/
export interface DataPageClassProps {
    class_container?: string;
    class_loading_container?: string;
    class_pagination?: string;
    class_filters?: string;
}

/*
========
Tipagem para o comportamento principal e paginação do DataPage.
========
*/
export interface DataPageBehaviorProps {
    /*
    Desativa completamente a paginação interna (não fatia os itens, ignora page/page_size dos default_params
    e oculta a barra de paginação), exibindo todos os registros retornados/filtrados de uma só vez,
    mas mantendo add_params, add_params_keep_page e silent_params funcionando normalmente.
    Também funciona automaticamente quando type_fetch === 'none'.
    */
    disable_pagination?: boolean;

    /* Ativa a paginação e filtragem operando 100% no frontend sobre o array carregado */
    frontend_pagination?: boolean;
    /* Função customizada para filtrar itens no frontend (funciona com frontend_pagination ou disable_pagination) */
    custom_frontend_filter?: ((item: any, search: string, filter: string) => boolean) | null;

    type_loading?: 'placeholder' | 'spiner-table' | 'spiner';
    type_fetch?: 'pagination' | 'infinite-scroll' | 'none';
    custom_loading?: Component | null;

    /* filtros que irão ser usados */
    list_filter?: any[];
    first_text_page_size?: string;
    second_text_page_size?: string;

    /* tempo mínimo em ms para mostrar o loading para evitar telas piscando */
    min_loading_delay?: number;
    /* Número de tentativas automáticas em caso de falha */
    retry_attempts?: number;
    /* Atraso em milissegundos entre cada tentativa */
    retry_delay?: number;

    use_checkbox?: boolean;
    item_key?: string;
    limit_per_page?: number;
    page_starts_at?: number;
    element_id?: string;
    watch?: WatchSource[];
    immediate?: boolean;

    /* Aceita string (seletor) OU HTMLElement (ref direto) OU null */
    pagination_teleport?: string | HTMLElement | null;
}

export type VDataPageProps = (
    DataPageApiProps &
    DataPageClassProps &
    DataPageBehaviorProps
);

export type DataPagePropsWithDefaults = VDataPageProps & {
    disable_pagination: boolean;
    frontend_pagination: boolean;
    custom_frontend_filter: ((item: any, search: string, filter: string) => boolean) | null;
    fetch_name: string;
    type_loading: 'placeholder' | 'spiner-table' | 'spiner';
    type_fetch: 'pagination' | 'infinite-scroll' | 'none';
    custom_loading: Component | null;
    deactivate_default_params: boolean;
    filter_param_name: string;
    search_param_name: string;
    page_param_name: string;
    page_size_param_name: string;
    next_page_response_name: string;
    add_params: Record<string, any> | (() => Record<string, any>);
    add_params_keep_page: Record<string, any> | (() => Record<string, any>);
    silent_params: Record<string, any> | (() => Record<string, any>);
    data_key: string;
    total_key: string;
    list_filter: any[];
    class_container: string;
    class_loading_container: string;
    class_pagination: string;
    class_filters: string;
    min_loading_delay: number;
    retry_attempts: number;
    retry_delay: number;
    use_checkbox: boolean;
    item_key: string;
    first_text_page_size: string;
    second_text_page_size: string;
    limit_per_page: number;
    page_starts_at: number;
    element_id: string;
    watch: WatchSource[];
    immediate: boolean;
    disable_request: MaybeRefOrGetter<boolean>;
    pagination_teleport: string | HTMLElement | null;
};

export interface PaginationObject {
    current_page: number;
    count: number;
    limit_per_page: number;
    search: string;
    filter: string;
}

export interface ExposedFunctions<T extends Record<string, any> = Record<string, any>> {
    execute: () => Promise<void>;
    reSearch: () => void;
    pagination: DeepReadonly<Ref<PaginationObject>>;
    default_params: ComputedRefOrRecord;
    set_limit_per_page: (newLimit: number) => void;
    set_search: (newSearch: string) => void;
    set_filter: (newFilter: string) => void;
    set_page: (newPage: number) => void;
    items: DeepReadonly<Ref<T[]>>;
    results: DeepReadonly<Ref<T[]>>;
}

type ComputedRefOrRecord = Record<string, any>;