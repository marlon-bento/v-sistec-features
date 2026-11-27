/*
========
Composable global para gerenciamento de preferencias de acessibilidade.
Aplica atributos de dados no elemento raiz (html) e persiste as configuracoes
no localStorage para reutilizacao em qualquer aplicacao do SISTEC.
========
*/
import { ref, computed } from "vue";

// Chave padrao utilizada para salvar as preferencias no navegador
const CHAVE_STORAGE = "sistec_acessibilidade";

// Percentual atual do tamanho da fonte da pagina
const percentualFonte = ref<number>(100);

// Estado dos filtros visuais ativos
const altoContraste = ref<boolean>(false);
const escalaCinza = ref<boolean>(false);
const destacarLinks = ref<boolean>(false);
const fonteLegivel = ref<boolean>(false);

// Controla se a inicializacao ja foi executada
let inicializado = false;

// Aplica os atributos de acessibilidade no elemento html e salva o estado atual
function aplicarNoDom() {
  const root = document.documentElement;

  root.style.fontSize = percentualFonte.value === 100 ? "" : `${percentualFonte.value}%`;

  if (altoContraste.value) {
    root.setAttribute("data-acessibilidade-contraste", "alto");
  } else {
    root.removeAttribute("data-acessibilidade-contraste");
  }

  root.setAttribute("data-acessibilidade-cinza", String(escalaCinza.value));
  root.setAttribute("data-acessibilidade-destacar-links", String(destacarLinks.value));
  root.setAttribute("data-acessibilidade-fonte-legivel", String(fonteLegivel.value));

  localStorage.setItem(
    CHAVE_STORAGE,
    JSON.stringify({
      percentualFonte: percentualFonte.value,
      altoContraste: altoContraste.value,
      escalaCinza: escalaCinza.value,
      destacarLinks: destacarLinks.value,
      fonteLegivel: fonteLegivel.value,
    })
  );
}

// Carrega preferencias salvas no localStorage e aplica no DOM
function inicializarAcessibilidade() {
  if (inicializado) return;
  inicializado = true;

  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo) {
      const dados = JSON.parse(salvo);
      percentualFonte.value = Number(dados.percentualFonte) || 100;
      altoContraste.value = Boolean(dados.altoContraste);
      escalaCinza.value = Boolean(dados.escalaCinza);
      destacarLinks.value = Boolean(dados.destacarLinks);
      fonteLegivel.value = Boolean(dados.fonteLegivel);
    }
  } catch {
    restaurarPadroes();
  }

  aplicarNoDom();
}

// Restaura todas as configuracoes de acessibilidade para os valores originais
function restaurarPadroes() {
  percentualFonte.value = 100;
  altoContraste.value = false;
  escalaCinza.value = false;
  destacarLinks.value = false;
  fonteLegivel.value = false;
  aplicarNoDom();
}
function restaurarFontePadrao() {
  percentualFonte.value = 100;
  aplicarNoDom();
}
function restaurarAltoContraste() {
  altoContraste.value = false;
}
function restaurarEscalaCinza() {
  escalaCinza.value = false;
}
function restaurarDestacarLinks() {
  destacarLinks.value = false;
}
function restaurarFonteLegivel() {
  fonteLegivel.value = false;
}
// Constantes padrao de limite de tamanho de fonte
const LIMITE_FONTE_MINIMA_PADRAO = 80;
const LIMITE_FONTE_MAXIMA_PADRAO = 140;
const INCREMENTO_FONTE_PADRAO = 10;
// Exporta o estado reativo e as acoes de controle para os componentes Vue
export function useAcessibilidade(
  limiteFonteMinima: number = LIMITE_FONTE_MINIMA_PADRAO,
  limiteFonteMaxima: number = LIMITE_FONTE_MAXIMA_PADRAO,
  incrementoFonte: number = INCREMENTO_FONTE_PADRAO
) {
  
  const podeAumentar = computed(() => percentualFonte.value < limiteFonteMaxima);
  const podeDiminuir = computed(() => percentualFonte.value > limiteFonteMinima);
  const possuiFiltroAtivo = computed(
    () =>
      percentualFonte.value !== 100 ||
      altoContraste.value ||
      escalaCinza.value ||
      destacarLinks.value ||
      fonteLegivel.value
  );

  // Aumenta o tamanho da fonte em 10% ate o limite maximo
  function aumentarFonte() {
    if (!podeAumentar.value) return;
    percentualFonte.value += incrementoFonte;
    aplicarNoDom();
  }

  // Diminui o tamanho da fonte em 10% ate o limite minimo
  function diminuirFonte() {
    if (!podeDiminuir.value) return;
    percentualFonte.value -= incrementoFonte;
    aplicarNoDom();
  }

  // Alterna o estado do modo de alto contraste
  function alternarAltoContraste() {
    altoContraste.value = !altoContraste.value;
    aplicarNoDom();
  }

  // Alterna o filtro de escala de cinza
  function alternarEscalaCinza() {
    escalaCinza.value = !escalaCinza.value;
    aplicarNoDom();
  }

  // Alterna o destaque visual nos links
  function alternarDestacarLinks() {
    destacarLinks.value = !destacarLinks.value;
    aplicarNoDom();
  }

  // Alterna a tipografia para fonte sem serifa mais espacada
  function alternarFonteLegivel() {
    fonteLegivel.value = !fonteLegivel.value;
    aplicarNoDom();
  }

  return {
    percentualFonte,
    altoContraste,
    escalaCinza,
    destacarLinks,
    fonteLegivel,
    podeAumentar,
    podeDiminuir,
    possuiFiltroAtivo,
    inicializarAcessibilidade,
    restaurarPadroes,
    restaurarFontePadrao,
    restaurarAltoContraste,
    restaurarEscalaCinza,
    restaurarDestacarLinks,
    restaurarFonteLegivel,
    aumentarFonte,
    diminuirFonte,
    alternarAltoContraste,
    alternarEscalaCinza,
    alternarDestacarLinks,
    alternarFonteLegivel,
  };
}