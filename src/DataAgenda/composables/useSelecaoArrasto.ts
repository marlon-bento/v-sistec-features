/*
========
Este arquivo implementa um gerenciador genérico e agnóstico de seleção por arrasto (drag-to-select).
Ele permite selecionar intervalos contínuos de itens em um mesmo eixo (horizontal ou vertical),
validando se há itens desabilitados no caminho e devolvendo a lista de dados selecionados ao final.
========
*/
import { ref, onMounted, onUnmounted } from 'vue';

interface OpcoesSelecaoArrasto<T = any> {
    obterListaDoGrupo?: (grupo: string | number) => T[];
    validarItemDisponivel?: (item: T) => boolean;
    aoFinalizarSelecao?: (dados: {
        grupo: string | number;
        indiceInicial: number;
        indiceFinal: number;
        itensSelecionados: T[];
    }) => void;
    aoClicarItemIndisponivel?: (item: T, grupo: string | number, indice: number) => void;
}

export function useSelecaoArrasto<T = any>(opcoes: OpcoesSelecaoArrasto<T> = {}) {
    const arrastando = ref(false);
    const grupoAtivo = ref<string | number | null>(null);
    const indiceInicio = ref<number | null>(null);
    const indiceFim = ref<number | null>(null);

    const mapaItensRegistrados = new Map<string | number, Map<number, { item: T; disponivel: boolean }>>();

    const registrarItemNoMapa = (grupo: string | number, indice: number, item: T, disponivel: boolean) => {
        if (!mapaItensRegistrados.has(grupo)) {
            mapaItensRegistrados.set(grupo, new Map());
        }
        mapaItensRegistrados.get(grupo)!.set(indice, { item, disponivel });
    };

    const removerItemDoMapa = (grupo: string | number, indice: number) => {
        const submapa = mapaItensRegistrados.get(grupo);
        if (submapa) {
            submapa.delete(indice);
            if (submapa.size === 0) mapaItensRegistrados.delete(grupo);
        }
    };

    const verificarSelecionado = (grupo: string | number, indice: number): boolean => {
        if (!arrastando.value || grupoAtivo.value !== grupo) return false;
        if (indiceInicio.value === null || indiceFim.value === null) return false;
        const menor = Math.min(indiceInicio.value, indiceFim.value);
        const maior = Math.max(indiceInicio.value, indiceFim.value);
        return indice >= menor && indice <= maior;
    };

    const iniciarArrasto = (grupo: string | number, indice: number, item: T, disponivel = true) => {
        const podeSelecionar = opcoes.validarItemDisponivel
            ? opcoes.validarItemDisponivel(item)
            : disponivel;

        if (!podeSelecionar) {
            if (opcoes.aoClicarItemIndisponivel) {
                opcoes.aoClicarItemIndisponivel(item, grupo, indice);
            }
            return;
        }

        arrastando.value = true;
        grupoAtivo.value = grupo;
        indiceInicio.value = indice;
        indiceFim.value = indice;
    };

    const atualizarArrasto = (grupo: string | number, indice: number) => {
        if (!arrastando.value || grupoAtivo.value !== grupo || indiceInicio.value === null) return;

        const menorTentativa = Math.min(indiceInicio.value, indice);
        const maiorTentativa = Math.max(indiceInicio.value, indice);

        if (opcoes.obterListaDoGrupo && opcoes.validarItemDisponivel) {
            const listaGrupo = opcoes.obterListaDoGrupo(grupo);
            for (let i = menorTentativa; i <= maiorTentativa; i++) {
                const itemVerificacao = listaGrupo[i];
                if (!itemVerificacao || !opcoes.validarItemDisponivel(itemVerificacao)) {
                    return;
                }
            }
        } else {
            const submapa = mapaItensRegistrados.get(grupo);
            if (submapa) {
                for (let i = menorTentativa; i <= maiorTentativa; i++) {
                    const registro = submapa.get(i);
                    if (!registro || !registro.disponivel) {
                        return;
                    }
                }
            }
        }

        indiceFim.value = indice;
    };

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

        if (opcoes.obterListaDoGrupo) {
            const listaGrupo = opcoes.obterListaDoGrupo(grupoFinal);
            for (let i = menor; i <= maior; i++) {
                const itemLocalizado = listaGrupo[i];
                // Tipagem forte para garantir ao TS que a conversão é segura.
                if (itemLocalizado !== undefined) {
                    itensSelecionados.push(itemLocalizado as T);
                }
            }
        } else {
            const submapa = mapaItensRegistrados.get(grupoFinal);
            if (submapa) {
                for (let i = menor; i <= maior; i++) {
                    const reg = submapa.get(i);
                    if (reg) itensSelecionados.push(reg.item);
                }
            }
        }

        if (itensSelecionados.length > 0 && opcoes.aoFinalizarSelecao) {
            opcoes.aoFinalizarSelecao({
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