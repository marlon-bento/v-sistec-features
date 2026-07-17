<template>

</template>

<script setup lang="ts">
import { inject, onMounted, useSlots } from 'vue';
import { dataTableApiKey } from '../keys';
const column_internal_id = crypto.randomUUID();
defineSlots<{
  // props para o slot body 
  body?: (props: { item: any }) => any,
  col_header?: (props: { col: any, locked: boolean }) => any,
  col_header_midle?: (props: { col: any, locked: boolean }) => any,
}>();
interface VColumnProps {
  field?: string | null;
  header: string;
  type?: 'text' | 'img' | 'date' | 'html';
  class_column?: string;
  class_row?: string;
  class_item?: string;
  format?: 'complete' | 'simple';
  deactivate_img_preview?: boolean;
  limite_text?: number | string | null;
  transform_function?: ((value: any) => any) | null;
  click?: Function | null;
  // bloqueia a coluna para não ser movida
  locked?: boolean;
  use_ordering?: boolean;
  param_ordering?: string;
  decreasing_value?: string;
  increasing_value?: string;
  class_rules?: Record<string, (item: any) => boolean>;
  start_hidden?: boolean;
}
const props = withDefaults(defineProps<VColumnProps>(), {
  field: null,
  type: 'text',
  /* adiciona class na tr da tabela respectiva a coluna do field*/
  class_column: '',

  /* adiciona class na td da tabela respectiva a coluna do field*/
  class_row: '',

  /* adiciona class no elemento dentro da td */
  class_item:'',

  /* formata a data, se type for date */
  format: 'complete' ,

  /* desativa o preview da imagem, se type for img */
  deactivate_img_preview: false ,

  /* limita o texto se for type text */
  limite_text:  null ,

  /* recebe função para alterar o que é mostrado */
  transform_function:  null ,
  click: null,
  locked: false,

  use_ordering: false,
  start_hidden: false,
  param_ordering: '',
  decreasing_value: '',
  increasing_value: '',
  class_rules: () => ({}),
});

const slots = useSlots();
const parentApi = inject(dataTableApiKey);

if (!parentApi) {
  throw new Error('VColumn deve ser usado dentro de um VDataTable.');
}

const typeOptions = ['text', 'img', 'date', 'html'];

onMounted(() => {
  if (props.field !== null && !props.field) {
    throw new Error('A propriedade "field" é obrigatória em VColumn.');
  }
  if (!props.header) {
    throw new Error('A propriedade "header" é obrigatória em VColumn.');
  }
  if (props.field !== null && !typeOptions.includes(props.type)) {
    throw new Error(`O tipo "${props.type}" não é suportado em VColumn. Tipos suportados: text, img, date, html.`);
  }
  if (props.limite_text) {
    if (props.type !== 'text') {
      throw new Error('A propriedade "limite_text" só pode ser usada quando o tipo for "text".');
    }

    else if (typeof props.limite_text === 'string' && isNaN(Number(props.limite_text))) {
      throw new Error('A propriedade "limite_text" deve ser um número quando for uma string.');
    }

    else if (isNaN(Number(props.limite_text)) || Number(props.limite_text) <= 0) {
      throw new Error('A propriedade "limite_text" deve ser um número maior que 0.');
    }
  }

  parentApi.addColumn({
    id: column_internal_id,
    field: props.field,
    header: props.header,
    type: props.type,
    class_column: props.class_column,
    class_row: props.class_row,
    class_item: props.class_item,
    click: props.click,
    transform_function: props.transform_function,
    locked: props.locked,
    use_ordering: props.use_ordering,
    param_ordering: props.param_ordering,
    decreasing_value: props.decreasing_value,
    increasing_value: props.increasing_value,
    class_rules: props.class_rules,

    bodySlot: slots.body,
    // colHeaderSlot é para o slot do header da coluna, que pode ser usado para colocar ícone de ordenação ou qualquer outra coisa que o usuário queira colocar no header da coluna
    colHeaderSlot: slots.col_header,
    // colHeaderMidleSlot é para o slot do header da coluna, mas ele fica entre o texto do header e o ícone de ordenação, para o usuário colocar coisas entre eles
    colHeaderMidleSlot: slots.col_header_midle,
    ...(props.type === 'text' && { limite_text: Number(props.limite_text) }),
    ...(props.type === 'img' && { deactivate_img_preview: props.deactivate_img_preview }),
    ...(props.type === 'date' && { format: props.format }),

    start_hidden: props.start_hidden,// se a coluna é opcional por padrão ela não é visível, mas o usuário pode escolher mostrar ela
    visible:! props.start_hidden // Se start_hidden for true, ela não estará visível inicialmente
    
  });

});
</script>