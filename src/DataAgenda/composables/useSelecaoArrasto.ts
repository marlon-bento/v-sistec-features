/*
========
Este arquivo implementa o gerenciador de seleção contínua por clique e arrasto (drag-to-select).
Valida se todos os blocos no caminho estão disponíveis no mesmo grupo (linha ou coluna) e
devolve a lista ordenada de itens selecionados ao soltar o botão do mouse.
========
*/
import { ref, onMounted, onUnmounted } from 'vue';

interface OpcoesSelecaoArrasto<T = any> {
    aoFinalizarSelecao?: (dados: {
        grupo: string | number;
        indiceInicial: number;
        indiceFinal: number;
        itensSelecionados: T[];
    }) => void;
    aoClicarItemIndisponivel?: (item: T, grupo: string | number, indice: number) => void;
}

// Recebe os callbacks de finalização de seleção e de clique em item ocupado e devolve o controlador de arrasto.
export function useSelecaoArrasto<T = any>(opcoes: OpcoesSelecaoArrasto<T> = {}) {
    // Indica se o usuário está mantendo o botão do mouse pressionado sobre uma grade.
    const arrastando = ref(false);
    // Identifica a linha (recurso) ou coluna (dia) onde o arrasto começou.
    const grupoAtivo = ref<string | number | null>(null);
    // Índice numérico do primeiro bloco clicado.
    const indiceInicio = ref<number | null>(null);
    // Índice numérico do último bloco alcançado pelo cursor.
    const indiceFim = ref<number | null>(null);

    // Mapa interno que armazena os blocos renderizados em cada grupo para checagem de caminho livre.
    const mapaItensRegistrados = new Map<string | number, Map<number, { item: T; disponivel: boolean }>>();

    // Registra ou atualiza os dados e disponibilidade de uma célula no mapa do seu grupo.
    const registrarItemNoMapa = (grupo: string | number, indice: number, item: T, disponivel: boolean) => {
        if (!mapaItensRegistrados.has(grupo)) {
            mapaItensRegistrados.set(grupo, new Map());
        }
        mapaItensRegistrados.get(grupo)!.set(indice, { item, disponivel });
    };

    // Remove uma célula desmontada do mapa de verificação do grupo.
    const removerItemDoMapa = (grupo: string | number, indice: number) => {
        const submapa = mapaItensRegistrados.get(grupo);
        if (submapa) {
            submapa.delete(indice);
            if (submapa.size === 0) mapaItensRegistrados.delete(grupo);
        }
    };

    // Recebe o grupo e o índice da célula e devolve verdadeiro caso ela esteja dentro do intervalo arrastado.
    const verificarSelecionado = (grupo: string | number, indice: number): boolean => {
        if (!arrastando.value || grupoAtivo.value !== grupo) return false;
        if (indiceInicio.value === null || indiceFim.value === null) return false;
        const menor = Math.min(indiceInicio.value, indiceFim.value);
        const maior = Math.max(indiceInicio.value, indiceFim.value);
        return indice >= menor && indice <= maior;
    };

    // Inicia o arrasto se o bloco estiver livre ou dispara a abertura de detalhes caso esteja ocupado.
    const iniciarArrasto = (grupo: string | number, indice: number, item: T, disponivel = true) => {
        if (!disponivel) {
            opcoes.aoClicarItemIndisponivel?.(item, grupo, indice);
            return;
        }

        arrastando.value = true;
        grupoAtivo.value = grupo;
        indiceInicio.value = indice;
        indiceFim.value = indice;
    };

    // Expande a seleção até o novo índice caso todas as células intermediárias do mesmo grupo estejam livres.
    const atualizarArrasto = (grupo: string | number, indice: number) => {
        if (!arrastando.value || grupoAtivo.value !== grupo || indiceInicio.value === null) return;

        const menorTentativa = Math.min(indiceInicio.value, indice);
        const maiorTentativa = Math.max(indiceInicio.value, indice);
        const submapa = mapaItensRegistrados.get(grupo);

        if (submapa) {
            for (let i = menorTentativa; i <= maiorTentativa; i++) {
                const registro = submapa.get(i);
                if (!registro || !registro.disponivel) {
                    return;
                }
            }
        }

        indiceFim.value = indice;
    };

    // Encerra o estado de arrasto ao soltar o mouse e emite a lista ordenada de itens selecionados.
    const finalizarArrasto = () => {
        if (!arrastando.value) return;

        const grupoFinal = grupoAtivo.value;
        const ini = indiceInicio.value;
        const fim = indiceFim.value;

        arrastando.value = false;
        grupoAtivo.value = null;
        indiceInicio.value = null;
        indiceFim.value = null;

        if (grupoFinal === null || ini === null || fim === null) return;

        const menor = Math.min(ini, fim);
        const maior = Math.max(ini, fim);
        const itensSelecionados: T[] = [];
        const submapa = mapaItensRegistrados.get(grupoFinal);

        if (submapa) {
            for (let i = menor; i <= maior; i++) {
                const reg = submapa.get(i);
                if (reg) itensSelecionados.push(reg.item);
            }
        }

        if (itensSelecionados.length > 0) {
            opcoes.aoFinalizarSelecao?.({
                grupo: grupoFinal,
                indiceInicial: menor,
                indiceFinal: maior,
                itensSelecionados
            });
        }
    };

    onMounted(() => {
        window.addEventListener('mouseup', finalizarArrasto);
    });

    onUnmounted(() => {
        window.removeEventListener('mouseup', finalizarArrasto);
    });

    return {
        arrastando,
        grupoAtivo,
        indiceInicio,
        indiceFim,
        verificarSelecionado,
        iniciarArrasto,
        atualizarArrasto,
        finalizarArrasto,
        registrarItemNoMapa,
        removerItemDoMapa
    };
}