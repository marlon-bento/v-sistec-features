<!--
========
Componente de botão flutuante para alternar o modo de tela cheia (Lightbox).
Possui acabamento translúcido e ícone vetorial com animação suave de expansão e retração.
========
-->
<template>
  <button
    type="button"
    class="botao-tela-cheia"
    :aria-label="props.emTelaCheia ? 'Sair da tela cheia' : 'Expandir para tela cheia'"
    :title="props.emTelaCheia ? 'Minimizar (ESC)' : 'Expandir'"
    @click.stop="alternar"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="icone-expansao"
      :class="{ 'modo-minimizar': props.emTelaCheia }"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      stroke-width="2.2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <g class="seta seta-superior-direita">
        <path d="M16 4h4v4" />
        <path d="M14 10l6 -6" />
      </g>
      <g class="seta seta-inferior-esquerda">
        <path d="M8 20h-4v-4" />
        <path d="M4 20l6 -6" />
      </g>
    </svg>
  </button>
</template>

<script setup lang="ts">
// Propriedade que indica se o componente pai está com o modo tela cheia ativo
const props = withDefaults(defineProps<{
  emTelaCheia?: boolean;
}>(), {
  emTelaCheia: false
});

const emit = defineEmits<{
  (e: 'alternar'): void;
  (e: 'abrir'): void;
  (e: 'fechar'): void;
}>();

// Recebe o clique do usuário e emite os eventos correspondentes ao estado atual
function alternar() {
  emit('alternar');
  if (props.emTelaCheia) {
    emit('fechar');
  } else {
    emit('abrir');
  }
}
</script>

<style scoped>
.botao-tela-cheia {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 15;
  width: 36px;
  height: 36px;
  padding: 6px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.botao-tela-cheia:hover {
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.06);
}

.botao-tela-cheia:active {
  transform: scale(0.95);
}

.icone-expansao {
  width: 100%;
  height: 100%;
}

.seta {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.seta-superior-direita {
  transform-origin: 17px 7px;
}

.seta-inferior-esquerda {
  transform-origin: 7px 17px;
}

.icone-expansao.modo-minimizar .seta {
  transform: rotate(180deg);
}
</style>