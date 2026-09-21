<!-- 
========
Este arquivo representa o componente de modal para criação e edição de reservas em uma agenda.
Ele gerencia o formulário de reserva, valida a disponibilidade de horários baseando-se na grade 
do recurso selecionado, e interage com o composable useAgenda para salvar os dados na API.
========
-->
<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
const api = inject('api-instance-agenda') as any
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    dadosIniciais: { type: Object, required: true },
    usaInterceptador: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'salvo', 'cancelado', 'before-save']);

const {
    minutosInicio, minutosFim, recursosDisponiveis, agendasDisponiveis,
    criarReserva, converterParaUtc, reservasBrutas
} = useAgenda(api);

// Indica se o formulário está em processo de salvamento.
const salvando = ref(false);

// Indica se os horários do formulário precisam ser validados contra a grade disponível.
const precisaValidar = ref(false);

// Controla a visibilidade da listagem de horários disponíveis no modal.
const exibirHorariosModal = ref(false);

// Armazena a lista de horários formatados que estão disponíveis para reserva.
const horariosDisponiveisFormatados = ref<string[]>([]);

// Armazena os dados atuais do formulário de reserva preenchidos pelo usuário.
const formReserva = ref({
    resourceId: '',
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
});

// Recebe nada. Retorna nada.
// Usada para habilitar a flag de validação de horário quando o usuário altera algum campo de data.
const marcarComoAlterado = () => {
    precisaValidar.value = true;
};

// Recebe nada. Retorna nada.
// Usada para consultar a grade de horários da agenda baseada no recurso e data selecionados e exibi-los no modal.
const mostrarHorariosPossiveis = () => {
    if (!formReserva.value.resourceId || !formReserva.value.startDate) {
        alert("Selecione um recurso e uma data para ver os horarios possiveis.");
        return;
    }

    const recurso = recursosDisponiveis.value.find((r: any) => Number(r.id) === Number(formReserva.value.resourceId));
    const sId = recurso?.scheduleId || recurso?.schedule_id;
    const agenda = agendasDisponiveis.value.find((a: any) => Number(a.id) === Number(sId));

    if (!agenda || !agenda.detalhes || !agenda.detalhes.periods) {
        alert("Nenhuma grade de horarios encontrada.");
        return;
    }

    const inicioDate = new Date(`${formReserva.value.startDate}T00:00:00`);
    const diaDaSemana = inicioDate.getDay();
    const periodosDoDia = agenda.detalhes.periods[diaDaSemana] || [];

    const slotsReservaveis = periodosDoDia
        .filter((s: any) => s.isReservable)
        .sort((a: any, b: any) => {
            const [hA, mA] = a.startTime.split(':').map(Number) as [number, number];
            const [hB, mB] = b.startTime.split(':').map(Number) as [number, number];
            return (hA * 60 + mA) - (hB * 60 + mB);
        });

    if (slotsReservaveis.length === 0) {
        alert("Nenhum horario disponivel para este dia na grade.");
        return;
    }

    horariosDisponiveisFormatados.value = slotsReservaveis.map((s: any) => `${s.startTime} as ${s.endTime}`);
    exibirHorariosModal.value = true;
};

// Recebe um booleano silencioso (opcional). Retorna nada.
// Usada para ajustar e corrigir o horário de início e fim da reserva com base no expediente disponível da agenda.
const ajustarHorarios = (silencioso = false) => {
    if (!formReserva.value.resourceId || !formReserva.value.startDate || !formReserva.value.startTime || !formReserva.value.endTime) return;

    const recurso = recursosDisponiveis.value.find((r: any) => Number(r.id) === Number(formReserva.value.resourceId));
    const sId = recurso?.scheduleId || recurso?.schedule_id;
    const agenda = agendasDisponiveis.value.find((a: any) => Number(a.id) === Number(sId));

    if (!agenda || !agenda.detalhes || !agenda.detalhes.periods) return;

    const inicioDate = new Date(`${formReserva.value.startDate}T00:00:00`);
    const diaDaSemana = inicioDate.getDay();
    const periodosDoDia = agenda.detalhes.periods[diaDaSemana] || [];

    const slotsReservaveis = periodosDoDia
        .filter((s: any) => s.isReservable)
        .map((s: any) => {
            const [hI, mI] = s.startTime.split(':').map(Number) as [number, number];
            const [hF, mF] = s.endTime.split(':').map(Number) as [number, number];
            return { inicio: hI * 60 + mI, fim: hF * 60 + mF };
        })
        .sort((a: any, b: any) => a.inicio - b.inicio);

    if (slotsReservaveis.length === 0) {
        if (!silencioso) alert("Nenhum horario disponivel para este dia na grade.");
        return;
    }

    const [hI, mI] = formReserva.value.startTime.split(':').map(Number) as [number, number];
    const [hF, mF] = formReserva.value.endTime.split(':').map(Number) as [number, number];
    const minInicio = hI * 60 + mI;
    const minFim = hF * 60 + mF;

    let blocoInicio = [...slotsReservaveis].reverse().find(b => b.inicio <= minInicio);
    if (!blocoInicio) blocoInicio = slotsReservaveis[0];
    const novoInicioMin = blocoInicio.inicio;

    let blocoFim = [...slotsReservaveis].reverse().find(b => b.inicio < minFim);
    if (!blocoFim) blocoFim = slotsReservaveis[0];
    let novoFimMin = blocoFim.fim;

    if (novoFimMin <= novoInicioMin) {
        novoFimMin = blocoInicio.fim;
    }

    const formatarMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    
    formReserva.value.startTime = formatarMin(novoInicioMin);
    formReserva.value.endTime = formatarMin(novoFimMin);
    
    precisaValidar.value = false;
    
    if (!silencioso) {
        alert("Horario validado e ajustado conforme a grade disponivel.");
    }
};

watch(() => props.modelValue, (aberto) => {
    if (aberto && props.dadosIniciais) {
        formReserva.value = { ...formReserva.value, ...(props.dadosIniciais as typeof formReserva.value) };
        precisaValidar.value = false;
        exibirHorariosModal.value = false;
        ajustarHorarios(true);
    }
});

// Recebe nada. Retorna nada.
// Usada para emitir os eventos de fechamento da janela modal para o componente pai.
const fecharModal = () => {
    emit('update:modelValue', false);
    emit('cancelado');
};

// Recebe um objeto contendo os dados organizados da reserva. Retorna uma Promise resolvida ao fim da criação.
// Usada para disparar o serviço da API e lidar com erros amigavelmente caso a criação falhe.
const executarCriacaoAPI = async (payloadParaEnviar: any) => {
    try {
        await criarReserva(payloadParaEnviar);
        emit('salvo');
        emit('update:modelValue', false);
    } catch (erro: any) {
        const textoErro = erro.response?.data?.mensagem?.texto 
            || erro.response?.data?.message 
            || erro.response?.data?.detail 
            || "Erro ao criar a reserva na API. Verifique a disponibilidade do horário.";
            
        alert(`Falha na reserva:\n${textoErro}`);
    } finally {
        salvando.value = false;
    }
};

// Recebe nada. Retorna uma Promise caso proceda com o salvamento na API.
// Usada para validar todo o preenchimento, checar conflitos de expediente e acionar o salvamento (API ou interceptador).
const salvarReserva = async () => {
    if (precisaValidar.value) return;

    if (!formReserva.value.title.trim()) {
        alert("O nome da reserva é obrigatório.");
        return;
    }

    const inicioNovaReserva = new Date(`${formReserva.value.startDate}T${formReserva.value.startTime}`);
    const fimNovaReserva = new Date(`${formReserva.value.endDate}T${formReserva.value.endTime}`);

    const minutosInicioReserva = inicioNovaReserva.getHours() * 60 + inicioNovaReserva.getMinutes();
    const minutosFimReserva = fimNovaReserva.getHours() * 60 + fimNovaReserva.getMinutes();

    if (minutosInicioReserva < minutosInicio.value || minutosFimReserva > minutosFim.value) {
        alert("O horário selecionado está fora do expediente da agenda.");
        return;
    }

    if (inicioNovaReserva >= fimNovaReserva) {
        alert("O horário de início deve ser anterior ao término.");
        return;
    }

    const conflito = reservasBrutas.value.some((reserva: any) => {
        if (Number(reserva.resourceId) !== Number(formReserva.value.resourceId)) return false;
        const inicioEvento = new Date(reserva.startDate);
        const fimEvento = new Date(reserva.endDate);
        return inicioNovaReserva < fimEvento && fimNovaReserva > inicioEvento;
    });

    if (conflito) {
        alert("Já existe uma reserva para este recurso no horário selecionado.");
        return;
    }

    salvando.value = true;

    const payloadBase = {
        resourceId: Number(formReserva.value.resourceId),
        title: formReserva.value.title,
        startDateTime: converterParaUtc(formReserva.value.startDate, formReserva.value.startTime),
        endDateTime: converterParaUtc(formReserva.value.endDate, formReserva.value.endTime)
    };

    if (props.usaInterceptador) {
        emit('before-save', {
            payloadBase: payloadBase,
            dadosReserva: { ...formReserva.value },
            proceed: (novoPayloadModificado: any) => {
                executarCriacaoAPI(novoPayloadModificado || payloadBase);
            },
            abort: (callbackAcaoCustomizada?: Function) => {
                salvando.value = false;
                if (typeof callbackAcaoCustomizada === 'function') {
                    callbackAcaoCustomizada();
                }
            }
        });
    } else {
        await executarCriacaoAPI(payloadBase);
    }
};
</script>

<template>
  <!-- Todo o restante do template e style segue idêntico -->
  <div class="modal-overlay" v-if="modelValue" @mousedown.self="fecharModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Nova Reserva</h3>
        <button class="btn-fechar" @click="fecharModal" title="Fechar">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Nome da Reserva</label>
          <input type="text" v-model="formReserva.title" placeholder="Ex: Treinamento" autofocus />
        </div>
        
        <div class="form-group">
          <label>Calendário / Recurso</label>
          <select v-model="formReserva.resourceId" disabled>
            <option v-for="rec in recursosDisponiveis" :key="rec.id" :value="rec.id">
              {{ rec.resource_name || rec.name }}
            </option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group metade">
            <label>Início</label>
            <div class="input-group">
              <input type="date" v-model="formReserva.startDate" @input="marcarComoAlterado" />
              <input type="time" v-model="formReserva.startTime" @input="marcarComoAlterado" />
            </div>
          </div>
          
          <div class="form-group metade">
            <label>Fim</label>
            <div class="input-group">
              <input type="date" v-model="formReserva.endDate" @input="marcarComoAlterado" />
              <input type="time" v-model="formReserva.endTime" @input="marcarComoAlterado" />
            </div>
          </div>
        </div>
            
        <div class="area-customizada">
          <slot name="campos-extras"></slot>
        </div>
      </div>

      <div class="modal-footer">
        <div class="acoes-validacao">
          <span class="aviso-validar" v-if="precisaValidar">Valide a data.</span>
          <button class="btn-validar" v-if="precisaValidar" @click="ajustarHorarios(false)">Validar Data</button>
          <button class="btn-horarios" type="button" @click="mostrarHorariosPossiveis">Ver Horários</button>
        </div>
        
        <div class="acoes-salvar">
          <button class="btn-cancelar" @click="fecharModal" :disabled="salvando">Cancelar</button>
          <button class="btn-salvar" @click="salvarReserva" :disabled="salvando || precisaValidar">
            {{ salvando ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
        
      <div class="horarios-overlay" v-if="exibirHorariosModal">
        <div class="modal-header">
          <h3>Horários Disponíveis</h3>
          <button class="btn-fechar" @click="exibirHorariosModal = false" title="Voltar">&times;</button>
        </div>
        <div class="modal-body horarios-lista-container">
          <ul class="horarios-lista">
            <li v-for="horario in horariosDisponiveisFormatados" :key="horario">
              {{ horario }}
            </li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-cancelar" @click="exibirHorariosModal = false">Voltar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    backdrop-filter: blur(2px);
}

.modal-card {
    background: #ffffff;
    width: 100%;
    max-width: 480px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
    margin: 0;
    font-size: 16px;
    color: #333;
    font-weight: 600;
}

.btn-fechar {
    background: transparent;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    line-height: 1;
    transition: color 0.2s;
}

.btn-fechar:hover {
    color: #333;
}

.modal-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 13px;
    color: #555;
    font-weight: 500;
}

.form-group input[type="text"],
.form-group select,
.input-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #dcdcdc;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.form-group input[type="text"]:focus,
.input-group input:focus {
    border-color: #1a73e8;
    outline: none;
}

.form-group select:disabled {
    background-color: #f5f5f5;
    color: #666;
    cursor: not-allowed;
    opacity: 1;
}

.form-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.metade {
    flex: 1;
}

.input-group {
    display: flex;
    gap: 8px;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
}

.acoes-validacao {
    display: flex;
    align-items: center;
    gap: 10px;
}

.acoes-salvar {
    display: flex;
    gap: 12px;
}

.aviso-validar {
    font-size: 12px;
    color: #e74c3c;
    font-weight: 600;
}

.btn-validar {
    background: #fdf2f0;
    border: 1px solid #fadbd8;
    color: #c0392b;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-validar:hover {
    background: #fadbd8;
}

.btn-horarios {
    background: #f0f4f8;
    border: 1px solid #c2e7ff;
    color: #003366;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-horarios:hover {
    background: #eaf1fb;
}

.btn-cancelar {
    background: transparent;
    border: none;
    color: #1a73e8;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-cancelar:hover {
    background: #f0f4f8;
}

.btn-salvar {
    background: #1a73e8;
    border: none;
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 24px;
    border-radius: 6px;
    transition: background 0.2s;
}

.btn-salvar:hover:not(:disabled) {
    background: #1557b0;
}

.btn-salvar:disabled {
    background: #a0c1f2;
    cursor: not-allowed;
}

.horarios-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #ffffff;
    z-index: 10;
    display: flex;
    flex-direction: column;
}

.horarios-lista-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    margin: 0;
}

.horarios-lista {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.horarios-lista li {
    background: #f0f4f8;
    padding: 12px 16px;
    border-radius: 8px;
    color: #003366;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
    border: 1px solid #c2e7ff;
}
</style>