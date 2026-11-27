<!--
========
Componente flutuante de acessibilidade da biblioteca v-sistec-features.
Renderiza um botao fixo circular na tela e abre um modal com controles de tamanho de fonte,
alto contraste, escala de cinza e destaque de links.
========
-->
<template>
  <div class="d-print-none" :class="{ 'd-none': props.naoExibirWidget }">
    <button
      type="button"
      class="botao-flutuante-acessibilidade"
      :class="classePosicao"
      :style="{ zIndex: props.zIndex }"
      aria-label="Abrir configurações de acessibilidade"
      title="Acessibilidade"
      @click="mostrarModal = true"
    >
      <span
        v-if="acessibilidade.possuiFiltroAtivo.value"
        class="indicador-ativo"
        aria-hidden="true"
      ></span>
      <IconAccessible :size="28" stroke="2.2" />
    </button>

    <ModalBaseDefault
      v-model="mostrarModal"
      tamanho="md"
      titulo="Acessibilidade"
      texto-cancelar="Fechar"
      :mostrar-botao-confirmar="false"
      @cancelar="fecharModal"
    >
      <div class="painel-acessibilidade">
        <section class="bloco-controle-fonte" aria-label="Controle de tamanho do texto">
          <div class="cabecalho-bloco-fonte">
            <div class="titulo-bloco-fonte">
              <span class="icone-bloco-fonte" aria-hidden="true">
                <IconTextSize :size="18" />
              </span>
              <span class="texto-bloco-fonte">Tamanho do Texto</span>
            </div>

            <div class="meta-bloco-fonte">
              <button
                v-if="acessibilidade.percentualFonte.value !== 100"
                type="button"
                class="botao-resetar-fonte"
                title="Voltar para 100%"
                @click="acessibilidade.restaurarFontePadrao"
              >
                Resetar
              </button>
              <span class="badge-percentual-fonte">
                {{ acessibilidade.percentualFonte.value }}%
              </span>
            </div>
          </div>

          <div class="trilha-progresso-fonte" aria-hidden="true">
            <div
              class="preenchimento-progresso-fonte"
              :style="{ width: `${progressoFonte}%` }"
            ></div>
          </div>

          <div class="acoes-controle-fonte" role="group" aria-label="Ajustar tamanho da fonte">
            <button
              type="button"
              class="botao-ajuste-fonte"
              :disabled="!acessibilidade.podeDiminuir.value"
              @click="acessibilidade.diminuirFonte"
            >
              A- Diminuir
            </button>
            <button
              type="button"
              class="botao-ajuste-fonte"
              :disabled="!acessibilidade.podeAumentar.value"
              @click="acessibilidade.aumentarFonte"
            >
              A+ Aumentar
            </button>
          </div>
        </section>

        <section class="lista-opcoes-acessibilidade" aria-label="Filtros visuais">
          <button
            type="button"
            class="item-opcao-acessibilidade"
            :class="{ ativo: acessibilidade.altoContraste.value }"
            role="switch"
            :aria-checked="acessibilidade.altoContraste.value"
            @click="acessibilidade.alternarAltoContraste"
          >
            <span class="icone-item-opcao" aria-hidden="true">
              <IconContrast :size="20" />
            </span>
            <span class="conteudo-item-opcao">
              <span class="titulo-item-opcao">Alto Contraste</span>
              <span class="descricao-item-opcao">Aumenta o contraste entre texto e fundo</span>
            </span>
            <span class="interruptor-opcao" aria-hidden="true">
              <span class="bolinha-interruptor"></span>
            </span>
          </button>

          <button
            type="button"
            class="item-opcao-acessibilidade"
            :class="{ ativo: acessibilidade.escalaCinza.value }"
            role="switch"
            :aria-checked="acessibilidade.escalaCinza.value"
            @click="acessibilidade.alternarEscalaCinza"
          >
            <span class="icone-item-opcao" aria-hidden="true">
              <IconDropletOff :size="20" />
            </span>
            <span class="conteudo-item-opcao">
              <span class="titulo-item-opcao">Escala de Cinza</span>
              <span class="descricao-item-opcao">Remove a saturação de cores da página</span>
            </span>
            <span class="interruptor-opcao" aria-hidden="true">
              <span class="bolinha-interruptor"></span>
            </span>
          </button>

          <button
            type="button"
            class="item-opcao-acessibilidade"
            :class="{ ativo: acessibilidade.destacarLinks.value }"
            role="switch"
            :aria-checked="acessibilidade.destacarLinks.value"
            @click="acessibilidade.alternarDestacarLinks"
          >
            <span class="icone-item-opcao" aria-hidden="true">
              <IconLink :size="20" />
            </span>
            <span class="conteudo-item-opcao">
              <span class="titulo-item-opcao">Destacar Links</span>
              <span class="descricao-item-opcao">Sublinha e evidencia links clicáveis</span>
            </span>
            <span class="interruptor-opcao" aria-hidden="true">
              <span class="bolinha-interruptor"></span>
            </span>
          </button>
        </section>
      </div>

      <template #botoes-esquerda>
        <button
          type="button"
          class="botao-restaurar-padrao"
          :disabled="!acessibilidade.possuiFiltroAtivo.value"
          @click="acessibilidade.restaurarPadroes"
        >
          <IconRefresh :size="16" />
          <span>Restaurar padrão</span>
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
  IconRefresh,
} from "@tabler/icons-vue";
import { useAcessibilidade } from "./useAcessibilidade";

const props = withDefaults(
  defineProps<{
    posicao?: "esquerda" | "direita";
    zIndex?: number;
    limiteFonteMinima?: number;
    limiteFonteMaxima?: number;
    incrementoFonte?: number;
    naoExibirWidget?: boolean;
  }>(),
  {
    posicao: "esquerda",
    zIndex: 1040,
    limiteFonteMinima: 80,
    limiteFonteMaxima: 140,
    naoExibirWidget: false,
    incrementoFonte: 10,
  }
);

// Estado global compartilhado das configuracoes de acessibilidade
const acessibilidade = useAcessibilidade(
  props.limiteFonteMinima,
  props.limiteFonteMaxima,
  props.incrementoFonte
);

// Controla a visibilidade do modal de configuracoes
const mostrarModal = ref(false);

// Define a classe de posicionamento horizontal do botao flutuante
const classePosicao = computed(() =>
  props.posicao === "direita" ? "posicao-direita" : "posicao-esquerda"
);

// Calcula o percentual de preenchimento da barra visual do tamanho da fonte
const progressoFonte = computed(() => {
  const intervalo = props.limiteFonteMaxima - props.limiteFonteMinima;
  if (intervalo <= 0) return 0;
  const atual = acessibilidade.percentualFonte.value - props.limiteFonteMinima;
  return Math.min(100, Math.max(0, (atual / intervalo) * 100));
});

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
  background-color: var(--icei-destaque, var(--tblr-primary, #206bc4));
  color: var(--tblr-primary-fg, #ffffff);
  border: 3px solid color-mix(in srgb, var(--icei-destaque, var(--tblr-primary, #206bc4)) 55%, #ffffff);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
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

.painel-acessibilidade {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 14px;
}

.bloco-controle-fonte {
  padding: 14px 16px;
  border-radius: 12px;
  background-color: var(--icei-bg-suave, var(--tblr-bg-surface-secondary, #f8fafc));
  border: 1px solid var(--icei-borda, var(--tblr-border-color, rgba(15, 23, 42, 0.08)));
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cabecalho-bloco-fonte {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.titulo-bloco-fonte {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.icone-bloco-fonte {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--icei-destaque, var(--tblr-primary, #0284c7)) 12%, transparent);
  color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.texto-bloco-fonte {
  font-size: 14px;
  font-weight: 700;
  color: var(--icei-texto-titulo, var(--tblr-body-color, #1d273b));
  white-space: nowrap;
}

.meta-bloco-fonte {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.botao-resetar-fonte {
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--icei-borda-forte, rgba(15, 23, 42, 0.16));
  background: transparent;
  color: var(--icei-texto-secundario, #475569);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.18s ease, color 0.18s ease;
}

.botao-resetar-fonte:hover {
  border-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  color: var(--icei-destaque, var(--tblr-primary, #0284c7));
}

.badge-percentual-fonte {
  padding: 3px 10px;
  border-radius: 999px;
  background-color: var(--icei-primaria, var(--tblr-primary, #1d273b));
  color: var(--tblr-primary-fg, #ffffff);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.trilha-progresso-fonte {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background-color: var(--icei-borda-forte, rgba(15, 23, 42, 0.12));
  overflow: hidden;
}

.preenchimento-progresso-fonte {
  height: 100%;
  border-radius: 999px;
  background-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  transition: width 0.2s ease;
}

.acoes-controle-fonte {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.botao-ajuste-fonte {
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid var(--icei-borda-forte, var(--tblr-border-color, rgba(15, 23, 42, 0.14)));
  background-color: var(--icei-bg-superficie, var(--tblr-bg-surface, #ffffff));
  color: var(--icei-texto-titulo, var(--tblr-body-color, #1d273b));
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.botao-ajuste-fonte:hover:not(:disabled) {
  background-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  border-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  color: #ffffff;
}

.botao-ajuste-fonte:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.lista-opcoes-acessibilidade {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-opcao-acessibilidade {
  width: 100%;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--icei-borda-forte, var(--tblr-border-color, rgba(15, 23, 42, 0.1)));
  background-color: var(--icei-bg-superficie, var(--tblr-bg-surface, #ffffff));
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.item-opcao-acessibilidade:hover {
  border-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  background-color: var(--icei-bg-suave, var(--tblr-bg-surface-secondary, #f8fafc));
}

.item-opcao-acessibilidade.ativo {
  background-color: var(--icei-destaque-fundo, color-mix(in srgb, var(--tblr-primary, #0284c7) 8%, #ffffff));
  border-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
}

.icone-item-opcao {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background-color: var(--icei-bg-elevado, #f1f5f9);
  color: var(--icei-texto-titulo, #1d273b);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.item-opcao-acessibilidade.ativo .icone-item-opcao {
  background-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
  color: #ffffff;
}

.conteudo-item-opcao {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.titulo-item-opcao {
  font-size: 14px;
  font-weight: 700;
  color: var(--icei-texto-titulo, var(--tblr-body-color, #1d273b));
  line-height: 1.25;
}

.descricao-item-opcao {
  font-size: 12px;
  color: var(--icei-texto-suave, #64748b);
  line-height: 1.3;
}

.interruptor-opcao {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  background-color: var(--icei-borda-forte, rgba(15, 23, 42, 0.2));
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.bolinha-interruptor {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: transform 0.2s ease;
}

.item-opcao-acessibilidade.ativo .interruptor-opcao {
  background-color: var(--icei-destaque, var(--tblr-primary, #0284c7));
}

.item-opcao-acessibilidade.ativo .bolinha-interruptor {
  transform: translateX(18px);
}

.botao-restaurar-padrao {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 9px;
  border: 1px solid rgba(220, 38, 38, 0.35);
  background-color: transparent;
  color: #dc2626;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.botao-restaurar-padrao:hover:not(:disabled) {
  background-color: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
}

.botao-restaurar-padrao:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

<style>
html[data-acessibilidade-contraste="alto"] .botao-flutuante-acessibilidade {
  background-color: var(--ac-bg-elevado, #18181d);
  color: var(--ac-texto, #ffffff);
  border: 2px solid var(--ac-texto, #ffffff);
  box-shadow: none;
}

html[data-acessibilidade-contraste="alto"] .botao-flutuante-acessibilidade:hover {
  background-color: var(--ac-foco, #fde047);
  color: var(--ac-texto-inverso, #000000);
  border-color: var(--ac-foco, #fde047);
}

html[data-acessibilidade-contraste="alto"] .bloco-controle-fonte,
html[data-acessibilidade-contraste="alto"] .item-opcao-acessibilidade {
  background-color: var(--ac-bg-superficie, #0e0e11);
  border-color: var(--ac-borda-forte, #a1a1aa);
  box-shadow: none;
}

html[data-acessibilidade-contraste="alto"] .item-opcao-acessibilidade.ativo {
  background-color: var(--ac-bg-elevado, #18181d);
  border-color: var(--ac-foco, #fde047);
}

html[data-acessibilidade-contraste="alto"] .item-opcao-acessibilidade.ativo .icone-item-opcao,
html[data-acessibilidade-contraste="alto"] .badge-percentual-fonte {
  background-color: var(--ac-btn-primario-bg, #ffffff);
  color: var(--ac-btn-primario-texto, #000000);
}

html[data-acessibilidade-contraste="alto"] .item-opcao-acessibilidade.ativo .interruptor-opcao,
html[data-acessibilidade-contraste="alto"] .preenchimento-progresso-fonte {
  background-color: var(--ac-foco, #fde047);
}

html[data-acessibilidade-contraste="alto"] .item-opcao-acessibilidade.ativo .bolinha-interruptor {
  background-color: #000000;
}

html[data-acessibilidade-contraste="alto"] .botao-ajuste-fonte {
  background-color: var(--ac-bg-elevado, #18181d);
  color: var(--ac-texto, #ffffff);
  border-color: var(--ac-borda-forte, #a1a1aa);
}

html[data-acessibilidade-contraste="alto"] .botao-ajuste-fonte:hover:not(:disabled) {
  background-color: var(--ac-foco, #fde047);
  border-color: var(--ac-foco, #fde047);
  color: var(--ac-texto-inverso, #000000);
}

html[data-acessibilidade-contraste="alto"] .botao-restaurar-padrao {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

html[data-acessibilidade-contraste="alto"] .botao-restaurar-padrao:hover:not(:disabled) {
  background-color: #ff6b6b;
  color: #000000;
  border-color: #ff6b6b;
}
</style>