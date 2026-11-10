<!--
========
Componente principal do Mapa Analítico para o Dashboard.
Renderiza o mapa interativo via jsVectorMap com controles de zoom customizados,
interação cruzada entre a tabela de países e o mapa, bandeiras integradas,
legenda em escala logarítmica e tooltip flutuante via Teleport.
========
-->
<template>
  <div class="card card-mapa-analytics">
    <div class="card-header border-0 pb-0">
      <h3 class="card-title fw-bold">{{ props.titulo }}</h3>
    </div>

    <div class="row card-body pt-3 ">
      <div class="col-12 col-lg-7 d-flex flex-column justify-content-between">
        <div class="mapa-wrapper position-relative ">
          <div
            ref="mapContainer"
            class="w-100 h-100 map-custom"
          ></div>

          <div class="controles-zoom-mapa" role="group" aria-label="Controles de zoom do mapa">
            <button
              type="button"
              class="btn-zoom-mapa"
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
              @click="aplicarZoom(true)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5l0 14" />
                <path d="M5 12l14 0" />
              </svg>
            </button>
            <div class="divisor-zoom"></div>
            <button
              type="button"
              class="btn-zoom-mapa"
              title="Diminuir zoom"
              aria-label="Diminuir zoom"
              @click="aplicarZoom(false)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12l14 0" />
              </svg>
            </button>
            <div class="divisor-zoom"></div>
            <button
              type="button"
              class="btn-zoom-mapa"
              title="Resetar visualização"
              aria-label="Resetar visualização"
              @click="resetarVisualizacaoMapa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="dadosLegenda.length > 0" class="mt-3 pt-2">
          <div class="subheader fw-bold mb-2 text-uppercase tracking-wide opacity-75">
            {{ props.tituloLegenda }}
          </div>
          <div class="d-flex align-items-center flex-wrap gap-2">
            <div
              v-for="item in dadosLegenda"
              :key="item.etiqueta"
              class="pilula-legenda d-inline-flex align-items-center"
            >
              <span
                class="legend-color-box"
                :style="{ backgroundColor: item.cor }"
              ></span>
              <span class="ms-2 fw-medium text-nowrap small">
                {{ item.etiqueta }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-5 mt-4 mt-lg-0 d-flex flex-column justify-content-between coluna-tabela-paises">
        <div class="table-responsive">
          <table class="table table-vcenter table-nowrap mb-0">
            <thead>
              <tr>
                <th class="th-custom bold">{{ props.tituloColunaPais }}</th>
                <th class="th-custom bold text-end">{{ props.tituloColunaMetrica }}</th>
              </tr>
            </thead>

            <TransitionGroup
              v-if="dadosPaisesRefinados.length > 0"
              tag="tbody"
              name="list"
            >
              <tr
                v-for="pais in linhasVisiveis"
                :key="pais.codigo"
                class="tr-custom linha-pais-interativa"
                @mouseenter="destacarPaisNoMapa(pais.codigo, true)"
                @mouseleave="destacarPaisNoMapa(pais.codigo, false)"
                @click="focarPaisNoMapa(pais.codigo)"
              >
                <td class="td-custom">
                  <div class="d-flex align-items-center gap-2">
                    <FlagIcon
                      v-if="pais.codigo && !pais.codigo.startsWith('_')"
                      :code="pais.codigo.toLowerCase() as any"
                      size="16"
                      class="rounded-1 shadow-xs flex-shrink-0"
                    />
                    <span class="text-truncate fw-medium">{{ pais.nome }}</span>
                  </div>
                </td>
                <td class="td-custom text-end">
                  <div class="d-inline-flex align-items-baseline justify-content-end gap-2 numero-tabular">
                    <span class="fw-semibold">{{ pais.usuariosAtivos.toLocaleString('pt-BR') }}</span>
                    <span class="text-secondary small percentual-fixo">({{ pais.percentualUsuarios }}%)</span>
                  </div>
                  <div class="container-progress">
                    <span class="progress progress-xs progress-custom">
                      <span
                        class="progress-bar bg-primary"
                        :style="{ width: pais.percentualUsuarios + '%' }"
                      ></span>
                    </span>
                  </div>
                </td>
              </tr>
            </TransitionGroup>

            <tbody v-else>
              <tr>
                <td colspan="2" class="text-center text-secondary py-4">
                  {{ props.textoVazio }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="dadosPaisesRefinados.length > 0"
          class="d-flex justify-content-between align-items-center mt-3 pt-2 text-button-table border-top border-secondary-subtle"
        >
          <div class="text-secondary small">{{ textoDoRodape }}</div>
          <div class="d-flex gap-2">
            <button
              v-if="podeMostrarMenos"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="reiniciarLimite"
            >
              Ver menos
            </button>
            <button
              v-if="existemMaisLinhas"
              type="button"
              class="btn btn-sm btn-primary"
              @click="mostrarMais"
            >
              Ver mais
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport v-if="containerTooltipVue" :to="containerTooltipVue">
      <slot name="tooltip" :dados="dadosTooltipAtivo">
        <TooltipMapaAnalytics
          :dados="dadosTooltipAtivo"
          :rotulo-metrica="props.tituloColunaMetrica"
        />
      </slot>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import jsVectorMap from 'jsvectormap';
import 'jsvectormap/dist/maps/world.js';
import 'jsvectormap/dist/jsvectormap.css';
import FlagIcon from 'vue3-flag-icons';
import 'vue3-flag-icons/styles';
import TooltipMapaAnalytics from './TooltipMapaAnalytics.vue';
import { useListaExpansivel } from '../../composables/useListaExpansivel';
import type {
  EntradaDadosMapa,
  LinhaBrutaAnalytics,
  PaisProcessado,
  ItemLegendaMapa,
  DadosTooltipMapa
} from '../types/map';

// Propriedades de configuração e dados de entrada do componente
const props = withDefaults(defineProps<{
  data: EntradaDadosMapa | LinhaBrutaAnalytics[] | null;
  dateTooltip?: string;
  mapName?: string;
  titulo?: string;
  tituloColunaPais?: string;
  tituloColunaMetrica?: string;
  tituloLegenda?: string;
  textoVazio?: string;
  limiteInicial?: number;
  incremento?: number;
  options?: Record<string, any>;
}>(), {
  dateTooltip: '7daysAgo',
  mapName: 'world',
  titulo: 'Usuários ativos',
  tituloColunaPais: 'País',
  tituloColunaMetrica: 'Usuários ativos',
  tituloLegenda: 'Legenda de Usuários',
  textoVazio: 'Nenhum dado para exibir.',
  limiteInicial: 8,
  incremento: 5,
  options: () => ({ zoomOnScroll: false })
});

// Quantidade de faixas de cores na escala logarítmica
const NUM_BUCKETS = 8;

// Referência ao elemento DOM onde o SVG do mapa é montado
const mapContainer = ref<HTMLElement | null>(null);

// Instância ativa do jsVectorMap
const mapInstance = ref<any>(null);

// Elemento DOM criado dentro do tooltip do jsVectorMap para receber o Teleport do Vue
const containerTooltipVue = ref<HTMLElement | null>(null);

// Observador de redimensionamento do container do mapa
let resizeObserver: ResizeObserver | null = null;

// Estado reativo repassado ao componente de tooltip quando o usuário passa o mouse sobre um país
const dadosTooltipAtivo = reactive<DadosTooltipMapa>({
  codigo: 'br',
  pais: 'Brasil',
  periodo: props.dateTooltip,
  usuariosAtivos: 0
});

// Extrai o array de linhas brutas independentemente do formato de entrada da prop data
const linhasBrutas = computed<LinhaBrutaAnalytics[]>(() => {
  if (!props.data) return [];
  if (Array.isArray(props.data)) return props.data;
  if (Array.isArray(props.data.rows)) return props.data.rows;
  return [];
});

// Dicionário de chaves de escala (scale1 a scale8) mapeadas para tons da cor primária do tema
const coresEscala = computed(() => {
  const cores: Record<string, string> = {};
  for (let i = 1; i <= NUM_BUCKETS; i++) {
    const percentual = 38 + (i - 1) * 8;
    cores[`scale${i}`] = `color-mix(in srgb, var(--tblr-primary, #206bc4) ${percentual}%, white)`;
  }
  return cores;
});

// Filtra países válidos, soma o total de usuários e calcula o percentual de cada país
const dadosPaisesRefinados = computed<PaisProcessado[]>(() => {
  const paisesValidos = linhasBrutas.value.filter(
    (item) => item.dimension_values?.[0] && item.dimension_values[0] !== '(not set)'
  );
  if (paisesValidos.length === 0) return [];

  const totalUsuarios = paisesValidos.reduce(
    (soma, item) => soma + Number(item.metric_values[0]),
    0
  );
  if (totalUsuarios === 0) return [];

  return paisesValidos.map((item) => {
    const ativos = Number(item.metric_values[0]);
    return {
      nome: item.dimension_values[0],
      codigo: String(item.dimension_values[1]).toUpperCase(),
      usuariosAtivos: ativos,
      percentualUsuarios: ((ativos / totalUsuarios) * 100).toFixed(1)
    };
  });
});

// Mapa indexado pelo código ISO em maiúsculo para busca em tempo O(1) ao exibir o tooltip
const mapaPaisesPorCodigo = computed(() => {
  const mapa = new Map<string, PaisProcessado>();
  dadosPaisesRefinados.value.forEach((p) => {
    if (p.codigo) mapa.set(p.codigo.toUpperCase(), p);
  });
  return mapa;
});

const {
  linhasVisiveis,
  existemMaisLinhas,
  podeMostrarMenos,
  textoDoRodape,
  mostrarMais,
  reiniciarLimite
} = useListaExpansivel(dadosPaisesRefinados, props.limiteInicial, props.incremento);

// Gera o objeto values (mapeando código do país para o identificador scaleX) e a lista da legenda
const dadosSerieMapa = computed(() => {
  const dados = dadosPaisesRefinados.value;
  if (!dados || dados.length === 0) return { values: {}, legend: [] as ItemLegendaMapa[] };

  const contagens = dados.map((item) => item.usuariosAtivos).filter((c) => c > 0);
  if (contagens.length === 0) return { values: {}, legend: [] as ItemLegendaMapa[] };

  const maxUsuarios = Math.max(...contagens);
  const logMax = Math.log(Math.max(2, maxUsuarios));

  const values = dados.reduce((acc: Record<string, string>, item) => {
    if (item.usuariosAtivos <= 0) return acc;
    const valorLog = Math.log(item.usuariosAtivos);
    const indiceBucket = Math.ceil((valorLog / logMax) * NUM_BUCKETS);
    acc[item.codigo] = `scale${Math.max(1, indiceBucket)}`;
    return acc;
  }, {});

  const legend: ItemLegendaMapa[] = [];
  let ultimoLimiteSuperior = 0;

  for (let i = 1; i <= NUM_BUCKETS; i++) {
    const limiteInferior = ultimoLimiteSuperior + 1;
    let limiteSuperior = Math.round(Math.exp((i / NUM_BUCKETS) * logMax));
    limiteSuperior = Math.max(limiteSuperior, limiteInferior);

    if (i === NUM_BUCKETS) limiteSuperior = maxUsuarios;
    if (limiteInferior > maxUsuarios || ultimoLimiteSuperior === limiteSuperior) continue;

    legend.push({
      etiqueta: limiteInferior === limiteSuperior ? `${limiteInferior}` : `${limiteInferior} – ${limiteSuperior}`,
      cor: coresEscala.value[`scale${i}`]!
    });
    ultimoLimiteSuperior = limiteSuperior;
  }

  return { values, legend };
});

// Lista de faixas de cores para renderizar a legenda abaixo do mapa
const dadosLegenda = computed(() => dadosSerieMapa.value.legend);

// Recebe um booleano indicando aproximação ou afastamento e aciona a escala suave do jsVectorMap
function aplicarZoom(aproximar: boolean) {
  const mapa = mapInstance.value;
  if (!mapa || typeof mapa._setScale !== 'function') return;
  const passo = mapa.params?.zoomStep || 1.5;
  const novaEscala = aproximar ? mapa.scale * passo : mapa.scale / passo;
  mapa._setScale(novaEscala, mapa._width / 2, mapa._height / 2, false, true);
}

// Restaura o nível de zoom e o posicionamento central padrão do mapa
function resetarVisualizacaoMapa() {
  const mapa = mapInstance.value;
  if (!mapa) return;
  mapa.scale = mapa._baseScale;
  mapa.transX = mapa._baseTransX;
  mapa.transY = mapa._baseTransY;
  mapa._applyTransform?.();
}

// Recebe o código do país e estado de hover da tabela para destacar a região correspondente no SVG
function destacarPaisNoMapa(codigo: string, ativo: boolean) {
  const regiao = mapInstance.value?.regions?.[codigo.toUpperCase()];
  if (regiao?.element) {
    regiao.element.hover(ativo);
  }
}

// Recebe o código do país clicado na tabela e centraliza o foco do mapa sobre ele
function focarPaisNoMapa(codigo: string) {
  const codigoUpper = codigo.toUpperCase();
  if (mapInstance.value?.regions?.[codigoUpper]) {
    mapInstance.value.setFocus({
      region: codigoUpper,
      animate: true
    });
  }
}

// Destrói a instância atual do jsVectorMap e limpa os elementos residuais do DOM
function destruirMapa() {
  containerTooltipVue.value = null;
  if (mapInstance.value) {
    mapInstance.value.destroy();
    mapInstance.value = null;
  }
  if (mapContainer.value) {
    mapContainer.value.innerHTML = '';
  }
}

// Instancia o jsVectorMap vinculando as cores de série e o container reativo do tooltip
function criarMapa() {
  if (!mapContainer.value || !props.mapName) return;

  mapInstance.value = new jsVectorMap({
    selector: mapContainer.value,
    map: props.mapName,
    zoomOnScroll: false,
    zoomButtons: false,
    regionStyle: {
      initial: {
        fill: 'color-mix(in srgb, var(--tblr-body-color, #94a3b8) 22%, var(--tblr-bg-surface, #233044))',
        fillOpacity: 1,
        stroke: 'color-mix(in srgb, var(--tblr-border-color, #ffffff) 10%, transparent)',
        strokeWidth: 0.8,
        strokeOpacity: 1
      },
      hover: {
        fillOpacity: 0.85,
        cursor: 'pointer'
      }
    },
    series: {
      regions: [{
        attribute: 'fill',
        scale: coresEscala.value,
        values: dadosSerieMapa.value.values
      }]
    },
    onLoaded(mapa: any) {
      const elementoTooltip: HTMLElement | undefined = mapa._tooltip?.getElement?.();
      if (elementoTooltip) {
        elementoTooltip.style.backgroundColor = 'transparent';
        elementoTooltip.style.padding = '0';
        elementoTooltip.style.border = 'none';
        elementoTooltip.style.boxShadow = 'none';
        elementoTooltip.style.color = 'inherit';
        elementoTooltip.style.margin = '0';

        const novoContainer = document.createElement('div');
        elementoTooltip.innerHTML = '';
        elementoTooltip.appendChild(novoContainer);
        containerTooltipVue.value = novoContainer;
      }
    },
    onRegionTooltipShow(_event: any, tooltip: any, code: string) {
      const codigoUpper = String(code).toUpperCase();
      const encontrado = mapaPaisesPorCodigo.value.get(codigoUpper);
      const nomeMapa = mapInstance.value?._mapData?.paths?.[codigoUpper]?.name || code;

      dadosTooltipAtivo.codigo = codigoUpper.toLowerCase();
      dadosTooltipAtivo.pais = encontrado?.nome || nomeMapa;
      dadosTooltipAtivo.periodo = props.dateTooltip;
      dadosTooltipAtivo.usuariosAtivos = encontrado?.usuariosAtivos ?? 0;

      const elementoDomTooltip: HTMLElement | undefined = tooltip.getElement?.();
      if (elementoDomTooltip && containerTooltipVue.value && !elementoDomTooltip.contains(containerTooltipVue.value)) {
        elementoDomTooltip.innerHTML = '';
        elementoDomTooltip.appendChild(containerTooltipVue.value);
      }
    },
    ...props.options
  });
}

// Atualiza as dimensões do SVG quando o container sofre alteração de tamanho
function atualizarTamanhoMapa() {
  if (mapInstance.value) mapInstance.value.updateSize();
}

watch(() => props.dateTooltip, (novoPeriodo) => {
  dadosTooltipAtivo.periodo = novoPeriodo;
});

watch([() => props.mapName, () => props.options, dadosPaisesRefinados], () => {
  destruirMapa();
  criarMapa();
}, { deep: true });

onMounted(() => {
  criarMapa();
  if (mapContainer.value) {
    resizeObserver = new ResizeObserver(() => atualizarTamanhoMapa());
    resizeObserver.observe(mapContainer.value);
  }
  window.addEventListener('resize', atualizarTamanhoMapa);
});

onUnmounted(() => {
  destruirMapa();
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  window.removeEventListener('resize', atualizarTamanhoMapa);
});
</script>

<style scoped>
.mapa-wrapper {
  height: 320px;
  border-radius: 8px;
  overflow: hidden;
}

.map-custom {
  width: 100%;
  height: 100%;
}
/* Dock flutuante com mais destaque para não se misturar ao mapa */
.controles-zoom-mapa {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--tblr-bg-surface, #1e293b) 90%, #ffffff 10%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--tblr-border-color, #ffffff) 20%, transparent);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.btn-zoom-mapa {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--tblr-body-color, #f1f5f9);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.btn-zoom-mapa:hover {
  background: color-mix(in srgb, var(--tblr-primary, #206bc4) 28%, transparent);
  color: var(--tblr-primary, #206bc4);
}

.btn-zoom-mapa:active {
  transform: scale(0.92);
}

.divisor-zoom {
  height: 1px;
  width: 100%;
  background: color-mix(in srgb, var(--tblr-border-color, #ffffff) 15%, transparent);
}

/* Pílulas modernas para a legenda */
.pilula-legenda {
  padding: 4px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tblr-body-color, #64748b) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--tblr-border-color, #ffffff) 10%, transparent);
}

.legend-color-box {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.table-responsive {
  overflow-x: auto;
}

.table {
  table-layout: fixed;
  width: 100%;
}

.tr-custom {
  position: relative;
  border: none !important;
  border-color: transparent !important;
}

.linha-pais-interativa {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.linha-pais-interativa:hover {
  background-color: color-mix(in srgb, var(--tblr-primary, #206bc4) 10%, transparent);
}

.td-custom,
.th-custom {
  padding: 9px 10px !important;
  vertical-align: middle;
}

.numero-tabular {
  font-variant-numeric: tabular-nums;
}

.percentual-fixo {
  min-width: 48px;
  text-align: right;
}

.text-button-table {
  padding: 0 10px !important;
}

.progress-custom {
  height: 3px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--tblr-body-color, #64748b) 12%, transparent);
}

.container-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0 10px;
}

.list-enter-active {
  transition: all 0.4s ease;
}

.list-enter-from {
  opacity: 0;
  transform: scaleY(0.4) translateY(-20px);
}

.list-enter-to {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.list-leave-active {
  transition: all 0.3s ease;
}

.list-leave-to {
  opacity: 0;
  transform: scaleY(0.4) translateY(-20px);
}
</style>