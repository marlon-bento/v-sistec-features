<!--
========
Subcomponente do ModalReserva responsável por exibir o card de resumo do dia/horário
e o painel expansível de ajuste manual de data, hora de início e hora de término.
========
-->
<script setup lang="ts">
defineProps<{
    formReserva: {
        data_inicio: string;
        hora_inicio: string;
        hora_fim: string;
        [key: string]: any;
    };
    editandoEmGrupo: boolean;
    textoDiaSelecionado: string;
    textoIntervaloHorario: string;
    mostrarAjusteHorario: boolean;
}>();

defineEmits<{
    (e: 'alternar-ajuste'): void;
    (e: 'alterado'): void;
}>();
</script>

<template>
  <div class="resumo-horario-box">
    <div class="resumo-horario-textos">
      <span class="resumo-label">
        {{ editandoEmGrupo ? 'Horário do Grupo Recorrente' : 'Período selecionado' }}
      </span>
      <div class="resumo-dia">{{ textoDiaSelecionado }}</div>
      <div class="resumo-horas">{{ textoIntervaloHorario }}</div>
    </div>

    <button
      type="button"
      class="btn-toggle-ajuste"
      @click="$emit('alternar-ajuste')"
    >
      {{ mostrarAjusteHorario ? 'Ocultar ajuste' : 'Ajustar horário' }}
    </button>
  </div>

  <div class="painel-ajuste-horario" v-if="mostrarAjusteHorario">
    <div class="form-group">
      <label>
        Data do Agendamento
        <span v-if="editandoEmGrupo" class="nota-data-bloqueada">
          (Retire do grupo acima para alterar a data)
        </span>
      </label>
      <input
        type="date"
        v-model="formReserva.data_inicio"
        :disabled="editandoEmGrupo"
        @input="$emit('alterado')"
      />
    </div>

    <div class="form-row-lado-a-lado">
      <div class="form-group metade">
        <label>Início</label>
        <input type="time" v-model="formReserva.hora_inicio" @input="$emit('alterado')" />
      </div>

      <div class="form-group metade">
        <label>Fim</label>
        <input type="time" v-model="formReserva.hora_fim" @input="$emit('alterado')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.resumo-horario-box { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 8px; background: var(--bg-secondary); border: 1px solid var(--border-light); flex-shrink: 0; }
.resumo-horario-textos { display: flex; flex-direction: column; gap: 2px; }
.resumo-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-secondary); }
.resumo-dia { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.resumo-horas { font-size: 13px; font-weight: 600; color: var(--color-brand); }
.btn-toggle-ajuste { background: var(--bg-primary); border: 1px solid var(--border-light); color: var(--text-primary); font-weight: 600; font-size: 12.5px; padding: 7px 12px; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.btn-toggle-ajuste:hover { background: var(--bg-hover); border-color: var(--color-brand); color: var(--color-brand); }
.painel-ajuste-horario { display: flex; flex-direction: column; gap: 12px; padding: 12px 14px; border-radius: 8px; background: var(--bg-secondary); border: 1px dashed var(--border-light); flex-shrink: 0; }
.form-row-lado-a-lado { display: flex; flex-direction: row; gap: 12px; }
.metade { flex: 1; min-width: 0; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.nota-data-bloqueada { font-size: 11.5px; color: #d97706; font-weight: 600; margin-left: 4px; }
.form-group input[type="date"],
.form-group input[type="time"] { width: 100%; padding: 10px; border: 1px solid var(--border-light); background: var(--bg-primary); border-radius: 6px; font-size: 14px; color: var(--text-primary); box-sizing: border-box; }
.form-group input:disabled { background-color: var(--bg-secondary); color: var(--text-secondary); cursor: not-allowed; opacity: 0.8; }
</style>