<!--
========
Componente de botão de fechar padronizado seguindo a identidade visual do ModalReserva.
Pode ser utilizado dentro de cabeçalhos de modais ou posicionado de forma flutuante no canto
superior direito, emitindo o evento de clique quando não estiver desabilitado.
========
-->
<template>
    <button
        type="button"
        class="btn-fechar"
        :class="{ 'btn-fechar-flutuante': flutuante }"
        :title="titulo"
        :aria-label="titulo"
        :disabled="desabilitado"
        @click="aoClicar"
    >
        ×
    </button>
</template>

<script setup lang="ts">
// Propriedades de configuração visual e estado do botão de fechar
const props = defineProps({
    titulo: { type: String, default: "Fechar" },
    desabilitado: { type: Boolean, default: false },
    flutuante: { type: Boolean, default: false }
});

// Evento emitido ao acionar o botão
const emit = defineEmits<{
    (e: "click", evento: MouseEvent): void;
}>();

// Recebe o evento de clique do mouse, não devolve valor e repassa o evento caso o botão esteja ativo
function aoClicar(evento: MouseEvent) {
    if (props.desabilitado) return;
    emit("click", evento);
}
</script>

<style scoped>
.btn-fechar {
    background: transparent;
    border: none;
    font-size: 24px;
    color: var(--text-secondary, var(--tblr-secondary, #64748b));
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease, background-color 0.2s ease;
}

.btn-fechar:hover:not(:disabled) {
    color: var(--text-primary, var(--tblr-body-color, #1e293b));
    background-color: var(--bg-hover, rgba(0, 0, 0, 0.05));
}

.btn-fechar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-fechar-flutuante {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
}
</style>