<!--
========
Componente base interno para modais de diálogo, alerta e decisão.
Construído sem dependência de Bootstrap, utilizando Teleport, controle nativo de tecla ESC,
clique no overlay e estilização compatível com o ModalReserva e Tabler.
========
-->
<template>
    <Teleport to="body">
        <div
            v-if="exibirModal"
            class="modal-overlay"
            @mousedown.self="aoClicarFora"
        >
            <div
                class="modal-card"
                :class="`modal-tamanho-${tamanho}`"
                role="dialog"
                aria-modal="true"
            >
                <div
                    v-if="corTopo"
                    class="modal-status-topo"
                    :class="classeStatusTopo"
                    :style="estiloStatusTopo"
                ></div>

                <BotaoFechar
                    v-if="mostrarBotaoFechar"
                    flutuante
                    :desabilitado="carregando"
                    @click="cancelarAcao"
                />

                <div class="modal-body text-center py-4 px-4">
                    <slot name="icone"></slot>

                    <h3 v-if="titulo || slots.titulo" class="modal-titulo-dialogo mb-2">
                        <slot name="titulo">{{ titulo }}</slot>
                    </h3>

                    <div class="modal-descricao-dialogo">
                        <slot>{{ descricao }}</slot>
                    </div>

                    <div v-if="slots.conteudo" class="mt-3 text-start">
                        <slot name="conteudo"></slot>
                    </div>

                    <div v-if="slots.extra" class="mt-3">
                        <slot name="extra"></slot>
                    </div>
                </div>

                <div v-if="!ocultarRodape" class="modal-footer">
                    <div class="w-100">
                        <div class="row g-2 align-items-center">
                            <slot
                                name="footer"
                                :cancelar="cancelarAcao"
                                :confirmar="confirmarAcao"
                            >
                                <slot
                                    name="botoes-esquerda"
                                    :cancelar="cancelarAcao"
                                    :confirmar="confirmarAcao"
                                ></slot>

                                <div v-if="mostrarBotaoCancelar" class="col">
                                    <button
                                        type="button"
                                        class="btn w-100 botao-secundario-modal"
                                        :disabled="carregando"
                                        @click="cancelarAcao"
                                    >
                                        {{ textoCancelar }}
                                    </button>
                                </div>

                                <slot
                                    name="botoes-meio"
                                    :cancelar="cancelarAcao"
                                    :confirmar="confirmarAcao"
                                ></slot>

                                <div v-if="mostrarBotaoConfirmar" class="col">
                                    <button
                                        type="button"
                                        class="btn w-100"
                                        :class="classeBotaoConfirmar"
                                        :style="estiloBotaoConfirmar"
                                        :disabled="desabilitarConfirmar || carregando"
                                        @click="confirmarAcao"
                                    >
                                        <span
                                            v-if="carregando"
                                            class="spinner-border spinner-border-sm me-2"
                                            role="status"
                                        ></span>
                                        {{ textoConfirmar }}
                                    </button>
                                </div>

                                <slot
                                    name="botoes-direita"
                                    :cancelar="cancelarAcao"
                                    :confirmar="confirmarAcao"
                                ></slot>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, useSlots, watch, onUnmounted, type Slots } from "vue";
import BotaoFechar from "../BotaoFechar.vue";

// Interface do escopo fornecido aos slots do rodapé
export interface EscopoRodapeModal {
    cancelar: () => void;
    confirmar: () => void;
}

// Declaração explícita dos slots para validação do vue-tsc nos componentes filhos
defineSlots<{
    default?: (props: {}) => any;
    icone?: (props: {}) => any;
    titulo?: (props: {}) => any;
    conteudo?: (props: {}) => any;
    extra?: (props: {}) => any;
    "botoes-esquerda"?: (props: EscopoRodapeModal) => any;
    "botoes-meio"?: (props: EscopoRodapeModal) => any;
    "botoes-direita"?: (props: EscopoRodapeModal) => any;
    footer?: (props: EscopoRodapeModal) => any;
}>();

// Acesso tipado aos slots recebidos pelo componente
const slots: Slots = useSlots();

// Propriedades estruturais repassadas pelos componentes filhos especializados
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    tamanho: { type: String as () => "sm" | "md" | "lg" | "xl", default: "sm" },
    corTopo: {
        type: String as () => "brand" | "danger" | "success" | "warning" | "info" | "primary" | "",
        default: "brand"
    },
    corBotaoConfirmar: {
        type: String as () => "brand" | "danger" | "success" | "warning" | "info" | "primary",
        default: "brand"
    },
    titulo: { type: String, default: "" },
    descricao: { type: String, default: "" },
    textoCancelar: { type: String, default: "Cancelar" },
    textoConfirmar: { type: String, default: "Confirmar" },
    mostrarBotaoCancelar: { type: Boolean, default: true },
    mostrarBotaoConfirmar: { type: Boolean, default: true },
    mostrarBotaoFechar: { type: Boolean, default: true },
    ocultarRodape: { type: Boolean, default: false },
    fecharAoClicarFora: { type: Boolean, default: true },
    fecharComEsc: { type: Boolean, default: true },
    fecharAoConfirmar: { type: Boolean, default: false },
    desabilitarConfirmar: { type: Boolean, default: false },
    carregando: { type: Boolean, default: false }
});

// Eventos padrões de ciclo de vida e decisão do modal
const emit = defineEmits(["update:modelValue", "confirmar", "cancelar", "fechar"]);

// Controla a visibilidade do modal sincronizada com o v-model
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit("update:modelValue", valor)
});

// Impede o fechamento ao clicar no fundo escuro se configurado ou se estiver carregando
const bloquearCliqueFora = computed(() => !props.fecharAoClicarFora || props.carregando);

// Impede o fechamento pela tecla ESC se configurado ou se estiver carregando
const bloquearEsc = computed(() => !props.fecharComEsc || props.carregando);

// Define a classe de cor da barra de topo para cores padrão do Tabler
const classeStatusTopo = computed(() => {
    if (!props.corTopo || props.corTopo === "brand") return "";
    return `bg-${props.corTopo}`;
});

// Aplica a variável CSS --color-brand na barra de topo quando selecionada
const estiloStatusTopo = computed(() => {
    if (props.corTopo === "brand") {
        return { backgroundColor: "var(--color-brand, var(--tblr-primary, #206bc4))" };
    }
    return {};
});

// Define a classe visual do botão principal de confirmação
const classeBotaoConfirmar = computed(() => {
    if (props.corBotaoConfirmar === "brand") return "btn-brand-custom text-white";
    return `btn-${props.corBotaoConfirmar}`;
});

// Aplica a cor da marca ao botão principal quando configurado como brand
const estiloBotaoConfirmar = computed(() => {
    if (props.corBotaoConfirmar === "brand") {
        return {
            backgroundColor: "var(--color-brand, var(--tblr-primary, #206bc4))",
            borderColor: "var(--color-brand, var(--tblr-primary, #206bc4))"
        };
    }
    return {};
});

// Recebe o evento de teclado, não devolve valor e fecha o modal ao pressionar ESC se permitido
function aoPressionarTecla(evento: KeyboardEvent) {
    if (evento.key === "Escape" && exibirModal.value && !bloquearEsc.value) {
        cancelarAcao();
    }
}

// Observa a abertura do modal para registrar ou remover o listener da tecla ESC
watch(
    exibirModal,
    (aberto) => {
        if (typeof window === "undefined") return;
        if (aberto) {
            window.addEventListener("keydown", aoPressionarTecla);
        } else {
            window.removeEventListener("keydown", aoPressionarTecla);
        }
    },
    { immediate: true }
);

onUnmounted(() => {
    if (typeof window !== "undefined") {
        window.removeEventListener("keydown", aoPressionarTecla);
    }
});

// Não recebe parâmetros, não devolve valor e trata o clique no fundo escuro do modal
function aoClicarFora() {
    if (bloquearCliqueFora.value) return;
    cancelarAcao();
}

// Não recebe parâmetros, não devolve valor e fecha o modal emitindo os eventos de cancelamento
function cancelarAcao() {
    if (props.carregando) return;
    exibirModal.value = false;
    emit("cancelar");
    emit("fechar");
}

// Não recebe parâmetros, não devolve valor e emite o evento de confirmação
function confirmarAcao() {
    if (props.desabilitarConfirmar || props.carregando) return;
    emit("confirmar");
    if (props.fecharAoConfirmar) {
        exibirModal.value = false;
    }
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: 16px;
    box-sizing: border-box;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.modal-card {
    background: var(--bg-modal, var(--bg-primary, var(--tblr-bg-surface, #ffffff)));
    color: var(--text-primary, var(--tblr-body-color, #1e293b));
    width: 100%;
    max-height: calc(100vh - 32px);
    border-radius: 12px;
    box-shadow: var(--shadow-float, 0 10px 25px rgba(0, 0, 0, 0.15));
    border: 1px solid var(--border-light, var(--tblr-border-color, rgba(0, 0, 0, 0.08)));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

.modal-tamanho-sm {
    max-width: 400px;
}

.modal-tamanho-md {
    max-width: 540px;
}

.modal-tamanho-lg {
    max-width: 720px;
}

.modal-tamanho-xl {
    max-width: 1140px;
}

.modal-status-topo {
    height: 4px;
    width: 100%;
    flex-shrink: 0;
}

.modal-body {
    background: var(--bg-primary, var(--tblr-bg-surface, #ffffff));
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

.modal-titulo-dialogo {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, var(--tblr-body-color, #1e293b));
}

.modal-descricao-dialogo {
    color: var(--text-secondary, var(--tblr-secondary, #64748b));
    font-size: 14px;
    line-height: 1.5;
}

.modal-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border-light, var(--tblr-border-color, #e6e7e9));
    background: var(--bg-secondary, var(--tblr-bg-surface-secondary, #f8fafc));
    flex-shrink: 0;
}

.botao-secundario-modal {
    background: var(--bg-primary, var(--tblr-bg-surface, #ffffff));
    border: 1px solid var(--border-light, var(--tblr-border-color, #cbd5e1));
    color: var(--text-primary, var(--tblr-body-color, #1e293b));
    font-weight: 600;
}

.botao-secundario-modal:hover:not(:disabled) {
    background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.btn-brand-custom {
    font-weight: 600;
}

.btn-brand-custom:hover:not(:disabled) {
    filter: brightness(0.92);
}
</style>