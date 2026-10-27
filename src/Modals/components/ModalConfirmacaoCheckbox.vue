<!--
========
Modal de segurança com trava de confirmação por checkbox.
Mantém o botão de ação principal desabilitado até que o usuário marque a caixa de verificação,
resetando o estado automaticamente ao abrir.
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
        :fechar-ao-confirmar="fecharAoConfirmar"
        :desabilitar-confirmar="!confirmacaoMarcada || desabilitarConfirmar"
        :carregando="carregando"
        @abriu="emit('abriu')"
        @confirmar="emit('confirmar')"
        @cancelar="emit('cancelar')"
        @fechar="emit('fechar')"
    >
        <template #icone>
            <slot name="icone">
                <IconAlertTriangle
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

        <template v-if="slots.conteudo" #conteudo>
            <slot name="conteudo"></slot>
        </template>

        <template #extra>
            <div class="mt-2 text-start d-inline-block">
                <label class="form-check mb-0 user-select-none cursor-pointer">
                    <input
                        v-model="confirmacaoMarcada"
                        class="form-check-input"
                        type="checkbox"
                        :disabled="carregando"
                    />
                    <span class="form-check-label">
                        <slot name="texto-checkbox">{{ textoCheckbox }}</slot>
                    </span>
                </label>
            </div>
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
import { IconAlertTriangle } from "@tabler/icons-vue";
import ModalDialogoInterno, { type EscopoRodapeModal } from "./interno/ModalDialogoInterno.vue";

// Tipagem dos slots aceitos pelo componente
defineSlots<{
    default?: (props: {}) => any;
    icone?: (props: {}) => any;
    titulo?: (props: {}) => any;
    conteudo?: (props: {}) => any;
    "texto-checkbox"?: (props: {}) => any;
    extra?: (props: {}) => any;
    "botoes-esquerda"?: (props: EscopoRodapeModal) => any;
    "botoes-meio"?: (props: EscopoRodapeModal) => any;
    "botoes-direita"?: (props: EscopoRodapeModal) => any;
    footer?: (props: EscopoRodapeModal) => any;
}>();

// Instância de slots para verificação segura no template
const slots = useSlots();

// Propriedades de configuração do modal com trava de checkbox
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    tamanho: { type: String as () => "sm" | "md" | "lg", default: "sm" },
    corTema: { type: String as () => "danger" | "warning" | "brand", default: "danger" },
    titulo: { type: String, default: "Você tem certeza?" },
    descricao: { type: String, default: "Você realmente deseja deletar este item? Esta ação não pode ser desfeita." },
    textoCheckbox: { type: String, default: "Eu entendo que esta ação não pode ser desfeita" },
    textoCancelar: { type: String, default: "Cancelar" },
    textoConfirmar: { type: String, default: "Deletar" },
    mostrarBotaoCancelar: { type: Boolean, default: true },
    mostrarBotaoConfirmar: { type: Boolean, default: true },
    mostrarBotaoFechar: { type: Boolean, default: true },
    fecharAoClicarFora: { type: Boolean, default: false },
    fecharComEsc: { type: Boolean, default: true },
    fecharAoConfirmar: { type: Boolean, default: false },
    desabilitarConfirmar: { type: Boolean, default: false },
    carregando: { type: Boolean, default: false }
});

// Eventos emitidos para o componente pai
const emit = defineEmits(["update:modelValue", "abriu", "confirmar", "cancelar", "fechar"]);

// Estado reativo que controla se o usuário marcou o checkbox de ciência
const confirmacaoMarcada = ref(false);

// Sincroniza o estado de abertura do modal
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit("update:modelValue", valor)
});

// Desmarca o checkbox sempre que o modal é reaberto
watch(exibirModal, (aberto) => {
    if (aberto) {
        confirmacaoMarcada.value = false;
    }
});
</script>

<style scoped>
.icone-destaque {
    width: 3.5rem;
    height: 3.5rem;
}
</style>