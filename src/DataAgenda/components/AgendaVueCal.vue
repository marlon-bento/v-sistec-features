<!--
========
Este arquivo representa o componente de calendário visual utilizando a biblioteca vue-cal.
Ele exibe e gerencia os eventos e reservas na interface, permitindo a criação de novos agendamentos,
a abertura do modal de detalhes ao clicar em reservas existentes, a navegação entre datas e a exposição
da lista contendo o recurso atualmente em exibição.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { ref, computed, inject } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';
import { useAgenda } from '../composables/useAgenda';
import { extrairDataHoraLocal, formatarDataIso } from '../composables/useGradeCompartilhada';
import ModalReserva from './ModalReserva.vue';
import ModalDetalhesReserva from './ModalDetalhesReserva.vue';

const api = inject('api-instance-agenda') as any;

const props = defineProps({
    usaInterceptador: { type: Boolean, default: false },
    usuarioLogado: { type: String, default: '' },
    tituloPadrao: { type: String, default: '' },
    ocultarTituloModal: { type: Boolean, default: false }
});

defineEmits(['before-save']);

const {
    reservasBrutas,
    recursosDisponiveis,
    recursoSelecionado,
    dataSelecionada,
    dataVisao,
    visaoAtiva,
    minutosInicio,
    minutosFim,
    datasDesabilitadas,
    buscarReservas
} = useAgenda(api);

const calendarioRef = ref<any>(null);
const modalAberto = ref(false);
const resolverCriacaoVueCal = ref<any>(null);
const dadosParaModal = ref({});
const modalDetalhesAberto = ref(false);
const reservaSelecionadaDetalhes = ref<any>(null);

const recursosEmExibicao = computed(() => {
    if (!recursoSelecionado.value) return [];
    const encontrado = recursosDisponiveis.value.find(
        (r: any) => Number(r.id_recurso) === Number(recursoSelecionado.value)
    );
    return encontrado ? [encontrado] : [];
});

defineExpose({
    recursosEmExibicao,
    irParaHoje: () => calendarioRef.value?.view?.goToToday(),
    periodoAnterior: () => calendarioRef.value?.view?.previous(),
    periodoProximo: () => calendarioRef.value?.view?.next(),
    mudarVisao: (v: string) => { visaoAtiva.value = v; calendarioRef.value?.view?.switch(v); }
});

const atualizarVisualizacao = (evento: any = null) => {
    let dataInicio: Date;
    let dataFim: Date;

    if (evento?.startDate && evento?.endDate) {
        dataInicio = new Date(evento.startDate);
        dataFim = new Date(evento.endDate);
    } else {
        const d = new Date(dataVisao.value || dataSelecionada.value || new Date());
        if (visaoAtiva.value === 'day') {
            dataInicio = new Date(d);
            dataFim = new Date(d);
        } else {
            const diaSemana = d.getDay();
            dataInicio = new Date(d);
            dataInicio.setDate(d.getDate() - diaSemana);
            dataFim = new Date(d);
            dataFim.setDate(d.getDate() + (6 - diaSemana));
        }
    }

    buscarReservas(`${formatarDataIso(dataInicio)}T00:00:00`, `${formatarDataIso(dataFim)}T23:59:59`);
};

const aoCriarEvento = ({ event, resolve }: any) => {
    resolverCriacaoVueCal.value = resolve;

    let start = typeof event.start === 'string' ? new Date(event.start.replace(' ', 'T')) : new Date(event.start);
    let end = typeof event.end === 'string' ? new Date(event.end.replace(' ', 'T')) : new Date(event.end);

    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) end = new Date();

    const inicio = extrairDataHoraLocal(start.toISOString());
    const fim = extrairDataHoraLocal(end.toISOString());

    dadosParaModal.value = {
        id_recurso: recursoSelecionado.value,
        titulo_reserva: '',
        data_inicio: inicio.data,
        hora_inicio: inicio.hora,
        data_fim: fim.data,
        hora_fim: fim.hora
    };

    modalAberto.value = true;
};

const aoClicarEvento = (eventoVueCal: any) => {
    const idClicado = eventoVueCal?.id || eventoVueCal?.event?.id;
    if (!idClicado) return;

    const encontrada = reservasBrutas.value.find(
        (r: any) => String(r.codigo_referencia_reserva) === String(idClicado)
    );

    if (encontrada) {
        reservaSelecionadaDetalhes.value = encontrada;
        modalDetalhesAberto.value = true;
    }
};

const encerrarCriacaoProvisoria = () => {
    if (resolverCriacaoVueCal.value) {
        resolverCriacaoVueCal.value(false);
        resolverCriacaoVueCal.value = null;
    }
};

const aoSalvar = () => {
    encerrarCriacaoProvisoria();
    atualizarVisualizacao();
};

type FormatoDataVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number} ${number}${number}:${number}${number}`;

const eventosProcessados = computed(() => {
    if (!recursoSelecionado.value) return [];

    return reservasBrutas.value
        .filter(reserva => Number(reserva.id_recurso) === Number(recursoSelecionado.value))
        .map(reserva => {
            const identificadorAutor = reserva.email_responsavel_reserva || reserva.usuario_responsavel_reserva;
            const ehMeu = Boolean(
                identificadorAutor &&
                props.usuarioLogado &&
                String(identificadorAutor).toLowerCase() === props.usuarioLogado.toLowerCase()
            );
            const ini = extrairDataHoraLocal(reserva.data_inicio_reserva);
            const fim = extrairDataHoraLocal(reserva.data_fim_reserva);

            return {
                id: reserva.codigo_referencia_reserva,
                title: String(reserva.titulo_reserva || '').trim() || props.tituloPadrao,
                start: `${ini.data} ${ini.hora}` as FormatoDataVueCal,
                end: `${fim.data} ${fim.hora}` as FormatoDataVueCal,
                id_recurso: reserva.id_recurso,
                draggable: ehMeu,
                resizable: ehMeu,
                deletable: ehMeu,
                class: ehMeu ? 'reserva-minha' : 'reserva-bloqueada'
            };
        });
});

const ehDataSelecionada = (data: any) => {
    if (!dataSelecionada.value || !data) return false;
    return new Date(data).toDateString() === new Date(dataSelecionada.value).toDateString();
};

const obterNomeDiaCurto = (data: Date) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];

const horasBloqueadasNativas = computed(() => {
    const bloqueios = [
        { from: 0, to: minutosInicio.value, allowEvents: false, class: 'fora-do-expediente' },
        { from: minutosFim.value, to: 24 * 60, allowEvents: false, class: 'fora-do-expediente' }
    ];
    return { mon: bloqueios, tue: bloqueios, wed: bloqueios, thu: bloqueios, fri: bloqueios, sat: bloqueios, sun: bloqueios };
});
</script>

<template>
    <div class="wrapper-calendario">
        <ModalReserva
            v-model="modalAberto"
            :dados-iniciais="dadosParaModal"
            :usa-interceptador="usaInterceptador"
            :ocultar-titulo-modal="props.ocultarTituloModal"
            @before-save="$emit('before-save', $event)"
            @salvo="aoSalvar"
            @cancelado="encerrarCriacaoProvisoria"
        >
            <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
                <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
            </template>
        </ModalReserva>

        <ModalDetalhesReserva
            v-model="modalDetalhesAberto"
            :reserva="reservaSelecionadaDetalhes"
            :titulo-padrao="props.tituloPadrao"
            @excluido="atualizarVisualizacao"
        />

        <vue-cal
            ref="calendarioRef"
            class="calendario-principal vuecal--blue-theme"
            :events="eventosProcessados"
            v-model:active-view="visaoAtiva"
            v-model:selected-date="dataSelecionada"
            v-model:view-date="dataVisao"
            @update:view-date="dataVisao = $event"
            :views="['day', 'week']"
            :hide-view-selector="true"
            :hide-title-bar="true"
            :click-to-navigate="false"
            locale="pt-br"
            :time-from="minutosInicio"
            :time-to="minutosFim"
            :disable-days="datasDesabilitadas"
            :special-hours="horasBloqueadasNativas"
            :snap-to-interval="15"
            :start-week-on-sunday="true"
            :editable-events="{ drag: true, resize: true, delete: true, create: true }"
            @ready="atualizarVisualizacao"
            @view-change="atualizarVisualizacao"
            @event-create="aoCriarEvento"
            @event-click="aoClicarEvento"
        >
            <template #weekday-heading="{ date }">
                <div class="cabecalho-dia-customizado" @click="dataSelecionada = date; dataVisao = date" style="cursor: pointer;">
                    <span class="nome-dia">{{ obterNomeDiaCurto(date) }}</span>
                    <span
                        class="numero-dia"
                        :class="{ 'dia-hoje': date.toDateString() === new Date().toDateString(), 'dia-selecionado': ehDataSelecionada(date) }"
                    >
                        {{ date.getDate() }}
                    </span>
                </div>
            </template>
        </vue-cal>
    </div>
</template>

<style scoped>
.wrapper-calendario { display: flex; flex-direction: column; flex-grow: 1; height: 100%; overflow: hidden; background: var(--bg-primary); }
.calendario-principal { --vuecal-weekday-bar-size: 75px !important; background: var(--bg-primary); flex-grow: 1; height: 100%; overflow: hidden; border-radius: 0 !important; border: none !important; box-shadow: none !important; }
:deep(.vuecal__header), :deep(.vuecal__title-bar) { display: none !important; }
:deep(.vuecal__weekdays-headings) { border-bottom: 1px solid var(--border-light); background-color: var(--bg-primary); color: var(--text-primary); }
:deep(.vuecal__weekday) { background-color: var(--bg-primary); justify-content: center; border-right: 1px solid var(--border-light); padding: 0; }
:deep(.vuecal__weekday:last-child) { border-right: none; }
.cabecalho-dia-customizado { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; padding: 8px 0; }
.nome-dia { font-size: 13px; color: var(--text-secondary); margin-bottom: 2px; font-weight: 500; }
.numero-dia { font-size: 22px; color: var(--text-primary); font-weight: 400; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid transparent; transition: all 0.2s ease; }
.numero-dia.dia-hoje { background-color: var(--bg-hover); border-color: transparent; color: var(--color-brand); }
.numero-dia.dia-hoje.dia-selecionado { background-color: var(--color-brand-light); color: var(--color-brand); }
.numero-dia:not(.dia-hoje).dia-selecionado { background-color: var(--bg-secondary); border-color: transparent; color: var(--text-primary); }
:deep(.vuecal__scrollable-wrap), :deep(.vuecal__scrollable) { padding-top: 0 !important; margin-top: 0 !important; }
:deep(.vuecal__cell--disabled) { background-color: var(--bg-secondary) !important; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.02) 10px, rgba(0, 0, 0, 0.02) 20px) !important; cursor: not-allowed !important; pointer-events: none; border: 1px solid var(--border-light); }
:deep(.vuecal__special-hours.fora-do-expediente) { background-color: var(--bg-secondary); background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.02) 10px, rgba(0, 0, 0, 0.02) 20px); pointer-events: none; }
:deep(.vuecal__cell--selected) { background-color: var(--color-brand-light) !important; }
:deep(.vuecal__cell--today) { background-color: var(--bg-hover) !important; }
:deep(.vuecal__event) { background-color: var(--color-brand) !important; color: var(--text-inverse) !important; border: 1px solid var(--border-focus) !important; border-radius: 4px; box-shadow: var(--shadow-sm); padding: 4px; transition: all 0.2s ease; cursor: pointer !important; }
:deep(.vuecal__event:hover), :deep(.vuecal__event--focus) { box-shadow: var(--shadow-float); filter: brightness(1.1); }
:deep(.vuecal__event.reserva-minha) { background-color: var(--color-success) !important; border-color: var(--color-success) !important; color: var(--text-inverse) !important; }
:deep(.vuecal__event.reserva-bloqueada) { background-color: var(--border-editor) !important; border-color: var(--border-light) !important; color: var(--text-primary) !important; font-weight: bold; opacity: 0.75; cursor: pointer !important; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.1) 10px, rgba(0, 0, 0, 0.1) 20px) !important; }
:deep(.vuecal__time-column) { background-color: var(--bg-primary) !important; border-right: 1px solid var(--border-editor) !important; }
:deep(.vuecal__time-cell) { color: var(--text-secondary) !important; }
:deep(.vuecal__time-cell-line::before) { border-color: var(--border-editor) !important; }
:deep(.vuecal__cell) { background-color: transparent !important; border-right: 1px solid var(--border-editor) !important; }
:deep(.vuecal__now-line), :deep(.vuecal__now-line span) { color: var(--text-primary) !important; }
:deep(.vuecal__cell::before) { border-color: var(--border-light) !important; }
</style>