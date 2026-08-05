<template>
    <div v-if="use_column_manager" :class="[
        { 'dropdown d-inline-block ms-2': !disable_class_column_manager_default },
        class_column_manager_dropdown
    ]">
        <button :class="[
            { 'btn dropdown-toggle': !disable_class_column_manager_default },
            class_column_manager_button
        ]" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Gerenciar Colunas visíveis">
            <component :is="icons.column_manager" />
        </button>
        <div class="dropdown-menu dropdown-menu-end p-3 shadow-sm" :class="[
            { 'dropdown-menu dropdown-menu-end p-3 shadow-sm': !disable_class_column_manager_default },
            class_column_manager_dropdown_menu
        ]" style="min-width: 220px; z-index: 1050;">
            <div class="d-flex justify-content-between align-items-center mb-1 w-100">
                <h6 class="dropdown-header text-uppercase fw-bold  m-0 p-0">Exibir Colunas</h6>
                <button title="resetar" type="button" class="btn-puro-reset" @click="resetColumnsState">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="icon icon-tabler icons-tabler-outline icon-tabler-refresh">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
                        <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                    </svg>
                </button>


            </div>

            <div class="dropdown-divider my-3"></div>
            <div class="d-flex flex-column gap-2">
                <label v-for="coluna in columns_list" :key="coluna.id" class="form-check cursor-pointer m-0">
                    <input class="form-check-input" type="checkbox" :checked="coluna.visible"
                        :disabled="coluna.disable_hide" @change="toggleColumnVisibility(coluna.id)">
                    <span class="form-check-label user-select-none">{{ coluna.header }}</span>
                </label>
            </div>




        </div>
    </div>
</template>
<script setup lang="ts">
import { buildIcons } from '@/utils/svgFactory'
import { svgs } from '@/DatatableVue/style/svgs'
const icons = buildIcons(svgs)

interface SearchProps {
    columns_list?: any[];
    use_column_manager?: boolean;
    toggleColumnVisibility?: (columnId: string) => void;
    class_column_manager_dropdown?: string;
    class_column_manager_dropdown_menu?: string;
    class_column_manager_button?: string;
    disable_class_column_manager_default?: boolean;
    resetColumnsState?: () => void;
}
withDefaults(defineProps<SearchProps>(), {
    columns_list: () => [],
    use_column_manager: false,
    toggleColumnVisibility: () => { },
    class_column_manager_dropdown: '',
    class_column_manager_dropdown_menu: '',
    class_column_manager_button: '',
    disable_class_column_manager_default: false,
    resetColumnsState: () => { }
});


</script>
<style scoped lang="scss">
.btn-puro-reset {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: rgb(204, 18, 18);
}
</style>