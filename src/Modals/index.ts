/*
========
Arquivo principal de exportação do módulo de Modais (v-sistec-features/Modals).
Disponibiliza todos os 9 componentes de modal e o componente BotaoFechar prontos para uso.
========
*/

import BotaoFechar from "./components/BotaoFechar.vue";
import ModalBaseDefault from "./components/ModalBaseDefault.vue";
import ModalConfirmacao from "./components/ModalConfirmacao.vue";
import ModalPerigo from "./components/ModalPerigo.vue";
import ModalSucesso from "./components/ModalSucesso.vue";
import ModalAviso from "./components/ModalAviso.vue";
import ModalInformacao from "./components/ModalInformacao.vue";
import ModalConfirmacaoCheckbox from "./components/ModalConfirmacaoCheckbox.vue";
import ModalConfirmacaoInput from "./components/ModalConfirmacaoInput.vue";
import ModalConfirmacaoSimples from "./components/ModalConfirmacaoSimples.vue";

export {
    BotaoFechar,
    ModalBaseDefault,
    ModalConfirmacao,
    ModalPerigo,
    ModalSucesso,
    ModalAviso,
    ModalInformacao,
    ModalConfirmacaoCheckbox,
    ModalConfirmacaoInput,
    ModalConfirmacaoSimples
};

export default ModalBaseDefault;