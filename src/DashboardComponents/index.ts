/*
========
Ponto de entrada unificado do módulo DashboardComponents.
========
*/
import VMapaAnalytics from './maps/components/VMapaAnalytics.vue';
import TooltipMapaAnalytics from './maps/components/TooltipMapaAnalytics.vue';
import { useListaExpansivel } from './composables/useListaExpansivel';

export {
  VMapaAnalytics,
  VMapaAnalytics as MapVue,
  TooltipMapaAnalytics,
  useListaExpansivel
};

export * from './maps/types/map';