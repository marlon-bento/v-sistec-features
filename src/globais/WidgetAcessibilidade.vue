<!--
========
Componente flutuante de acessibilidade da biblioteca v-sistec-features.
Renderiza um botao fixo na tela e abre um modal com controles de tamanho de fonte,
alto contraste, escala de cinza, destaque de links e fonte legivel.
========
-->
<template>
  <div class="d-print-none">
    <button
      type="button"
      class="botao-flutuante-acessibilidade"
      :class="classePosicao"
      :style="{ zIndex: props.zIndex }"
      aria-label="Abrir configurações de acessibilidade"
      title="Acessibilidade"
      @click="mostrarModal = true"
    >
      <span v-if="acessibilidade.possuiFiltroAtivo.value" class="indicador-ativo"></span>
      <IconAccessible :size="28" stroke="2.2" />
    </button>

    <ModalBaseDefault
      v-model="mostrarModal"
      tamanho="sm"
      titulo="Acessibilidade"
      texto-cancelar="Fechar"
      :mostrar-botao-confirmar="false"
      @cancelar="fecharModal"
    >
      <div class="d-flex flex-column gap-3">
        <div class="card p-3 bg-light-subtle border">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold text-secondary d-flex align-items-center gap-1">
              <IconTextSize :size="18" />
              Tamanho do Texto
            </span>
            <span class="badge bg-primary text-primary-fg">
              {{ acessibilidade.percentualFonte.value }}%
            </span>
          </div>

          <div class="btn-group w-100" role="group" aria-label="Ajustar tamanho da fonte">
            <button
              type="button"
              class="btn btn-outline-primary fw-bold"
              :disabled="!acessibilidade.podeDiminuir.value"
              @click="acessibilidade.diminuirFonte"
            >
              A- Diminuir
            </button>
            <button
              type="button"
              class="btn btn-outline-primary fw-bold"
              :disabled="!acessibilidade.podeAumentar.value"
              @click="acessibilidade.aumentarFonte"
            >
              A+ Aumentar
            </button>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-6">
            <button
              type="button"
              class="btn w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-bold"
              :class="acessibilidade.altoContraste.value ? 'btn-primary' : 'btn-outline-secondary'"
              @click="acessibilidade.alternarAltoContraste"
            >
              <IconContrast :size="22" />
              <span class="small">Alto Contraste</span>
            </button>
          </div>

          <div class="col-6">
            <button
              type="button"
              class="btn w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-bold"
              :class="acessibilidade.escalaCinza.value ? 'btn-primary' : 'btn-outline-secondary'"
              @click="acessibilidade.alternarEscalaCinza"
            >
              <IconDropletOff :size="22" />
              <span class="small">Escala de Cinza</span>
            </button>
          </div>

          <div class="col-6">
            <button
              type="button"
              class="btn w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-bold"
              :class="acessibilidade.destacarLinks.value ? 'btn-primary' : 'btn-outline-secondary'"
              @click="acessibilidade.alternarDestacarLinks"
            >
              <IconLink :size="22" />
              <span class="small">Destacar Links</span>
            </button>
          </div>

          <div class="col-6">
            <button
              type="button"
              class="btn w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center gap-1 fw-bold"
              :class="acessibilidade.fonteLegivel.value ? 'btn-primary' : 'btn-outline-secondary'"
              @click="acessibilidade.alternarFonteLegivel"
            >
              <IconTypography :size="22" />
              <span class="small">Fonte Legível</span>
            </button>
          </div>
        </div>
      </div>

      <template #botoes-esquerda>
        <button
          type="button"
          class="btn btn-outline-danger fw-bold d-flex align-items-center gap-1"
          :disabled="!acessibilidade.possuiFiltroAtivo.value"
          @click="acessibilidade.restaurarPadroes"
        >
          <IconRefresh :size="16" />
          Restaurar padrão
        </button>
      </template>
    </ModalBaseDefault>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ModalBaseDefault } from "../Modals";
import {
  IconAccessible,
  IconTextSize,
  IconContrast,
  IconDropletOff,
  IconLink,
  IconTypography,
  IconRefresh,
} from "@tabler/icons-vue";
import { useAcessibilidade } from "./useAcessibilidade";

const props = withDefaults(
  defineProps<{
    posicao?: "esquerda" | "direita";
    zIndex?: number;
  }>(),
  {
    posicao: "esquerda",
    zIndex: 1040,
  }
);

// Estado global compartilhado das configuracoes de acessibilidade
const acessibilidade = useAcessibilidade();

// Controla a visibilidade do modal de configuracoes
const mostrarModal = ref(false);

// Define a classe de posicionamento horizontal do botao flutuante
const classePosicao = computed(() =>
  props.posicao === "direita" ? "posicao-direita" : "posicao-esquerda"
);

// Recebe nada, devolve nada; fecha o modal de configuracoes de acessibilidade
function fecharModal() {
  mostrarModal.value = false;
}

onMounted(() => {
  acessibilidade.inicializarAcessibilidade();
});

defineExpose({
  acessibilidade,
  mostrarModal,
  fecharModal,
});
</script>

<style scoped>
.botao-flutuante-acessibilidade {
  position: fixed;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--tblr-primary, #206bc4);
  color: var(--tblr-primary-fg, #ffffff);
  border: 3px solid color-mix(in srgb, var(--tblr-primary, #206bc4) 55%, #ffffff);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.posicao-esquerda {
  left: 24px;
}

.posicao-direita {
  right: 24px;
}

.botao-flutuante-acessibilidade:hover {
  transform: scale(1.08);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.42);
}

.indicador-ativo {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background-color: var(--tblr-success, #2fb344);
  border: 2px solid var(--tblr-bg-surface, #ffffff);
  border-radius: 50%;
}
</style>


<style>
html[data-acessibilidade-contraste="alto"] .modal .btn:not(.btn-primary):not(.btn-outline-danger):hover {
  background-color: #1f1f1f;
  color: #ffff00;
  border-color: #ffff00;
}

html[data-acessibilidade-contraste="alto"] .modal .btn-outline-danger {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

html[data-acessibilidade-contraste="alto"] .modal .btn-outline-danger:hover {
  background-color: #ff6b6b;
  color: #000000;
  border-color: #ff6b6b;
}
</style>