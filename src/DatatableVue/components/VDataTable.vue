<template>
  <div>
    <div class="" :class="options.class_container">
      <slot></slot>
      <div class="" :class="options.class_content">
        <div :class="options.class_filters" class="d-flex justify-content-between align-items-start ">
          <slot name="pageSize" :changePageSize="changePageSize" :limit_per_page="pagination.limit_per_page">
            <div class="text-secondary" :class="options.class_page_size">
              {{ options.first_text_page_size }}
              <div class="mx-2 d-inline-block">
                <input class="form-control form-control-sm" @change="changePageSize"
                  v-model.lazy="pagination.limit_per_page" min="1" size="3" aria-label="Número de registros por página"
                  type="number" />
              </div>
              {{ options.second_text_page_size }}
            </div>
          </slot>

          <slot name="fieldMiddle">

          </slot>
          <Teleport :to="options.search_teleport || 'body'" :disabled="!options.search_teleport">
            <slot name="search-field" :search="pagination.search" :filter="pagination.filter" :reSearch="reSearch"
              :list_filter="options.list_filter" :item_use="item_use">
              <Search v-if="!options.disable_search" v-model:search="pagination.search"
                v-model:filter="pagination.filter" :list_filter="options.list_filter" :item_use="item_use"
                @search="reSearch" :deactivate_search_on_clear="options.deactivate_search_on_clear"
                :placeholder_search="options.placeholder_search"
                :deactivate_search_empty="options.deactivate_search_empty"
                @clicked-clear-search="$emit('clickedClearSearch')" />
            </slot>
          </Teleport>
        </div>
        <slot name="item-selected-info" :selected_items="selected_items" :clearSelection="() => selected_items = []">
          <div v-if="(options.use_checkbox && selected_items.length > 0) && !options.deactivate_selected_info"
            class="alert alert-cyan d-flex justify-content-center align-items-center py-2" role="alert">
            <h4 class="alert-title m-0"> <strong>oi Itens Selecionados:</strong> <span
                class="badge bg-azure text-azure-fg">{{ selected_items.length }}</span></h4>
            <a class=" cursor-pointer " @click="selected_items = []">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-trash">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 7l16 0" />
                <path d="M10 11l0 6" />
                <path d="M14 11l0 6" />
                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
              </svg>
              Limpar Seleção</a>
          </div>
        </slot>


        <VDataTableLoading v-if="showLoadingState" :columns="columns" :limit="pagination.limit_per_page"
          :type_loading="options.type_loading" :custom_loading="options.custom_loading"
          :class_table="options.class_table" :attempt="attempt" :pagination="pagination" />
        <div v-else-if="error" class="feedback-container text-center">
          <h4 class="text-danger">Ocorreu um Erro</h4>
          <p class="text-secondary" v-if="attempt">
            Não foi possível carregar os dados após {{ attempt.total }} tentativa(s).
          </p>
          <p class="text-secondary" v-else>
            Não foi possível carregar os dados. Verifique sua conexão.
          </p>
          <button class="btn btn-primary mt-2" @click="fetchDataWithDelay">
            Tentar Novamente
          </button>
        </div>
        <div class="table-responsive" v-else-if="items">
          <div v-if="hasItems || options.show_header_when_empty">
            <table class="table table-vcenter table-selectable" :class="options.class_table">
              <thead>

                <draggable v-model="draggableColumns" tag="tr" item-key="id" :animation="400"
                  ghost-class="ghost-item" drag-class="dragging-item" @start="isDraggingColumns = true"
                  @end="() => onDragEnd()">

                  <template #header>
                    <th v-if="options.use_expandable_items"></th>
                    <th v-if="options.use_checkbox" class="w-1">
                      <input class="form-check-input m-0" type="checkbox" ref="selectAllCheckbox"
                        @change="toggleSelectAll" aria-label="Selecionar todos os itens na página" />
                    </th>
                  </template>

                  <template #item="{ element: col }">
                    <v-th-data-table :header="col.header" :class_column="col.class_column"
                      :use_ordering="col.use_ordering" :orderings_state="orderings_state[col.id] || 'none'"
                      @toggleOrderingState="() => toggleOrderingState(col.id)" :locked="false" :col="col">

                    </v-th-data-table>
                  </template>

                  <template #footer>

                    <template v-for="col in lockedColumns" :key="col.field || col.header">
                      <v-th-data-table :header="col.header" :class_column="col.class_column"
                        :use_ordering="col.use_ordering" :orderings_state="orderings_state[col.id] || 'none'"
                        @toggleOrderingState="() => toggleOrderingState(col.id)" :col="col" locked>

                      </v-th-data-table>

                    </template>
                  </template>
                </draggable>
              </thead>

              <tbody>
                <template v-if="hasItems">
                  <template v-for="(item, index) in items" :key="item[options.item_key]">
                    <TransitionGroup tag="tr" :name="isDraggingColumns ? 'column-move' : ''">
                      <td v-if="options.use_expandable_items" class="w-1">
                        <slot name="expand-button" :item="item" :index="index" :is-expanded="is_item_expanded(item)"
                          :expand_item_toggle="expand_item_toggle">
                          <button type="button" class="btn-clean btn-icon-anim"
                            :class="{ 'is-expanded': is_item_expanded(item) }" @click="expand_item_toggle(item)">

                            <template v-if="options.type_button_expand === 'arrow'">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right icon-transition-arrow">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M9 6l6 6l-6 6" />
                              </svg>

                            </template>

                            <template v-else>
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="icon icon-transition-plus">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M12 5l0 14" class="vertical-line" />
                                <path d="M5 12l14 0" />
                              </svg>
                            </template>

                          </button>
                        </slot>
                      </td>
                      <td v-if="options.use_checkbox" class="w-1">
                        <input class="form-check-input m-0" type="checkbox" :checked="isSelected(item)"
                          @change="toggleItemSelection(item)" aria-label="Selecionar este item" />
                      </td>

                      <td v-for="(col, index) in renderedColumns" :key="col.field || col.header" :class="col.class_row">
                        <component v-if="col.bodySlot" :is="col.bodySlot" :item="item" :index="index"
                          :is-selected="isSelected(item)" />
                        <span @click="col.click ? col.click(item) : null" :class="computeClasses(col, item)"
                          v-else-if="col.type === 'text'">
                          {{
                            limiteText(getSubItem(col.field, item, col.transform_function), col.limite_text ?? null)
                          }}</span>

                        <span @click="col.click ? col.click(item) : null" v-else-if="col.type === 'date'"
                          :class="computeClasses(col, item)">
                          <span v-if="col.format === 'complete'">{{ new Date(getSubItem(col.field,
                            item)).toLocaleString()
                            }}</span>
                          <span v-if="col.format === 'simple'"> {{ new Date(getSubItem(col.field,
                            item)).toLocaleDateString()
                            }} </span>
                        </span>
                        <div @click="col.click ? col.click(item) : null" :class="computeClasses(col, item)"
                          v-else-if="col.type === 'html'" v-html="getSubItem(col.field, item)">
                        </div>

                        <div @click="col.click ? col.click(item) : null" :class="computeClasses(col, item)"
                          v-else-if="col.type === 'img'">

                          <div v-if="getSubItem(col.field, item)" v-bind="col.deactivate_img_preview ? {
                            class: 'container-img'
                          } :
                            {
                              onMouseover: (event) => handleMouseOver(event, getSubItem(col.field, item)),
                              onMousemove: handleMouseMove,
                              onMouseleave: handleMouseLeave,
                              class: 'container-img container-img-preview'
                            }">

                            <img class="img-tamanho" :src="getSubItem(col.field, item)" />
                            <img class="img-tamanho-cover" :src="getSubItem(col.field, item)" />
                            <div class="bg-img"></div>
                          </div>

                        </div>
                        <span class="text-danger erro-custom-container" v-else>tipo <span
                            class="badge bg-orange text-white erro-custom-text">{{ col.type }}</span> não
                          suportado</span>
                      </td>
                    </TransitionGroup>
                    <Transition :name="'expand-item-' + options.type_animation_expand"
                      :css="!options.deactivate_animation_expand">
                      <!-- mostra uma linha após cada item -->
                      <tr :id="'expand-item-' + item[options.item_key]" v-if="is_item_expanded(item)"
                        class="expanded-item-row">
                        <!-- se estiver usando checkbox existe uma coluna a mais -->
                        <td :colspan="colspanExpandItems()">
                          <slot name="after-row" :item="item">

                          </slot>

                        </td>
                      </tr>
                    </Transition>


                  </template>
                </template>


              </tbody>
            </table>
          </div>
          <div v-if="!hasItems && first_fetch === false">
            <slot name="idle-state">

            </slot>
          </div>
          <div v-else-if="!hasItems" class="text-center p-4 text-secondary">
            <p class="m-0">Nenhum item encontrado.</p>
          </div>
        </div>
      </div>
    </div>
    <Teleport :to="options.pagination_teleport || 'body'" :disabled="!options.pagination_teleport">
      <slot name="pagination" :pagination="pagination" :tradePage="fetchDataWithDelay" :error="error">
        <div v-if="!error && pagination.count > 0" class="px-3" :class="options.class_pagination">
          <PaginationDatatable :page_starts_at="options.page_starts_at" :filtering="true" :pagination="pagination"
            @tradePage="tradePageEmit" />
        </div>
      </slot>
    </Teleport>

    <div v-if="isHovering" class="image-preview-container" :style="previewStyle">
      <img :src="previewSrc" alt="Preview" class="image-preview-large" />
    </div>
  </div>

</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import type { VDataTableProps, ExposedFunctions, PaginationObject } from '../types/v-data-table.ts';
import { readonly, ref, provide, computed, watch, nextTick, inject, onMounted } from 'vue';
import { DATA_TABLE_CONFIG } from '@/config/datatableConfig'
import PaginationDatatable from '@/Pagination/Pagination.vue';
import Search from './SearchDatatable.vue';
import { useImagePreview } from '../composables/useImagePreview';
import { dataTableApiKey, type ColumnConfiguration } from '../keys';
import draggable from 'vuedraggable';
import { useExpandedItem } from '../composables/useExpandedItem';
import { useDataTableFetch } from '../composables/useDataTableFetch';
import { useCheckBox } from '../composables/useCheckBox.ts';
import VDataTableLoading from './VDataTableLoading.vue';
import VThDataTable from './VThDataTable.vue';

const globalConfig = inject(DATA_TABLE_CONFIG, {});
const {
  isHovering,
  previewSrc,
  previewStyle,
  handleMouseOver,
  handleMouseMove,
  handleMouseLeave
} = useImagePreview();


// =======================================================
// 1. DEFINIÇÃO DE PROPS COM VALORES PADRÃO
// =======================================================
const props = withDefaults(defineProps<VDataTableProps>(), {
  fetch_name: '',
  custom_loading: null,
  deactivate_default_params: false,

  add_params: () => ({}),
  list_filter: () => [],

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
  show_header_when_empty: false,
});
const options = computed(() => {
  return {
    // Primeiro, espelha todas as props originais.
    ...props,

    // Agora SOBRESCREVEMOS as propriedades que precisam de lógica Global/Default
    // (Prioridade para Prop, mas aceita Global)

    // === TEXTOS ===
    first_text_page_size: props.first_text_page_size ?? globalConfig.first_text_page_size ?? 'Mostrar',
    second_text_page_size: props.second_text_page_size ?? globalConfig.second_text_page_size ?? 'registros',
    placeholder_search: props.placeholder_search ?? globalConfig.placeholder_search ?? 'Buscar...',

    // === CLASSES  ===
    class_table: props.class_table || globalConfig.class_table || '',
    class_pagination: props.class_pagination || globalConfig.class_pagination || '',
    class_container: props.class_container || globalConfig.class_container || '',
    class_content: props.class_content || globalConfig.class_content || '',
    class_filters: props.class_filters || globalConfig.class_filters || '',
    class_page_size: props.class_page_size || globalConfig.class_page_size || '',

    // === CONFIGURAÇÃO DE API ===
    filter_param_name: props.filter_param_name ?? globalConfig.filter_param_name ?? 'filter',
    search_param_name: props.search_param_name ?? globalConfig.search_param_name ?? 'search',
    page_param_name: props.page_param_name ?? globalConfig.page_param_name ?? 'page',
    page_size_param_name: props.page_size_param_name ?? globalConfig.page_size_param_name ?? 'page_size',
    page_starts_at: props.page_starts_at ?? globalConfig.page_starts_at ?? 0,
    item_key: props.item_key ?? globalConfig.item_key ?? 'id',
    data_key: props.data_key ?? globalConfig.data_key ?? 'results',
    total_key: props.total_key ?? globalConfig.total_key ?? 'count',

    // === COMPORTAMENTO ===
    limit_per_page: props.limit_per_page ?? globalConfig.limit_per_page ?? 5,
    type_loading: props.type_loading ?? globalConfig.type_loading ?? 'placeholder',
    min_loading_delay: props.min_loading_delay ?? globalConfig.min_loading_delay ?? 600,
    retry_attempts: props.retry_attempts ?? globalConfig.retry_attempts ?? 3,
    retry_delay: props.retry_delay ?? globalConfig.retry_delay ?? 2000,
    show_header_when_empty: props.show_header_when_empty ?? globalConfig.show_header_when_empty ?? false,
  };
});
const emit = defineEmits(['tradePage', 'beforeFetch', 'afterFetch', 'clickedClearSearch']);

// =======================================================
// 2. ESTADO REATIVO PRINCIPAL
// =======================================================

// variavel para saber quando o datatable já fez alguma busca

const orderings_state = ref<Record<string, 'none' | 'increasing' | 'decreasing'>>({});
const columns = ref<ColumnConfiguration[]>([]);
const totalItems = ref<number>(0);




// só ativa animação de arrastar colunas quando estiver arrastando
const isDraggingColumns = ref(false);

/*--------- definição de páginação ---------------*/
const pagination = ref<PaginationObject>({
  current_page: options.value.page_starts_at, // pagina atual
  count: 0,  // total de itens
  limit_per_page: options.value.limit_per_page, // limite de itens por página
  search: '', // termo de busca
  filter: '', // filtro selecionado
})



const {
  expand_item_toggle,
  close_all_expanded_items,
  is_item_expanded
} = useExpandedItem(
  options.value.close_expanded_item_on_expand_new,
  options.value.item_key,
  options.value.deactivate_animation_expand,
  options.value.scroll_to_expanded_item
);

const {
  items, error, response, attempt, default_params,
  fetchDataWithDelay, reSearch,
  showLoadingState, first_fetch
} = useDataTableFetch<T>(options.value, pagination, columns, orderings_state, emit, close_all_expanded_items);


const {
  selectAllCheckbox, selected_items, isSelected,
  atLeastOneSelected, toggleSelectAll, toggleItemSelection
} = useCheckBox(options.value, items);

// =======================================================
// 4. PROPRIEDADES COMPUTADAS
// =======================================================

// colunas TRAVADAS (apenas leitura)
const lockedColumns = computed(() =>
  columns.value.filter(c => c.locked && c.visible !== false)
);
// 'v-model' para as colunas ARRASTÁVEIS (com get/set)
const draggableColumns = computed({
  get() {
    return columns.value.filter(c => !c.locked && c.visible !== false);
  },
  set(newUnlockedOrder) {
    const locked = columns.value.filter(c => c.locked);
    const hidden = columns.value.filter(c => !c.locked && c.visible === false);
    columns.value = [...newUnlockedOrder, ...hidden, ...locked];
  }
});
// colunas RENDERIZADAS (ordem final)
const renderedColumns = computed(() => {
  return [...draggableColumns.value, ...lockedColumns.value];
});
/*
Variável que mapeia as colunas cadastradas.
Usada para entregar ao componente pai as informações de cabeçalho, campo, se a coluna é opcional e se está visível atualmente.
*/
const columns_list = computed(() => {
  return columns.value.map(col => ({
    id: col.id,
    header: col.header,
    field: col.field,
    start_hidden: !!col.start_hidden, // Converte para booleano, caso seja undefined
    visible: col.visible !== false,
    locked: col.locked
  }));
});
/*
Função que inverte o estado de visibilidade de uma coluna específica.
Recebe: id (string), que é o identificador único da coluna.
Devolve: nada (void).
Por que é usada: Permite ao usuário exibir ou ocultar uma coluna dinamicamente (como as opcionais) diretamente pela interface externa da tabela.
*/
function toggleColumnVisibility(id: string): void {
  const coluna = columns.value.find(c => c.id === id);
  if (coluna) {
    coluna.visible = !coluna.visible;
  }
}

const item_use = computed<number[]>(() => {
  let use = [1]
  if (options.value.list_filter.length > 0) {
    use.push(2)
  }
  return use;
});

//tem pelo menos um item
const hasItems = computed(() => {
  return items.value.length > 0
});


// =======================================================
// 5. WATCHERS (Observadores)
// =======================================================



watch(response, (newResponse: any) => {
  if (newResponse) {
    items.value = newResponse[options.value.data_key] || [];
    totalItems.value = newResponse[options.value.total_key] || 0;
    pagination.value.count = totalItems.value;
  } else {
    items.value = [];
    totalItems.value = 0;
  }
}, { immediate: true });



// =======================================================
// 6. MÉTODOS
// =======================================================
function onDragEnd() {
  setTimeout(() => {
    isDraggingColumns.value = false;
  }, 500);
}

function addColumn(colConfig: ColumnConfiguration): void {
  columns.value.push(colConfig);
}

provide(dataTableApiKey, { addColumn });


const changePageSize = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const newSize = parseInt(target.value, 10);
  if (newSize > 0) {
    pagination.value.limit_per_page = newSize;
    pagination.value.limit_per_page = newSize; // Atualiza o limite de itens por página
    reSearch();
  }
};

function getSubItem(field: string | null, item: T, transform_function: ((value: any) => any) | null = null): any {
  if (!field) return item;
  const parts = field.split('.');
  let value_item = item;

  for (const part of parts) {
    if (value_item && typeof value_item === 'object' && part in value_item) {
      value_item = value_item[part];
    }
    else {
      console.error(`Caminho inválido ou valor nulo em: ${field} na parte ${part}`);
    }
  }

  if (transform_function) {
    value_item = transform_function(value_item);
  }
  return value_item;
}



function limiteText(text: string | null, limite: number | null): string | null {
  if (limite && typeof limite === 'number' && limite > 0 && typeof text === 'string' && text.length > limite) {
    return text.substring(0, limite) + '...';
  }
  return text;
}

function toggleOrderingState(id: string) {

  // desabilita todos que não são o header clicado
  for (const key in orderings_state.value) {
    if (key !== id) {
      orderings_state.value[key] = 'none';
    }
  }

  const currentState = orderings_state.value[id] || 'none';
  if (currentState === 'none') {
    orderings_state.value[id] = 'increasing';
  } else if (currentState === 'increasing') {
    orderings_state.value[id] = 'decreasing';
  } else {
    orderings_state.value[id] = 'none';
  }

  reSearch();
}


// =======================================================
// 7. EXPOSE E CICLO DE VIDA
// =======================================================
function set_limit_per_page(newLimit: number): void {
  if (newLimit > 0) {
    pagination.value.limit_per_page = newLimit;
    reSearch();
  } else {
    console.warn("O limite deve ser um número maior que zero.");
  }
}
function set_search(newSearch: string): void {
  pagination.value.search = newSearch;
  reSearch();
}
function set_filter(newFilter: string): void {
  pagination.value.filter = newFilter;
  reSearch();
}
function set_page(newPage: number): void {
  if (newPage >= 0 && newPage <= Math.ceil(pagination.value.count / pagination.value.limit_per_page)) {
    pagination.value.current_page = newPage;
    fetchDataWithDelay();
  } else {
    console.warn("Número de página inválido.");
  }
}




function colspanExpandItems(): number {
  let colspan = columns.value.length;
  if (options.value.use_checkbox) colspan += 1;
  if (options.value.use_expandable_items) colspan += 1;
  return colspan;
}
function tradePageEmit(): void {
  emit('tradePage');
  fetchDataWithDelay();

}
const computeClasses = (col: ColumnConfiguration, item: T) => {
  // Pega a classe estática padrão
  const classes = [col.class_item || ''];

  // Se a coluna for clicável, adiciona cursor-pointer automaticamente
  if (col.click) {
    classes.push('cursor-pointer');
  }

  // Processa as regras dinâmicas (class_rules)
  if (col.class_rules) {
    for (const [className, ruleValidator] of Object.entries(col.class_rules)) {
      if (typeof ruleValidator === 'function' && ruleValidator(item)) {
        classes.push(className);
      }
    }
  }

  return classes.join(' ').trim();
};

defineExpose<ExposedFunctions<T>>({
  execute: fetchDataWithDelay,
  reSearch: reSearch,
  pagination: readonly(pagination),
  set_limit_per_page: set_limit_per_page,
  set_search: set_search,
  set_filter: set_filter,
  set_page: set_page,
  default_params,
  selected_items,
  atLeastOneSelected,
  expand_item_toggle,
  close_all_expanded_items,
  selectAllCheckbox,
  toggleColumnVisibility,
  columns_list,
});

onMounted(() => {
  if (options.value.immediate) {
    nextTick(() => {
      reSearch();
    });
  }
});

watch(
  () => options.value.add_params,
  () => {
    reSearch();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
@use '@/DatatableVue/style/scss/VDataTable.scss';
</style>