<!--
========
Subcomponente do ModalReserva que exibe a caixa de ativação de repetição semanal
e o seletor de data limite para agendamentos recorrentes durante a criação.
========
-->
<script setup lang="ts">
defineProps<{
    repetirReserva: boolean;
    formReserva: {
        data_inicio: string;
        hora_inicio: string;
        hora_fim: string;
        data_limite_repeticao: string;
        [key: string]: any;
    };
    nomeDiaSemana: string;
}>();

defineEmits<{
    (e: 'update:repetirReserva', valor: boolean): void;
}>();
</script>

<template>
  <div class="recorrencia-box">
    <label class="recorrencia-toggle">
      <input
        type="checkbox"
        :checked="repetirReserva"
        @change="$emit('update:repetirReserva', ($event.target as HTMLInputElement).checked)"
      />
      <span class="recorrencia-titulo">Repetir agendamento semanalmente</span>
    </label>

    <div class="recorrencia-detalhes" v-if="repetirReserva">
      <div class="form-group">
        <label>Repetir até o dia:</label>
        <input
          type="date"
          v-model="formReserva.data_limite_repeticao"
          :min="formReserva.data_inicio"
        />
      </div>
      <span class="recorrencia-dica">
        O agendamento será replicado toda <strong>{{ nomeDiaSemana }}</strong> das
        <strong>{{ formReserva.hora_inicio }}</strong> às <strong>{{ formReserva.hora_fim }}</strong> até a data selecionada.
      </span>
    </div>
  </div>
</template>

<style scoped>
.recorrencia-box {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    flex-shrink: 0;
}

.recorrencia-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
}

.recorrencia-toggle input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-brand);
    cursor: pointer;
}

.recorrencia-titulo {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-primary);
}

.recorrencia-detalhes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--border-light);
}

.recorrencia-dica {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
}

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

.form-group input[type="date"] {
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

.form-group input[type="date"]:focus {
    border-color: var(--color-brand);
    outline: none;
}
</style>