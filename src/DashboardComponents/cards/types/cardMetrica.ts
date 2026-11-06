/*
========
Definições de tipos para o componente VCardMetrica do módulo DashboardComponents.
========
*/
import type { Component } from 'vue';

export type CorCardMetrica =
  | 'primary'
  | 'azure'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'teal'
  | 'cyan';

export interface ItemCardMetrica {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icone?: Component | null;
  svg?: string;
  cor?: CorCardMetrica;
  textoTooltip?: string;
  variacao?: string | number;
  sentidoVariacao?: 'alta' | 'baixa' | 'neutro';
}