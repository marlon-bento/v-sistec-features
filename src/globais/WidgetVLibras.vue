<!--
========
Componente responsável por carregar e inicializar o plugin oficial do VLibras.
Injeta o script do governo de forma assíncrona apenas uma vez no documento,
evitando duplicação em aplicações SPA Vue 3.
========
-->
<template>
  <div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

// URL oficial do script e da aplicação base do VLibras
const URL_SCRIPT_VLIBRAS = 'https://vlibras.gov.br/app/vlibras-plugin.js';
const URL_APP_VLIBRAS = 'https://vlibras.gov.br/app';

/*
Função: inicializarWidgetVLibras
Recebe: Nada
Devolve: Nada
Por que é usada: Instancia o widget global do VLibras caso o script já esteja
carregado na janela do navegador.
*/
function inicializarWidgetVLibras() {
  const janela = window as any;
  if (janela.VLibras?.Widget) {
    new janela.VLibras.Widget(URL_APP_VLIBRAS);
  }
}

/*
Função: carregarScriptVLibras
Recebe: Nada
Devolve: Nada
Por que é usada: Garante que o script externo do VLibras seja inserido no DOM
uma única vez e inicializa o widget assim que o carregamento terminar.
*/
function carregarScriptVLibras() {
  const scriptExistente = document.querySelector(`script[src="${URL_SCRIPT_VLIBRAS}"]`);

  if (scriptExistente) {
    inicializarWidgetVLibras();
    return;
  }

  const script = document.createElement('script');
  script.src = URL_SCRIPT_VLIBRAS;
  script.async = true;
  script.onload = inicializarWidgetVLibras;
  document.body.appendChild(script);
}

onMounted(() => {
  carregarScriptVLibras();
});
</script>