
// store.ts
import { useToast } from "vue-toastification";
import ToastComponent from "./components/ToastComponent.vue";
import { defineStore } from "pinia";

/**
 * Define os tipos de toast aceitos.
 * 1 = success
 * 2 = error
 * 3 = info
 */
type ToastStoreType = 1 | 2 | 3;

export const useToastStore = defineStore("toastStore", () => {
  const showToast = (
    title: string,
    body: string,
    type: ToastStoreType
  ) => {
    const toast = useToast();

    const content = {
      component: ToastComponent,
      props: {
        content: {
          title: title,
          body: body,
        },
      },
    };
    switch (type) {
      case 1:
        toast.success(content, {});
        break;
      case 2:
        toast.error(content, {
          timeout: 7000,
        });
        break;
      case 3:
        toast.info(content, {});
        break;
      default:
        console.info("Tipo de toast não encontrado");
        break;
    }
  };

  return {
    showToast,
  };
});