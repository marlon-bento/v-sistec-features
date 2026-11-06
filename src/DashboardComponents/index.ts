/*
========
Ponto de entrada unificado do módulo DashboardComponents.
========
*/
import VMapaAnalytics from './maps/components/VMapaAnalytics.vue';
import TooltipMapaAnalytics from './maps/components/TooltipMapaAnalytics.vue';
import VCardMetrica from './cards/components/VCardMetrica.vue';
import VTabelaProgresso from './tabelas/components/VTabelaProgresso.vue';
import { useListaExpansivel } from './composables/useListaExpansivel';

export {
  VMapaAnalytics,
  VMapaAnalytics as MapVue,
  TooltipMapaAnalytics,
  VCardMetrica,
  VCardMetrica as VKpiCard,
  VTabelaProgresso,
  VTabelaProgresso as VRankingTable,
  useListaExpansivel
};

export * from './maps/types/map';
export * from './cards/types/cardMetrica';
export * from './tabelas/types/tabelaProgresso';