/*
========
Arquivo responsável por converter strings de SVGs puros em componentes funcionais do Vue.
Ele recebe um objeto aninhado contendo strings de SVGs e retorna um espelho desse objeto, mas com as strings substituídas por componentes renderizáveis, preservando classes e atributos dinâmicos, com tipagem genérica mapeada.
========
*/
import { h } from 'vue';
import type { FunctionalComponent, VNode } from 'vue';

const parser = new DOMParser();

/*
Tipo que define a estrutura base de entrada.
Por que é usada: Garante que o objeto passado siga o padrão de chaves contendo strings ou outros objetos.
*/
export type SvgSource = {
  [key: string]: string | SvgSource;
};

/*
Tipo genérico recursivo que espelha a estrutura exata do objeto de entrada.
Por que é usada: Mapeia as chaves literais (como 'search', 'filter') do objeto de origem para que o TypeScript saiba exatamente quais propriedades existem, evitando o erro de propriedades indefinidas.
*/
export type IconTree<T> = {
  [K in keyof T]: T[K] extends string
    ? FunctionalComponent
    : T[K] extends object
    ? IconTree<T[K]>
    : never;
};

/*
Função que converte uma string de SVG em um componente Vue.
Recebe: Uma string (stringSvg) contendo a marcação XML do SVG.
Devolve: Um componente funcional do Vue que renderiza o SVG.
Por que é usada: Permite que SVGs brutos sejam usados diretamente no template do Vue com suporte a atributos dinâmicos.
*/
const stringParaComponente = (stringSvg: string): FunctionalComponent => {
  const doc = parser.parseFromString(stringSvg, 'image/svg+xml');
  const root = doc.documentElement;

  if (root.tagName.toLowerCase() !== 'svg') {
    return () => h('span', {
      style: {
        backgroundColor: 'red',
        color: 'white',
        padding: '2px 4px',
        textAlign: 'center',
      }
    }, 'Icon Error');
  }

  const atributosPadrao: Record<string, string> = {};
  for (const attr of root.attributes) {
    atributosPadrao[attr.name] = attr.value;
  }

  const conteudoInterno = root.innerHTML;

  return (props: any, { attrs }: any): VNode => {
    const classeOriginal = atributosPadrao.class || '';
    const classeRecebida = (attrs.class as string) || ''; 

    const classeCombinada = [classeOriginal, classeRecebida].filter(Boolean).join(' ');

    const { class: _, ...restoPadrao } = atributosPadrao;
    const { class: __, ...restoAttrs } = attrs;

    return h('svg', {
      ...restoPadrao, 
      ...props,
      ...restoAttrs,   
      class: classeCombinada, 
      innerHTML: conteudoInterno
    });
  };
};

/*
Função que constrói a árvore de componentes de ícones dinamicamente.
Recebe: Um objeto genérico (objetoOrigem) contendo as strings de SVGs organizadas.
Devolve: Um objeto com a mesmíssima estrutura da entrada (inferida pelo TypeScript), contendo os componentes funcionais do Vue.
Por que é usada: Processa um dicionário de ícones garantindo o autocompletar exato de cada chave no editor.
*/
export const buildIcons = <T extends Record<string, any>>(objetoOrigem: T): IconTree<T> => {
  const resultado: any = {};

  for (const chave in objetoOrigem) {
    const valor = objetoOrigem[chave];

    if (typeof valor === 'string') {
      resultado[chave] = stringParaComponente(valor);
    } else if (typeof valor === 'object' && valor !== null) {
      resultado[chave] = buildIcons(valor);
    }
  }

  return resultado as IconTree<T>;
};