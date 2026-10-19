<!--
========
Este arquivo representa o modal de visualização detalhada de uma reserva existente.
Ele exibe as informações de horário, recurso, autoria (usuário ou API) e o payload JSON associado,
além de permitir o cancelamento do agendamento.
========
-->
<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';

const api = inject('api-instance-agenda') as any;

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    reserva: { type: Object, default: () => ({}) },
    tituloPadrao: { type: String, default: 'Reserva sem título' }
});

const emit = defineEmits(['update:modelValue', 'excluido']);

const { excluirReserva } = useAgenda(api);

// Indica se uma requisição de exclusão da reserva está em andamento.
const excluindo = ref(false);

// Recebe uma string ISO UTC e devolve a data e hora formatadas no padrão brasileiro local.
// É usada para apresentar o início e o término da reserva de forma legível.
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
    if (!props.reserva) return '-';
    if (props.reserva.origem_criacao_reserva === 'API' || !props.reserva.usuario_responsavel_reserva) {
        return 'Integração via API (Sistema)';
    }
    const nomeCompleto = [props.reserva.nome_responsavel_reserva, props.reserva.sobrenome_responsavel_reserva]
        .filter(Boolean)
        .join(' ')
        .trim();

    if (nomeCompleto && nomeCompleto !== props.reserva.usuario_responsavel_reserva) {
        return `${nomeCompleto} (${props.reserva.usuario_responsavel_reserva})`;
    }
    return props.reserva.usuario_responsavel_reserva;
});

// Verifica se o campo payload possui chaves ou valores para serem exibidos no modal.
const possuiPayload = computed(() => {
    const p = props.reserva?.payload;
    if (!p) return false;
    if (typeof p === 'object') return Object.keys(p).length > 0;
    return String(p).trim().length > 0;
});

// Devolve o conteúdo do payload formatado com indentação para leitura.
const payloadFormatado = computed(() => {
    const p = props.reserva?.payload;
    if (!p) return '';
    if (typeof p === 'object') return JSON.stringify(p, null, 2);
    return String(p);
});

// Fecha o modal de detalhes.
const fecharModal = () => {
    emit('update:modelValue', false);
};

// Confirma com o usuário e dispara a exclusão da reserva na API.
const confirmarExclusao = async () => {
    const codigo = props.reserva?.codigo_referencia_reserva;
    if (!codigo) return;

    if (!confirm("Deseja realmente cancelar e excluir esta reserva?")) return;

    excluindo.value = true;
    try {
        await excluirReserva(codigo);
        emit('excluido');
        fecharModal();
    } catch (erro: any) {
        const msg = erro.response?.data?.detail || erro.response?.data?.message || "Não foi possível excluir a reserva.";
        alert(`Erro ao excluir:\n${msg}`);
    } finally {
        excluindo.value = false;
    }
};
</script>

<template>
  <div class="modal-overlay" v-if="modelValue && reserva" @mousedown.self="fecharModal">
    <div class="modal-card">
      <div class="modal-header">
        <div class="cabecalho-titulo">
          <h3>Detalhes da Reserva</h3>
          <span
            class="badge-origem"
            :class="reserva.origem_criacao_reserva === 'API' ? 'origem-api' : 'origem-usuario'"
          >
            {{ reserva.origem_criacao_reserva || 'USUARIO' }}
          </span>
        </div>
        <button class="btn-fechar" @click="fecharModal" title="Fechar">&times;</button>
      </div>

      <div class="modal-body">
        <div class="info-bloco">
          <span class="info-label">Título da Reserva</span>
          <span class="info-valor destaque">
            {{ reserva.titulo_reserva?.trim() || props.tituloPadrao || 'Sem título' }}
          </span>
        </div>

        <div class="info-linha">
          <div class="info-bloco metade">
            <span class="info-label">Recurso</span>
            <span class="info-valor">{{ reserva.nome_recurso || '-' }}</span>
          </div>

          <div class="info-bloco metade">
            <span class="info-label">Código de Referência</span>
            <span class="info-valor codigo">{{ reserva.codigo_referencia_reserva || '-' }}</span>
          </div>
        </div>

        <div class="info-linha">
          <div class="info-bloco metade">
            <span class="info-label">Início</span>
            <span class="info-valor">{{ formatarDataHoraLocal(reserva.data_inicio_reserva) }}</span>
          </div>

          <div class="info-bloco metade">
            <span class="info-label">Término</span>
            <span class="info-valor">{{ formatarDataHoraLocal(reserva.data_fim_reserva) }}</span>
          </div>
        </div>

        <div class="info-bloco">
          <span class="info-label">Criado por</span>
          <span class="info-valor">{{ textoResponsavel }}</span>
          <span class="info-subvalor" v-if="reserva.email_responsavel_reserva">
            {{ reserva.email_responsavel_reserva }}
          </span>
        </div>

        <div class="info-bloco" v-if="possuiPayload">
          <span class="info-label">Payload da Reserva</span>
          <pre class="caixa-payload">{{ payloadFormatado }}</pre>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn-excluir"
          type="button"
          @click="confirmarExclusao"
          :disabled="excluindo"
        >
          {{ excluindo ? 'Excluindo...' : 'Cancelar Reserva' }}
        </button>

        <button class="btn-fechar-rodape" type="button" @click="fecharModal">
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1060; backdrop-filter: blur(2px); }
.modal-card { background: var(--bg-modal); width: 100%; max-width: 500px; border-radius: 12px; box-shadow: var(--shadow-float); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border-light); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-light); background: var(--bg-primary); }
.cabecalho-titulo { display: flex; align-items: center; gap: 10px; }
.modal-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 600; }
.badge-origem { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; letter-spacing: 0.4px; }
.origem-usuario { background: var(--color-brand-light); color: var(--color-brand); }
.origem-api { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
.btn-fechar { background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; line-height: 1; }
.btn-fechar:hover { color: var(--text-primary); }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; background: var(--bg-primary); }
.info-linha { display: flex; gap: 12px; }
.metade { flex: 1; min-width: 0; }
.info-bloco { display: flex; flex-direction: column; gap: 4px; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-light); }
.info-label { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; }
.info-valor { font-size: 14px; font-weight: 500; color: var(--text-primary); word-break: break-word; }
.info-valor.destaque { font-size: 15px; font-weight: 600; }
.info-valor.codigo { font-family: monospace; font-size: 12px; color: var(--text-secondary); }
.info-subvalor { font-size: 12.5px; color: var(--text-secondary); }
.caixa-payload { margin: 4px 0 0 0; padding: 10px; background: var(--bg-primary); border: 1px solid var(--border-light); border-radius: 6px; font-size: 12px; color: var(--text-primary); overflow-x: auto; max-height: 160px; }
.modal-footer { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--border-light); background: var(--bg-secondary); }
.btn-excluir { background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); font-weight: 600; font-size: 13px; cursor: pointer; padding: 8px 14px; border-radius: 6px; transition: background 0.2s; }
.btn-excluir:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
.btn-excluir:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-fechar-rodape { background: var(--color-brand); border: none; color: var(--text-inverse); font-weight: 600; font-size: 13.5px; cursor: pointer; padding: 8px 20px; border-radius: 6px; }
.btn-fechar-rodape:hover { filter: brightness(0.95); }
</style>