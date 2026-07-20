<template>

    <div v-if="use_column_manager" class="dropdown d-inline-block ms-2">
        <button class="btn  dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false"
            title="Gerenciar Colunas visíveis">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-columns" width="24" height="24"
                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round"
                stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 6l5.5 0" />
                <path d="M4 10l5.5 0" />
                <path d="M4 14l5.5 0" />
                <path d="M4 18l5.5 0" />
                <path d="M14.5 6l5.5 0" />
                <path d="M14.5 10l5.5 0" />
                <path d="M14.5 14l5.5 0" />
                <path d="M14.5 18l5.5 0" />
            </svg>
        </button>
        <div class="dropdown-menu dropdown-menu-end p-3 shadow-sm" style="min-width: 220px; z-index: 1050;">
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
interface SearchProps {
    columns_list?: any[];
    use_column_manager?: boolean;
    toggleColumnVisibility?: (columnId: string) => void;
}
const props = withDefaults(defineProps<SearchProps>(), {
    columns_list: () => [],
    use_column_manager: false,
    toggleColumnVisibility: () => { }
});


</script>