<!--
========
Componente de tabela de métricas com barra de progresso proporcional em cada linha
e paginação incremental ("Ver mais" / "Ver menos") integrada via useListaExpansivel.
========
-->
<template>
  <div class="card card-tabela-progresso h-100 d-flex flex-column justify-content-between">
    <div>
      <div class="card-header border-0 pb-0 d-flex align-items-center justify-content-between gap-2">
        <div>
          <h3 class="card-title fw-bold mb-0">{{ props.titulo }}</h3>
          <div v-if="props.subtitulo" class="text-secondary small mt-1">
            {{ props.subtitulo }}
          </div>
        </div>
        <slot name="acoes-cabecalho"></slot>
      </div>

      <div class="card-body pt-3 pb-2">
        <div class="table-responsive">
          <table class="table table-vcenter table-nowrap mb-0 tabela-progresso-fixa">
            <thead>
              <tr>
                <th
                  v-for="col in props.colunas"
                  :key="col.chave"
                  class="th-custom fw-bold"
                  :class="[
                    col.largura || '',
                    col.alinhamento === 'end' ? 'text-end' : col.alinhamento === 'center' ? 'text-center' : 'text-start',
                    { 'celula-truncada': col.truncar !== false }
                  ]"
                  :title="col.titulo"
                >
                  {{ col.titulo }}
                </th>
                <th class="th-custom fw-bold text-end col-metrica-header" :title="props.tituloColunaMetrica">
                  {{ props.tituloColunaMetrica }}
                </th>
              </tr>
            </thead>

            <TransitionGroup
              v-if="itensProcessados.length > 0"
              tag="tbody"
              name="list"
            >
              <tr
                v-for="(item, indice) in linhasVisiveis"
                :key="item._idInternoLinha"
                class="tr-custom linha-progresso-interativa"
                @click="emit('clicar-linha', item)"
              >
                <td
                  v-for="col in props.colunas"
                  :key="col.chave"
                  class="td-custom"
                  :class="[
                    col.alinhamento === 'end' ? 'text-end' : col.alinhamento === 'center' ? 'text-center' : 'text-start',
                    {
                      'celula-truncada': col.truncar !== false,
                      'text-secondary': col.secundario,
                      'font-monospace small': col.monospace,
                      'fw-medium': !col.secundario
                    }
                  ]"
                  :title="String(item[col.chave] ?? '')"
                >
                  <slot :name="`celula-${col.chave}`" :item="item" :valor="item[col.chave]" :indice="indice">
                    {{ item[col.chave] }}
                  </slot>
                </td>

                <td class="td-custom text-end">
                  <div class="d-inline-flex align-items-baseline justify-content-end gap-2 numero-tabular">
                    <span class="fw-semibold">
                      {{ item._valorMetricaNumerico.toLocaleString('pt-BR') }}
                    </span>
                    <span
                      v-if="props.exibirPercentual"
                      class="text-secondary small percentual-fixo"
                    >
                      ({{ item._percentualMetrica }}%)
                    </span>
                  </div>

                  <div class="container-progress">
                    <span class="progress progress-xs progress-custom">
                      <span
                        class="progress-bar"
                        :class="`bg-${props.corBarra}`"
                        :style="{ width: item._percentualMetrica + '%' }"
                      ></span>
                    </span>
                  </div>
                </td>
              </tr>
            </TransitionGroup>

            <tbody v-else>
              <tr>
                <td :colspan="props.colunas.length + 1" class="text-center text-secondary py-4">
                  {{ props.textoVazio }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="itensProcessados.length > 0"
      class="card-footer bg-transparent d-flex justify-content-between align-items-center py-3 border-top border-secondary-subtle"
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useListaExpansivel } from '../../composables/useListaExpansivel';
import type { ColunaTabelaProgresso, LinhaProcessadaTabelaProgresso } from '../types/tabelaProgresso';

const props = withDefaults(defineProps<{
  dados: Record<string, any>[] | null;
  colunas: ColunaTabelaProgresso[];
  chaveMetrica: string;
  chaveId?: string | ((item: Record<string, any>, indice: number) => string);
  titulo?: string;
  subtitulo?: string;
  tituloColunaMetrica?: string;
  textoVazio?: string;
  limiteInicial?: number;
  incremento?: number;
  exibirPercentual?: boolean;
  corBarra?: string;
  filtrarItem?: ((item: any) => boolean) | null;
}>(), {
  chaveId: undefined,
  titulo: 'Visualizações por Página',
  subtitulo: '',
  tituloColunaMetrica: 'Visualizações',
  textoVazio: 'Nenhum dado para exibir.',
  limiteInicial: 8,
  incremento: 5,
  exibirPercentual: true,
  corBarra: 'primary',
  filtrarItem: null
});

const emit = defineEmits<{
  (e: 'clicar-linha', item: LinhaProcessadaTabelaProgresso): void;
}>();

// Filtra os registros válidos, soma o total da métrica e calcula o percentual de cada linha
const itensProcessados = computed<LinhaProcessadaTabelaProgresso[]>(() => {
  if (!Array.isArray(props.dados) || props.dados.length === 0) return [];

  const listaFiltrada = typeof props.filtrarItem === 'function'
    ? props.dados.filter(props.filtrarItem)
    : props.dados;

  if (listaFiltrada.length === 0) return [];

  const totalMetrica = listaFiltrada.reduce(
    (soma, item) => soma + (Number(item[props.chaveMetrica]) || 0),
    0
  );

  return listaFiltrada.map((item, indice) => {
    const valorNumerico = Number(item[props.chaveMetrica]) || 0;
    const percentual = totalMetrica > 0
      ? ((valorNumerico / totalMetrica) * 100).toFixed(1)
      : '0.0';

    let idUnico: string;
    if (typeof props.chaveId === 'function') {
      idUnico = props.chaveId(item, indice);
    } else if (typeof props.chaveId === 'string' && item[props.chaveId] !== undefined) {
      idUnico = String(item[props.chaveId]);
    } else {
      idUnico = props.colunas.map((c) => String(item[c.chave] ?? '')).join('__') || String(indice);
    }

    return {
      ...item,
      _idInternoLinha: idUnico,
      _valorMetricaNumerico: valorNumerico,
      _percentualMetrica: percentual
    };
  });
});

const {
  linhasVisiveis,
  existemMaisLinhas,
  podeMostrarMenos,
  textoDoRodape,
  mostrarMais,
  reiniciarLimite
} = useListaExpansivel(itensProcessados, props.limiteInicial, props.incremento);
</script>

<style scoped>
.card-tabela-progresso {
  border-radius: 10px;
}

.tabela-progresso-fixa {
  table-layout: fixed;
  width: 100%;
}

.col-metrica-header {
  width: 140px;
}

.celula-truncada {
  max-width: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tr-custom {
  position: relative;
  border: none !important;
  border-color: transparent !important;
}

.linha-progresso-interativa {
  transition: background-color 0.15s ease;
}

.linha-progresso-interativa:hover {
  background-color: color-mix(in srgb, var(--tblr-primary, #206bc4) 8%, transparent);
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