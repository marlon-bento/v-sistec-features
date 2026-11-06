<!--
========
Componente de exibição de imagem com fundo desfocado (efeito Ambilight).
Calibrado com a luminosidade suave original do portal ICEI, herdando a superfície
do card e aplicando desfoque leve sem escurecer excessivamente as bordas.
========
-->
<template>
  <component
    :is="tagRaiz"
    v-bind="atributosLink"
    class="v-imagem-blur"
    :class="{
      'v-imagem-blur--clicavel': Boolean(props.href || props.permitirTelaCheia),
      'v-imagem-blur--zoom-hover': props.zoomNoHover
    }"
    :style="estiloContainer"
    @click="aoClicarContainer"
  >
    <img
      v-if="urlAtiva"
      class="v-imagem-blur__fundo"
      :src="urlAtiva"
      alt=""
      aria-hidden="true"
      loading="lazy"
      :style="estiloFundo"
    />

    <div class="v-imagem-blur__pelicula" :style="estiloPelicula"></div>

    <img
      v-if="urlAtiva"
      class="v-imagem-blur__principal"
      :src="urlAtiva"
      :alt="props.alt"
      :loading="props.carregamento"
      :style="estiloImagemPrincipal"
      @load="aoCarregarImagem"
      @error="aoFalharImagem"
    />

    <BotaoTelaCheia
      v-if="props.permitirTelaCheia && urlAtiva"
      :em-tela-cheia="telaCheiaAtiva"
      @alternar="alternarTelaCheia"
    />

    <slot></slot>

    <Teleport to="body">
      <Transition name="fade-lightbox">
        <div
          v-if="telaCheiaAtiva"
          class="v-imagem-blur__lightbox"
          role="dialog"
          aria-modal="true"
          @click.self="fecharTelaCheia"
        >
          <BotaoTelaCheia
            :em-tela-cheia="true"
            class="botao-lightbox-topo"
            @alternar="fecharTelaCheia"
          />
          <img
            class="v-imagem-blur__lightbox-img"
            :src="urlAtiva"
            :alt="props.alt"
          />
        </div>
      </Transition>
    </Teleport>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import BotaoTelaCheia from './BotaoTelaCheia.vue';

const props = withDefaults(defineProps<{
  src: string;
  srcMobile?: string;
  alt?: string;
  proporcao?: string;
  altura?: string;
  ajuste?: 'contain' | 'cover';
  intensidadeBlur?: number;
  opacidadeFundo?: number;
  escurecimentoFundo?: number;
  escalaFundo?: number;
  larguraMaximaImagem?: string;
  bordaArredondada?: string;
  href?: string;
  target?: string;
  zoomNoHover?: boolean;
  permitirTelaCheia?: boolean;
  breakpointMobile?: number;
  carregamento?: 'lazy' | 'eager';
}>(), {
  srcMobile: '',
  alt: '',
  proporcao: '1 / 1',
  altura: '',
  ajuste: 'contain',
  intensidadeBlur: 4,
  opacidadeFundo: 0.5,
  escurecimentoFundo: 0.3,
  escalaFundo: 1,
  larguraMaximaImagem: '100%',
  bordaArredondada: '0px',
  href: '',
  target: '_blank',
  zoomNoHover: false,
  permitirTelaCheia: false,
  breakpointMobile: 768,
  carregamento: 'lazy'
});

const emit = defineEmits<{
  (e: 'load', evento: Event): void;
  (e: 'error', evento: Event): void;
  (e: 'click', evento: MouseEvent): void;
}>();

// Controla se a viewport atual está abaixo do breakpoint mobile
const ehTelaMobile = ref(false);

// Controla se o modal de tela cheia da imagem está aberto
const telaCheiaAtiva = ref(false);

// Define se a tag raiz será um link <a> ou uma <div> comum
const tagRaiz = computed(() => (props.href ? 'a' : 'div'));

// Atributos HTML aplicados quando o componente funciona como um link
const atributosLink = computed(() => {
  if (!props.href) return {};
  return {
    href: props.href,
    target: props.target,
    rel: props.target === '_blank' ? 'noopener noreferrer' : undefined
  };
});

// Escolhe automaticamente entre a imagem mobile e a desktop conforme a largura da tela
const urlAtiva = computed(() => {
  if (ehTelaMobile.value && props.srcMobile) {
    return props.srcMobile;
  }
  return props.src;
});

// Estilos dinâmicos de dimensão e proporção do container principal
const estiloContainer = computed(() => {
  const estilos: Record<string, string> = {
    borderRadius: props.bordaArredondada
  };
  if (props.altura) {
    estilos.height = props.altura;
    estilos.width = '100%';
  } else if (props.proporcao) {
    estilos.aspectRatio = props.proporcao;
    estilos.width = '100%';
  }
  return estilos;
});

// Estilo do fundo desfocado fiel à calibração original (blur 4px e opacidade 0.5)
const estiloFundo = computed(() => ({
  filter: `blur(${props.intensidadeBlur}px)`,
  opacity: String(props.opacidadeFundo),
  transform: `scale(${props.escalaFundo})`
}));

// Estilo da película intermediária (#0000004d equivale a rgba(0, 0, 0, 0.3))
const estiloPelicula = computed(() => ({
  backgroundColor: `rgba(0, 0, 0, ${props.escurecimentoFundo})`
}));

// Estilo da imagem principal centralizada
const estiloImagemPrincipal = computed(() => ({
  objectFit: props.ajuste,
  maxWidth: props.larguraMaximaImagem
}));

// Verifica o tamanho da janela para alternar entre src e srcMobile
function verificarTamanhoTela() {
  if (typeof window !== 'undefined') {
    ehTelaMobile.value = window.innerWidth < props.breakpointMobile;
  }
}

// Abre a visualização da imagem em tela cheia e bloqueia o scroll da página
function abrirTelaCheia() {
  telaCheiaAtiva.value = true;
  document.body.style.overflow = 'hidden';
}

// Fecha a visualização em tela cheia e restaura o scroll da página
function fecharTelaCheia() {
  telaCheiaAtiva.value = false;
  document.body.style.overflow = '';
}

// Alterna entre abrir e fechar o modo tela cheia
function alternarTelaCheia() {
  if (telaCheiaAtiva.value) {
    fecharTelaCheia();
  } else {
    abrirTelaCheia();
  }
}

// Trata o clique no container principal
function aoClicarContainer(evento: MouseEvent) {
  emit('click', evento);
}

// Repassa o evento de carregamento concluído da imagem principal
function aoCarregarImagem(evento: Event) {
  emit('load', evento);
}

// Repassa o evento de erro de carregamento da imagem principal
function aoFalharImagem(evento: Event) {
  emit('error', evento);
}

// Fecha o lightbox caso o usuário pressione a tecla Escape
function aoPressionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && telaCheiaAtiva.value) {
    fecharTelaCheia();
  }
}

onMounted(() => {
  verificarTamanhoTela();
  window.addEventListener('resize', verificarTamanhoTela, { passive: true });
  window.addEventListener('keydown', aoPressionarTecla);
});

onUnmounted(() => {
  window.removeEventListener('resize', verificarTamanhoTela);
  window.removeEventListener('keydown', aoPressionarTecla);
  if (telaCheiaAtiva.value) {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.v-imagem-blur {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* Usa a superfície do card (branco no light, escuro no dark) igual ao antigo */
  background-color: var(--tblr-bg-surface, transparent);
  user-select: none;
  text-decoration: none;
}

.v-imagem-blur--clicavel {
  cursor: pointer;
}

.v-imagem-blur__fundo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
  transition: transform 0.4s ease;
}

.v-imagem-blur__pelicula {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.v-imagem-blur__principal {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.v-imagem-blur--zoom-hover:hover .v-imagem-blur__principal {
  transform: scale(1.03);
}

.v-imagem-blur--zoom-hover:hover .v-imagem-blur__fundo {
  transform: scale(1.06);
}

.v-imagem-blur__lightbox {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.botao-lightbox-topo {
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
}

.v-imagem-blur__lightbox-img {
  max-width: 92vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.fade-lightbox-enter-active,
.fade-lightbox-leave-active {
  transition: opacity 0.28s ease;
}

.fade-lightbox-enter-from,
.fade-lightbox-leave-to {
  opacity: 0;
}
</style>