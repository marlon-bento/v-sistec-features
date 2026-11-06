/*
========
Definições de tipos para o componente VTabelaProgresso do módulo DashboardComponents.
========
*/

export interface ColunaTabelaProgresso {
  chave: string;
  titulo: string;
  largura?: string;
  alinhamento?: 'start' | 'center' | 'end';
  truncar?: boolean;
  secundario?: boolean;
  monospace?: boolean;
}

export interface LinhaProcessadaTabelaProgresso {
  _idInternoLinha: string;
  _valorMetricaNumerico: number;
  _percentualMetrica: string;
  [chave: string]: any;
}