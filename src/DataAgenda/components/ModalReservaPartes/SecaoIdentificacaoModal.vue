<!--
========
Subcomponente do ModalReserva responsável por renderizar o campo de título da reserva
e o seletor bloqueado com o nome do recurso vinculado, lendo as configurações de rótulo,
placeholder e obrigatoriedade diretamente do estado global useAgenda.
========
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useAgenda } from '../../composables/useAgenda';

defineProps<{
    formReserva: {
        titulo_reserva: string;
        id_recurso: string | number;
        [key: string]: any;
    };
    recursosDisponiveis: any[];
}>();

const { configEntrada } = useAgenda();

// Calcula o texto do rótulo do campo de título conforme a configuração de obrigatoriedade.
const textoLabelTitulo = computed(() => {
    const base = configEntrada.labelTituloModal || 'Nome da Reserva';
    return configEntrada.tituloObrigatorio ? `${base} *` : `${base} (opcional)`;
});
</script>

<template>
  <div class="form-group" v-if="!configEntrada.ocultarTituloModal">
    <label>{{ textoLabelTitulo }}</label>
    <input
      type="text"
      v-model="formReserva.titulo_reserva"
      :placeholder="configEntrada.placeholderTituloModal || 'Ex: Treinamento'"
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