/*
========
Declarações de tipos para módulos externos sem tipagem nativa completa
utilizados pelos componentes de mapa (jsvectormap e vue3-flag-icons).
========
*/
declare module 'jsvectormap' {
  export default class jsVectorMap {
    constructor(options: Record<string, any>);
    public updateSize(): void;
    public destroy(): void;
    public static addMap(name: string, mapData: any): void;
  }
}

declare module 'vue3-flag-icons' {
  import { DefineComponent } from 'vue';
  export const FlagIcon: DefineComponent<{ code: string; size?: string | number }>;
  export default FlagIcon;
}

declare module 'vue3-flag-icons/styles';