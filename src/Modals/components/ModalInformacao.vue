<!--
========
Modal especializado para comunicados, ajuda e informações gerais (Info).
Por padrão oculta o botão de cancelar e fecha automaticamente ao clicar em Entendi.
========
-->
<template>
    <ModalDialogoInterno
        v-model="exibirModal"
        :tamanho="tamanho"
        :cor-topo="usarCorBrand ? 'brand' : 'info'"
        :cor-botao-confirmar="usarCorBrand ? 'brand' : 'info'"
        :titulo="titulo"
        :descricao="descricao"
        :texto-cancelar="textoCancelar"
        :texto-confirmar="textoConfirmar"
        :mostrar-botao-cancelar="mostrarBotaoCancelar"
        :mostrar-botao-confirmar="mostrarBotaoConfirmar"
        :mostrar-botao-fechar="mostrarBotaoFechar"
        :fechar-ao-clicar-fora="fecharAoClicarFora"
        :fechar-com-esc="fecharComEsc"
        :fechar-ao-confirmar="fecharAoConfirmar"
        :desabilitar-confirmar="desabilitarConfirmar"
        :carregando="carregando"
        @abriu="emit('abriu')"
        @confirmar="emit('confirmar')"
        @cancelar="emit('cancelar')"
        @fechar="emit('fechar')"
    >
        <template #icone>
            <slot name="icone">
                <IconInfoCircle
                    class="icon mb-2 icone-destaque"
                    :class="usarCorBrand ? '' : 'text-info'"
                    :style="usarCorBrand ? { color: 'var(--color-brand, var(--tblr-primary))' } : {}"
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

        <template v-if="slots.conteudo" #conteudo>
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
import { computed, useSlots } from "vue";
import { IconInfoCircle } from "@tabler/icons-vue";
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

// Propriedades de configuração do modal informativo
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    tamanho: { type: String as () => "sm" | "md" | "lg", default: "sm" },
    usarCorBrand: { type: Boolean, default: false },
    titulo: { type: String, default: "Informação" },
    descricao: { type: String, default: "" },
    textoCancelar: { type: String, default: "Fechar" },
    textoConfirmar: { type: String, default: "Entendi" },
    mostrarBotaoCancelar: { type: Boolean, default: false },
    mostrarBotaoConfirmar: { type: Boolean, default: true },
    mostrarBotaoFechar: { type: Boolean, default: true },
    fecharAoClicarFora: { type: Boolean, default: true },
    fecharComEsc: { type: Boolean, default: true },
    fecharAoConfirmar: { type: Boolean, default: true },
    desabilitarConfirmar: { type: Boolean, default: false },
    carregando: { type: Boolean, default: false }
});

// Eventos emitidos para o componente pai
const emit = defineEmits(["update:modelValue", "abriu", "confirmar", "cancelar", "fechar"]);

// Sincroniza o estado de abertura do modal
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit("update:modelValue", valor)
});
</script>

<style scoped>
.icone-destaque {
    width: 3.5rem;
    height: 3.5rem;
}
</style>