import type { InjectionKey } from 'vue';
import type { VDataTableProps } from '@/DatatableVue/types/v-data-table';

//o Partial para dizer que no global não precisamos passar TUDO
export type DataTableGlobalConfig = Partial<VDataTableProps>;

// A chave para o provide/inject
export const DATA_TABLE_CONFIG: InjectionKey<DataTableGlobalConfig> = Symbol('DataTableConfig');
