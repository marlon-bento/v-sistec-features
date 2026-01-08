<template>
  <div class="loading-container">
    <template v-if="props.custom_loading">
        <component :is="props.custom_loading" />
    </template>
    <template v-else>
        <table class="table table-vcenter table-selectable" :class="props.class_table">
            <thead>
                <tr>
                    <th v-for="col in columns" :key="col.field || col.header" :class="col.class_column">
                        {{ col.header }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <template v-if="props.type_loading === 'placeholder'">
                    <tr v-for="n in pagination.limit_per_page" :key="'placeholder-' + n" class="placeholder-glow">
                        <td v-for="col in columns" :key="col.field || col.header" :class="col.class_row">
                            <span v-if="col.bodySlot">
                                <span class="placeholder col-8"></span>
                            </span>
                            <span :class="col.class_item" v-else-if="col.type === 'text'">
                                <span class="placeholder col-8"></span>
                            </span>
                            <span v-else-if="col.type === 'date'">
                                <span class="placeholder col-9"></span>
                            </span>
                            <div :class="col.class_item" v-else-if="col.type === 'html'">
                                <div class="placeholder col-12"></div>
                            </div>

                            <div :class="col.class_item" v-else-if="col.type === 'img'">
                                <div class="placeholder placeholder-img"></div>
                            </div>

                            <span class="text-danger erro-custom-container" v-else>tipo <span
                                    class="badge bg-orange text-white erro-custom-text">{{ col.type }}</span> não
                                suportado
                            </span>
                        </td>
                    </tr>
                </template>
                <template v-else-if="props.type_loading === 'spiner-table'">
                    <tr v-for="n in pagination.limit_per_page" :key="'placeholder-' + n">
                        <td v-for="col in columns" :key="col.field || col.header" :class="col.class_row">
                            <span v-if="col.bodySlot">
                                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </span>
                            <span :class="col.class_item" v-else-if="col.type === 'text'">
                                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </span>
                            <span v-else-if="col.type === 'date'">
                                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </span>
                            <div :class="col.class_item" v-else-if="col.type === 'html'">
                                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            </div>

                            <div class="" :class="col.class_item" v-else-if="col.type === 'img'">
                                <span class="placeholder-img d-flex justify-content-center align-items-center">
                                    <span class="spinner-border spinner-border-sm" role="status"
                                        aria-hidden="true"></span>
                                </span>
                            </div>

                            <span class="text-danger erro-custom-container" v-else>tipo <span
                                    class="badge bg-orange text-white erro-custom-text">{{ col.type }}</span> não
                                suportado
                            </span>
                        </td>
                    </tr>

                </template>
                <template v-else-if="props.type_loading === 'spiner'">
                    <tr v-for="n in pagination.limit_per_page" :key="n">
                        <td :colspan="columns.length" class="text-center p-0" style="border-bottom: none;">
                            <div v-if="n === Math.floor(pagination.limit_per_page / 2) + 1"
                                class="d-flex flex-column justify-content-center align-items-center"
                                style="height: 6rem;">
                                <div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
                                </div>
                                <span class="mt-2">Carregando...</span>
                            </div>
                            <div v-else style="height: 3rem;"></div>
                        </td>
                    </tr>
                </template>

            </tbody>
        </table>
    </template>

    <div v-if="attempt && attempt.current > 1" class="p-3 text-center text-secondary">
        A conexão falhou. Tentando novamente... (Tentativa {{ attempt.current }} de {{ attempt.total }})
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnConfiguration } from '../keys'; 
import type { PaginationObject } from '@/DataPageVue/types/v-data-page.ts';
interface AttemptObject {
    current: number;
    total: number;
}

const props = defineProps<{
    columns: ColumnConfiguration[];
    limit: number;
    type_loading: string;
    custom_loading?: any;
    class_table?: string;
    attempt?: AttemptObject | null;
    pagination: PaginationObject;
}>();
</script>

<style lang="scss" scoped>

$max-width-img: 40px;

.placeholder-img {
  width: $max-width-img;
  height: $max-width-img;
  border-radius: 4px;
}

.erro-custom-container {
  display: inline-block;
  padding: 0.2em 0.6em;
  border-radius: 4px;
  background-color: #ffffff;
  font-weight: bold;
  text-transform: uppercase;
}

.erro-custom-text {
  font-size: 0.8em;
  text-transform: uppercase;
  font-weight: bold;
}
</style>