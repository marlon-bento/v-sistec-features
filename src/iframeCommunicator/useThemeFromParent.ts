import { useIframeCommunicator } from './useIframeCommunicator';
import { onMounted, ref, readonly, provide } from 'vue';


/**
 * Um composable "tudo-em-um" que configura a comunicação de temas com a janela pai.
 * para usar, bastar importar e chamar useTheme() na raiz do component app do iframe
 */
export function useTheme() {

    // Usa o composable genérico, passando o handler de temas, assim ele já configura 
    // o listener e o que é feito quando receber uma mensagem do pai referente a tema
    const theme = ref('light');
    const themePalette = ref('slate');
    const themePrimary = ref('');

    function handleThemeMessage(event: MessageEvent) {
        const data = event.data;

        // Validação básica para evitar erros se data for nulo
        if (!data) return;

        if (data.type === 'setTheme') {
            document.documentElement.setAttribute('data-bs-theme', data.theme);
            theme.value = data.theme;
        }

        if (data.type === 'setThemePrimary') {
            document.documentElement.setAttribute('data-bs-theme-primary', data.themePrimary);
            themePrimary.value = data.themePrimary;
        }

        if (data.type === 'setThemeBase') {
            document.documentElement.setAttribute('data-bs-theme-base', data.themeBase);
            themePalette.value = data.themeBase;
        }

        if (data.type === 'reload') {
            location.reload();
        }
    }
    const { sendMessage } = useIframeCommunicator(handleThemeMessage);

    // passa uma mensagem para o pai avisando que o iframe está pronto para receber temas
    onMounted(() => {
        sendMessage({ type: 'iframeReady' });
    });
    provide('theme-v-sistec', readonly(theme));
    provide('theme-palette-v-sistec', readonly(themePalette));
    provide('theme-primary-v-sistec', readonly(themePrimary));
    return { 
        theme: readonly(theme), 
        themePalette: readonly(themePalette), 
        themePrimary: readonly(themePrimary) 
    };
}