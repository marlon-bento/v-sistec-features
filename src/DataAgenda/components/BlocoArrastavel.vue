<!--
========
Este arquivo define um componente headless genérico para blocos selecionáveis via clique e arrasto.
Ele não possui estilização fixa e funciona em qualquer tag HTML (como 'td', 'div' ou 'li'),
recebendo o dado que representa, sua coordenada e o controlador de arrasto para funcionar tanto na horizontal quanto na vertical.
========
-->
<script setup lang="ts">
import { computed, watchEffect, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
    tag?: string;
    grupo: string | number;
    indice: number;
    item: any;
    disponivel?: boolean;
    controlador: {
        verificarSelecionado: (grupo: string | number, indice: number) => boolean;
        iniciarArrasto: (grupo: string | number, indice: number, item: any, disponivel: boolean) => void;
        atualizarArrasto: (grupo: string | number, indice: number) => void;
        registrarItemNoMapa: (grupo: string | number, indice: number, item: any, disponivel: boolean) => void;
        removerItemDoMapa: (grupo: string | number, indice: number) => void;
    };
}>(), {
    tag: 'div',
    disponivel: true
});

// Mantém o item registrado no controlador para validação automática de caminho durante o arrasto.
watchEffect(() => {
    props.controlador.registrarItemNoMapa(props.grupo, props.indice, props.item, props.disponivel);
});

onUnmounted(() => {
    props.controlador.removerItemDoMapa(props.grupo, props.indice);
});

// Calcula reativamente se este bloco específico faz parte da seleção de arrasto ativa no momento.
const estaSelecionado = computed(() => {
    return props.controlador.verificarSelecionado(props.grupo, props.indice);
});

// Aciona o início da seleção no controlador ao pressionar o botão do mouse sobre o bloco.
const aoPressionarMouse = () => {
    props.controlador.iniciarArrasto(props.grupo, props.indice, props.item, props.disponivel);
};

// Atualiza o limite final da seleção no controlador quando o cursor entra neste bloco durante o arrasto.
const aoEntrarMouse = () => {
    props.controlador.atualizarArrasto(props.grupo, props.indice);
};
</script>

<template>
  <component
    :is="props.tag"
    @mousedown.prevent="aoPressionarMouse"
    @mouseenter="aoEntrarMouse"
  >
    <slot :esta-selecionado="estaSelecionado" :item="props.item"></slot>
  </component>
</template>