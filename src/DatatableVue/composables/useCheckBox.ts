import { ref, watch, computed, type Ref, } from 'vue';
import type { DataTablePropsWithDefaults } from '../types/v-data-table'; // Ajuste o caminho conforme necessário

export function useCheckBox<T extends Record<string, any>>(
    props: DataTablePropsWithDefaults,
    items: Ref<T[]>,
) {
const selectAllCheckbox = ref<HTMLInputElement | null>(null);
const selected_items = ref<T[]>([]) as Ref<T[]>;
// Helper para verificar se um item está selecionado, comparando pela chave única
const isSelected = (item: T): boolean => {
  const key = props.item_key;
  return selected_items.value.some(selectedItem => selectedItem[key] === item[key]);
};

// Controla o estado do checkbox "selecionar todos"
const selectAllState = computed<boolean | 'indeterminate'>(() => {
  if (!items.value.length) return false;
  const selectedOnPageCount = items.value.filter(item => isSelected(item)).length;
  if (selectedOnPageCount === 0) return false;
  if (selectedOnPageCount === items.value.length) return true;
  return 'indeterminate';
});

// computed que mostra se pelo menos um item está selecionado
const atLeastOneSelected = computed<boolean>(() => selected_items.value.length > 0);


// observa o estado e atualiza a propriedade 'indeterminate'
watch([selectAllState, selectAllCheckbox], ([newState]) => {
  if (selectAllCheckbox.value) {
    if (newState === 'indeterminate') {
      // Se o estado for indeterminado:
      selectAllCheckbox.value.checked = false; // Ele não está "marcado"
      selectAllCheckbox.value.indeterminate = true; // Ele está com o "traço"
    } else {
      selectAllCheckbox.value.checked = newState; // Define o estado marcado/desmarcado
      selectAllCheckbox.value.indeterminate = false; // Remove o "traço"
    }
  }
}, {
  immediate: true,
  flush: 'post'
});
// Função para marcar ou desmarcar todos os itens da página atual
function toggleSelectAll(): void {
  const pageItems = items.value;
  if (!pageItems.length) return;

  // Usa a propriedade computada para saber o estado atual
  const currentState = selectAllState.value;

  // Se TODOS ou ALGUNS estiverem selecionados, o clique irá LIMPAR a seleção da página.
  if (currentState === true || currentState === 'indeterminate') {
    const pageItemKeys = pageItems.map(item => item[props.item_key]);
    selected_items.value = selected_items.value.filter(
      selectedItem => !pageItemKeys.includes(selectedItem[props.item_key])
    );
  }
  // Se NENHUM estiver selecionado, o clique irá SELECIONAR TODOS da página.
  else { // currentState é false
    pageItems.forEach(item => {
      if (!isSelected(item)) {
        selected_items.value.push(item);
      }
    });
  }
}

// Função para marcar ou desmarcar um item individual
function toggleItemSelection(item: T): void {
  const key = props.item_key;
  const index = selected_items.value.findIndex(selectedItem => selectedItem[key] === item[key]);

  if (index > -1) {
    selected_items.value.splice(index, 1); // Remove se já existe
  } else {
    selected_items.value.push(item); // Adiciona se não existe
  }
}

    return {
selectAllCheckbox,
selected_items,
 isSelected, selectAllState,
  atLeastOneSelected, toggleSelectAll, toggleItemSelection

    };
}