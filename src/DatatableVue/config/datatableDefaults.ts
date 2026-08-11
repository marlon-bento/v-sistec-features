import type { VDataTableProps } from '@/DatatableVue/types/v-data-table';
//o Partial para dizer que no global não precisamos passar TUDO
export type DataTableGlobalConfig = Partial<VDataTableProps>;
/**
 * nesse arquivo todas as props que não são obrigatórias ou seja que tem ?: definidas
 * no typescript, são definidas aqui com valores default
 * **/
export const defaultDataTableConfig: DataTableGlobalConfig = {
    // Configurações de API 

    fetch_name: '',
    custom_loading: null,
    deactivate_default_params: false,
    frontend_pagination: false,
    add_params: {},
    add_params_keep_page: {},
    silent_params: {},

    list_filter: [],

    use_checkbox: false,

    deactivate_selected_info: false,
    immediate: true,
    deactivate_search_on_clear: false,
    use_expandable_items: false,
    close_expanded_item_on_expand_new: false,
    scroll_to_expanded_item: false,
    type_animation_expand: 'expand',
    deactivate_animation_expand: false,
    type_button_expand: 'arrow',
    deactivate_search_empty: false,
    disable_request: false,
    disable_search: false,
    pagination_teleport: null,
    search_teleport: null,
    extra_actions_teleport: null,
    column_manager_teleport: null,

    // Classes Estruturais Base
    class_column_manager_dropdown: '',
    class_column_manager_dropdown_menu: '',
    class_column_manager_button: '',
    disable_class_column_manager_default: false,

    // === TEXTOS ===
    first_text_page_size: 'Mostrar',
    second_text_page_size: 'registros',
    placeholder_search: 'Buscar...',

    // === CLASSES  ===
    class_table: '',
    class_pagination: '',
    class_container: '',
    class_content: '',
    class_filters: '',
    class_page_size: '',

    // === CONFIGURAÇÃO DE API ===
    filter_param_name: 'filter',
    search_param_name: 'search',
    page_param_name: 'page',
    page_size_param_name: 'page_size',
    page_starts_at: 0,
    item_key: 'id',
    data_key: 'results',
    total_key: 'count',

    // === COMPORTAMENTO ===
    limit_per_page: 5,
    type_loading: 'placeholder',
    min_loading_delay: 600,
    retry_attempts: 3,
    retry_delay: 2000,
    show_header_when_empty: false,
    storage_id: '',
    use_column_manager: false,

    custom_frontend_filter: null,
};  