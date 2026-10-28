<!--
========
Este arquivo representa o modal de visualização detalhada de uma reserva existente.
Ele exibe horário, recurso, autoria, payload JSON e todos os dias reservados caso a reserva
pertença a um grupo de recorrência. Consome o tituloPadrao e os métodos da API diretamente do useAgenda.
========
-->
<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue';
import { ModalBaseDefault, ModalPerigo } from '@/Modals';
import { useAgenda } from '../composables/useAgenda';
import { criarDataLocal, extrairDataHoraLocal } from '../composables/useGradeCompartilhada';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    reserva: { type: Object as PropType<Record<string, any> | null>, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue', 'excluido', 'editar']);

const { configEntrada, excluirReserva, obterDetalhesReserva } = useAgenda();

// Armazena os dados completos da reserva garantindo que a lista de datas do grupo esteja sempre atualizada.
const reservaDetalhada = ref<Record<string, any>>({});

// Indica se uma requisição de exclusão da reserva ou do grupo está em andamento.
const excluindo = ref(false);

// Controla a visibilidade do modal de confirmação de exclusão para reservas avulsas.
const modalConfirmarExclusaoSimplesAberto = ref(false);

// Controla a visibilidade do modal de decisão para reservas que pertencem a um grupo de recorrência.
const modalConfirmarExclusaoGrupoAberto = ref(false);

// Controla a visibilidade do modal de erro caso a exclusão falhe na API.
const modalErroAberto = ref(false);

// Armazena a mensagem de erro retornada pela API durante a tentativa de exclusão.
const mensagemErro = ref('');

// Atualiza os dados locais sempre que a reserva recebida via prop mudar ou o modal abrir.
watch(
    [() => props.modelValue, () => props.reserva],
    async ([aberto, novaReserva]) => {
        if (aberto && novaReserva && typeof novaReserva === 'object') {
            reservaDetalhada.value = { ...novaReserva };
            if (
                novaReserva.grupo_recorrencia_reserva &&
                (!Array.isArray(novaReserva.datas_grupo_recorrencia_reserva) || novaReserva.datas_grupo_recorrencia_reserva.length === 0) &&
                novaReserva.codigo_referencia_reserva
            ) {
                try {
                    const atualizado = await obterDetalhesReserva(novaReserva.codigo_referencia_reserva);
                    if (atualizado) reservaDetalhada.value = atualizado;
                } catch {
                    // Mantém os dados já carregados em memória caso a consulta complementar falhe.
                }
            }
        }
    },
    { immediate: true }
);

// Controla a visibilidade do modal principal sincronizando com o componente pai.
const exibirModal = computed({
    get: () => Boolean(props.modelValue && props.reserva),
    set: (valor: boolean) => emit('update:modelValue', valor)
});

// Indica se algum modal secundário de confirmação ou erro está aberto por cima do modal principal.
const temDialogoSecundarioAberto = computed(() =>
    modalConfirmarExclusaoSimplesAberto.value ||
    modalConfirmarExclusaoGrupoAberto.value ||
    modalErroAberto.value
);

// Verifica se a reserva atual faz parte de um grupo de recorrência ativo.
const pertenceAGrupo = computed(() => Boolean(reservaDetalhada.value?.grupo_recorrencia_reserva));

// Extrai a data local (YYYY-MM-DD) da ocorrência selecionada para destacá-la na lista de datas do grupo.
const dataOcorrenciaAtualIso = computed(() => {
    if (!reservaDetalhada.value?.data_inicio_reserva) return '';
    return extrairDataHoraLocal(reservaDetalhada.value.data_inicio_reserva).data;
});

// Devolve a lista de datas do grupo formatadas em DD/MM/AAAA indicando qual é a reserva aberta no momento.
const datasDoGrupoFormatadas = computed(() => {
    const lista: string[] = reservaDetalhada.value?.datas_grupo_recorrencia_reserva || [];
    return lista.map((isoData: string) => {
        const dt = criarDataLocal(isoData);
        const texto = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return {
            iso: isoData,
            texto,
            ehAtual: isoData === dataOcorrenciaAtualIso.value
        };
    });
});

// Recebe uma string ISO UTC e devolve a data e hora formatadas no padrão brasileiro local.
const formatarDataHoraLocal = (isoStr?: string) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Devolve o nome formatado do responsável pela reserva ou indica que foi gerada via integração de API.
const textoResponsavel = computed(() => {
    const r = reservaDetalhada.value;
    if (!r) return '-';
    if (r.origem_criacao_reserva === 'API' || !r.usuario_responsavel_reserva) {
        return 'Integração via API (Sistema)';
    }
    const nomeCompleto = [r.nome_responsavel_reserva, r.sobrenome_responsavel_reserva]
        .filter(Boolean)
        .join(' ')
        .trim();

    if (nomeCompleto && nomeCompleto !== r.usuario_responsavel_reserva) {
        return `${nomeCompleto} (${r.usuario_responsavel_reserva})`;
    }
    return r.usuario_responsavel_reserva;
});

// Verifica se o campo payload possui chaves ou valores para serem exibidos no modal.
const possuiPayload = computed(() => {
    const p = reservaDetalhada.value?.payload;
    if (!p) return false;
    if (typeof p === 'object') return Object.keys(p).length > 0;
    return String(p).trim().length > 0;
});

// Devolve o conteúdo do payload formatado com indentação para leitura.
const payloadFormatado = computed(() => {
    const p = reservaDetalhada.value?.payload;
    if (!p) return '';
    if (typeof p === 'object') return JSON.stringify(p, null, 2);
    return String(p);
});

// Fecha o modal principal de detalhes atualizando o modelo reativo.
const fecharModal = () => {
    emit('update:modelValue', false);
};

// Emite o evento para o componente pai fechar os detalhes e abrir o ModalReserva em modo de edição.
const acionarEdicao = () => {
    emit('editar', reservaDetalhada.value);
};

// Abre o modal adequado de confirmação de cancelamento (simples ou de lote recorrente).
const solicitarConfirmacaoExclusao = () => {
    if (!reservaDetalhada.value?.codigo_referencia_reserva) return;
    if (pertenceAGrupo.value) {
        modalConfirmarExclusaoGrupoAberto.value = true;
    } else {
        modalConfirmarExclusaoSimplesAberto.value = true;
    }
};

// Executa a chamada de exclusão da reserva na API (apenas a selecionada ou todo o grupo de recorrência).
const executarExclusao = async (cancelarTodoGrupo = false) => {
    const codigo = reservaDetalhada.value?.codigo_referencia_reserva;
    if (!codigo) return;

    excluindo.value = true;
    try {
        await excluirReserva(codigo, cancelarTodoGrupo);
        modalConfirmarExclusaoSimplesAberto.value = false;
        modalConfirmarExclusaoGrupoAberto.value = false;
        emit('excluido');
        fecharModal();
    } catch (erro: any) {
        modalConfirmarExclusaoSimplesAberto.value = false;
        modalConfirmarExclusaoGrupoAberto.value = false;
        mensagemErro.value = erro.response?.data?.mensagem?.texto
            || erro.response?.data?.detail
            || erro.response?.data?.message
            || 'Não foi possível cancelar a reserva.';
        modalErroAberto.value = true;
    } finally {
        excluindo.value = false;
    }
};
</script>

<template>
  <ModalBaseDefault
    v-model="exibirModal"
    tamanho="md"
    cor-barra-topo=""
    :carregando="excluindo"
    :fechar-com-esc="!temDialogoSecundarioAberto"
  >
    <template #title-header>
      <div class="cabecalho-titulo">
        <span>Detalhes da Reserva</span>
        <span
          class="badge-origem"
          :class="reservaDetalhada?.origem_criacao_reserva === 'API' ? 'origem-api' : 'origem-usuario'"
        >
          {{ reservaDetalhada?.origem_criacao_reserva || 'USUARIO' }}
        </span>
        <span v-if="pertenceAGrupo" class="badge-grupo">
          Lote Recorrente
        </span>
      </div>
    </template>

    <div class="info-bloco">
      <span class="info-label">Título da Reserva</span>
      <span class="info-valor destaque">
        {{ reservaDetalhada?.titulo_reserva?.trim() || configEntrada.tituloPadrao || 'Sem título' }}
      </span>
    </div>

    <div class="info-linha">
      <div class="info-bloco metade">
        <span class="info-label">Recurso</span>
        <span class="info-valor">{{ reservaDetalhada?.nome_recurso || '-' }}</span>
      </div>

      <div class="info-bloco metade">
        <span class="info-label">Código de Referência</span>
        <span class="info-valor codigo">{{ reservaDetalhada?.codigo_referencia_reserva || '-' }}</span>
      </div>
    </div>

    <div class="info-linha">
      <div class="info-bloco metade">
        <span class="info-label">Início</span>
        <span class="info-valor">{{ formatarDataHoraLocal(reservaDetalhada?.data_inicio_reserva) }}</span>
      </div>

      <div class="info-bloco metade">
        <span class="info-label">Término</span>
        <span class="info-valor">{{ formatarDataHoraLocal(reservaDetalhada?.data_fim_reserva) }}</span>
      </div>
    </div>

    <div class="info-bloco bloco-recorrencia-detalhes" v-if="pertenceAGrupo">
      <div class="cabecalho-bloco-grupo">
        <span class="info-label">Grupo de Recorrência ({{ datasDoGrupoFormatadas.length }} dia(s) reservado(s))</span>
      </div>
      <span class="texto-apoio-grupo">
        Esta reserva faz parte de um lote semanal. Alterações de horário ou título são aplicadas a todas as datas do grupo, a menos que você a retire do grupo na tela de edição.
      </span>
      <div class="lista-chips-datas" v-if="datasDoGrupoFormatadas.length > 0">
        <span
          v-for="itemData in datasDoGrupoFormatadas"
          :key="itemData.iso"
          class="chip-data-grupo"
          :class="{ 'chip-data-atual': itemData.ehAtual }"
          :title="itemData.ehAtual ? 'Reserva selecionada atualmente' : 'Reserva vinculada ao mesmo grupo'"
        >
          {{ itemData.texto }}
        </span>
      </div>
    </div>

    <div class="info-bloco">
      <span class="info-label">Criado por</span>
      <span class="info-valor">{{ textoResponsavel }}</span>
      <span class="info-subvalor" v-if="reservaDetalhada?.email_responsavel_reserva">
        {{ reservaDetalhada.email_responsavel_reserva }}
      </span>
    </div>

    <div class="info-bloco" v-if="possuiPayload">
      <span class="info-label">Payload da Reserva</span>
      <pre class="caixa-payload">{{ payloadFormatado }}</pre>
    </div>

    <template #footer="{ fechar }">
      <div class="rodape-esquerda">
        <button
          class="btn-excluir"
          type="button"
          @click="solicitarConfirmacaoExclusao"
          :disabled="excluindo"
        >
          {{ excluindo ? 'Cancelando...' : 'Cancelar Reserva' }}
        </button>
      </div>

      <div class="rodape-direita">
        <button
          class="btn-editar"
          type="button"
          @click="acionarEdicao"
          :disabled="excluindo"
        >
          Editar Reserva
        </button>

        <button
          class="btn-fechar-rodape"
          type="button"
          @click="fechar"
          :disabled="excluindo"
        >
          Fechar
        </button>
      </div>
    </template>
  </ModalBaseDefault>

  <ModalPerigo
    v-model="modalConfirmarExclusaoSimplesAberto"
    titulo="Cancelar reserva?"
    descricao="Deseja realmente cancelar e excluir esta reserva? Esta ação não poderá ser desfeita."
    texto-cancelar="Voltar"
    texto-confirmar="Sim, cancelar"
    :carregando="excluindo"
    @confirmar="executarExclusao(false)"
  />

  <ModalBaseDefault
    v-model="modalConfirmarExclusaoGrupoAberto"
    titulo="Cancelar Reserva em Lote Recorrente"
    tamanho="md"
    cor-barra-topo="danger"
    :carregando="excluindo"
  >
    <div class="aviso-cancelamento-lote">
      <p class="texto-principal-lote">
        Esta reserva faz parte de um <strong>grupo de recorrência</strong> com
        <strong>{{ datasDoGrupoFormatadas.length }} agendamento(s) ativo(s)</strong>.
      </p>
      <p class="texto-secundario-lote">
        Por padrão, o cancelamento remove todas as ocorrências do lote, mas você também pode cancelar apenas o dia selecionado ({{ formatarDataHoraLocal(reservaDetalhada?.data_inicio_reserva) }}).
      </p>

      <div class="caixa-datas-modal-cancelar" v-if="datasDoGrupoFormatadas.length > 0">
        <span class="info-label">Dias que compõem este grupo:</span>
        <div class="lista-chips-datas">
          <span
            v-for="itemData in datasDoGrupoFormatadas"
            :key="itemData.iso"
            class="chip-data-grupo"
            :class="{ 'chip-data-atual': itemData.ehAtual }"
          >
            {{ itemData.texto }}
          </span>
        </div>
      </div>
    </div>

    <template #footer="{ fechar }">
      <button
        type="button"
        class="btn-voltar-lote"
        @click="fechar"
        :disabled="excluindo"
      >
        Voltar
      </button>

      <div class="acoes-decisao-lote">
        <button
          type="button"
          class="btn-cancelar-apenas-uma"
          @click="executarExclusao(false)"
          :disabled="excluindo"
        >
          Cancelar Apenas Esta
        </button>

        <button
          type="button"
          class="btn-cancelar-todo-grupo"
          @click="executarExclusao(true)"
          :disabled="excluindo"
        >
          {{ excluindo ? 'Cancelando...' : `Cancelar Todo o Grupo (${datasDoGrupoFormatadas.length})` }}
        </button>
      </div>
    </template>
  </ModalBaseDefault>

  <ModalPerigo
    v-model="modalErroAberto"
    titulo="Erro ao cancelar"
    :descricao="mensagemErro"
    texto-confirmar="Entendi"
    :mostrar-botao-cancelar="false"
    fechar-ao-confirmar
  />
</template>

<style scoped>
.cabecalho-titulo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.badge-origem { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; letter-spacing: 0.4px; }
.origem-usuario { background: var(--color-brand-light); color: var(--color-brand); }
.origem-api { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
.badge-grupo { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: rgba(245, 158, 11, 0.18); color: #d97706; letter-spacing: 0.3px; }
.info-linha { display: flex; gap: 12px; }
.metade { flex: 1; min-width: 0; }
.info-bloco { display: flex; flex-direction: column; gap: 4px; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-light); }
.bloco-recorrencia-detalhes { border-color: rgba(245, 158, 11, 0.4); background: color-mix(in srgb, var(--bg-secondary) 92%, #f59e0b); }
.cabecalho-bloco-grupo { display: flex; align-items: center; justify-content: space-between; }
.texto-apoio-grupo { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin-bottom: 4px; }
.lista-chips-datas { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; max-height: 120px; overflow-y: auto; }
.chip-data-grupo { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: var(--bg-primary); border: 1px solid var(--border-light); color: var(--text-primary); }
.chip-data-atual { background: var(--color-brand); color: var(--text-inverse); border-color: var(--color-brand); }
.info-label { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; }
.info-valor { font-size: 14px; font-weight: 500; color: var(--text-primary); word-break: break-word; }
.info-valor.destaque { font-size: 15px; font-weight: 600; }
.info-valor.codigo { font-family: monospace; font-size: 12px; color: var(--text-secondary); }
.info-subvalor { font-size: 12.5px; color: var(--text-secondary); }
.caixa-payload { margin: 4px 0 0 0; padding: 10px; background: var(--bg-primary); border: 1px solid var(--border-light); border-radius: 6px; font-size: 12px; color: var(--text-primary); overflow-x: auto; max-height: 160px; }
.rodape-esquerda, .rodape-direita { display: flex; align-items: center; gap: 10px; }
.btn-excluir { background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); font-weight: 600; font-size: 13px; cursor: pointer; padding: 8px 14px; border-radius: 6px; transition: background 0.2s; }
.btn-excluir:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
.btn-excluir:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-editar { background: var(--bg-secondary); border: 1px solid var(--color-brand); color: var(--color-brand); font-weight: 600; font-size: 13.5px; cursor: pointer; padding: 8px 16px; border-radius: 6px; transition: all 0.2s; }
.btn-editar:hover:not(:disabled) { background: var(--color-brand-light); }
.btn-editar:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-fechar-rodape { background: var(--color-brand); border: none; color: var(--text-inverse); font-weight: 600; font-size: 13.5px; cursor: pointer; padding: 8px 20px; border-radius: 6px; }
.btn-fechar-rodape:hover:not(:disabled) { filter: brightness(0.95); }
.btn-fechar-rodape:disabled { opacity: 0.5; cursor: not-allowed; }
.aviso-cancelamento-lote { display: flex; flex-direction: column; gap: 12px; }
.texto-principal-lote { margin: 0; font-size: 14.5px; color: var(--text-primary); line-height: 1.45; }
.texto-secundario-lote { margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.45; }
.caixa-datas-modal-cancelar { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 8px; background: var(--bg-secondary); border: 1px solid var(--border-light); }
.btn-voltar-lote { background: transparent; border: none; color: var(--text-secondary); font-weight: 600; font-size: 13.5px; cursor: pointer; padding: 8px 14px; border-radius: 6px; }
.btn-voltar-lote:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
.acoes-decisao-lote { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.btn-cancelar-apenas-uma { background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); font-weight: 600; font-size: 13px; cursor: pointer; padding: 8px 14px; border-radius: 6px; transition: background 0.2s; }
.btn-cancelar-apenas-uma:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
.btn-cancelar-todo-grupo { background: var(--color-danger); border: none; color: #ffffff; font-weight: 700; font-size: 13.5px; cursor: pointer; padding: 8px 16px; border-radius: 6px; transition: filter 0.2s; }
.btn-cancelar-todo-grupo:hover:not(:disabled) { filter: brightness(0.92); }
.btn-cancelar-apenas-uma:disabled, .btn-cancelar-todo-grupo:disabled { opacity: 0.5; cursor: not-allowed; }
</style>