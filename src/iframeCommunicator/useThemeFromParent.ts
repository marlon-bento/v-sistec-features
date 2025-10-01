import { useIframeCommunicator } from './useIframeCommunicator';
import { onMounted } from 'vue';

function handleThemeMessage(event: MessageEvent) {
    if (event.data.type === 'setTheme') {
        document.documentElement.setAttribute('data-bs-theme', event.data.theme);
    }
    if (event.data.type === 'setThemePrimary') {
        document.documentElement.setAttribute('data-bs-theme-primary', event.data.themePrimary);
    }
    if (event.data.type === 'setThemeBase') {
        document.documentElement.setAttribute('data-bs-theme-base', event.data.themeBase);
    }
    if (event.data.type === 'reload') {
        location.reload();
    }
}

/**
 * Um composable "tudo-em-um" que configura a comunicação de temas com a janela pai.
 * para usar, bastar importar e chamar useTheme() na raiz do component app do iframe
 */
export function useTheme() {
  // Usa o composable genérico, passando o handler de temas, assim ele já configura 
  // o listener e o que é feito quando receber uma mensagem do pai referente a tema
  const { sendMessage } = useIframeCommunicator(handleThemeMessage);

  // passa uma mensagem para o pai avisando que o iframe está pronto para receber temas
  onMounted(() => {
    sendMessage({ type: 'iframeReady' });
  });
}