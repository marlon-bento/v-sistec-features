<!--
========
Componente de modal de confirmação simples e compacto.
Segue o layout minimalista alinhado à esquerda sem dependência do Bootstrap, utilizando
BotaoFechar, controle nativo de eventos e slots para botões extras.
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
                    v-if="corBarraTopo"
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

                <div class="modal-body" :class="{ 'pe-5': mostrarBotaoFechar }">
                    <div class="modal-titulo-simples">
                        <slot name="titulo">{{ titulo }}</slot>
                    </div>
                    <div class="modal-descricao-simples mt-1">
                        <slot>{{ descricao }}</slot>
                    </div>
                    <div v-if="slots.conteudo" class="mt-3">
                        <slot name="conteudo"></slot>
                    </div>
                </div>

                <div class="modal-footer">
                    <slot name="footer" :cancelar="cancelarAcao" :confirmar="confirmarAcao">
                        <button
                            v-if="mostrarBotaoCancelar"
                            type="button"
                            class="btn btn-link link-secondary me-auto text-nowrap px-2"
                            :disabled="carregando"
                            @click="cancelarAcao"
                        >
                            {{ textoCancelar }}
                        </button>

                        <div class="d-flex gap-2 align-items-center flex-wrap ms-auto">
                            <slot name="botoes-extras" :cancelar="cancelarAcao" :confirmar="confirmarAcao"></slot>

                            <button
                                type="button"
                                class="btn text-nowrap"
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
                    </slot>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, useSlots, watch, onUnmounted, type Slots } from "vue";
import BotaoFechar from "./BotaoFechar.vue";
// Tipagem explícita dos slots do modal simples
defineSlots<{
    default?: (props: {}) => any;
    titulo?: (props: {}) => any;
    conteudo?: (props: {}) => any;
    "botoes-extras"?: (props: { cancelar: () => void; confirmar: () => void }) => any;
    footer?: (props: { cancelar: () => void; confirmar: () => void }) => any;
}>();

// Instância de slots para checagem no template
const slots: Slots = useSlots();


// Propriedades de configuração do modal simples compacto
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    tamanho: { type: String as () => "sm" | "md" | "lg", default: "sm" },
    titulo: { type: String, default: "Você tem certeza?" },
    descricao: { type: String, default: "Se você prosseguir, perderá todos os seus dados." },
    textoCancelar: { type: String, default: "Cancelar" },
    textoConfirmar: { type: String, default: "Sim, deletar" },
    corBotaoConfirmar: {
        type: String as () => "danger" | "primary" | "success" | "warning" | "brand",
        default: "danger"
    },
    corBarraTopo: {
        type: String as () => "brand" | "danger" | "success" | "warning" | "info" | "",
        default: ""
    },
    mostrarBotaoCancelar: { type: Boolean, default: true },
    mostrarBotaoFechar: { type: Boolean, default: false },
    fecharAoClicarFora: { type: Boolean, default: true },
    fecharComEsc: { type: Boolean, default: true },
    fecharAoConfirmar: { type: Boolean, default: false },
    desabilitarConfirmar: { type: Boolean, default: false },
    carregando: { type: Boolean, default: false }
});

// Eventos emitidos pelo modal
const emit = defineEmits(["update:modelValue", "confirmar", "cancelar", "fechar"]);

// Sincroniza a visibilidade com o v-model
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit("update:modelValue", valor)
});

// Controle de bloqueio de clique fora
const bloquearCliqueFora = computed(() => !props.fecharAoClicarFora || props.carregando);

// Controle de bloqueio da tecla ESC
const bloquearEsc = computed(() => !props.fecharComEsc || props.carregando);

// Classe CSS da barra de topo opcional
const classeStatusTopo = computed(() => {
    if (!props.corBarraTopo || props.corBarraTopo === "brand") return "";
    return `bg-${props.corBarraTopo}`;
});

// Estilo inline para barra de topo com var(--color-brand)
const estiloStatusTopo = computed(() => {
    if (props.corBarraTopo === "brand") {
        return { backgroundColor: "var(--color-brand, var(--tblr-primary, #206bc4))" };
    }
    return {};
});

// Classe CSS do botão de confirmação
const classeBotaoConfirmar = computed(() => {
    if (props.corBotaoConfirmar === "brand") return "btn-brand-custom text-white";
    return `btn-${props.corBotaoConfirmar}`;
});

// Estilo inline do botão de confirmação quando configurado como brand
const estiloBotaoConfirmar = computed(() => {
    if (props.corBotaoConfirmar === "brand") {
        return {
            backgroundColor: "var(--color-brand, var(--tblr-primary, #206bc4))",
            borderColor: "var(--color-brand, var(--tblr-primary, #206bc4))"
        };
    }
    return {};
});

// Recebe o evento de teclado, não devolve valor e fecha o modal ao pressionar ESC
function aoPressionarTecla(evento: KeyboardEvent) {
    if (evento.key === "Escape" && exibirModal.value && !bloquearEsc.value) {
        cancelarAcao();
    }
}

// Registra e limpa o listener da tecla ESC conforme abertura do modal
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

// Não recebe parâmetros, não devolve valor e fecha o modal ao clicar no fundo escuro
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

// Não recebe parâmetros, não devolve valor e emite o evento de confirmação para o componente pai
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

.modal-status-topo {
    height: 4px;
    width: 100%;
    flex-shrink: 0;
}

.modal-body {
    padding: 20px;
    background: var(--bg-primary, var(--tblr-bg-surface, #ffffff));
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

.modal-titulo-simples {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, var(--tblr-body-color, #1e293b));
}

.modal-descricao-simples {
    font-size: 14px;
    color: var(--text-secondary, var(--tblr-secondary, #64748b));
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid var(--border-light, var(--tblr-border-color, #e6e7e9));
    background: var(--bg-secondary, var(--tblr-bg-surface-secondary, #f8fafc));
    flex-shrink: 0;
}

.btn-brand-custom:hover:not(:disabled) {
    filter: brightness(0.92);
}
</style>