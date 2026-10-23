<!--
========
Este arquivo representa o componente de modal para criação e edição de reservas em uma agenda.
Ele gerencia o formulário de reserva, valida a disponibilidade de horários baseando-se na grade 
do recurso selecionado, permite ativar repetição semanal até uma data limite, disponibiliza slots
individuais para cada seção do formulário e salva os dados na API.
========
-->
<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { criarDataLocal } from '../composables/useGradeCompartilhada';

const api = inject('api-instance-agenda') as any;
const props = defineProps({
    modelValue: { type: Boolean, default: false },
    dadosIniciais: { type: Object, required: true },
    usaInterceptador: { type: Boolean, default: false },
    ocultarTituloModal: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'salvo', 'cancelado', 'before-save']);

const {
    minutosInicio, minutosFim, recursosDisponiveis, agendasDisponiveis,
    criarReserva, criarReservaRecorrente, converterParaUtc, reservasBrutas
} = useAgenda(api);

const salvando = ref(false);
const precisaValidar = ref(false);
const mostrarAjusteHorario = ref(false);
const repetirReserva = ref(false);
const exibirHorariosModal = ref(false);
const horariosDisponiveisFormatados = ref<string[]>([]);

const formReserva = ref({
    id_recurso: '',
    titulo_reserva: '',
    data_inicio: '',
    hora_inicio: '',
    data_fim: '',
    hora_fim: '',
    data_limite_repeticao: ''
});

const dataInicioLocal = computed(() => {
    if (!formReserva.value.data_inicio || formReserva.value.data_inicio.split('-').length !== 3) return null;
    const dt = criarDataLocal(formReserva.value.data_inicio);
    return isNaN(dt.getTime()) ? null : dt;
});

const textoDiaSelecionado = computed(() => {
    if (!dataInicioLocal.value) return formReserva.value.data_inicio || 'Data não definida';
    const diaSemana = dataInicioLocal.value.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    const dataBr = dataInicioLocal.value.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${diaSemanaCap}, ${dataBr}`;
});

const nomeDiaSemana = computed(() => {
    return dataInicioLocal.value ? dataInicioLocal.value.toLocaleDateString('pt-BR', { weekday: 'long' }) : 'semana';
});

const textoIntervaloHorario = computed(() => {
    return `Das ${formReserva.value.hora_inicio || '--:--'} até as ${formReserva.value.hora_fim || '--:--'}`;
});

const alternarAjusteHorario = () => { mostrarAjusteHorario.value = !mostrarAjusteHorario.value; };
const definirRepetirReserva = (valor: boolean) => { repetirReserva.value = valor; };

const marcarComoAlterado = () => {
    if (formReserva.value.data_inicio) {
        formReserva.value.data_fim = formReserva.value.data_inicio;
        if (formReserva.value.data_limite_repeticao && formReserva.value.data_limite_repeticao < formReserva.value.data_inicio) {
            formReserva.value.data_limite_repeticao = formReserva.value.data_inicio;
        }
    }
    precisaValidar.value = true;
};

const converterHoraParaMinutos = (horaStr: string) => {
    const [h, m] = horaStr.split(':').map(Number) as [number, number];
    return h * 60 + m;
};

// Localiza e ordena os períodos reserváveis do dia selecionado na agenda vinculada ao recurso.
const obterPeriodosReservaveisDoDia = () => {
    if (!formReserva.value.id_recurso || !dataInicioLocal.value) return null;

    const recurso = recursosDisponiveis.value.find((r: any) => Number(r.id_recurso) === Number(formReserva.value.id_recurso));
    const agenda = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(recurso?.id_agenda));
    const periodosAgenda = agenda?.detalhes?.periodos_agenda;
    if (!periodosAgenda) return null;

    const diaDaSemanaPython = (dataInicioLocal.value.getDay() + 6) % 7;
    const periodosDoDia = periodosAgenda[diaDaSemanaPython] || [];

    return periodosDoDia
        .filter((s: any) => s.reservavel_periodo)
        .map((s: any) => ({
            ...s,
            inicioMin: converterHoraParaMinutos(s.hora_inicio_periodo),
            fimMin: converterHoraParaMinutos(s.hora_fim_periodo)
        }))
        .sort((a: any, b: any) => a.inicioMin - b.inicioMin);
};

const mostrarHorariosPossiveis = () => {
    if (!formReserva.value.id_recurso || !formReserva.value.data_inicio) {
        alert("Selecione um recurso e uma data para ver os horários possíveis.");
        return;
    }

    const slotsReservaveis = obterPeriodosReservaveisDoDia();
    if (!slotsReservaveis) {
        alert("Nenhuma grade de horários encontrada.");
        return;
    }

    if (slotsReservaveis.length === 0) {
        alert("Nenhum horário disponível para este dia na grade.");
        return;
    }

    horariosDisponiveisFormatados.value = slotsReservaveis.map((s: any) => `${s.hora_inicio_periodo} às ${s.hora_fim_periodo}`);
    exibirHorariosModal.value = true;
};

const ajustarHorarios = (silencioso = false) => {
    if (!formReserva.value.id_recurso || !formReserva.value.data_inicio || !formReserva.value.hora_inicio || !formReserva.value.hora_fim) return;

    const slotsReservaveis = obterPeriodosReservaveisDoDia();
    if (!slotsReservaveis) return;

    if (slotsReservaveis.length === 0) {
        if (!silencioso) alert("Nenhum horário disponível para este dia na grade.");
        return;
    }

    const minInicio = converterHoraParaMinutos(formReserva.value.hora_inicio);
    const minFim = converterHoraParaMinutos(formReserva.value.hora_fim);

    const invertidos = [...slotsReservaveis].reverse();
    const blocoInicio = invertidos.find(b => b.inicioMin <= minInicio) || slotsReservaveis[0];
    const blocoFim = invertidos.find(b => b.inicioMin < minFim) || slotsReservaveis[0];

    const novoInicioMin = blocoInicio.inicioMin;
    const novoFimMin = blocoFim.fimMin <= novoInicioMin ? blocoInicio.fimMin : blocoFim.fimMin;

    const formatarMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    formReserva.value.hora_inicio = formatarMin(novoInicioMin);
    formReserva.value.hora_fim = formatarMin(novoFimMin);
    formReserva.value.data_fim = formReserva.value.data_inicio;
    precisaValidar.value = false;

    if (!silencioso) {
        alert("Horário validado e ajustado conforme a grade disponível.");
    }
};

watch(() => props.modelValue, (aberto) => {
    if (aberto && props.dadosIniciais) {
        const dataIni = props.dadosIniciais.data_inicio ?? '';
        formReserva.value = {
            id_recurso: props.dadosIniciais.id_recurso ?? '',
            titulo_reserva: props.dadosIniciais.titulo_reserva ?? '',
            data_inicio: dataIni,
            hora_inicio: props.dadosIniciais.hora_inicio ?? '',
            data_fim: props.dadosIniciais.data_fim || dataIni,
            hora_fim: props.dadosIniciais.hora_fim ?? '',
            data_limite_repeticao: dataIni
        };
        precisaValidar.value = false;
        mostrarAjusteHorario.value = false;
        repetirReserva.value = false;
        exibirHorariosModal.value = false;
        ajustarHorarios(true);
    }
});

const fecharModal = () => {
    emit('update:modelValue', false);
    emit('cancelado');
};

const executarCriacaoAPI = async (payloadParaEnviar: any) => {
    try {
        if (repetirReserva.value) {
            await criarReservaRecorrente({
                ...payloadParaEnviar,
                data_limite_repeticao: formReserva.value.data_limite_repeticao
            });
        } else {
            await criarReserva(payloadParaEnviar);
        }
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

const salvarReserva = async () => {
    if (precisaValidar.value) return;

    formReserva.value.data_fim = formReserva.value.data_inicio;

    const inicioNovaReserva = new Date(`${formReserva.value.data_inicio}T${formReserva.value.hora_inicio}`);
    const fimNovaReserva = new Date(`${formReserva.value.data_fim}T${formReserva.value.hora_fim}`);

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

    if (repetirReserva.value) {
        if (!formReserva.value.data_limite_repeticao) {
            alert("Informe a data final para a repetição do agendamento.");
            return;
        }
        if (formReserva.value.data_limite_repeticao < formReserva.value.data_inicio) {
            alert("A data final da repetição deve ser igual ou posterior à data inicial do agendamento.");
            return;
        }
    }

    const conflito = reservasBrutas.value.some((reserva: any) => {
        if (Number(reserva.id_recurso) !== Number(formReserva.value.id_recurso)) return false;
        const inicioEvento = new Date(reserva.data_inicio_reserva);
        const fimEvento = new Date(reserva.data_fim_reserva);
        return inicioNovaReserva < fimEvento && fimNovaReserva > inicioEvento;
    });

    if (conflito) {
        alert("Já existe uma reserva para este recurso no horário selecionado.");
        return;
    }

    salvando.value = true;

    const payloadBase: any = {
        id_recurso: Number(formReserva.value.id_recurso),
        titulo_reserva: formReserva.value.titulo_reserva.trim(),
        data_inicio_reserva: converterParaUtc(formReserva.value.data_inicio, formReserva.value.hora_inicio),
        data_fim_reserva: converterParaUtc(formReserva.value.data_fim, formReserva.value.hora_fim)
    };

    if (repetirReserva.value) {
        payloadBase.data_limite_repeticao = formReserva.value.data_limite_repeticao;
    }

    if (props.usaInterceptador) {
        emit('before-save', {
            payloadBase,
            dadosReserva: { ...formReserva.value, repetir_reserva: repetirReserva.value },
            proceed: (novoPayloadModificado: any) => {
                executarCriacaoAPI(novoPayloadModificado || payloadBase);
            },
            abort: (callbackAcaoCustomizada?: Function) => {
                salvando.value = false;
                if (typeof callbackAcaoCustomizada === 'function') callbackAcaoCustomizada();
            }
        });
    } else {
        await executarCriacaoAPI(payloadBase);
    }
};
</script>

<template>
  <div class="modal-overlay" v-if="modelValue" @mousedown.self="fecharModal">
    <div class="modal-card">
      <div class="modal-header">
        <h3>Nova Reserva</h3>
        <button class="btn-fechar" @click="fecharModal" title="Fechar">&times;</button>
      </div>

      <div class="modal-body">
        <slot
          name="topo-modal"
          :dados-reserva="formReserva"
          :texto-dia-selecionado="textoDiaSelecionado"
          :texto-intervalo-horario="textoIntervaloHorario"
        ></slot>

        <slot
          name="visualizacao-dados"
          :dados-reserva="formReserva"
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
            :recursos-disponiveis="recursosDisponiveis"
            :ocultar-titulo-modal="props.ocultarTituloModal"
          >
            <div class="form-group" v-if="!props.ocultarTituloModal">
              <label>Nome da Reserva (opcional)</label>
              <input type="text" v-model="formReserva.titulo_reserva" placeholder="Ex: Treinamento" autofocus />
            </div>

            <div class="form-group">
              <label>Calendário / Recurso</label>
              <select v-model="formReserva.id_recurso" disabled>
                <option v-for="rec in recursosDisponiveis" :key="rec.id_recurso" :value="rec.id_recurso">
                  {{ rec.nome_recurso }}
                </option>
              </select>
            </div>
          </slot>

          <slot
            name="campo-horario"
            :dados-reserva="formReserva"
            :texto-dia-selecionado="textoDiaSelecionado"
            :texto-intervalo-horario="textoIntervaloHorario"
            :mostrar-ajuste-horario="mostrarAjusteHorario"
            :alternar-ajuste-horario="alternarAjusteHorario"
            :precisa-validar="precisaValidar"
            :marcar-como-alterado="marcarComoAlterado"
            :ajustar-horarios="ajustarHorarios"
          >
            <div class="resumo-horario-box">
              <div class="resumo-horario-textos">
                <span class="resumo-label">Período selecionado</span>
                <div class="resumo-dia">{{ textoDiaSelecionado }}</div>
                <div class="resumo-horas">{{ textoIntervaloHorario }}</div>
              </div>

              <button
                type="button"
                class="btn-toggle-ajuste"
                @click="alternarAjusteHorario"
              >
                {{ mostrarAjusteHorario ? 'Ocultar ajuste' : 'Ajustar horário' }}
              </button>
            </div>

            <div class="painel-ajuste-horario" v-if="mostrarAjusteHorario">
              <div class="form-group">
                <label>Data do Agendamento</label>
                <input type="date" v-model="formReserva.data_inicio" @input="marcarComoAlterado" />
              </div>

              <div class="form-row-lado-a-lado">
                <div class="form-group metade">
                  <label>Início</label>
                  <input type="time" v-model="formReserva.hora_inicio" @input="marcarComoAlterado" />
                </div>

                <div class="form-group metade">
                  <label>Fim</label>
                  <input type="time" v-model="formReserva.hora_fim" @input="marcarComoAlterado" />
                </div>
              </div>
            </div>
          </slot>

          <slot
            name="campo-recorrencia"
            :dados-reserva="formReserva"
            :repetir-reserva="repetirReserva"
            :definir-repetir-reserva="definirRepetirReserva"
            :nome-dia-semana="nomeDiaSemana"
          >
            <div class="recorrencia-box">
              <label class="recorrencia-toggle">
                <input type="checkbox" v-model="repetirReserva" />
                <span class="recorrencia-titulo">Repetir agendamento semanalmente</span>
              </label>

              <div class="recorrencia-detalhes" v-if="repetirReserva">
                <div class="form-group">
                  <label>Repetir até o dia:</label>
                  <input
                    type="date"
                    v-model="formReserva.data_limite_repeticao"
                    :min="formReserva.data_inicio"
                  />
                </div>
                <span class="recorrencia-dica">
                  O agendamento será replicado toda <strong>{{ nomeDiaSemana }}</strong> das
                  <strong>{{ formReserva.hora_inicio }}</strong> às <strong>{{ formReserva.hora_fim }}</strong> até a data selecionada.
                </span>
              </div>
            </div>
          </slot>
        </slot>

        <div class="area-customizada">
          <slot
            name="campos-extras"
            :dados-reserva="formReserva"
            :texto-dia-selecionado="textoDiaSelecionado"
            :texto-intervalo-horario="textoIntervaloHorario"
          ></slot>
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
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; padding: 16px; box-sizing: border-box; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1050; backdrop-filter: blur(2px); }
.modal-card { background: var(--bg-modal); width: 100%; max-width: 500px; max-height: calc(100vh - 32px); border-radius: 12px; box-shadow: var(--shadow-float); display: flex; flex-direction: column; overflow: hidden; position: relative; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-light); background: var(--bg-primary); flex-shrink: 0; }
.modal-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 600; }
.btn-fechar { background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; line-height: 1; transition: color 0.2s; }
.btn-fechar:hover { color: var(--text-primary); }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; background: var(--bg-primary); flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.form-group input[type="text"],
.form-group input[type="date"],
.form-group input[type="time"],
.form-group select { width: 100%; padding: 10px; border: 1px solid var(--border-light); background: var(--bg-primary); border-radius: 6px; font-size: 14px; color: var(--text-primary); box-sizing: border-box; transition: border-color 0.2s; }
.form-group input:focus { border-color: var(--color-brand); outline: none; }
.form-group select:disabled { background-color: var(--bg-secondary); color: var(--text-secondary); cursor: not-allowed; opacity: 1; }
.resumo-horario-box { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 8px; background: var(--bg-secondary); border: 1px solid var(--border-light); flex-shrink: 0; }
.resumo-horario-textos { display: flex; flex-direction: column; gap: 2px; }
.resumo-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--text-secondary); }
.resumo-dia { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.resumo-horas { font-size: 13px; font-weight: 600; color: var(--color-brand); }
.btn-toggle-ajuste { background: var(--bg-primary); border: 1px solid var(--border-light); color: var(--text-primary); font-weight: 600; font-size: 12.5px; padding: 7px 12px; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.btn-toggle-ajuste:hover { background: var(--bg-hover); border-color: var(--color-brand); color: var(--color-brand); }
.painel-ajuste-horario { display: flex; flex-direction: column; gap: 12px; padding: 12px 14px; border-radius: 8px; background: var(--bg-secondary); border: 1px dashed var(--border-light); flex-shrink: 0; }
.form-row-lado-a-lado { display: flex; flex-direction: row; gap: 12px; }
.metade { flex: 1; min-width: 0; }
.recorrencia-box { display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; border-radius: 8px; background: var(--bg-secondary); border: 1px solid var(--border-light); flex-shrink: 0; }
.recorrencia-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.recorrencia-toggle input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-brand); cursor: pointer; }
.recorrencia-titulo { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.recorrencia-detalhes { display: flex; flex-direction: column; gap: 8px; padding-top: 6px; border-top: 1px solid var(--border-light); }
.recorrencia-dica { font-size: 12px; color: var(--text-secondary); line-height: 1.4; }
.modal-footer { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid var(--border-light); background: var(--bg-secondary); flex-shrink: 0; }
.acoes-validacao { display: flex; align-items: center; gap: 10px; }
.acoes-salvar { display: flex; gap: 12px; }
.aviso-validar { font-size: 12px; color: var(--color-danger); font-weight: 600; }
.btn-validar { background: transparent; border: 1px solid var(--color-danger); color: var(--color-danger); font-weight: 600; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: background 0.2s; }
.btn-validar:hover { background: rgba(239, 68, 68, 0.1); }
.btn-horarios { background: var(--bg-primary); border: 1px solid var(--border-light); color: var(--text-primary); font-weight: 600; font-size: 13px; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: background 0.2s; }
.btn-horarios:hover { background: var(--bg-hover); }
.btn-cancelar { background: transparent; border: none; color: var(--color-brand); font-weight: 600; font-size: 14px; cursor: pointer; padding: 8px 16px; border-radius: 6px; transition: background 0.2s; }
.btn-cancelar:hover { background: var(--color-brand-light); }
.btn-salvar { background: var(--color-brand); border: none; color: var(--text-inverse); font-weight: 600; font-size: 14px; cursor: pointer; padding: 8px 24px; border-radius: 6px; transition: background 0.2s; }
.btn-salvar:hover:not(:disabled) { filter: brightness(0.9); }
.btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }
.horarios-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: var(--bg-primary); z-index: 10; display: flex; flex-direction: column; overflow: hidden; }
.horarios-lista-container { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 20px; margin: 0; }
.horarios-lista { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.horarios-lista li { background: var(--bg-secondary); padding: 12px 16px; border-radius: 8px; color: var(--text-primary); font-weight: 500; font-size: 14px; text-align: center; border: 1px solid var(--border-light); }
</style>

<style>
[data-bs-theme="dark"] .modal-card .btn-salvar,
[data-bs-theme="dark"] .modal-card .btn-cancelar {
    color: #ffffff !important;
    font-weight: bold;
}
[data-bs-theme="dark"] .modal-card .btn-salvar {
    background: color-mix(in srgb, var(--color-brand) 70%, black) !important;
}
</style>