<!--
========
Este arquivo representa o componente orquestrador do modal de criação e edição de reservas.
Ele conecta a lógica do composable useFormularioReserva aos subcomponentes visuais modulares
e preserva todos os slots customizáveis e modais de feedback, expondo também o payloadRecurso
e os utilitários de erro para validação de campos específicos da aplicação.
========
-->
<script setup lang="ts">
import { computed } from 'vue';
import {
    ModalBaseDefault,
    ModalAviso,
    ModalPerigo,
    ModalSucesso
} from '@/Modals';
import { useFormularioReserva } from '../composables/useFormularioReserva';
import OverlayHorariosDisponiveis from './ModalReservaPartes/OverlayHorariosDisponiveis.vue';
import PainelGrupoRecorrenciaModal from './ModalReservaPartes/PainelGrupoRecorrenciaModal.vue';
import SecaoIdentificacaoModal from './ModalReservaPartes/SecaoIdentificacaoModal.vue';
import SecaoHorarioModal from './ModalReservaPartes/SecaoHorarioModal.vue';
import SecaoRecorrenciaModal from './ModalReservaPartes/SecaoRecorrenciaModal.vue';
import RodapeAcoesModal from './ModalReservaPartes/RodapeAcoesModal.vue';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    dadosIniciais: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue', 'salvo', 'cancelado']);

// Sincroniza o estado de visibilidade do modal com o v-model externo.
const exibirModal = computed({
    get: () => props.modelValue,
    set: (valor: boolean) => emit('update:modelValue', valor)
});

const {
    configEntrada,
    recursosDisponiveis,
    recursoAtual,
    payloadRecurso,
    errosCampos,
    activeError,
    definirErroCampo,
    limparErroCampo,
    limparErrosCampos,
    abrirAviso,
    abrirPerigo,
    salvando,
    desvinculando,
    modalConfirmarDesvinculoAberto,
    precisaValidar,
    mostrarAjusteHorario,
    repetirReserva,
    exibirHorariosModal,
    horariosDisponiveisFormatados,
    estadoEdicao,
    feedbackModal,
    formReserva,
    ehModoEdicao,
    editandoEmGrupo,
    tituloModalPrincipal,
    datasGrupoFormatadas,
    temDialogoSecundarioAberto,
    textoDiaSelecionado,
    nomeDiaSemana,
    textoIntervaloHorario,
    alternarAjusteHorario,
    definirRepetirReserva,
    marcarComoAlterado,
    mostrarHorariosPossiveis,
    ajustarHorarios,
    confirmarRetiradaDoGrupo,
    salvarReserva
} = useFormularioReserva({
    obterAberto: () => props.modelValue,
    obterDadosIniciais: () => props.dadosIniciais,
    aoSalvar: () => emit('salvo'),
    aoFecharModal: () => emit('update:modelValue', false)
});

// Emite o evento de cancelamento quando o modal principal é fechado pelo usuário.
const aoCancelarModal = () => {
    emit('cancelado');
};
</script>

<template>
  <ModalBaseDefault
    v-model="exibirModal"
    :titulo="tituloModalPrincipal"
    tamanho="md"
    cor-barra-topo=""
    :carregando="salvando || desvinculando"
    :fechar-com-esc="!temDialogoSecundarioAberto"
    @cancelar="aoCancelarModal"
  >
    <slot
      name="topo-modal"
      :dados-reserva="formReserva"
      :payload="formReserva.payload"
      :recurso-atual="recursoAtual"
      :payload-recurso="payloadRecurso"
      :erros-campos="errosCampos"
      :definir-erro-campo="definirErroCampo"
      :limpar-erro-campo="limparErroCampo"
      :limpar-erros-campos="limparErrosCampos"
      :abrir-aviso="abrirAviso"
      :abrir-perigo="abrirPerigo"
      :modo-edicao="ehModoEdicao"
      :editando-em-grupo="editandoEmGrupo"
      :texto-dia-selecionado="textoDiaSelecionado"
      :texto-intervalo-horario="textoIntervaloHorario"
    ></slot>

    <PainelGrupoRecorrenciaModal
      :editando-em-grupo="editandoEmGrupo"
      :foi-desvinculada-nesta-sessao="estadoEdicao.foiDesvinculadaNestaSessao"
      :eh-modo-edicao="ehModoEdicao"
      :datas-grupo-formatadas="datasGrupoFormatadas"
      :desvinculando="desvinculando"
      :salvando="salvando"
      @solicitar-desvinculo="modalConfirmarDesvinculoAberto = true"
    />

    <slot
      name="visualizacao-dados"
      :dados-reserva="formReserva"
      :payload="formReserva.payload"
      :recurso-atual="recursoAtual"
      :payload-recurso="payloadRecurso"
      :erros-campos="errosCampos"
      :definir-erro-campo="definirErroCampo"
      :limpar-erro-campo="limparErroCampo"
      :limpar-erros-campos="limparErrosCampos"
      :abrir-aviso="abrirAviso"
      :abrir-perigo="abrirPerigo"
      :modo-edicao="ehModoEdicao"
      :editando-em-grupo="editandoEmGrupo"
      :recursos-disponiveis="recursosDisponiveis"
      :texto-dia-selecionado="textoDiaSelecionado"
      :texto-intervalo-horario="textoIntervaloHorario"
      :nome-dia-semana="nomeDiaSemana"
      :repetir-reserva="repetirReserva"
      :definir-repetir-reserva="definirRepetirReserva"
      :mostrar-ajuste-horario="mostrarAjusteHorario"
      :alternar-ajuste-horario="alternarAjusteHorario"
      :precisa-validar="precisaValidar"
      :marcar-como-alterado="marcarComoAlterado"
      :ajustar-horarios="ajustarHorarios"
    >
      <slot
        name="campo-nome"
        :dados-reserva="formReserva"
        :payload="formReserva.payload"
        :recurso-atual="recursoAtual"
        :payload-recurso="payloadRecurso"
        :recursos-disponiveis="recursosDisponiveis"
        :ocultar-titulo-modal="configEntrada.ocultarTituloModal"
      >
        <SecaoIdentificacaoModal
          :form-reserva="formReserva"
          :recursos-disponiveis="recursosDisponiveis"
        />
      </slot>

      <slot
        name="campo-horario"
        :dados-reserva="formReserva"
        :payload="formReserva.payload"
        :recurso-atual="recursoAtual"
        :payload-recurso="payloadRecurso"
        :texto-dia-selecionado="textoDiaSelecionado"
        :texto-intervalo-horario="textoIntervaloHorario"
        :mostrar-ajuste-horario="mostrarAjusteHorario"
        :alternar-ajuste-horario="alternarAjusteHorario"
        :precisa-validar="precisaValidar"
        :marcar-como-alterado="marcarComoAlterado"
        :ajustar-horarios="ajustarHorarios"
      >
        <SecaoHorarioModal
          :form-reserva="formReserva"
          :editando-em-grupo="editandoEmGrupo"
          :texto-dia-selecionado="textoDiaSelecionado"
          :texto-intervalo-horario="textoIntervaloHorario"
          :mostrar-ajuste-horario="mostrarAjusteHorario"
          @alternar-ajuste="alternarAjusteHorario"
          @alterado="marcarComoAlterado"
        />
      </slot>

      <slot
        v-if="!ehModoEdicao"
        name="campo-recorrencia"
        :dados-reserva="formReserva"
        :payload="formReserva.payload"
        :recurso-atual="recursoAtual"
        :payload-recurso="payloadRecurso"
        :repetir-reserva="repetirReserva"
        :definir-repetir-reserva="definirRepetirReserva"
        :nome-dia-semana="nomeDiaSemana"
      >
        <SecaoRecorrenciaModal
          v-model:repetir-reserva="repetirReserva"
          :form-reserva="formReserva"
          :nome-dia-semana="nomeDiaSemana"
        />
      </slot>
    </slot>

    <div class="area-customizada">
      <slot
        name="campos-extras"
        :payload="formReserva.payload"
        :dados-reserva="formReserva"
        :recurso-atual="recursoAtual"
        :payload-recurso="payloadRecurso"
        :active-error="activeError"
        :erros-campos="errosCampos"
        :definir-erro-campo="definirErroCampo"
        :limpar-erro-campo="limparErroCampo"
        :limpar-erros-campos="limparErrosCampos"
        :abrir-aviso="abrirAviso"
        :abrir-perigo="abrirPerigo"
        :modo-edicao="ehModoEdicao"
        :editando-em-grupo="editandoEmGrupo"
        :texto-dia-selecionado="textoDiaSelecionado"
        :texto-intervalo-horario="textoIntervaloHorario"
      ></slot>
    </div>

    <OverlayHorariosDisponiveis
      :aberto="exibirHorariosModal"
      :horarios="horariosDisponiveisFormatados"
      @fechar="exibirHorariosModal = false"
    />

    <template #footer="{ fechar }">
      <RodapeAcoesModal
        :precisa-validar="precisaValidar"
        :salvando="salvando"
        :desvinculando="desvinculando"
        :eh-modo-edicao="ehModoEdicao"
        :editando-em-grupo="editandoEmGrupo"
        @validar-grade="ajustarHorarios(false)"
        @ver-horarios="mostrarHorariosPossiveis"
        @cancelar="fechar"
        @salvar="salvarReserva"
      />
    </template>
  </ModalBaseDefault>

  <ModalAviso
    v-model="modalConfirmarDesvinculoAberto"
    titulo="Retirar reserva deste grupo?"
    descricao="Ao retirar esta reserva do grupo de recorrência, ela se tornará um agendamento independente de forma permanente. Você poderá mudar a data e o horário dela livremente sem afetar as outras semanas do lote."
    texto-cancelar="Manter no grupo"
    texto-confirmar="Sim, retirar do grupo"
    :carregando="desvinculando"
    @confirmar="confirmarRetiradaDoGrupo"
  />

  <ModalAviso
    v-model="feedbackModal.avisoAberto"
    :titulo="feedbackModal.titulo"
    :descricao="feedbackModal.descricao"
    texto-confirmar="Entendi"
    :mostrar-botao-cancelar="false"
    fechar-ao-confirmar
  />

  <ModalPerigo
    v-model="feedbackModal.perigoAberto"
    :titulo="feedbackModal.titulo"
    :descricao="feedbackModal.descricao"
    texto-confirmar="Entendi"
    :mostrar-botao-cancelar="false"
    fechar-ao-confirmar
  />

  <ModalSucesso
    v-model="feedbackModal.sucessoAberto"
    :titulo="feedbackModal.titulo"
    :descricao="feedbackModal.descricao"
    texto-confirmar="Entendi"
    :mostrar-botao-cancelar="false"
    fechar-ao-confirmar
  />
</template>