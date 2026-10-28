<!--
========
Subcomponente do ModalReserva responsável por renderizar o campo de título da reserva
e o seletor bloqueado com o nome do recurso vinculado, consumindo as configurações de rótulo
e obrigatoriedade fornecidas pelo VDataAgenda.
========
-->
<script setup lang="ts">
import { computed, inject } from 'vue';

const props = defineProps<{
    formReserva: {
        titulo_reserva: string;
        id_recurso: string | number;
        [key: string]: any;
    };
    recursosDisponiveis: any[];
    ocultarTituloModal?: boolean;
}>();

const configInjetada = inject<any>('config-modal-agenda', null);

// Calcula o texto do rótulo do campo de título conforme a configuração de obrigatoriedade.
const textoLabelTitulo = computed(() => {
    const base = configInjetada?.value?.labelTituloModal || 'Nome da Reserva';
    const obrigatorio = Boolean(configInjetada?.value?.tituloObrigatorio);
    return obrigatorio ? `${base} *` : `${base} (opcional)`;
});

// Devolve o placeholder configurado para o input de título da reserva.
const textoPlaceholderTitulo = computed(() => {
    return configInjetada?.value?.placeholderTituloModal || 'Ex: Treinamento';
});

// Verifica se o campo de título deve ser ocultado via prop direta ou configuração injetada.
const deveOcultarTitulo = computed(() => {
    return Boolean(props.ocultarTituloModal || configInjetada?.value?.ocultarTituloModal);
});
</script>

<template>
  <div class="form-group" v-if="!deveOcultarTitulo">
    <label>{{ textoLabelTitulo }}</label>
    <input
      type="text"
      v-model="formReserva.titulo_reserva"
      :placeholder="textoPlaceholderTitulo"
      autofocus
    />
  </div>

  <div class="form-group">
    <label>Calendário / Recurso</label>
    <select v-model="formReserva.id_recurso" disabled>
      <option
        v-for="rec in recursosDisponiveis"
        :key="rec.id_recurso"
        :value="rec.id_recurso"
      >
        {{ rec.nome_recurso }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
}

.form-group input[type="text"],
.form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary);
    border-radius: 6px;
    font-size: 14px;
    color: var(--text-primary);
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.form-group input:focus {
    border-color: var(--color-brand);
    outline: none;
}

.form-group select:disabled,
.form-group input:disabled {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    cursor: not-allowed;
    opacity: 0.8;
}
</style>