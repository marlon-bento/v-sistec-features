<!--
========
Componente de modal base padrão para formulários, tabelas e conteúdos extensos.
Segue a arquitetura e estilização do ModalReserva utilizando Vue e Tabler, com cabeçalho,
botão de fechar padronizado, barra de status superior, rodapé customizável e evento @abriu.
========
-->
<template>
    <Teleport to="body">
        <div
            v-if="exibirModal"
            :id="id ? String(id) : undefined"
            class="modal-overlay"
            @mousedown.self="aoClicarFora"
        >
            <div
                class="modal-card"
                :class="`modal-tamanho-${tamanhoCalculado}`"
                role="dialog"
                aria-modal="true"
            >
                <div
                    v-if="corBarraTopo"
                    class="modal-status-topo"
                    :class="classeStatusTopo"
                    :style="estiloStatusTopo"
                ></div>
                <slot name="barrinha-header"></slot>

                <div v-if="!ocultarCabecalho" class="modal-header">
                    <h3 class="modal-title">
                        <slot name="title-header">{{ titulo }}</slot>
                    </h3>
                    <BotaoFechar
                        v-if="mostrarBotaoFechar"
                        :desabilitado="carregando"
                        @click="cancelarAcao"
                    />
                </div>

                <div class="modal-body" :class="classeCorpo">
                    <slot></slot>
                    <slot name="conteudo"></slot>
                    <slot name="content"></slot>
                </div>

                <div v-if="!ocultarRodape" class="modal-footer">
                    <slot name="footer" :fechar="cancelarAcao" :confirmar="confirmarAcao">
                        <button
                            v-if="mostrarBotaoCancelar"
                            type="button"
                            class="btn-cancelar-base"
                            :disabled="carregando"
                            @click="cancelarAcao"
                        >
                            {{ textoCancelar }}
                        </button>

                        <div class="acoes-direita-base">
                            <slot name="botoes-esquerda" :fechar="cancelarAcao" :confirmar="confirmarAcao"></slot>

                            <button
                                v-if="mostrarBotaoConfirmar"
                                type="button"
                                class="btn"
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

                            <slot name="botoes-direita" :fechar="cancelarAcao" :confirmar="confirmarAcao"></slot>
                        </div>
                    </slot>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted } from "vue";
import BotaoFechar from "./BotaoFechar.vue";

// Tipagem explícita dos slots do ModalBaseDefault
defineSlots<{
    default?: (props: {}) => any;
    "barrinha-header"?: (props: {}) => any;
    "title-header"?: (props: {}) => any;
    conteudo?: (props: {}) => any;
    content?: (props: {}) => any;
    "botoes-esquerda"?: (props: { fechar: () => void; confirmar: () => void }) => any;
    "botoes-direita"?: (props: { fechar: () => void; confirmar: () => void }) => any;
    footer?: (props: { fechar: () => void; confirmar: () => void }) => any;
}>();

// Propriedades de configuração do modal padrão
const props = defineProps({
    id: { type: [String, Number], default: undefined },
    modelValue: { type: Boolean, default: false },
    size: { type: String as () => "sm" | "md" | "lg" | "xl", default: "lg" },
    tamanho: { type: String as () => "sm" | "md" | "lg" | "xl", default: undefined },
    titulo: { type: String, default: "" },
    corBarraTopo: {
        type: String as () => "brand" | "danger" | "success" | "warning" | "info" | "primary" | "",
        default: "brand"
    },
    textoCancelar: { type: String, default: "Fechar" },
    textoConfirmar: { type: String, default: "Salvar alterações" },
    corBotaoConfirmar: {
        type: String as () => "brand" | "primary" | "danger" | "success" | "warning",
        default: "brand"
    },
    mostrarBotaoCancelar: { type: Boolean, default: true },
    mostrarBotaoConfirmar: { type: Boolean, default: true },
    mostrarBotaoFechar: { type: Boolean, default: true },
    ocultarCabecalho: { type: Boolean, default: false },
    ocultarRodape: { type: Boolean, default: false },
    fecharAoClicarFora: { type: Boolean, default: true },
    fecharComEsc: { type: Boolean, default: true },
    fecharAoConfirmar: { type: Boolean, default: false },
    desabilitarConfirmar: { type: Boolean, default: false },
    carregando: { type: Boolean, default: false },
    classeCorpo: { type: String, default: "" }
});

// Emissores de eventos para controle externo
const emit = defineEmits(["update:modelValue", "abriu", "confirmar", "cancelar", "fechar"]);

// Resolve o tamanho priorizando a propriedade em português
const tamanhoCalculado = computed(() => props.tamanho || props.size);

// Sincroniza o estado de abertura do modal com o componente pai
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit("update:modelValue", valor)
});

// Calcula o bloqueio de clique fora do modal
const bloquearCliqueFora = computed(() => !props.fecharAoClicarFora || props.carregando);

// Calcula o bloqueio da tecla ESC
const bloquearEsc = computed(() => !props.fecharComEsc || props.carregando);

// Retorna a classe da barra de topo caso não seja brand
const classeStatusTopo = computed(() => {
    if (!props.corBarraTopo || props.corBarraTopo === "brand") return "";
    return `bg-${props.corBarraTopo}`;
});

// Retorna o estilo inline para barra de topo com var(--color-brand)
const estiloStatusTopo = computed(() => {
    if (props.corBarraTopo === "brand") {
        return { backgroundColor: "var(--color-brand, var(--tblr-primary, #206bc4))" };
    }
    return {};
});

// Retorna a classe do botão de confirmação
const classeBotaoConfirmar = computed(() => {
    if (props.corBotaoConfirmar === "brand") return "btn-salvar-base";
    return `btn-${props.corBotaoConfirmar}`;
});

// Retorna o estilo inline do botão de confirmação quando configurado como brand
const estiloBotaoConfirmar = computed(() => {
    if (props.corBotaoConfirmar === "brand") {
        return {
            backgroundColor: "var(--color-brand, var(--tblr-primary, #206bc4))",
            color: "var(--text-inverse, #ffffff)"
        };
    }
    return {};
});

// Recebe o evento de teclado, não devolve valor e fecha o modal se a tecla for ESC
function aoPressionarTecla(evento: KeyboardEvent) {
    if (evento.key === "Escape" && exibirModal.value && !bloquearEsc.value) {
        cancelarAcao();
    }
}

// Monitora o estado de abertura para disparar @abriu e ativar ou remover o evento de teclado
watch(
    exibirModal,
    (aberto) => {
        if (aberto) {
            emit("abriu");
        }
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

// Não recebe parâmetros, não devolve valor e fecha o modal emitindo os eventos de cancelamento e fechamento
function cancelarAcao() {
    if (props.carregando) return;
    exibirModal.value = false;
    emit("cancelar");
    emit("fechar");
}

// Não recebe parâmetros, não devolve valor e emite o evento de confirmação do modal
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

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light, var(--tblr-border-color, #e6e7e9));
    background: var(--bg-primary, var(--tblr-bg-surface, #ffffff));
    flex-shrink: 0;
}

.modal-title {
    margin: 0;
    font-size: 16px;
    color: var(--text-primary, var(--tblr-body-color, #1e293b));
    font-weight: 600;
}

.modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: var(--bg-primary, var(--tblr-bg-surface, #ffffff));
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-light, var(--tblr-border-color, #e6e7e9));
    background: var(--bg-secondary, var(--tblr-bg-surface-secondary, #f8fafc));
    flex-shrink: 0;
}

.acoes-direita-base {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-left: auto;
}

.btn-cancelar-base {
    background: transparent;
    border: none;
    color: var(--color-brand, var(--tblr-primary, #206bc4));
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-cancelar-base:hover:not(:disabled) {
    background: var(--color-brand-light, rgba(32, 107, 196, 0.1));
}

.btn-cancelar-base:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-salvar-base {
    border: none;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 24px;
    border-radius: 6px;
    transition: filter 0.2s;
}

.btn-salvar-base:hover:not(:disabled) {
    filter: brightness(0.9);
}

.btn-salvar-base:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>