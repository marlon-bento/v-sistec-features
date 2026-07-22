/* 
========
Arquivo responsável por armazenar as strings brutas de todos os SVGs utilizados pelo sistema.
Ele exporta um objeto contendo as marcações XML dos ícones para serem processados pela fábrica de componentes.
========
*/

import type { SvgSource } from '@/utils/svgFactory';

/*
Objeto que armazena as strings dos ícones SVG.
Por que é usada: Centraliza os ícones do sistema. Usa o operador 'satisfies' para garantir a integridade estrutural sem perder o autocompletar das chaves literais (search, filter, etc) na tipagem estrita.
*/
export const svgs = {
    search: {
        filter: `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-filter" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z"> </path> </svg>`,
        clear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-x"> <path stroke="none" d="M0 0h24v24H0z" fill="none" /> <path d="M18 6l-12 12" /> <path d="M6 6l12 12" /> </svg>`,
        loupe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"> <path stroke="none" d="M0 0h24v24H0z" fill="none"></path> <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path> <path d="M21 21l-6 -6"></path> </svg>`,
    },
    checkbox: {
        clear :` <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-trash"> <path stroke="none" d="M0 0h24v24H0z" fill="none" /> <path d="M4 7l16 0" /> <path d="M10 11l0 6" /> <path d="M14 11l0 6" /> <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /> <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /> </svg> `,
    },
    expand: {
        arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right icon-transition-arrow"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 6l6 6l-6 6" /></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-transition-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" class="vertical-line" /><path d="M5 12l14 0" /></svg>`,
    },
    ordering: {
        default: ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="m3 8 4-4 4 4"></path> <path d="m11 16-4 4-4-4"></path> <path d="M7 4v16"></path> <path d="M15 8h6"></path> <path d="M15 16h6"></path> <path d="M13 12h8"></path> </svg> `,
        decreasing:` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="m3 16 4 4 4-4"></path> <path d="M7 20V4"></path> <path d="M11 4h10"></path> <path d="M11 8h7"></path> <path d="M11 12h4"></path> </svg> `,
        increasing:` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="m3 8 4-4 4 4"></path> <path d="M7 4v16"></path> <path d="M11 12h4"></path> <path d="M11 16h7"></path> <path d="M11 20h10"></path> </svg> </span> `,
    },
    column_manager: ` <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-columns" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"> <path stroke="none" d="M0 0h24v24H0z" fill="none" /> <path d="M4 6l5.5 0" /> <path d="M4 10l5.5 0" /> <path d="M4 14l5.5 0" /> <path d="M4 18l5.5 0" /> <path d="M14.5 6l5.5 0" /> <path d="M14.5 10l5.5 0" /> <path d="M14.5 14l5.5 0" /> <path d="M14.5 18l5.5 0" /> </svg> `,
} satisfies SvgSource;