import type { Ref, ComputedRef, Component, MaybeRefOrGetter, DeepReadonly } from 'vue';
import type { PaginationObject } from '../keys';

export type { PaginationObject } from '../keys';


/*
Tipagem para configurações de API.
Por que é usada: Isola as propriedades responsáveis por buscar e interpretar os dados do backend.
*/
export interface ApiProps {
  /* configuração do useApiFetch */
  fetch: Function;
  endpoint: string;
  fetch_name?: string;
  /* usado para pegar os dados do useApiFetch */
  data_key?: string;
  total_key?: string;
  /* nomes dos parâmetros para passar para o backend */
  filter_param_name?: string;
  search_param_name?: string;
  page_param_name?: string;
  page_size_param_name?: string;
  /* 
  Parâmetros reativos: dispara um novo fetch e reseta a tabela para a página 1 sempre que sofrer mutação. 
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

/**
 * =====================================================
 *  Tipagem para classes CSS.
 *  Por que é usada: Agrupa as opções de estilização estrutural do datatable.
 * =====================================================
 * **/
export interface ColumnManagerClass{
    class_column_manager_dropdown?: string;
    class_column_manager_dropdown_menu?: string;
    class_column_manager_button?: string;
    disable_class_column_manager_default?: boolean;
}
export interface PaginationClass{
  class_pagination?: string;
}
export interface BodyClass{
  class_content?: string;
  class_container?: string;
}
export interface TableClass{
  class_table?: string;
}
export interface FiltersClass{
  class_filters?: string;
  class_page_size?: string;
}
/*
Tipagem para classes CSS.
Por que é usada: Agrupa as opções de estilização estrutural do datatable.
*/
export type ClassProps = (
  ColumnManagerClass & 
  PaginationClass & 
  BodyClass & 
  TableClass & 
  FiltersClass
);

/*
Tipagem para o comportamento principal.
Por que é usada: Controla limites, tempos de carregamento, armazenamento de estado e identificadores.
*/
export interface BehaviorProps {
  frontend_pagination?: boolean;
  limit_per_page?: number;
  page_starts_at?: number;
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
  immediate?: boolean;
  // Propriedade para ativar a persistência de configuração da tabela no localstorage
  storage_id?: string;
  use_column_manager?: boolean;
  show_header_when_empty?: boolean;
  // Define qual propriedade do item será usada como chave única para a seleção.
  item_key?: string;
  /* tipos de loading pré-definidos*/
  type_loading?: 'placeholder' | 'spiner-table' | 'spiner';
  /*recebe um component para loading*/
  custom_loading?: Component | null;
}

/*
Tipagem para regras de busca.
Por que é usada: Define propriedades dos filtros, placeholders e teleports de pesquisa.
*/
export interface SearchProps {
  /* filtros que irão ser usados */
  list_filter?: any[];
  placeholder_search?: string;
  disable_search?: boolean;
  deactivate_search_empty?: boolean;
  deactivate_search_on_clear?: boolean;
  custom_frontend_filter?: ((item: any, search: string, filter: string) => boolean) | null;
}
/*
Tipagem para regras de paginação.
Por que é usada: Define os textos exibidos e o local de renderização da paginação.
*/
export interface PaginationProps {
  first_text_page_size?: string;
  second_text_page_size?: string;
}
/*
Tipagem para regras de movimentação de itens
*/
export interface TeleportsProps {
  /*teleports para o search e para a paginação*/
  search_teleport?: string | HTMLElement | null;
  // Aceita string (seletor) OU HTMLElement (ref direto) OU null
  pagination_teleport?: string | HTMLElement | null;
  extra_actions_teleport?: string | HTMLElement | null;
  column_manager_teleport?: string | HTMLElement | null;
}
/*
Tipagem para recursos extras.
Por que é usada: Habilita checkboxes e itens expansíveis na tabela.
*/
export interface ExtraFeaturesProps {
  // Ativa a funcionalidade de seleção com checkboxes
  use_checkbox?: boolean;
  deactivate_selected_info?: boolean;
  use_expandable_items?: boolean;
  close_expanded_item_on_expand_new?: boolean;
  scroll_to_expanded_item?: boolean;
  type_animation_expand?: 'fade' | 'expand' | 'none';
  deactivate_animation_expand?: boolean;
  type_button_expand?: 'arrow' | 'plus';
}

/*
Tipagem consolidada de propriedades do VDataTable.
Por que é usada: Une todas as categorias lógicas através de interseção, fornecendo uma interface plana para o Vue, preservando a retrocompatibilidade com versões anteriores da aplicação.
*/
export type VDataTableProps = (
  ApiProps &
  ClassProps &
  BehaviorProps &
  SearchProps &
  PaginationProps &
  ExtraFeaturesProps &
  TeleportsProps
);

/*
Tipagem consolidada de propriedades do VDataTable com valores padrão.
Por que é usada: Fornece uma interface completa para o Vue, incluindo todas as propriedades obrigatórias e opcionais, com valores padrão definidos.
*/
export type DataTablePropsWithDefaults = VDataTableProps & {
    custom_frontend_filter: ((item: any, search: string, filter: string) => boolean) | null;
    frontend_pagination: boolean;
    // Strings
    fetch_name: string;
    type_loading: string;
    filter_param_name: string;
    search_param_name: string;
    page_param_name: string;
    page_size_param_name: string;
    data_key: string;
    total_key: string;
    item_key: string;
    first_text_page_size: string;
    second_text_page_size: string;
    placeholder_search: string;
    type_animation_expand: string;
    type_button_expand: string;
    

    // Classes CSS (Strings)
    class_table: string;
    class_content: string;
    class_container: string;
    class_pagination: string;
    class_filters: string;
    class_page_size: string;

    // Numbers
    min_loading_delay: number;
    retry_attempts: number;
    retry_delay: number;
    limit_per_page: number;
    page_starts_at: number;

    // Booleans
    deactivate_default_params: boolean;
    use_checkbox: boolean;
    deactivate_selected_info: boolean;
    immediate: boolean;
    deactivate_search_on_clear: boolean;
    use_expandable_items: boolean;
    close_expanded_item_on_expand_new: boolean;
    scroll_to_expanded_item: boolean;
    deactivate_animation_expand: boolean;
    deactivate_search_empty: boolean;
    disable_request: MaybeRefOrGetter<boolean>;

    // Complex Types (Arrays/Objects/Functions) 
    add_params: Record<string, any> | (() => Record<string, any>);
    list_filter: any[]; 
    custom_loading: any | null; 
    storage_id: string;
    use_column_manager: boolean;
};
export interface ExposedFunctions<T extends Record<string, any>> {
  execute: () => void;
  reSearch: () => void;
  pagination: Ref<PaginationObject>;
  default_params: Record<string, any>;
  selected_items: Ref<T[]>;
  atLeastOneSelected: ComputedRef<boolean>;
  set_limit_per_page: (newLimit: number) => void;
  set_search: (newSearch: string) => void;
  set_filter: (newFilter: string) => void;
  set_page: (newPage: number) => void;
  expand_item_toggle: (item: any) => void;
  close_all_expanded_items: () => void;
  selectAllCheckbox: Ref<HTMLInputElement | null>;
  toggleColumnVisibility: (field: string) => void;
  columns_list: ComputedRef<Array<{
    id: string;
    header: string;
    field: string | null;
    start_hidden: boolean;
    visible: boolean;
    locked: boolean | 'start' | 'end';
  }>>;
  items: DeepReadonly<Ref<T[]>>;
  results: DeepReadonly<Ref<T[]>>;
}
