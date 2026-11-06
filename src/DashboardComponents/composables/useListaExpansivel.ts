/*
========
Composable para controle de paginação incremental ("Ver mais" e "Ver menos").
Gerencia o fatiamento reativo de listas e os contadores de exibição do rodapé
para tabelas de métricas do dashboard.
========
*/
import { ref, computed, type Ref } from 'vue';

// Recebe a lista completa reativa, o limite inicial e o incremento, devolvendo os itens visíveis e ações de controle
export function useListaExpansivel<T>(
  listaCompleta: Ref<T[]>,
  limiteInicial = 8,
  incremento = 5
) {
  // Quantidade máxima atual de linhas exibidas na tabela
  const limiteDeLinhas = ref(limiteInicial);

  // Subconjunto da lista original cortado até o limite atual
  const linhasVisiveis = computed(() => {
    return listaCompleta.value.slice(0, limiteDeLinhas.value);
  });

  // Indica se existem itens ocultos além do limite atual
  const existemMaisLinhas = computed(() => {
    return linhasVisiveis.value.length < listaCompleta.value.length;
  });

  // Indica se a tabela está expandida além do limite inicial
  const podeMostrarMenos = computed(() => {
    return limiteDeLinhas.value > limiteInicial;
  });

  // Texto descritivo com a contagem atual e total de registros
  const textoDoRodape = computed(() => {
    return `Mostrando ${linhasVisiveis.value.length} de ${listaCompleta.value.length} resultados`;
  });

  // Expande a lista somando o valor de incremento ao limite atual
  const mostrarMais = () => {
    limiteDeLinhas.value += incremento;
  };

  // Retorna a lista para a quantidade inicial de linhas
  const reiniciarLimite = () => {
    limiteDeLinhas.value = limiteInicial;
  };

  return {
    limiteDeLinhas,
    linhasVisiveis,
    existemMaisLinhas,
    podeMostrarMenos,
    textoDoRodape,
    mostrarMais,
    reiniciarLimite
  };
}