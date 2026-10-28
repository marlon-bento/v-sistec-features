<!--
========
Subcomponente do ModalReserva que exibe a camada sobreposta com a lista de horários
disponíveis na grade para o dia selecionado.
========
-->
<script setup lang="ts">
import { BotaoFechar } from '@/Modals';

defineProps<{
    aberto: boolean;
    horarios: string[];
}>();

defineEmits<{
    (e: 'fechar'): void;
}>();
</script>

<template>
  <div class="horarios-overlay" v-if="aberto">
    <div class="horarios-header">
      <h3>Horários Disponíveis</h3>
      <BotaoFechar titulo="Voltar" @click="$emit('fechar')" />
    </div>
    <div class="horarios-lista-container">
      <ul class="horarios-lista">
        <li v-for="horario in horarios" :key="horario">
          {{ horario }}
        </li>
      </ul>
    </div>
    <div class="horarios-footer">
      <button class="btn-voltar" type="button" @click="$emit('fechar')">Voltar</button>
    </div>
  </div>
</template>

<style scoped>
.horarios-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg-primary); z-index: 10; display: flex; flex-direction: column; overflow: hidden; }
.horarios-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-light); background: var(--bg-primary); flex-shrink: 0; }
.horarios-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 600; }
.horarios-lista-container { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 20px; margin: 0; }
.horarios-lista { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.horarios-lista li { background: var(--bg-secondary); padding: 12px 16px; border-radius: 8px; color: var(--text-primary); font-weight: 500; font-size: 14px; text-align: center; border: 1px solid var(--border-light); }
.horarios-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid var(--border-light); background: var(--bg-secondary); flex-shrink: 0; }
.btn-voltar { background: transparent; border: none; color: var(--color-brand); font-weight: 600; font-size: 14px; cursor: pointer; padding: 8px 16px; border-radius: 6px; }
.btn-voltar:hover { background: var(--color-brand-light); }
</style>