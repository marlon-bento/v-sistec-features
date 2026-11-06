/*
========
Definições de tipos do módulo de mapas do Dashboard.
========
*/
export interface LinhaBrutaAnalytics {
  dimension_values: [string, string, ...string[]];
  metric_values: [number | string, ...(number | string)[]];
}

export interface EntradaDadosMapa {
  rows?: LinhaBrutaAnalytics[];
}

export interface PaisProcessado {
  nome: string;
  codigo: string;
  usuariosAtivos: number;
  percentualUsuarios: string;
}

export interface ItemLegendaMapa {
  etiqueta: string;
  cor: string;
}

export interface DadosTooltipMapa {
  codigo: string;
  pais: string;
  periodo: string;
  usuariosAtivos: number;
}