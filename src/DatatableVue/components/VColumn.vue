<template>

</template>

<script setup lang="ts">
import { inject, onMounted, useSlots } from 'vue';
import { dataTableApiKey } from '../keys';

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
    field: props.field,
    header: props.header,
    type: props.type,
    class_column: props.class_column,
    class_row: props.class_row,
    class_item: props.class_item,
    transform_function: props.transform_function,

    bodySlot: slots.body,
    ...(props.type === 'text' && { limite_text: Number(props.limite_text) }),
    ...(props.type === 'img' && { deactivate_img_preview: props.deactivate_img_preview }),
    ...(props.type === 'date' && { format: props.format }),
  });
});
</script>