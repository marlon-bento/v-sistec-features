<!--
========
Componente unificado de Carrossel (VCarrossel) para a biblioteca v-sistec-features.
Atende tanto banners rotativos de topo (com autoplay, links e imagens desktop/mobile)
quanto galerias de posts e notícias (imagens e vídeos do YouTube com swipe e tela cheia).
========
-->
<template>
    <div v-if="slidesNormalizados.length > 0" class="v-carrossel-wrapper w-100">
        <div ref="containerCarrosselRef" class="v-carrossel" :class="[
            `v-carrossel--${props.variante}`,
            { 'v-carrossel--arrastando': estaArrastando }
        ]" :style="estiloCarrossel" @mouseenter="pausarHover = true" @mouseleave="aoSairMouseContainer"
            @mousedown="iniciarArrasto" @mousemove="moverArrasto" @mouseup="finalizarArrasto"
            @dragstart.prevent
            @touchstart.passive="iniciarArrastoTouch" @touchmove="moverArrastoTouch" @touchend="finalizarArrasto">
            <div class="v-carrossel__camada-swipe"
                :class="{ 'v-carrossel__camada-swipe--inativa': slideAtualEhVideo || slideAtualTemLink }"></div>

            <BotaoTelaCheia v-if="props.permitirTelaCheia" :em-tela-cheia="emTelaCheia" :style="buttonStyle"
                @alternar="abrirTelaCheia" />

            <button v-if="mostrarSetaAnterior" type="button" class="v-carrossel__seta v-carrossel__seta--anterior"
                aria-label="Slide anterior" @click.stop="irParaAnterior">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 6l-6 6l6 6" />
                </svg>
            </button>

            <button v-if="mostrarSetaProximo" type="button" class="v-carrossel__seta v-carrossel__seta--proximo"
                aria-label="Próximo slide" @click.stop="irParaProximo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 6l6 6l-6 6" />
                </svg>
            </button>

            <div class="v-carrossel__trilho">
                <div v-for="(slide, index) in slidesNormalizados" :key="slide.id" class="v-carrossel__slide"
                    :style="obterEstiloSlide(index, larguraContainer)">
                    <VImagemBlur v-if="slide.tipo === 'imagem'" :src="slide.srcDesktop" :src-mobile="slide.srcMobile"
                        :alt="slide.alt" :href="!arrasteSignificativo ? slide.url : ''" :ajuste="props.ajusteImagem"
                        altura="100%" proporcao="" @load="notificarCarregamento" />

                    <div v-else class="v-carrossel__video-container">
                        <img class="v-carrossel__video-fundo"
                            :src="`https://img.youtube.com/vi/${slide.videoId}/hqdefault.jpg`" alt=""
                            aria-hidden="true" />
                        <div class="v-carrossel__video-pelicula"></div>
                        <iframe class="v-carrossel__iframe" :src="`https://www.youtube.com/embed/${slide.videoId}`"
                            :title="slide.alt || 'YouTube video player'" frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen @load="notificarCarregamento"></iframe>
                    </div>
                </div>
            </div>

            <div v-if="props.mostrarIndicadores && slidesNormalizados.length > 1" class="v-carrossel__indicadores"
                :style="indicadoresStyle">
                <button v-for="(slide, index) in slidesNormalizados" :key="`ind-${slide.id}`" type="button"
                    class="v-carrossel__ponto" :class="{ 'v-carrossel__ponto--ativo': index === indiceAtivo }"
                    :aria-label="`Ir para o slide ${index + 1}`" @click.stop="irParaSlide(index)"></button>
            </div>
        </div>

        <Teleport to="body">
            <Transition name="fade-carrossel-lightbox">
                <div v-if="emTelaCheia" class="v-carrossel-lightbox" role="dialog" aria-modal="true"
                    @click.self="fecharTelaCheia">
                    <div ref="containerLightboxRef" class="v-carrossel-lightbox__palco"
                        :class="{ 'v-carrossel--arrastando': estaArrastando }"
                        @mousedown="iniciarArrasto" @mousemove="moverArrasto" @mouseup="finalizarArrasto"
                        @mouseleave="finalizarArrasto" @dragstart.prevent
                        @touchstart.passive="iniciarArrastoTouch" @touchmove="moverArrastoTouch"
                        @touchend="finalizarArrasto">
                        <BotaoTelaCheia :em-tela-cheia="true" class="v-carrossel-lightbox__fechar"
                            :style="buttonStyle" @alternar="fecharTelaCheia" />

                        <button v-if="mostrarSetaAnterior" type="button"
                            class="v-carrossel__seta v-carrossel__seta--anterior v-carrossel__seta--grande"
                            aria-label="Slide anterior" @click.stop="irParaAnterior">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 6l-6 6l6 6" />
                            </svg>
                        </button>

                        <button v-if="mostrarSetaProximo" type="button"
                            class="v-carrossel__seta v-carrossel__seta--proximo v-carrossel__seta--grande"
                            aria-label="Próximo slide" @click.stop="irParaProximo">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 6l6 6l-6 6" />
                            </svg>
                        </button>

                        <div class="v-carrossel__trilho">
                            <div v-for="(slide, index) in slidesNormalizados" :key="`lb-${slide.id}`"
                                class="v-carrossel__slide" :style="obterEstiloSlide(index, larguraLightbox)">
                                <VImagemBlur v-if="slide.tipo === 'imagem'" :src="slide.srcDesktop" :alt="slide.alt"
                                    ajuste="contain" altura="100%" proporcao="" />
                                <div v-else class="v-carrossel__video-container">
                                    <img class="v-carrossel__video-fundo"
                                        :src="`https://img.youtube.com/vi/${slide.videoId}/hqdefault.jpg`" alt=""
                                        aria-hidden="true" />
                                    <div class="v-carrossel__video-pelicula"></div>
                                    <iframe class="v-carrossel__iframe v-carrossel__iframe--lightbox"
                                        :src="`https://www.youtube.com/embed/${slide.videoId}`"
                                        :title="slide.alt || 'YouTube video player'" frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowfullscreen></iframe>
                                </div>
                            </div>
                        </div>

                        <div v-if="slidesNormalizados.length > 1" class="v-carrossel__indicadores"
                            :style="indicadoresStyle">
                            <button v-for="(slide, index) in slidesNormalizados" :key="`lb-ind-${slide.id}`"
                                type="button" class="v-carrossel__ponto"
                                :class="{ 'v-carrossel__ponto--ativo': index === indiceAtivo }"
                                :aria-label="`Ir para o slide ${index + 1}`" @click.stop="irParaSlide(index)"></button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import VImagemBlur from './VImagemBlur.vue';
import BotaoTelaCheia from './BotaoTelaCheia.vue';
import type { ItemMidiaCarrossel } from '../types/midia';

const props = withDefaults(defineProps<{
    itens?: ItemMidiaCarrossel[];
    carousel_media?: ItemMidiaCarrossel[];
    carousel_data?: ItemMidiaCarrossel[];
    variante?: 'galeria' | 'banner';
    proporcao?: string;
    altura?: string;
    larguraMaxima?: string;
    bordaArredondada?: string;
    ajusteImagem?: 'contain' | 'cover';
    autoplay?: boolean;
    intervaloAutoplay?: number;
    loop?: boolean;
    permitirTelaCheia?: boolean;
    mostrarSetas?: boolean;
    mostrarIndicadores?: boolean;
    transformarUrl?: ((url: string) => string) | null;
}>(), {
    itens: () => [],
    carousel_media: () => [],
    carousel_data: () => [],
    variante: 'galeria',
    proporcao: '',
    altura: '',
    larguraMaxima: '',
    bordaArredondada: '12px',
    ajusteImagem: 'contain',
    autoplay: false,
    intervaloAutoplay: 5000,
    loop: false,
    permitirTelaCheia: false,
    mostrarSetas: true,
    mostrarIndicadores: true,
    transformarUrl: null
});

const emit = defineEmits<{
    (e: 'loaded'): void;
    (e: 'mudar-slide', indice: number): void;
}>();

const containerCarrosselRef = ref<HTMLElement | null>(null);
const containerLightboxRef = ref<HTMLElement | null>(null);

const indiceAtivo = ref(0);
const emTelaCheia = ref(false);

const estaArrastando = ref(false);
const arrasteSignificativo = ref(false);
const posInicialX = ref(0);
const deltaArrastoX = ref(0);

const larguraContainer = ref(1);
const larguraLightbox = ref(1);

const pausarHover = ref(false);
const carregouPrimeiraMidia = ref(false);

let observadorResize: ResizeObserver | null = null;
let timerAutoplay: ReturnType<typeof setInterval> | null = null;

function formatarUrl(url?: string): string {
    if (!url) return '';
    return typeof props.transformarUrl === 'function' ? props.transformarUrl(url) : url;
}

const slidesNormalizados = computed(() => {
    const fonteBruta =
        props.itens?.length ? props.itens :
            props.carousel_media?.length ? props.carousel_media :
                props.carousel_data?.length ? props.carousel_data : [];

    return fonteBruta.map((item, idx) => {
        const ehVideo = item.tipo === 2 || item.tipo === 'video' || item.type === 2 || item.type === '2' || Boolean(item.video_id);
        const urlPrincipal = item.src || item.media || item.image_url || item.media_web || '';
        const urlMobile = item.srcMobile || item.media_mobile || '';

        return {
            id: item.id ?? idx,
            tipo: ehVideo ? ('video' as const) : ('imagem' as const),
            srcDesktop: formatarUrl(urlPrincipal),
            srcMobile: formatarUrl(urlMobile),
            videoId: item.video_id || (ehVideo ? (item.src || item.media || '') : ''),
            url: item.url || '',
            alt: item.alt || item.titulo || `Slide ${idx + 1}`
        };
    });
});

const slideAtualEhVideo = computed(() => {
    return slidesNormalizados.value[indiceAtivo.value]?.tipo === 'video';
});

const slideAtualTemLink = computed(() => {
    return Boolean(slidesNormalizados.value[indiceAtivo.value]?.url);
});

const loopAtivo = computed(() => {
    return props.loop || props.variante === 'banner';
});

const mostrarSetaAnterior = computed(() => {
    if (!props.mostrarSetas || slidesNormalizados.value.length <= 1) return false;
    return loopAtivo.value || indiceAtivo.value > 0;
});

const mostrarSetaProximo = computed(() => {
    if (!props.mostrarSetas || slidesNormalizados.value.length <= 1) return false;
    return loopAtivo.value || indiceAtivo.value < slidesNormalizados.value.length - 1;
});

// Verifica se o usuário está puxando além da borda no 1º ou no último slide
const arrastandoNosExtremos = computed(() => {
    const ehPrimeiroSlide = indiceAtivo.value === 0;
    const ehUltimoSlide = indiceAtivo.value === slidesNormalizados.value.length - 1;

    const alemDoInicio = ehPrimeiroSlide && deltaArrastoX.value > 0;
    const alemDoFim = ehUltimoSlide && deltaArrastoX.value < 0;

    return estaArrastando.value && (alemDoInicio || alemDoFim);
});

// Mantém o botão de tela cheia colado na imagem nos extremos (modo normal e lightbox)
const buttonStyle = computed(() => {
    if (arrastandoNosExtremos.value) {
        return {
            transform: `translate3d(${deltaArrastoX.value}px, 0, 0)`,
            transition: 'none'
        };
    }

    return {
        transform: 'translate3d(0, 0, 0)',
        transition: estaArrastando.value
            ? 'none'
            : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)'
    };
});

// Mantém a barra de indicadores (bolinhas) colada no centro da imagem nos extremos
const indicadoresStyle = computed(() => {
    if (arrastandoNosExtremos.value) {
        return {
            transform: `translate3d(calc(-50% + ${deltaArrastoX.value}px), 0, 0)`,
            transition: 'none'
        };
    }

    return {
        transform: 'translate3d(-50%, 0, 0)',
        transition: estaArrastando.value
            ? 'none'
            : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)'
    };
});

const estiloCarrossel = computed(() => {
    const estilos: Record<string, string> = {
        borderRadius: props.bordaArredondada
    };

    if (props.larguraMaxima) {
        estilos.maxWidth = props.larguraMaxima;
    } else if (props.variante === 'galeria') {
        estilos.maxWidth = '440px';
    }

    if (props.altura) {
        estilos.height = props.altura;
    } else if (props.proporcao) {
        estilos.aspectRatio = props.proporcao;
    } else if (props.variante === 'banner') {
        estilos.height = '300px';
    } else {
        estilos.aspectRatio = '1 / 1';
    }

    return estilos;
});

function obterEstiloSlide(indice: number, larguraBase: number) {
    const deslocamentoBase = (indice - indiceAtivo.value) * 100;
    const percentualArrasto = larguraBase > 0 ? (deltaArrastoX.value / larguraBase) * 100 : 0;
    const translacaoFinal = deslocamentoBase + percentualArrasto;

    return {
        transform: `translate3d(${translacaoFinal}%, 0, 0)`,
        transition: estaArrastando.value
            ? 'none'
            : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)'
    };
}

function irParaProximo() {
    const total = slidesNormalizados.value.length;
    if (total <= 1) return;

    if (indiceAtivo.value < total - 1) {
        indiceAtivo.value++;
    } else if (loopAtivo.value) {
        indiceAtivo.value = 0;
    }
    emit('mudar-slide', indiceAtivo.value);
}

function irParaAnterior() {
    const total = slidesNormalizados.value.length;
    if (total <= 1) return;

    if (indiceAtivo.value > 0) {
        indiceAtivo.value--;
    } else if (loopAtivo.value) {
        indiceAtivo.value = total - 1;
    }
    emit('mudar-slide', indiceAtivo.value);
}

function irParaSlide(indice: number) {
    if (indice >= 0 && indice < slidesNormalizados.value.length) {
        indiceAtivo.value = indice;
        emit('mudar-slide', indice);
    }
}

function atualizarLarguras() {
    if (containerCarrosselRef.value) {
        larguraContainer.value = containerCarrosselRef.value.offsetWidth || 1;
    }
    if (containerLightboxRef.value) {
        larguraLightbox.value = containerLightboxRef.value.offsetWidth || 1;
    }
}

function iniciarArrasto(evento: MouseEvent) {
    if (evento.button !== 0) return;
    const alvo = evento.target as HTMLElement;
    if (alvo.tagName === 'IFRAME' || alvo.closest('button')) return;

    evento.preventDefault();

    atualizarLarguras();
    estaArrastando.value = true;
    arrasteSignificativo.value = false;
    posInicialX.value = evento.clientX;
    deltaArrastoX.value = 0;
}

function moverArrasto(evento: MouseEvent) {
    if (!estaArrastando.value) return;
    deltaArrastoX.value = evento.clientX - posInicialX.value;
    if (Math.abs(deltaArrastoX.value) > 8) {
        arrasteSignificativo.value = true;
    }
}

function iniciarArrastoTouch(evento: TouchEvent) {
    const alvo = evento.target as HTMLElement;
    if (alvo.tagName === 'IFRAME' || alvo.closest('button') || !evento.touches[0]) return;

    atualizarLarguras();
    estaArrastando.value = true;
    arrasteSignificativo.value = false;
    posInicialX.value = evento.touches[0].clientX;
    deltaArrastoX.value = 0;
}

function moverArrastoTouch(evento: TouchEvent) {
    if (!estaArrastando.value || !evento.touches[0]) return;
    const diferencaX = evento.touches[0].clientX - posInicialX.value;
    deltaArrastoX.value = diferencaX;

    if (Math.abs(diferencaX) > 10) {
        arrasteSignificativo.value = true;
        if (evento.cancelable) {
            evento.preventDefault();
        }
    }
}

function finalizarArrasto() {
    if (!estaArrastando.value) return;
    estaArrastando.value = false;

    const larguraReferencia = emTelaCheia.value ? larguraLightbox.value : larguraContainer.value;
    const limiteTroca = Math.min(larguraReferencia * 0.22, 95);

    if (deltaArrastoX.value < -limiteTroca) {
        irParaProximo();
    } else if (deltaArrastoX.value > limiteTroca) {
        irParaAnterior();
    }

    deltaArrastoX.value = 0;
    setTimeout(() => {
        arrasteSignificativo.value = false;
    }, 50);
}

function aoSairMouseContainer() {
    pausarHover.value = false;
    if (estaArrastando.value) {
        finalizarArrasto();
    }
}

function abrirTelaCheia() {
    emTelaCheia.value = true;
    document.body.style.overflow = 'hidden';
    nextTick(() => atualizarLarguras());
}

function fecharTelaCheia() {
    emTelaCheia.value = false;
    document.body.style.overflow = '';
}

function notificarCarregamento() {
    if (!carregouPrimeiraMidia.value) {
        carregouPrimeiraMidia.value = true;
        emit('loaded');
    }
}

function aoPressionarTecla(evento: KeyboardEvent) {
    if (!emTelaCheia.value) return;

    if (evento.key === 'Escape') {
        evento.stopPropagation();
        fecharTelaCheia();
    } else if (evento.key === 'ArrowLeft') {
        evento.stopPropagation();
        irParaAnterior();
    } else if (evento.key === 'ArrowRight') {
        evento.stopPropagation();
        irParaProximo();
    }
}

function configurarAutoplay() {
    pararAutoplay();
    const deveRodar = props.autoplay || props.variante === 'banner';
    if (!deveRodar || slidesNormalizados.value.length <= 1) return;

    timerAutoplay = setInterval(() => {
        if (!pausarHover.value && !estaArrastando.value && !emTelaCheia.value && !slideAtualEhVideo.value) {
            irParaProximo();
        }
    }, props.intervaloAutoplay);
}

function pararAutoplay() {
    if (timerAutoplay) {
        clearInterval(timerAutoplay);
        timerAutoplay = null;
    }
}

watch(slidesNormalizados, () => {
    indiceAtivo.value = 0;
    configurarAutoplay();
});

onMounted(() => {
    atualizarLarguras();
    if (typeof ResizeObserver !== 'undefined' && containerCarrosselRef.value) {
        observadorResize = new ResizeObserver(() => atualizarLarguras());
        observadorResize.observe(containerCarrosselRef.value);
    }
    window.addEventListener('keydown', aoPressionarTecla, true);
    configurarAutoplay();
    nextTick(() => emit('loaded'));
});

onUnmounted(() => {
    pararAutoplay();
    if (observadorResize) {
        observadorResize.disconnect();
        observadorResize = null;
    }
    window.removeEventListener('keydown', aoPressionarTecla, true);
    if (emTelaCheia.value) {
        document.body.style.overflow = '';
    }
});
</script>

<style scoped>
.v-carrossel {
    position: relative;
    width: 100%;
    margin: 0 auto;
    overflow: hidden;
    background-color: var(--tblr-bg-surface, transparent);
    user-select: none;
    cursor: grab;
}

.v-carrossel--arrastando,
.v-carrossel-lightbox__palco.v-carrossel--arrastando {
    cursor: grabbing;
}

.v-carrossel :deep(img),
.v-carrossel-lightbox__palco :deep(img) {
    -webkit-user-drag: none;
    user-select: none;
    pointer-events: none;
}

.v-carrossel__camada-swipe {
    position: absolute;
    inset: 0;
    z-index: 4;
}

.v-carrossel__camada-swipe--inativa {
    pointer-events: none;
}

.v-carrossel__trilho {
    position: relative;
    width: 100%;
    height: 100%;
}

.v-carrossel__slide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    will-change: transform;
}

/* Posiciona o botão de tela cheia absolutamente dentro do carrossel e do lightbox */
.v-carrossel :deep(.botao-tela-cheia) {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 15;
    will-change: transform;
}

.v-carrossel-lightbox__palco :deep(.botao-tela-cheia) {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 15;
    will-change: transform;
}

.v-carrossel__seta {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 12;
    width: 38px;
    height: 38px;
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
    padding: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
    transition: background-color 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.v-carrossel__seta svg {
    width: 22px;
    height: 22px;
}

.v-carrossel__seta--grande {
    width: 48px;
    height: 48px;
}

.v-carrossel__seta--grande svg {
    width: 26px;
    height: 26px;
}

.v-carrossel__seta--anterior {
    left: 12px;
}

.v-carrossel__seta--proximo {
    right: 12px;
}

.v-carrossel__seta:hover {
    background: rgba(15, 23, 42, 0.85);
    border-color: rgba(255, 255, 255, 0.45);
    transform: translateY(-50%) scale(1.08);
}

.v-carrossel__seta:active {
    transform: translateY(-50%) scale(0.95);
}

.v-carrossel__indicadores {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translate3d(-50%, 0, 0);
    will-change: transform;
    z-index: 12;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.v-carrossel__ponto {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    border: none;
    padding: 0;
    background-color: rgba(255, 255, 255, 0.45);
    cursor: pointer;
    transition: width 0.25s ease, background-color 0.25s ease;
}

.v-carrossel__ponto:hover {
    background-color: rgba(255, 255, 255, 0.8);
}

.v-carrossel__ponto--ativo {
    width: 22px;
    background-color: #ffffff;
}

.v-carrossel__video-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.684);
}

.v-carrossel__video-fundo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.4);
    filter: blur(4px);
    opacity: 0.5;
    z-index: 0;
}

.v-carrossel__video-pelicula {
    position: absolute;
    inset: 0;
    background-color: #0000004d;
    z-index: 1;
}

.v-carrossel__iframe {
    position: relative;
    z-index: 2;
    width: 100%;
    max-height: 78%;
    aspect-ratio: 16 / 9;
    border: none;
}

.v-carrossel__iframe--lightbox {
    max-width: 90%;
    max-height: 85%;
}

.v-carrossel-lightbox {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 99999;
    background: rgba(9, 13, 22, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.v-carrossel-lightbox__palco {
    position: relative;
    width: min(92vw, 860px);
    height: min(88vh, 860px);
    border-radius: 14px;
    overflow: hidden;
    background-color: transparent;
    user-select: none;
    cursor: grab;
}

.v-carrossel-lightbox__fechar {
    top: 16px;
    right: 16px;
    width: 42px;
    height: 42px;
}

.fade-carrossel-lightbox-enter-active,
.fade-carrossel-lightbox-leave-active {
    transition: opacity 0.28s ease;
}

.fade-carrossel-lightbox-enter-from,
.fade-carrossel-lightbox-leave-to {
    opacity: 0;
}
</style>