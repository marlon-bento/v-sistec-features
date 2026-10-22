<!--
========
Este arquivo representa o componente base da visão em matriz horizontal ('tabela').
Ele ordena a semana a partir do dia inicial da agenda, exibe a barra de data seguida pelos horários
daquele dia em cada bloco diário, utiliza o componente genérico BlocoArrastavel para seleção horizontal
e mescla células de reservas contínuas com colspan.
========
-->
<script setup lang="ts">
import { computed, onMounted, watch, ref, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useCoresAgenda } from '../composables/useCoresAgenda';
import { useSelecaoArrasto } from '../composables/useSelecaoArrasto';
import BlocoArrastavel from './BlocoArrastavel.vue';
import ModalReserva from './ModalReserva.vue';
import ModalDetalhesReserva from './ModalDetalhesReserva.vue';

interface MetadadoColuna {
    corFundo: string | null;
    corBorda: string;
    fimDeSubbloco: boolean;
    fimDeBlocoPrincipal: boolean;
}

const props = defineProps<{
    idsRecursosVisiveis: string[];
    usaInterceptador?: boolean;
    tituloPadrao?: string;
    ocultarTituloModal?: boolean;
    mensagemVazio?: string;
    configuracaoBlocos?: any;
}>();

const api = inject('api-instance-agenda') as any;
const emit = defineEmits(['before-save']);

const {
    dadosMatrix,
    buscarSlotsMatrix,
    buscarReservas,
    agendasDisponiveis,
    agendaSelecionada,
    dataSelecionada,
    converterParaUtc
} = useAgenda(api);

const {  obterCoresBloco } = useCoresAgenda();

// Lista de siglas dos dias da semana ordenada conforme o retorno de Date.getDay() do JavaScript (0=DOM a 6=SAB).
const SIGLAS_DIAS_JS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

// Indica se a matriz está buscando e processando dados na API.
const carregando = ref(false);

// Controla a abertura do modal de criação de reserva.
const modalAberto = ref(false);

// Armazena os dados do slot ou intervalo selecionado para preencher o modal de criação.
const dadosParaModal = ref({});

// Controla a abertura do modal de detalhes de uma reserva existente.
const modalDetalhesAberto = ref(false);

// Armazena o objeto da reserva clicada para exibição no modal de detalhes.
const reservaSelecionadaDetalhes = ref<any>(null);

// Recebe uma string ISO UTC e devolve objeto com data (YYYY-MM-DD) e hora (HH:MM) locais.
// É usada para converter os limites dos slots selecionados para o formato esperado pelo ModalReserva.
const extrairDataHoraLocal = (isoString: string) => {
    const d = new Date(isoString);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return { data: `${ano}-${mes}-${dia}`, hora: `${horas}:${min}` };
};

// Instância do controlador genérico de arrasto configurada para operar nas linhas horizontais da matriz.
const controladorArrastoHorizontal = useSelecaoArrasto({
    aoClicarItemIndisponivel: (item) => {
        if (item?.slot?.reservado_slot && item?.slot?.detalhes_reserva) {
            reservaSelecionadaDetalhes.value = item.slot.detalhes_reserva;
            modalDetalhesAberto.value = true;
        }
    },
    aoFinalizarSelecao: ({ itensSelecionados }) => {
        const primeiro = itensSelecionados[0];
        const ultimo = itensSelecionados[itensSelecionados.length - 1];
        if (!primeiro?.slot || !ultimo?.slot) return;

        const inicio = extrairDataHoraLocal(primeiro.slot.data_inicio_slot);
        const fim = extrairDataHoraLocal(ultimo.slot.data_fim_slot);

        dadosParaModal.value = {
            id_recurso: Number(primeiro.idRecurso),
            titulo_reserva: '',
            data_inicio: inicio.data,
            hora_inicio: inicio.hora,
            data_fim: fim.data,
            hora_fim: fim.hora
        };

        modalAberto.value = true;
    }
});

// Calcula a data de início da semana (Segunda-feira por padrão) com base na data selecionada.
const obterInicioDaSemana = (dataRef: Date, idAgenda: number | null) => {
    const d = new Date(dataRef.getFullYear(), dataRef.getMonth(), dataRef.getDate());
    const agendaObj = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(idAgenda));
    const diaInicioPython = agendaObj?.detalhes?.dia_inicio_semana_agenda ?? 0;
    const diaInicioJs = (diaInicioPython + 1) % 7;
    const diff = (d.getDay() - diaInicioJs + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
};

// Busca os slots da matriz e as reservas correspondentes à semana ordenada a partir do dia inicial da agenda.
const dispararBuscaMatrix = async () => {
    const idAgenda = agendaSelecionada.value;
    if (!idAgenda) return;

    carregando.value = true;

    const valorData = dataSelecionada.value || new Date();
    let dataBase: Date;

    if (typeof valorData === 'string') {
        const apenasData = String(valorData).substring(0, 10);
        const [ano, mes, dia] = apenasData.split('-');
        dataBase = new Date(Number(ano), Number(mes) - 1, Number(dia));
    } else {
        dataBase = new Date(valorData);
    }

    const dataInicio = obterInicioDaSemana(dataBase, idAgenda);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + 6);

    const formatar = (dt: Date) => {
        const ano = dt.getFullYear();
        const mes = String(dt.getMonth() + 1).padStart(2, '0');
        const dia = String(dt.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    };

    const strInicio = formatar(dataInicio);
    const strFim = formatar(dataFim);

    const inicioUtc = encodeURIComponent(converterParaUtc(strInicio, '00:00'));
    const fimUtc = encodeURIComponent(converterParaUtc(strFim, '23:59'));

    await buscarSlotsMatrix(idAgenda, inicioUtc, fimUtc);
    await buscarReservas(`${strInicio}T00:00:00`, `${strFim}T23:59:59`);
    carregando.value = false;
};

onMounted(() => {
    dispararBuscaMatrix();
});

watch([dataSelecionada, agendaSelecionada], () => {
    dispararBuscaMatrix();
});

// Recebe uma string ISO UTC e devolve uma string no formato HH:MM local.
const extrairHoraFormatada = (isoStr: string) => {
    const d = new Date(isoStr);
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
};

// Recebe uma string de data YYYY-MM-DD e devolve a sigla do dia da semana correspondente (SEG, TER, etc.).
const obterSiglaDia = (isoData: string): string => {
    const apenasData = String(isoData).substring(0, 10);
    const [ano, mes, dia] = apenasData.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return SIGLAS_DIAS_JS[data.getDay()] || 'SEG';
};

// Localiza e devolve a configuração de blocos correspondente à agenda exibida no momento.
const configuracaoAgendaAtual = computed(() => {
    if (!props.configuracaoBlocos || !agendaSelecionada.value) return null;

    const idAtual = Number(agendaSelecionada.value);

    if (Array.isArray(props.configuracaoBlocos)) {
        return props.configuracaoBlocos.find((c: any) => Number(c.id_agenda) === idAtual) || null;
    }

    if (typeof props.configuracaoBlocos === 'object') {
        if (Number(props.configuracaoBlocos.id_agenda) === idAtual) {
            return props.configuracaoBlocos;
        }
        if (props.configuracaoBlocos[idAtual]) {
            return props.configuracaoBlocos[idAtual];
        }
    }

    return null;
});

// Constrói os blocos principais, subdivisões, cores e bordas por coluna para o cabeçalho e células de um dia específico.
const construirCabecalhosDeBlocos = (slotsBase: { horaInicio: string; horaFim: string }[], siglaDia: string) => {
    const totalSlots = slotsBase.length;
    const configAgenda = configuracaoAgendaAtual.value;

    let listaBlocosConfig: any[] | null = null;

    if (configAgenda) {
        if (configAgenda.por_dia && configAgenda.por_dia[siglaDia]) {
            listaBlocosConfig = configAgenda.por_dia[siglaDia];
        } else if (Array.isArray(configAgenda.blocos)) {
            listaBlocosConfig = configAgenda.blocos;
        }
    }

    const metadadosColunas: MetadadoColuna[] = slotsBase.map(() => ({
        corFundo: null,
        corBorda: 'var(--border-light)',
        fimDeSubbloco: false,
        fimDeBlocoPrincipal: false
    }));

    if (!listaBlocosConfig || listaBlocosConfig.length === 0) {
        return {
            temBlocos: false,
            temSubblocos: false,
            blocosPrincipais: [],
            subblocos: [],
            metadadosColunas
        };
    }

    const blocosPrincipais: any[] = [];
    const subblocos: any[] = [];
    let cursor = 0;
    let algumSubblocoDefinido = false;

    listaBlocosConfig.forEach((blocoCfg: any, idxBloco: number) => {
        if (cursor >= totalSlots) return;

        const qtdSolicitada = Number(blocoCfg.quantidade) || 0;
        if (qtdSolicitada <= 0) return;

        const qtdReal = Math.min(qtdSolicitada, totalSlots - cursor);
        if (qtdReal <= 0) return;

        const { corFundo: corBloco, corBorda } = obterCoresBloco(idxBloco);

        const slotPrimeiro = slotsBase[cursor];
        const slotUltimo = slotsBase[cursor + qtdReal - 1];

        blocosPrincipais.push({
            nome: blocoCfg.nome || `Bloco ${idxBloco + 1}`,
            colspan: qtdReal,
            cor: corBloco,
            corBorda: corBorda,
            horaInicio: slotPrimeiro?.horaInicio ?? '',
            horaFim: slotUltimo?.horaFim ?? ''
        });

        for (let i = 0; i < qtdReal; i++) {
            const meta = metadadosColunas[cursor + i];
            if (meta) {
                meta.corFundo = corBloco;
                meta.corBorda = corBorda;
            }
        }

        const tamanhoSubFixo = Number(blocoCfg.subdivisao) || 0;
        const listaSubCustom = Array.isArray(blocoCfg.subdivisoes) ? blocoCfg.subdivisoes : null;

        if (listaSubCustom && listaSubCustom.length > 0) {
            algumSubblocoDefinido = true;
            let consumido = 0;
            listaSubCustom.forEach((tamSub: number) => {
                if (consumido >= qtdReal) return;
                const tamEfetivo = Math.min(Number(tamSub) || 1, qtdReal - consumido);
                const iniSub = slotsBase[cursor + consumido];
                const fimSub = slotsBase[cursor + consumido + tamEfetivo - 1];
                const ehUltimoDoBloco = (consumido + tamEfetivo) >= qtdReal;

                subblocos.push({
                    colspan: tamEfetivo,
                    cor: corBloco,
                    corBorda: corBorda,
                    fimDeBlocoPrincipal: ehUltimoDoBloco,
                    etiqueta: `${iniSub?.horaInicio ?? ''} - ${fimSub?.horaFim ?? ''}`
                });

                consumido += tamEfetivo;
                const metaFimSub = metadadosColunas[cursor + consumido - 1];
                if (metaFimSub) metaFimSub.fimDeSubbloco = true;
            });
            if (consumido < qtdReal) {
                const restante = qtdReal - consumido;
                const iniSub = slotsBase[cursor + consumido];
                const fimSub = slotsBase[cursor + qtdReal - 1];
                subblocos.push({
                    colspan: restante,
                    cor: corBloco,
                    corBorda: corBorda,
                    fimDeBlocoPrincipal: true,
                    etiqueta: `${iniSub?.horaInicio ?? ''} - ${fimSub?.horaFim ?? ''}`
                });
                const metaFimSub = metadadosColunas[cursor + qtdReal - 1];
                if (metaFimSub) metaFimSub.fimDeSubbloco = true;
            }
        } else if (tamanhoSubFixo > 0) {
            algumSubblocoDefinido = true;
            let consumido = 0;
            while (consumido < qtdReal) {
                const tamEfetivo = Math.min(tamanhoSubFixo, qtdReal - consumido);
                const iniSub = slotsBase[cursor + consumido];
                const fimSub = slotsBase[cursor + consumido + tamEfetivo - 1];
                const ehUltimoDoBloco = (consumido + tamEfetivo) >= qtdReal;

                subblocos.push({
                    colspan: tamEfetivo,
                    cor: corBloco,
                    corBorda: corBorda,
                    fimDeBlocoPrincipal: ehUltimoDoBloco,
                    etiqueta: `${iniSub?.horaInicio ?? ''} - ${fimSub?.horaFim ?? ''}`
                });

                consumido += tamEfetivo;
                const metaFimSub = metadadosColunas[cursor + consumido - 1];
                if (metaFimSub) metaFimSub.fimDeSubbloco = true;
            }
        } else {
            const iniSub = slotsBase[cursor];
            const fimSub = slotsBase[cursor + qtdReal - 1];
            subblocos.push({
                colspan: qtdReal,
                cor: corBloco,
                corBorda: corBorda,
                fimDeBlocoPrincipal: true,
                etiqueta: `${iniSub?.horaInicio ?? ''} - ${fimSub?.horaFim ?? ''}`
            });
        }

        const metaFimPrincipal = metadadosColunas[cursor + qtdReal - 1];
        if (metaFimPrincipal) {
            metaFimPrincipal.fimDeBlocoPrincipal = true;
        }

        cursor += qtdReal;
    });

    if (cursor < totalSlots) {
        const restante = totalSlots - cursor;
        const idxExtra = blocosPrincipais.length;
        
        const { corFundo: corRestante, corBorda: corBordaRestante } = obterCoresBloco(idxExtra);

        const slotPrimeiro = slotsBase[cursor];
        const slotUltimo = slotsBase[totalSlots - 1];

        blocosPrincipais.push({
            nome: 'Outros',
            colspan: restante,
            cor: corRestante,
            corBorda: corBordaRestante,
            horaInicio: slotPrimeiro?.horaInicio ?? '',
            horaFim: slotUltimo?.horaFim ?? ''
        });

        for (let i = 0; i < restante; i++) {
            const meta = metadadosColunas[cursor + i];
            if (meta) {
                meta.corFundo = corRestante;
                meta.corBorda = corBordaRestante;
            }
        }

        subblocos.push({
            colspan: restante,
            cor: corRestante,
            corBorda: corBordaRestante,
            fimDeBlocoPrincipal: true,
            etiqueta: `${slotPrimeiro?.horaInicio ?? ''} - ${slotUltimo?.horaFim ?? ''}`
        });

        const metaUltimo = metadadosColunas[totalSlots - 1];
        if (metaUltimo) {
            metaUltimo.fimDeBlocoPrincipal = true;
        }
    }

    return {
        temBlocos: blocosPrincipais.length > 0,
        temSubblocos: algumSubblocoDefinido,
        blocosPrincipais,
        subblocos,
        metadadosColunas
    };
};

// Gera a lista ordenada de dias operacionais, cada um com sua barra de data no topo e seu cabeçalho de horários logo abaixo.
const diasProcessados = computed(() => {
    if (!dadosMatrix.value?.datas_matriz) return [];

    const resultado: any[] = [];

    dadosMatrix.value.datas_matriz.forEach((dia: any) => {
        if (dia.dia_operacional_slot === false) return;

        const recursosFiltrados = (dia.recursos_slot || []).filter((res: any) =>
            props.idsRecursosVisiveis.includes(String(res.id_recurso))
        );

        if (recursosFiltrados.length === 0) return;

        const primeiroRecurso = recursosFiltrados[0];
        const slotsValidosBase = (primeiroRecurso.horarios_slot || []).filter((s: any) => !s.bloqueado_slot);

        if (slotsValidosBase.length === 0) return;

        const definicaoColunas = slotsValidosBase.map((s: any) => ({
            horaInicio: extrairHoraFormatada(s.data_inicio_slot),
            horaFim: extrairHoraFormatada(s.data_fim_slot)
        }));

        const siglaDia = obterSiglaDia(dia.data_slot);
        const infoBlocos = construirCabecalhosDeBlocos(definicaoColunas, siglaDia);

        const recursosProcessados = recursosFiltrados.map((rec: any) => {
            const slotsBrutos = (rec.horarios_slot || []).filter((s: any) => !s.bloqueado_slot);
            const celulasMescladas: any[] = [];

            let i = 0;
            while (i < slotsBrutos.length) {
                const slotAtual = slotsBrutos[i];
                const codRef = slotAtual?.detalhes_reserva?.codigo_referencia_reserva;

                if (slotAtual?.reservado_slot && codRef) {
                    let span = 1;
                    while (
                        i + span < slotsBrutos.length &&
                        slotsBrutos[i + span]?.reservado_slot &&
                        slotsBrutos[i + span]?.detalhes_reserva?.codigo_referencia_reserva === codRef
                    ) {
                        span++;
                    }
                    celulasMescladas.push({
                        ...slotAtual,
                        indiceColuna: i,
                        colspan: span,
                        ocultaPorColspan: false
                    });
                    for (let k = 1; k < span; k++) {
                        celulasMescladas.push({
                            ...slotsBrutos[i + k],
                            indiceColuna: i + k,
                            colspan: 1,
                            ocultaPorColspan: true
                        });
                    }
                    i += span;
                } else {
                    celulasMescladas.push({
                        ...slotAtual,
                        indiceColuna: i,
                        colspan: 1,
                        ocultaPorColspan: false
                    });
                    i++;
                }
            }

            return {
                id_recurso: rec.id_recurso,
                nome_recurso: rec.nome_recurso,
                slotsBrutos,
                horarios_slot: celulasMescladas
            };
        });

        resultado.push({
            data_slot: dia.data_slot,
            colunasHorarios: definicaoColunas,
            temBlocos: infoBlocos.temBlocos,
            temSubblocos: infoBlocos.temSubblocos,
            blocosPrincipais: infoBlocos.blocosPrincipais,
            subblocos: infoBlocos.subblocos,
            metadadosColunas: infoBlocos.metadadosColunas,
            recursos_slot: recursosProcessados
        });
    });

    return resultado;
});

// Formata a data YYYY-MM-DD por extenso em português para a barra superior de cada dia.
const formatarData = (isoData: string) => {
    const apenasData = String(isoData).substring(0, 10);
    const [ano, mes, dia] = apenasData.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};
</script>

<template>
  <div class="matriz-container">
    <ModalReserva
      v-model="modalAberto"
      :dados-iniciais="dadosParaModal"
      :usa-interceptador="props.usaInterceptador"
      :ocultar-titulo-modal="props.ocultarTituloModal"
      @before-save="$emit('before-save', $event)"
      @salvo="dispararBuscaMatrix"
    >
      <template #campos-extras>
        <slot name="campos-extras"></slot>
      </template>
    </ModalReserva>

    <ModalDetalhesReserva
      v-model="modalDetalhesAberto"
      :reserva="reservaSelecionadaDetalhes"
      :titulo-padrao="props.tituloPadrao"
      @excluido="dispararBuscaMatrix"
    />

    <div class="aviso-vazio" v-if="carregando">
      <div class="spinner"></div>
      <span>Processando grade temporal...</span>
    </div>

    <div class="matriz-conteudo" v-else-if="dadosMatrix.datas_matriz">
      <slot name="topo"></slot>

      <div class="tabelas-scroll-container" v-if="diasProcessados.length > 0">
        <div
          class="bloco-dia-tabela"
          v-for="dia in diasProcessados"
          :key="dia.data_slot"
        >
          <table class="tabela-premium">
            <thead>
              <tr class="linha-data">
                <th :colspan="dia.colunasHorarios.length + 1" class="th-barra-dia">
                  <div class="barra-data-full">
                    <span class="texto-data">{{ formatarData(dia.data_slot) }}</span>
                  </div>
                </th>
              </tr>

              <tr v-if="dia.temBlocos" class="linha-blocos-principais">
                <th
                  class="coluna-fixa cabecalho-canto"
                  :rowspan="dia.temSubblocos ? 3 : 2"
                >
                  Nome
                </th>
                <th
                  v-for="(bloco, idxB) in dia.blocosPrincipais"
                  :key="idxB"
                  :colspan="bloco.colspan"
                  :style="{
                    backgroundColor: bloco.cor,
                    borderColor: bloco.corBorda
                  }"
                  class="th-bloco-principal borda-col-bloco-principal"
                >
                  <div class="titulo-bloco-principal">{{ bloco.nome }}</div>
                  <div class="subtitulo-bloco-principal">{{ bloco.horaInicio }} - {{ bloco.horaFim }}</div>
                </th>
              </tr>

              <tr v-if="dia.temBlocos && dia.temSubblocos" class="linha-subblocos">
                <th
                  v-for="(sub, idxS) in dia.subblocos"
                  :key="idxS"
                  :colspan="sub.colspan"
                  :style="{
                    backgroundColor: sub.cor,
                    borderColor: sub.corBorda
                  }"
                  class="th-subbloco"
                  :class="{
                    'borda-col-bloco-principal': sub.fimDeBlocoPrincipal,
                    'borda-col-subbloco': !sub.fimDeBlocoPrincipal
                  }"
                >
                  {{ sub.etiqueta }}
                </th>
              </tr>

              <tr class="linha-horarios-individuais">
                <th v-if="!dia.temBlocos" class="coluna-fixa cabecalho-canto">Nome</th>
                <th
                  v-for="(col, idxH) in dia.colunasHorarios"
                  :key="idxH"
                  :style="{
                    backgroundColor: dia.metadadosColunas[idxH]?.corFundo || 'var(--bg-primary)',
                    borderColor: dia.metadadosColunas[idxH]?.corBorda || 'var(--border-light)'
                  }"
                  class="th-horario-individual"
                  :class="{
                    'borda-col-subbloco': dia.metadadosColunas[idxH]?.fimDeSubbloco,
                    'borda-col-bloco-principal': dia.metadadosColunas[idxH]?.fimDeBlocoPrincipal
                  }"
                >
                  <div class="empilhado-horarios">
                    <span class="hora-topo">{{ col.horaInicio }}</span>
                    <span class="hora-base">{{ col.horaFim }}</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="recurso in dia.recursos_slot" :key="recurso.id_recurso">
                <td class="coluna-fixa nome-recurso">{{ recurso.nome_recurso }}</td>
                <template v-for="slot in recurso.horarios_slot" :key="slot.data_inicio_slot">
                  <BlocoArrastavel
                    v-if="!slot.ocultaPorColspan"
                    tag="td"
                    :grupo="`${dia.data_slot}__${recurso.id_recurso}`"
                    :indice="slot.indiceColuna"
                    :item="{ slot, idRecurso: recurso.id_recurso, dataSlot: dia.data_slot }"
                    :disponivel="Boolean(slot.reservavel_slot && !slot.reservado_slot)"
                    :controlador="controladorArrastoHorizontal"
                    :colspan="slot.colspan || 1"
                    class="td-celula-slot"
                    :class="{
                      'slot-ocupado': slot.reservado_slot,
                      'slot-api': slot.detalhes_reserva?.origem_criacao_reserva === 'API',
                      'slot-selecionado-arrasto': controladorArrastoHorizontal.verificarSelecionado(`${dia.data_slot}__${recurso.id_recurso}`, slot.indiceColuna),
                      'borda-col-subbloco': dia.metadadosColunas[slot.indiceColuna + (slot.colspan || 1) - 1]?.fimDeSubbloco,
                      'borda-col-bloco-principal': dia.metadadosColunas[slot.indiceColuna + (slot.colspan || 1) - 1]?.fimDeBlocoPrincipal
                    }"
                    :style="{
                      backgroundColor: controladorArrastoHorizontal.verificarSelecionado(`${dia.data_slot}__${recurso.id_recurso}`, slot.indiceColuna)
                        ? 'var(--color-brand-light)'
                        : (dia.metadadosColunas[slot.indiceColuna]?.corFundo || 'var(--bg-primary)'),
                      borderColor: dia.metadadosColunas[slot.indiceColuna + (slot.colspan || 1) - 1]?.corBorda || 'var(--border-light)'
                    }"
                  >
                    <div class="conteudo-slot-matrix" v-if="slot.reservado_slot">
                      <span class="etiqueta-reserva">
                        {{ slot.detalhes_reserva?.titulo_reserva?.trim() || props.tituloPadrao || 'Reservado' }}
                      </span>
                    </div>
                  </BlocoArrastavel>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="aviso-vazio" v-else>
        <span>{{ props.mensagemVazio || 'Nenhuma sala selecionada.' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matriz-container { width: 100%; height: 100%; background: var(--bg-primary); display: flex; flex-direction: column; user-select: none; }
.matriz-conteudo { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.aviso-vazio { display: flex; flex-direction: column; justify-content: center; align-items: center; flex-grow: 1; color: var(--text-secondary); font-weight: 500; font-size: 1rem; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border-light); border-top-color: var(--color-brand); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.tabelas-scroll-container {
    flex-grow: 1;
    overflow: auto;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding-bottom: 24px;
}

.bloco-dia-tabela {
    width: 100%;
}

.tabela-premium {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12.5px;
    text-align: center;
}

.tabela-premium th,
.tabela-premium td {
    padding: 4px 6px;
    min-width: 68px;
    height: 44px;
    border-bottom: 1px solid var(--border-light);
    border-right: 1px solid var(--border-light);
    box-sizing: border-box;
}

.tabela-premium th:first-child,
.tabela-premium td:first-child {
    border-left: 1px solid var(--border-light);
}

.tabela-premium thead th {
    background: var(--bg-primary);
    font-weight: 700;
    color: var(--text-primary);
}

.coluna-fixa {
    width: 200px;
    min-width: 200px;
    max-width: 200px;
    text-align: left;
    background: var(--bg-primary);
    position: sticky;
    left: 0;
    z-index: 2;
    border-right: 2px solid var(--border-light) !important;
}

.cabecalho-canto {
    z-index: 3 !important;
    padding-left: 24px !important;
    background: var(--bg-primary) !important;
}

.th-barra-dia {
    padding: 0 !important;
    height: auto !important;
    border-top: 1px solid #005291 !important;
    border-bottom: 1px solid #005291 !important;
}

.th-bloco-principal {
    color: #111827 !important;
    padding: 6px 4px !important;
    height: 36px !important;
    border-bottom-width: 1.5px !important;
    border-bottom-style: solid !important;
}

.titulo-bloco-principal {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.3px;
    line-height: 1.2;
    text-transform: uppercase;
}

.subtitulo-bloco-principal {
    font-size: 10.5px;
    font-weight: 700;
    opacity: 0.9;
}

.th-subbloco {
    color: #111827 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    height: 26px !important;
    padding: 2px 4px !important;
    border-bottom-width: 1.5px !important;
    border-bottom-style: solid !important;
}

.th-horario-individual {
    height: 42px !important;
    padding: 4px 2px !important;
    color: #111827 !important;
    border-bottom-width: 2px !important;
    border-bottom-style: solid !important;
}

.empilhado-horarios {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.15;
    gap: 2px;
}

.hora-topo {
    font-size: 11.5px;
    font-weight: 700;
    color: #111827;
}

.hora-base {
    font-size: 11.5px;
    font-weight: 700;
    color: #111827;
}

.td-celula-slot {
    cursor: pointer;
    transition: filter 0.12s ease, box-shadow 0.12s ease;
    vertical-align: middle;
    color: #111827 !important;
}

.td-celula-slot:hover {
    filter: brightness(0.93);
    box-shadow: inset 0 0 0 1.5px var(--color-brand);
}

.slot-selecionado-arrasto {
    box-shadow: inset 0 0 0 2px var(--color-brand) !important;
}

.slot-ocupado {
    font-weight: 700;
    background-color: #e5e7eb !important;
    background-image: repeating-linear-gradient(
        45deg,
        rgba(0, 0, 0, 0.06),
        rgba(0, 0, 0, 0.06) 10px,
        transparent 10px,
        transparent 20px
    ) !important;
}

.conteudo-slot-matrix {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.etiqueta-reserva {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    line-height: 1.25;
    word-break: break-word;
}

.borda-col-subbloco {
    border-right-width: 2px !important;
}

.borda-col-bloco-principal {
    border-right-width: 2.5px !important;
}

.barra-data-full { 
    display: flex; 
    align-items: center; 
    justify-content: center;
    width: 100%; 
    background-color: #0066B3 !important;
    color: #FFFFFF !important; 
    padding: 9px 0; 
    border-radius: 0; 
    box-shadow: none; 
    box-sizing: border-box; 
    border: none;
    text-align: center;
}

.texto-data { 
    font-weight: 800;
    font-size: 13.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.nome-recurso { 
    font-weight: 700; 
    color: var(--text-primary); 
    background: var(--bg-primary) !important; 
    padding-left: 20px !important;
    padding-right: 12px !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 4px 0 8px rgba(0,0,0,0.03); 
}
</style>

<style>
/* CSS injetado globalmente para os blocos da matriz base escurecerem o texto no dark theme */
[data-bs-theme="dark"] .th-bloco-principal,
[data-bs-theme="dark"] .th-subbloco,
[data-bs-theme="dark"] .th-horario-individual,
[data-bs-theme="dark"] .hora-topo,
[data-bs-theme="dark"] .hora-base,
[data-bs-theme="dark"] .td-celula-slot,
[data-bs-theme="dark"] .etiqueta-reserva {
    color: var(--text-primary) !important;
}

[data-bs-theme="dark"] .slot-ocupado {
    background-color: #374151 !important;
    background-image: repeating-linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.03),
        rgba(255, 255, 255, 0.03) 10px,
        transparent 10px,
        transparent 20px
    ) !important;
}
</style>