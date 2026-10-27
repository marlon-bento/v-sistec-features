declare module '@tabler/core/dist/js/tabler.min.js';
/* Para o typescript conseguir ver os components vue e conseguir exportar eles*/
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}