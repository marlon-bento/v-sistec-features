/*
========
Este arquivo centraliza a paleta de cores dos blocos da agenda e a lógica de escurecimento 
automático no modo noturno (dark theme). 
========
*/
import { useTheme } from '@/iframeCommunicator/useThemeFromParent.ts';

const PALETA_CORES_BLOCOS: string[] = [
    '#FFE0B2', '#C8E6C9', '#BBDEFB', '#E1BEE7', '#F8BBD0',
    '#FFF59D', '#B2EBF2', '#FFCCBC', '#D1C4E9', '#DCEDC8'
];

const PALETA_BORDAS_BLOCOS: string[] = [
    '#DF9A00', '#5C9E31', '#4A89C7', '#8E24AA', '#D81B60',
    '#F9A825', '#0097A7', '#E64A19', '#5E35B1', '#689F38'
];

export function useCoresAgenda() {
    const { theme } = useTheme();

    // Recebe o índice numérico do bloco e devolve a cor de fundo e de borda correspondentes,
    // aplicando automaticamente a mistura (color-mix) com preto caso o tema atual seja 'dark'.
    const obterCoresBloco = (indiceBloco: number) => {
        const corFundoBase = PALETA_CORES_BLOCOS[indiceBloco % PALETA_CORES_BLOCOS.length] ?? '#FFE0B2';
        const corBordaBase = PALETA_BORDAS_BLOCOS[indiceBloco % PALETA_BORDAS_BLOCOS.length] ?? '#DF9A00';

        const corFundo = theme.value === 'dark' 
            ? `color-mix(in srgb, ${corFundoBase} 20%, black)` 
            : corFundoBase;
            
        const corBorda = theme.value === 'dark' 
            ? `color-mix(in srgb, ${corBordaBase} 40%, black)` 
            : corBordaBase;

        return { corFundo, corBorda };
    };

    return { obterCoresBloco, theme };
}