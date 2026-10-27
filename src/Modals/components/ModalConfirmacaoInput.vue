<!--
========
Modal de confirmação com entrada de texto ou justificativa integrada.
Permite exigir o preenchimento de um motivo ou palavra-chave exata antes de liberar o botão
de confirmação, emitindo o texto digitado no evento @confirmar.
========
-->
<template>
    <ModalDialogoInterno
        v-model="exibirModal"
        :tamanho="tamanho"
        :cor-topo="corTema"
        :cor-botao-confirmar="corTema"
        :titulo="titulo"
        :descricao="descricao"
        :texto-cancelar="textoCancelar"
        :texto-confirmar="textoConfirmar"
        :mostrar-botao-cancelar="mostrarBotaoCancelar"
        :mostrar-botao-confirmar="mostrarBotaoConfirmar"
        :mostrar-botao-fechar="mostrarBotaoFechar"
        :fechar-ao-clicar-fora="fecharAoClicarFora"
        :fechar-com-esc="fecharComEsc"
        :fechar-ao-confirmar="false"
        :desabilitar-confirmar="botaoDesabilitado"
        :carregando="carregando"
        @abriu="emit('abriu')"
        @confirmar="dispararConfirmacao"
        @cancelar="emit('cancelar')"
        @fechar="emit('fechar')"
    >
        <template #icone>
            <slot name="icone">
                <IconMessageReport
                    class="icon mb-2 icone-destaque"
                    :class="corTema === 'brand' ? '' : `text-${corTema}`"
                    :style="corTema === 'brand' ? { color: 'var(--color-brand, var(--tblr-primary))' } : {}"
                    stroke-width="1.5"
                />
            </slot>
        </template>

        <template v-if="slots.titulo" #titulo>
            <slot name="titulo"></slot>
        </template>

        <template v-if="slots.default" #default>
            <slot></slot>
        </template>

        <template #conteudo>
            <label v-if="rotuloInput" class="form-label fw-medium">
                {{ rotuloInput }}
                <span v-if="obrigatorio" class="text-danger">*</span>
            </label>

            <textarea
                v-if="multiplasLinhas"
                v-model="valorTexto"
                class="form-control"
                :rows="linhasTextarea"
                :placeholder="placeholder"
                :disabled="carregando"
            ></textarea>

            <input
                v-else
                v-model="valorTexto"
                type="text"
                class="form-control"
                :placeholder="placeholder"
                :disabled="carregando"
                @keyup.enter="dispararConfirmacao"
            />

            <small v-if="palavraChaveConfirmacao" class="form-hint mt-1 d-block">
                Digite <strong>{{ palavraChaveConfirmacao }}</strong> para liberar a confirmação.
            </small>

            <slot name="conteudo"></slot>
        </template>

        <template v-if="slots.extra" #extra>
            <slot name="extra"></slot>
        </template>

        <template v-if="slots['botoes-esquerda']" #botoes-esquerda="escopo">
            <slot name="botoes-esquerda" v-bind="escopo"></slot>
        </template>

        <template v-if="slots['botoes-meio']" #botoes-meio="escopo">
            <slot name="botoes-meio" v-bind="escopo"></slot>
        </template>

        <template v-if="slots['botoes-direita']" #botoes-direita="escopo">
            <slot name="botoes-direita" v-bind="escopo"></slot>
        </template>

        <template v-if="slots.footer" #footer="escopo">
            <slot name="footer" v-bind="escopo"></slot>
        </template>
    </ModalDialogoInterno>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots } from "vue";
import { IconMessageReport } from "@tabler/icons-vue";
import ModalDialogoInterno, { type EscopoRodapeModal } from "./interno/ModalDialogoInterno.vue";

// Tipagem dos slots aceitos pelo componente
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

// Instância de slots para verificação segura no template
const slots = useSlots();

// Propriedades de configuração do input e validações do modal
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    tamanho: { type: String as () => "sm" | "md" | "lg", default: "sm" },
    corTema: { type: String as () => "brand" | "danger" | "warning" | "primary", default: "brand" },
    titulo: { type: String, default: "Informe o motivo" },
    descricao: { type: String, default: "" },
    rotuloInput: { type: String, default: "" },
    placeholder: { type: String, default: "Digite aqui..." },
    multiplasLinhas: { type: Boolean, default: false },
    linhasTextarea: { type: Number, default: 3 },
    obrigatorio: { type: Boolean, default: true },
    palavraChaveConfirmacao: { type: String, default: "" },
    limparAoAbrir: { type: Boolean, default: true },
    textoCancelar: { type: String, default: "Cancelar" },
    textoConfirmar: { type: String, default: "Confirmar" },
    mostrarBotaoCancelar: { type: Boolean, default: true },
    mostrarBotaoConfirmar: { type: Boolean, default: true },
    mostrarBotaoFechar: { type: Boolean, default: true },
    fecharAoClicarFora: { type: Boolean, default: false },
    fecharComEsc: { type: Boolean, default: true },
    fecharAoConfirmar: { type: Boolean, default: false },
    carregando: { type: Boolean, default: false }
});

// Eventos emitidos (confirmar envia o texto digitado como parâmetro)
const emit = defineEmits<{
    (e: "update:modelValue", valor: boolean): void;
    (e: "abriu"): void;
    (e: "confirmar", textoDigitado: string): void;
    (e: "cancelar"): void;
    (e: "fechar"): void;
}>();

// Armazena o texto digitado pelo usuário no campo do modal
const valorTexto = ref("");

// Controla a visibilidade do modal
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit("update:modelValue", valor)
});

// Limpa o campo de texto automaticamente ao abrir o modal
watch(exibirModal, (aberto) => {
    if (aberto && props.limparAoAbrir) {
        valorTexto.value = "";
    }
});

// Valida se o botão principal deve ficar desabilitado conforme as regras do input
const botaoDesabilitado = computed(() => {
    const textoLimpo = valorTexto.value.trim();
    if (props.palavraChaveConfirmacao) {
        return textoLimpo !== props.palavraChaveConfirmacao;
    }
    if (props.obrigatorio) {
        return textoLimpo.length === 0;
    }
    return false;
});

// Não recebe parâmetros, não devolve valor e emite o evento confirmar passando o texto preenchido
function dispararConfirmacao() {
    if (botaoDesabilitado.value || props.carregando) return;
    emit("confirmar", valorTexto.value.trim());
    if (props.fecharAoConfirmar) {
        exibirModal.value = false;
    }
}
</script>

<style scoped>
.icone-destaque {
    width: 3.5rem;
    height: 3.5rem;
}
</style>