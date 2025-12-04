import { ref, nextTick } from 'vue';

export function useExpandedItem(
    close_expanded_item_on_expand_new: boolean,
    item_key: string,
    deactivate_animation_expand?: boolean,
    scroll_to_expanded_item?: boolean
) {
    const expanded_items = ref<any[]>([]);

    function close_all_expanded_items() {
        expanded_items.value = [];
    }

    function is_item_expanded(item: any): boolean {
        const identifier_item = item[item_key];
        return expanded_items.value.some((expandedItem: any) => expandedItem === identifier_item);
    }

    function expand_item_toggle(item: any): void {
        const identifier_item = item[item_key];

        // 1. Verificamos se já existe
        const index = expanded_items.value.findIndex((expandedItem: any) => expandedItem === identifier_item);
        const is_already_expanded = index > -1;

        // 2. Lógica para fechar o item expandido ao abrir um novo
        if (close_expanded_item_on_expand_new) {
            close_all_expanded_items();

            if (!is_already_expanded) {
                expanded_items.value.push(identifier_item);
                if (scroll_to_expanded_item){
                    scrollToExpadedItem(identifier_item);
                }
            }
        }
        // 3. Lógica padrão (multiplos)
        else {
            if (is_already_expanded) {
                expanded_items.value.splice(index, 1);
            } else {
                expanded_items.value.push(identifier_item);
                if (scroll_to_expanded_item){
                    scrollToExpadedItem(identifier_item);
                }
                
            }
        }
    }
    function scrollToExpadedItem(identifier_item: any): void {
        nextTick(() => {
            if (deactivate_animation_expand) {

                const rowElements: HTMLElement | null = document.querySelector('#expand-item-' + identifier_item)
                if (rowElements) {
                    rowElements.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            } else {
                setTimeout(() => {
                    const rowElements: HTMLElement | null = document.querySelector('#expand-item-' + identifier_item)
                    if (rowElements) {
                        rowElements.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 600); // espera a animação terminar
            }
        });

    }
    return {
        expanded_items,
        is_item_expanded,
        expand_item_toggle,
        close_all_expanded_items
    };
}