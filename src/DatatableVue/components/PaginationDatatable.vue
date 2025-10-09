<script setup lang="ts">
import { computed } from "vue";

// =======================================================
// 1. DEFINIÇÃO DE TIPOS E INTERFACES
// =======================================================

// Define a "forma" do objeto de paginação para garantir a segurança dos tipos.
interface PaginationObject {
  current_page: number;
  count: number;
  limit_per_page: number;
}

// Define as props do componente usando a interface.
interface PaginationProps {
  pagination: PaginationObject;
  filtering?: boolean;
}

// =======================================================
// 2. PROPS E EMITS
// =======================================================

const props =  withDefaults(defineProps<PaginationProps>(), {
  filtering: false,
});

// Define os eventos que o componente pode emitir com sua assinatura de tipo.
const emit = defineEmits<{
  (e: 'tradePage'): void
}>();

// =======================================================
// 3. LÓGICA REATIVA (COMPUTED)
// =======================================================

const total_pages = computed<number>(() => {
  if (!props.pagination.limit_per_page) return 0;
  return Math.ceil(props.pagination.count / props.pagination.limit_per_page);
});


const next = computed(() => {
    return props.pagination.current_page + 1 <
        Math.ceil(props.pagination.count / props.pagination.limit_per_page)
        ? props.pagination.current_page + 1
        : null;
});


// Função para passar para a próxima página
const nextPage = (): void => {
    props.pagination.current_page++;
    emit("tradePage");
};
const setPage = (newPage: number): void => {
    props.pagination.current_page = newPage;
    emit("tradePage");
};
const lastPage = (): void => {
    props.pagination.current_page = total_pages.value - 1;
    emit("tradePage");
};
const firstPage = (): void => {
    props.pagination.current_page = 0;
    emit("tradePage");
};
// Função para voltar para a página anterior
const prevPage = (): void => {
    if (props.pagination.current_page > 0) {
        props.pagination.current_page--;
        emit("tradePage");
    }
};

/**
 * @description função que serve para saber quais páginas mostrar
 *
 *
 * @param page esse valor é o valor n do v-for
 * @param current_page página atual que o usuário está usando
 * @param total_pages  total de páginas que existem
 *
 *
 */
function rate_next_pages(page: number, current_page: number, total_pages: number): boolean {
    /* se a página atual for a página que o v-for chegou, ela deve ser mostrada */
    if (page === current_page) {
        return true;
    } else if (current_page === page - 1 && page != 3) {
        /* se a página que o v-for chegou não for a página 3
            mostra as páginas posteriores a atual
         */
        return true;
    } else if (current_page === page + 1) {
        /* 
            mostra as páginas anteriores a atual
         */
        return true;
    } else if (page > total_pages - 2) {
        /* mostra as duas ultimas páginas */
        return true;
    } else {
        return false;
    }
}
function rate_first_last_pages(page: number, current_page: number, total_pages: number): boolean {
    /* 
        Verifica se a página atual está longe das primeiras páginas e das últimas páginas, 
        e se estamos na terceira última página do total.
        Exemplo: mostra "..." antes das últimas páginas (ex: ... 8 9).
     */
    if (
        page == total_pages - 2 &&
        current_page > 2 &&
        current_page != total_pages
    ) {
        return true;
    } else {
        return false;
    }
}
function rate_last_pages(page: number, current_page: number, total_pages: number): boolean {
    /*
        Controla a exibição das últimas duas páginas, 
        garantindo que "..." apareça apenas quando a página atual não for uma das duas últimas.
     */
    if (current_page != total_pages - 1 && current_page != total_pages - 2) {
        if (page > total_pages - 2) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
</script>

<template>
    <div class="d-flex align-items-center justify-content-between w-100" v-if="props.pagination.count > 0">
        <span>
            Mostrando de
            {{
                props.pagination.count !== 0
                    ? props.pagination.limit_per_page * props.pagination.current_page + 1
                    : 0
            }}
            até
            {{
                props.pagination.limit_per_page * (props.pagination.current_page + 1) < props.pagination.count ?
                    props.pagination.limit_per_page * (props.pagination.current_page + 1) : props.pagination.count }} de {{
                    props.pagination.count }} registros </span>
                <div class="d-flex align-items-center p-2 gap-2" v-if="total_pages > 0">
                    <div class="d-flex">
                        <button class="btn btn-estilo" @click.prevent="firstPage"
                            :disabled="props.pagination.current_page === 0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-left">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M11 7l-5 5l5 5" />
                                <path d="M17 7l-5 5l5 5" />
                            </svg>

                        </button>
                        <button class="btn btn-estilo" @click.prevent="prevPage"
                            :disabled="props.pagination.current_page === 0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M15 6l-6 6l6 6" />
                            </svg>
                        </button>
                    </div>

                    <div class="d-flex  gap-2">
                        <template v-if="total_pages < 7">
                            <template v-for="n in total_pages" :key="n">
                                <!-- Exibe normalmente todos os botões de páginas se o total de páginas que existem for menor que 7 -->
                                <button :class="props.pagination.current_page + 1 == n ? 'page-select' : ''"
                                    class="page-estilo" @click.prevent="setPage(n - 1)"
                                    :disabled="props.pagination.current_page + 1 == n">
                                    {{ n }}
                                </button>
                            </template>
                        </template>
                        <template v-else>
                            <template v-for="n in total_pages" :key="n">
                                <!-- primeiramente avalia as primeiras 2 páginas -->
                                <template v-if="n < 3">
                                    <button :class="props.pagination.current_page + 1 == n ? 'page-select' : ''
                                        " class="page-estilo" @click.prevent="setPage(n - 1)"
                                        :disabled="props.pagination.current_page + 1 == n">
                                        {{ n }}
                                    </button>
                                    <!-- tratamento de quando mostrar os ... que sempre fica depois da página 2 -->
                                    <p v-if="
                                        n === 2 &&
                                        props.pagination.current_page + 1 !== 2 &&
                                        props.pagination.current_page + 1 !== 3 &&
                                        props.pagination.current_page + 1 !== 4
                                    " class="m-0 p-0">
                                        ...
                                    </p>
                                </template>
                                <!-- Se a página atual for a 2, da a opção de ir pra próxima, que no caso é a 3 -->
                                <template v-else-if="n === 3 && props.pagination.current_page + 1 === 2">
                                    <button :class="props.pagination.current_page + 1 == n ? 'page-select' : ''
                                        " class="page-estilo" @click.prevent="setPage(n - 1)"
                                        :disabled="props.pagination.current_page + 1 == n">
                                        {{ n }}
                                    </button>
                                    <!-- mostra que tem mais páginas -->
                                    <p class="m-0 p-0">...</p>
                                </template>
                                <!-- Agora o tratamento para quais páginas além das 2 primeiras devem aparecer -->
                                <template v-else>
                                    <!--  -->
                                    <button v-if="
                                        rate_next_pages(
                                            n,
                                            props.pagination.current_page + 1,
                                            total_pages,
                                        )
                                    " :class="props.pagination.current_page + 1 == n ? 'page-select' : ''
                                        " class="page-estilo" @click.prevent="setPage(n - 1)"
                                        :disabled="props.pagination.current_page + 1 == n">
                                        {{ n }}
                                    </button>
                                    <template v-else>
                                        <p v-if="
                                            rate_first_last_pages(
                                                n,
                                                props.pagination.current_page + 1,
                                                total_pages,
                                            )
                                        " class="m-0 p-0">
                                            ...
                                        </p>
                                        <button v-if="
                                            rate_last_pages(
                                                n,
                                                props.pagination.current_page + 1,
                                                total_pages,
                                            )
                                        " :class="props.pagination.current_page + 1 == n ? 'page-select' : ''
                                            " class="page-estilo" @click.prevent="setPage(n - 1)"
                                            :disabled="props.pagination.current_page + 1 == n">
                                            {{ n }}
                                        </button>
                                    </template>
                                </template>
                            </template>


                        </template>
                    </div>


                    <div class="d-flex">
                        <button @click.prevent="nextPage" class="btn btn-estilo" :disabled="!next">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M9 6l6 6l-6 6" />
                            </svg>
                        </button>
                        <button @click.prevent="lastPage" class="btn btn-estilo" :disabled="!next">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round"
                                class="icon icon-tabler icons-tabler-outline icon-tabler-chevrons-right">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M7 7l5 5l-5 5" />
                                <path d="M13 7l5 5l-5 5" />
                            </svg>

                        </button>
                    </div>


                </div>
    </div>
</template>
<style lang="scss" scoped>
.page-select {
    background-color: var(--tblr-primary) !important;
    color: white !important;
    border: none !important;
}

.page-estilo {
    border: none;
    --cor-escurecida: color-mix(in srgb, var(--tblr-primary), #000 25%);
    //border: 2px solid var(--cor-escurecida);
    background: transparent;
    padding: 1px 10px;
    border-radius: 7px;
    margin: 0 !important;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;

    &:hover {
        background: var(--cor-escurecida);
        color: white;
    }
}


.btn-estilo {
    background: 0 0;
    margin: 0 !important;
    padding: 0 !important;
    border: none;
    transition: color 200ms ease-in-out;

    &:hover {
        color: rgb(86, 148, 242);
        border: var(--tblr-pagination-border-width) solid var(--tblr-pagination-border-color);
    }
}

.icon-tabler {
    margin: 0 !important;
    padding: 0 !important;
}
</style>
