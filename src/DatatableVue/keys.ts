// src/keys.ts
import type { InjectionKey, Slot } from 'vue'

export interface ColumnConfiguration {
  field: string | null;
  header: string;
  type: 'text' | 'img' | 'date' | 'html';
  class_column: string;
  class_row: string;
  class_item: string;
  transform_function: ((value: any) => any) | null;
  bodySlot?: Slot;
  colHeaderSlot?: Slot;
  colHeaderMidleSlot?: Slot;
  limite_text?: number;
  deactivate_img_preview?: boolean;
  format?: 'complete' | 'simple';
  click: Function | null;
  locked: boolean;
  use_ordering: boolean;
  param_ordering: string;
  decreasing_value: string;
  increasing_value: string;
  class_rules?: Record<string, (item: any) => boolean>;
  start_hidden?: boolean;
  // não é prop, é uma propriedade interna do VDataTable para controlar a visibilidade da coluna
  visible?: boolean; 
  id: string; // ID único da coluna, gerado internamente pelo VDataTable
  // Chave gerada dinamicamente para salvar e recuperar o estado da coluna no localstorage
  storage_key?: string;
}

// A API que o VDataTable "fornece" para os filhos
export interface DataTableApi {
  addColumn: (config: ColumnConfiguration) => void;
}

// A chave de injeção do DataTableApi
export const dataTableApiKey: InjectionKey<DataTableApi> = Symbol('v-datatable-key')

export interface PaginationObject {
  current_page: number;
  count: number;
  limit_per_page: number;
  search: string;
  filter: string;
}