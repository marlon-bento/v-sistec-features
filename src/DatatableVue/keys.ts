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
  limite_text?: number;
  deactivate_img_preview?: boolean;
  format?: 'complete' | 'simple';
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