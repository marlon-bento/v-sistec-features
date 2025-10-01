import { onMounted, onUnmounted, readonly, ref } from 'vue';

/**
 * Um Composable para gerenciar a comunicação entre um iframe e sua janela pai.
 * @param onMessageReceived - Uma função de callback que será executada quando uma mensagem for recebida do pai.
 */
export function useIframeCommunicator(onMessageReceived: (event: MessageEvent) => void) {

  // Uma ref reativa para saber se o app está rodando dentro de um iframe
  const isInIframe = ref(window.parent !== window);

  /**
   * Envia uma mensagem para a janela pai.
   * @param message - O objeto da mensagem a ser enviado.
   * @param targetOrigin - A origem do pai, para segurança. Padrão é '*'.
   */
  function sendMessage(message: any, targetOrigin: string = '*') {
    if (isInIframe.value) {
      window.parent.postMessage(message, targetOrigin);
    }
  }

  // Configura o ouvinte de eventos quando o componente é montado
  onMounted(() => {
    window.addEventListener('message', onMessageReceived);
  });

  // Remove o ouvinte de eventos quando o componente é desmontado
  onUnmounted(() => {
    window.removeEventListener('message', onMessageReceived);
  });

  // Retorna os valores e funções que o componente poderá usar
  return {
    isInIframe: readonly(isInIframe), // readonly para evitar modificação externa
    sendMessage
  };
}

