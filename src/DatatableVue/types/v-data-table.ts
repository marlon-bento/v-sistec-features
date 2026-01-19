import type { Ref, ComputedRef, Component, MaybeRefOrGetter } from 'vue';
import type { PaginationObject } from '../keys';

export type { PaginationObject } from '../keys';
export interface VDataTableProps {
  /* configuração do useApiFetch */
  fetch: Function;
  fetch_name?: string;
  endpoint: string;
  /* tipos de loading pré-definidos*/
  type_loading?: 'placeholder' | 'spiner-table' | 'spiner';
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
  class_table?: string;
  class_content?: string;
  class_container?: string;
  class_pagination?: string;
  class_filters?: string;
  class_page_size?: string;

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
  use_expandable_items?: boolean;
  close_expanded_item_on_expand_new?: boolean;
  scroll_to_expanded_item?: boolean;

  type_animation_expand?: 'fade' | 'expand' | 'none';
  deactivate_animation_expand?: boolean;
  type_button_expand?: 'arrow' | 'plus';
  deactivate_search_empty?: boolean;

  // Define qual propriedade do item será usada como chave única para a seleção.
  item_key?: string;

  limit_per_page?: number;
  page_starts_at?: number;
  deactivate_selected_info?: boolean;
  immediate?: boolean;
  placeholder_search?: string;
  deactivate_search_on_clear?: boolean;
  disable_search?: boolean;
  disable_request?: MaybeRefOrGetter<boolean>;
  // Aceita string (seletor) OU HTMLElement (ref direto) OU null
  pagination_teleport?: string | HTMLElement | null;
  search_teleport?: string | HTMLElement | null;
}
export type DataTablePropsWithDefaults = VDataTableProps & {
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
}
