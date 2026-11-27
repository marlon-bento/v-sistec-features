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

// Controla se a inicializacao ja foi executada
let inicializado = false;

// Constantes padrao de limite de tamanho de fonte
const LIMITE_FONTE_MINIMA_PADRAO = 80;
const LIMITE_FONTE_MAXIMA_PADRAO = 140;
const INCREMENTO_FONTE_PADRAO = 10;

// Recebe nada, devolve nada; aplica os atributos no elemento html e salva no localStorage
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

  localStorage.setItem(
    CHAVE_STORAGE,
    JSON.stringify({
      percentualFonte: percentualFonte.value,
      altoContraste: altoContraste.value,
      escalaCinza: escalaCinza.value,
      destacarLinks: destacarLinks.value,
    })
  );
}

// Recebe nada, devolve nada; carrega preferencias salvas no localStorage e aplica no DOM
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
    }
  } catch {
    restaurarPadroes();
  }

  aplicarNoDom();
}

// Recebe nada, devolve nada; restaura todas as configuracoes para os valores originais
function restaurarPadroes() {
  percentualFonte.value = 100;
  altoContraste.value = false;
  escalaCinza.value = false;
  destacarLinks.value = false;
  aplicarNoDom();
}

// Recebe nada, devolve nada; restaura apenas o tamanho da fonte para 100%
function restaurarFontePadrao() {
  percentualFonte.value = 100;
  aplicarNoDom();
}

// Recebe nada, devolve nada; desativa apenas o modo de alto contraste
function restaurarAltoContraste() {
  altoContraste.value = false;
  aplicarNoDom();
}

// Recebe nada, devolve nada; desativa apenas o filtro de escala de cinza
function restaurarEscalaCinza() {
  escalaCinza.value = false;
  aplicarNoDom();
}

// Recebe nada, devolve nada; desativa apenas o destaque visual nos links
function restaurarDestacarLinks() {
  destacarLinks.value = false;
  aplicarNoDom();
}

// Recebe os limites e o passo da fonte, devolve o estado reativo e as acoes de controle
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
      destacarLinks.value
  );

  // Recebe nada, devolve nada; aumenta o tamanho da fonte ate o limite maximo
  function aumentarFonte() {
    if (!podeAumentar.value) return;
    percentualFonte.value += incrementoFonte;
    aplicarNoDom();
  }

  // Recebe nada, devolve nada; diminui o tamanho da fonte ate o limite minimo
  function diminuirFonte() {
    if (!podeDiminuir.value) return;
    percentualFonte.value -= incrementoFonte;
    aplicarNoDom();
  }

  // Recebe nada, devolve nada; alterna o estado do modo de alto contraste
  function alternarAltoContraste() {
    altoContraste.value = !altoContraste.value;
    aplicarNoDom();
  }

  // Recebe nada, devolve nada; alterna o filtro de escala de cinza
  function alternarEscalaCinza() {
    escalaCinza.value = !escalaCinza.value;
    aplicarNoDom();
  }

  // Recebe nada, devolve nada; alterna o destaque visual nos links
  function alternarDestacarLinks() {
    destacarLinks.value = !destacarLinks.value;
    aplicarNoDom();
  }

  return {
    percentualFonte,
    altoContraste,
    escalaCinza,
    destacarLinks,
    podeAumentar,
    podeDiminuir,
    possuiFiltroAtivo,
    inicializarAcessibilidade,
    restaurarPadroes,
    restaurarFontePadrao,
    restaurarAltoContraste,
    restaurarEscalaCinza,
    restaurarDestacarLinks,
    aumentarFonte,
    diminuirFonte,
    alternarAltoContraste,
    alternarEscalaCinza,
    alternarDestacarLinks,
  };
}