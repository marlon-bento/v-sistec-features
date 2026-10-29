<!--
========
Este arquivo atua como controlador de regras de negócio para o modo calendário.
Ele converte as reservas da API para o formato aceito pela GradeVueCal, gerencia a busca por período
e controla a abertura dos modais de criação, edição e detalhes de reserva.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { ref, computed } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { extrairDataHoraLocal, formatarDataIso, montarDadosModalParaEdicao } from '../composables/useGradeCompartilhada';
import GradeVueCal from './Grades/GradeVueCal.vue';
import ModalReserva from './ModalReserva.vue';
import ModalDetalhesReserva from './ModalDetalhesReserva.vue';

const {
    configEntrada,
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
} = useAgenda();

const gradeCalendarioRef = ref<any>(null);
const modalAberto = ref(false);
const resolverCriacaoVueCal = ref<any>(null);
const dadosParaModal = ref({});
const modalDetalhesAberto = ref(false);
const reservaSelecionadaDetalhes = ref<any>(null);

const abrirEdicaoDeReserva = (reserva: any) => {
    if (!reserva) return;
    modalDetalhesAberto.value = false;
    dadosParaModal.value = montarDadosModalParaEdicao(reserva);
    modalAberto.value = true;
};

const recursosEmExibicao = computed(() => {
    if (!recursoSelecionado.value) return [];
    const encontrado = recursosDisponiveis.value.find(
        (r: any) => Number(r.id_recurso) === Number(recursoSelecionado.value)
    );
    return encontrado ? [encontrado] : [];
});

defineExpose({
    recursosEmExibicao,
    irParaHoje: () => gradeCalendarioRef.value?.irParaHoje(),
    periodoAnterior: () => gradeCalendarioRef.value?.periodoAnterior(),
    periodoProximo: () => gradeCalendarioRef.value?.periodoProximo(),
    mudarVisao: (v: string) => gradeCalendarioRef.value?.mudarVisao(v)
});

// Calcula a janela de datas ativa e solicita as reservas na API.
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

// Prepara os dados iniciais ao arrastar na grade e abre o ModalReserva.
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

// Localiza a reserva clicada pelo código de referência e abre o modal de detalhes.
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

// Converte as reservas brutas do recurso selecionado para o formato de exibição da GradeVueCal.
const eventosProcessados = computed(() => {
    if (!recursoSelecionado.value) return [];

    return reservasBrutas.value
        .filter(reserva => Number(reserva.id_recurso) === Number(recursoSelecionado.value))
        .map(reserva => {
            const identificadorAutor = reserva.email_responsavel_reserva || reserva.usuario_responsavel_reserva;
            const ehMeu = Boolean(
                identificadorAutor &&
                configEntrada.usuarioLogado &&
                String(identificadorAutor).toLowerCase() === configEntrada.usuarioLogado.toLowerCase()
            );
            const ini = extrairDataHoraLocal(reserva.data_inicio_reserva);
            const fim = extrairDataHoraLocal(reserva.data_fim_reserva);

            return {
                id: reserva.codigo_referencia_reserva,
                title: String(reserva.titulo_reserva || '').trim() || configEntrada.tituloPadrao,
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
</script>

<template>
    <div class="wrapper-calendario">
        <ModalReserva
            v-model="modalAberto"
            :dados-iniciais="dadosParaModal"
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
            @editar="abrirEdicaoDeReserva"
            @excluido="atualizarVisualizacao"
        />

        <GradeVueCal
            ref="gradeCalendarioRef"
            :eventos="eventosProcessados"
            v-model:visao-ativa="visaoAtiva"
            v-model:data-selecionada="dataSelecionada"
            v-model:data-visao="dataVisao"
            :minutos-inicio="minutosInicio"
            :minutos-fim="minutosFim"
            :datas-desabilitadas="datasDesabilitadas"
            @pronto="atualizarVisualizacao"
            @mudar-periodo="atualizarVisualizacao"
            @criar-evento="aoCriarEvento"
            @clicar-evento="aoClicarEvento"
        />
    </div>
</template>

<style scoped>
.wrapper-calendario {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    background: var(--bg-primary);
}
</style>