<!--
========
Subcomponente do ModalReserva que renderiza os botões de ação do rodapé:
validação de grade, consulta de horários disponíveis, cancelamento e confirmação de salvamento.
========
-->
<script setup lang="ts">
defineProps<{
    precisaValidar: boolean;
    salvando: boolean;
    desvinculando: boolean;
    ehModoEdicao: boolean;
    editandoEmGrupo: boolean;
}>();

defineEmits<{
    (e: 'validar-grade'): void;
    (e: 'ver-horarios'): void;
    (e: 'cancelar'): void;
    (e: 'salvar'): void;
}>();
</script>

<template>
  <div class="acoes-validacao">
    <span class="aviso-validar" v-if="precisaValidar">Valide o horário.</span>
    <button
      class="btn-validar"
      type="button"
      v-if="precisaValidar"
      @click="$emit('validar-grade')"
    >
      Validar Grade
    </button>
    <button
      class="btn-horarios"
      type="button"
      @click="$emit('ver-horarios')"
    >
      Ver Horários
    </button>
  </div>

  <div class="acoes-salvar">
    <button
      class="btn-cancelar"
      type="button"
      @click="$emit('cancelar')"
      :disabled="salvando || desvinculando"
    >
      Cancelar
    </button>
    <button
      class="btn-salvar"
      type="button"
      @click="$emit('salvar')"
      :disabled="salvando || desvinculando || precisaValidar"
    >
      {{
        salvando
          ? 'Salvando...'
          : ehModoEdicao
            ? (editandoEmGrupo ? 'Salvar em Todo o Grupo' : 'Salvar Alterações')
            : 'Salvar'
      }}
    </button>
  </div>
</template>

<style scoped>
.acoes-validacao {
    display: flex;
    align-items: center;
    gap: 10px;
}

.acoes-salvar {
    display: flex;
    gap: 12px;
}

.aviso-validar {
    font-size: 12px;
    color: var(--color-danger);
    font-weight: 600;
}

.btn-validar {
    background: transparent;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-validar:hover {
    background: rgba(239, 68, 68, 0.1);
}

.btn-horarios {
    background: var(--bg-primary);
    border: 1px solid var(--border-light);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-horarios:hover {
    background: var(--bg-hover);
}

.btn-cancelar {
    background: transparent;
    border: none;
    color: var(--color-brand);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-cancelar:hover {
    background: var(--color-brand-light);
}

.btn-salvar {
    background: var(--color-brand);
    border: none;
    color: var(--text-inverse);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 24px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-salvar:hover:not(:disabled) {
    filter: brightness(0.9);
}

.btn-salvar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>

<style>
[data-bs-theme="dark"] .acoes-salvar .btn-salvar,
[data-bs-theme="dark"] .acoes-salvar .btn-cancelar {
    color: #ffffff !important;
    font-weight: bold;
}

[data-bs-theme="dark"] .acoes-salvar .btn-salvar {
    background: color-mix(in srgb, var(--color-brand) 70%, black) !important;
}
</style>