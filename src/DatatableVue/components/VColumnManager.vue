<template>
    <div v-if="use_column_manager" :class="[
        { 'dropdown d-inline-block ms-2': !disable_class_column_manager_default },
        class_column_manager_dropdown
    ]">
        <button :class="[
            { 'btn  dropdown-toggle': !disable_class_column_manager_default },
            class_column_manager_button
        ]" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="Gerenciar Colunas visíveis">
            <component :is="icons.column_manager" />
        </button>
        <div class="dropdown-menu dropdown-menu-end p-3 shadow-sm" :class="[
            { 'dropdown-menu dropdown-menu-end p-3 shadow-sm': !disable_class_column_manager_default },
            class_column_manager_dropdown_menu
        ]" style="min-width: 220px; z-index: 1050;">
            <h6 class="dropdown-header text-uppercase fw-bold mb-2">Exibir Colunas</h6>
            <div class="d-flex flex-column gap-2">
                <label v-for="coluna in columns_list" :key="coluna.id" class="form-check cursor-pointer m-0">
                    <input class="form-check-input" type="checkbox" :checked="coluna.visible" :disabled="coluna.locked"
                        @change="toggleColumnVisibility(coluna.id)">
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
}
withDefaults(defineProps<SearchProps>(), {
    columns_list: () => [],
    use_column_manager: false,
    toggleColumnVisibility: () => { },
    class_column_manager_dropdown: '',
    class_column_manager_dropdown_menu: '',
    class_column_manager_button: '',
    disable_class_column_manager_default: false
});


</script>