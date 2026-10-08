<!-- 
========
Este arquivo representa o componente de calendário visual utilizando a biblioteca vue-cal.
Ele exibe e gerencia os eventos e reservas na interface, permitindo interações como 
criação, visualização de disponibilidade e navegação entre datas.
========
-->
<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { VueCal } from 'vue-cal';
import 'vue-cal/style.css';
import { useAgenda } from '../composables/useAgenda';
import ModalReserva from './ModalReserva.vue';
const api = inject('api-instance-agenda') as any
const props = defineProps({
    usaInterceptador: { type: Boolean, default: false },
    // Recebe o identificador do usuário autenticado (e-mail ou username) da aplicação principal.
    usuarioLogado: { type: String, default: '' }
});

const emit = defineEmits(['before-save']);
const {
    reservasBrutas, recursoSelecionado, dataSelecionada, dataVisao,
    visaoAtiva, minutosInicio, minutosFim, datasDesabilitadas,
    buscarReservas
} = useAgenda(api);

// Armazena a referência direta à instância do componente vue-cal.
const calendarioRef = ref<any>(null);

// Controla o estado de visibilidade da janela modal de reservas.
const modalAberto = ref(false);

// Armazena a função de resolução interna (Promise) fornecida pelo vue-cal durante a criação de um evento.
const resolverCriacaoVueCal = ref<any>(null); 

// Armazena os dados base processados do clique no calendário para preencher o formulário do modal.
const dadosParaModal = ref({});

defineExpose({
    irParaHoje: () => calendarioRef.value?.view?.goToToday(),
    periodoAnterior: () => calendarioRef.value?.view?.previous(),
    periodoProximo: () => calendarioRef.value?.view?.next(),
    mudarVisao: (v: string) => { visaoAtiva.value = v; calendarioRef.value?.view?.switch(v); }
});

// Recebe um objeto de evento opcional. Retorna nada.
// Usada para identificar o período visível atual no calendário e disparar a busca de reservas na API para essas datas.
const atualizarVisualizacao = (evento: any = null) => {
    let dataInicio: Date;
    let dataFim: Date;

    if (evento && evento.startDate && evento.endDate) {
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

    const formatar = (d: Date) => {
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };

    buscarReservas(`${formatar(dataInicio)}T00:00:00`, `${formatar(dataFim)}T23:59:59`);
};

// Recebe um objeto Date. Retorna uma string no formato YYYY-MM-DD.
// Usada para converter datas do sistema para o formato aceito pelos inputs nativos de data do HTML.
const formatarDataInput = (d: Date) => {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// Recebe um objeto Date. Retorna uma string no formato HH:mm.
// Usada para extrair e formatar as horas preenchendo os inputs nativos de tempo do HTML.
const formatarHoraInput = (d: Date) => {
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
};

// Recebe um objeto contendo o evento disparado pelo vue-cal e a função de resolução. Retorna nada.
// Usada para interceptar a intenção de agendamento na interface visual, capturar as datas clicadas e abrir o modal correspondente.
const aoCriarEvento = ({ event, resolve }: any) => {
    resolverCriacaoVueCal.value = resolve;

    let start = typeof event.start === 'string' ? new Date(event.start.replace(' ', 'T')) : new Date(event.start);
    let end = typeof event.end === 'string' ? new Date(event.end.replace(' ', 'T')) : new Date(event.end);

    if (isNaN(start.getTime())) start = new Date();
    if (isNaN(end.getTime())) end = new Date();

    dadosParaModal.value = {
        resourceId: recursoSelecionado.value,
        title: '',
        startDate: formatarDataInput(start),
        startTime: formatarHoraInput(start),
        endDate: formatarDataInput(end),
        endTime: formatarHoraInput(end)
    };

    modalAberto.value = true;
};

// Recebe nada. Retorna nada.
// Usada para finalizar e limpar a promessa pendente do calendário e recarregar os dados após um salvamento na API.
const aoSalvar = () => {
    if (resolverCriacaoVueCal.value) {
        resolverCriacaoVueCal.value(false);
        resolverCriacaoVueCal.value = null;
    }
    atualizarVisualizacao();
};

// Recebe nada. Retorna nada.
// Usada para abortar a criação do bloco visual no calendário quando o usuário fecha o modal de reserva.
const aoCancelar = () => {
    if (resolverCriacaoVueCal.value) {
        resolverCriacaoVueCal.value(false); 
        resolverCriacaoVueCal.value = null;
    }
};

type FormatoDataVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number} ${number}${number}:${number}${number}`;

// Recebe um array com as reservas retornadas pela API. Retorna um array de objetos estruturados.
// Usada para traduzir o modelo de dados externo para a estrutura que o vue-cal exige, determinando cores e permissões com base no usuário logado.
const mapearEventosVisuais = (reservas: any[]) => {
    const formatarDataLocal = (dataIsoUtc: string): FormatoDataVueCal => {
        const d = new Date(dataIsoUtc);
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        const horas = String(d.getHours()).padStart(2, '0');
        const minutos = String(d.getMinutes()).padStart(2, '0');
        return `${ano}-${mes}-${dia} ${horas}:${minutos}` as FormatoDataVueCal;
    };

    return reservas.map(reserva => {
        const emailReserva = reserva.emailAddress || reserva.email || reserva.userName;
        const ehMeu = Boolean(emailReserva && props.usuarioLogado && emailReserva.toLowerCase() === props.usuarioLogado.toLowerCase());
        
        return {
            id: reserva.referenceNumber,
            title: reserva.title || 'Reserva',
            start: formatarDataLocal(reserva.startDate),
            end: formatarDataLocal(reserva.endDate),
            resourceId: reserva.resourceId,
            draggable: ehMeu,
            resizable: ehMeu,
            deletable: ehMeu,
            class: ehMeu ? 'reserva-minha' : 'reserva-bloqueada'
        };
    });
};

// Armazena a listagem reativa das reservas mapeadas para o calendário e filtradas pelo recurso atual.
const eventosProcessados = computed(() => {
    if (!recursoSelecionado.value) return [];
    
    return mapearEventosVisuais(reservasBrutas.value).filter(evento => 
        Number(evento.resourceId) === Number(recursoSelecionado.value)
    );
});

// Recebe um valor representando uma data. Retorna um booleano.
// Usada para destacar o dia atual selecionado no estado da aplicação quando visualizado no cabeçalho do calendário.
const ehDataSelecionada = (data: any) => {
    if (!dataSelecionada.value || !data) return false;
    const dSelecionada = new Date(dataSelecionada.value);
    const dCabecalho = new Date(data);
    return dCabecalho.toDateString() === dSelecionada.toDateString();
};

// Recebe um objeto Date. Retorna uma string.
// Usada para extrair o nome curto do dia da semana (ex: Seg, Ter) para compor a interface.
const obterNomeDiaCurto = (data: Date) => {
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];
};

// Armazena a definição estrutural das horas do dia que não aceitam reservas.
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
      @before-save="$emit('before-save', $event)"
      @salvo="aoSalvar"
      @cancelado="aoCancelar"
    >
      <template #campos-extras>
        <slot name="campos-extras"></slot>
      </template>
    </ModalReserva>

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
    >
      <template #weekday-heading="{ date }">
        <div
          class="cabecalho-dia-customizado"
          @click="dataSelecionada = date; dataVisao = date"
          style="cursor: pointer;"
        >
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
:deep(.vuecal__event) { background-color: var(--color-brand) !important; color: var(--text-inverse) !important; border: 1px solid var(--border-focus) !important; border-radius: 4px; box-shadow: var(--shadow-sm); padding: 4px; transition: all 0.2s ease; }
:deep(.vuecal__event:hover), :deep(.vuecal__event--focus) { box-shadow: var(--shadow-float); filter: brightness(1.1); }
:deep(.vuecal__event.reserva-minha) { background-color: var(--color-success) !important; border-color: var(--color-success) !important; color: var(--text-inverse) !important; }
:deep(.vuecal__event.reserva-bloqueada) { background-color: var(--border-editor) !important; border-color: var(--border-light) !important; color: var(--text-primary) !important; font-weight: bold; opacity: 0.75; cursor: not-allowed !important; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0, 0, 0, 0.1) 10px, rgba(0, 0, 0, 0.1) 20px) !important; }
/* Correção da coluna de horas lateral */
:deep(.vuecal__time-column) {
    background-color: var(--bg-primary) !important;
    border-right: 1px solid var(--border-editor) !important;
}
:deep(.vuecal__time-cell) {
    color: var(--text-secondary) !important;
}
:deep(.vuecal__time-cell-line::before),
:deep(.vuecal__cell::before) {
    border-color: var(--border-editor) !important;
}
/* Garante que o fundo das células normais não puxe o branco padrão */
:deep(.vuecal__cell) {
    background-color: transparent !important;
    border-right: 1px solid var(--border-editor) !important;
}

:deep(.vuecal__now-line) {
    color: var(--text-primary) !important;
}
:deep(.vuecal__now-line span) {
    color: var(--text-primary) !important;
}
:deep(.vuecal__cell::before) {
    border-color: var(--border-light) !important;
}
</style>