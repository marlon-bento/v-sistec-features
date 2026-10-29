<!--
========
Este arquivo concentra a regra de negócio e transformação de dados da visão em matriz horizontal ('tabela').
Ele processa os blocos diários, subdivisões e mesclagens de colspan a partir dos dados da API e alimenta
o componente visual puro GradeMatrix, gerenciando os modais de reserva e detalhes.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { computed } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useCoresAgenda } from '../composables/useCoresAgenda';
import {
    SIGLAS_DIAS_JS,
    extrairDataHoraLocal,
    extrairHoraFormatada,
    criarDataLocal,
    mesclarSlotsReservados,
    useGradeSemanal
} from '../composables/useGradeCompartilhada';
import GradeMatrix from './Grades/GradeMatrix.vue';
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
    mensagemVazio?: string;
}>();

const { configEntrada } = useAgenda();
const { obterCoresBloco } = useCoresAgenda();

const {
    dadosMatrix,
    carregando,
    modalAberto,
    dadosParaModal,
    modalDetalhesAberto,
    reservaSelecionadaDetalhes,
    obterBlocosDoDia,
    dispararBuscaSemanal,
    abrirEdicaoDeReserva
} = useGradeSemanal();

// Abre o modal de detalhes quando o usuário clica em uma célula já ocupada na GradeMatrix.
const aoClicarReserva = (detalhesReserva: any) => {
    reservaSelecionadaDetalhes.value = detalhesReserva;
    modalDetalhesAberto.value = true;
};

// Abre o modal de nova reserva preenchido com o intervalo arrastado na GradeMatrix.
const aoSelecionarIntervalo = (itensSelecionados: any[]) => {
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
};

// Constrói os blocos principais, subdivisões, cores e bordas por coluna para o cabeçalho e células de um dia específico.
const construirCabecalhosDeBlocos = (slotsBase: { horaInicio: string; horaFim: string }[], siglaDia: string) => {
    const totalSlots = slotsBase.length;
    const listaBlocosConfig = obterBlocosDoDia(siglaDia);

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

    const adicionarSubbloco = (inicioIdx: number, tam: number, cor: string, corBorda: string, fimPrincipal: boolean, marcarSub: boolean) => {
        const iniSub = slotsBase[inicioIdx];
        const fimSub = slotsBase[inicioIdx + tam - 1];
        subblocos.push({
            colspan: tam,
            cor,
            corBorda,
            fimDeBlocoPrincipal: fimPrincipal,
            etiqueta: `${iniSub?.horaInicio ?? ''} - ${fimSub?.horaFim ?? ''}`
        });
        if (marcarSub) {
            const metaFimSub = metadadosColunas[inicioIdx + tam - 1];
            if (metaFimSub) metaFimSub.fimDeSubbloco = true;
        }
    };

    listaBlocosConfig.forEach((blocoCfg: any, idxBloco: number) => {
        if (cursor >= totalSlots) return;

        const qtdSolicitada = Number(blocoCfg.quantidade) || 0;
        const qtdReal = Math.min(qtdSolicitada, totalSlots - cursor);
        if (qtdReal <= 0) return;

        const { corFundo: corBloco, corBorda } = obterCoresBloco(idxBloco);
        const slotPrimeiro = slotsBase[cursor];
        const slotUltimo = slotsBase[cursor + qtdReal - 1];

        blocosPrincipais.push({
            nome: blocoCfg.nome || `Bloco ${idxBloco + 1}`,
            colspan: qtdReal,
            cor: corBloco,
            corBorda,
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
                const ehUltimo = (consumido + tamEfetivo) >= qtdReal;
                adicionarSubbloco(cursor + consumido, tamEfetivo, corBloco, corBorda, ehUltimo, true);
                consumido += tamEfetivo;
            });
            if (consumido < qtdReal) {
                adicionarSubbloco(cursor + consumido, qtdReal - consumido, corBloco, corBorda, true, true);
            }
        } else if (tamanhoSubFixo > 0) {
            algumSubblocoDefinido = true;
            let consumido = 0;
            while (consumido < qtdReal) {
                const tamEfetivo = Math.min(tamanhoSubFixo, qtdReal - consumido);
                const ehUltimo = (consumido + tamEfetivo) >= qtdReal;
                adicionarSubbloco(cursor + consumido, tamEfetivo, corBloco, corBorda, ehUltimo, true);
                consumido += tamEfetivo;
            }
        } else {
            adicionarSubbloco(cursor, qtdReal, corBloco, corBorda, true, false);
        }

        const metaFimPrincipal = metadadosColunas[cursor + qtdReal - 1];
        if (metaFimPrincipal) metaFimPrincipal.fimDeBlocoPrincipal = true;

        cursor += qtdReal;
    });

    if (cursor < totalSlots) {
        const restante = totalSlots - cursor;
        const { corFundo: corRestante, corBorda: corBordaRestante } = obterCoresBloco(blocosPrincipais.length);
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

        adicionarSubbloco(cursor, restante, corRestante, corBordaRestante, true, false);

        const metaUltimo = metadadosColunas[totalSlots - 1];
        if (metaUltimo) metaUltimo.fimDeBlocoPrincipal = true;
    }

    return {
        temBlocos: blocosPrincipais.length > 0,
        temSubblocos: algumSubblocoDefinido,
        blocosPrincipais,
        subblocos,
        metadadosColunas
    };
};

const formatarData = (isoData: string) => {
    return criarDataLocal(isoData).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Gera a lista ordenada de dias operacionais com cabeçalhos e células mescladas por colspan para enviar à GradeMatrix.
const diasProcessados = computed(() => {
    if (!dadosMatrix.value?.datas_matriz) return [];

    const resultado: any[] = [];

    dadosMatrix.value.datas_matriz.forEach((dia: any) => {
        if (dia.dia_operacional_slot === false) return;

        const recursosFiltrados = (dia.recursos_slot || []).filter((res: any) =>
            props.idsRecursosVisiveis.includes(String(res.id_recurso))
        );
        if (recursosFiltrados.length === 0) return;

        const slotsValidosBase = (recursosFiltrados[0].horarios_slot || []).filter((s: any) => !s.bloqueado_slot);
        if (slotsValidosBase.length === 0) return;

        const definicaoColunas = slotsValidosBase.map((s: any) => ({
            horaInicio: extrairHoraFormatada(s.data_inicio_slot),
            horaFim: extrairHoraFormatada(s.data_fim_slot)
        }));

        const siglaDia = SIGLAS_DIAS_JS[criarDataLocal(dia.data_slot).getDay()] || 'SEG';
        const infoBlocos = construirCabecalhosDeBlocos(definicaoColunas, siglaDia);

        const recursosProcessados = recursosFiltrados.map((rec: any) => {
            const slotsBrutos = (rec.horarios_slot || []).filter((s: any) => !s.bloqueado_slot);
            return {
                id_recurso: rec.id_recurso,
                nome_recurso: rec.nome_recurso,
                slotsBrutos,
                horarios_slot: mesclarSlotsReservados(slotsBrutos, 'colspan')
            };
        });

        resultado.push({
            data_slot: dia.data_slot,
            dataFormatada: formatarData(dia.data_slot),
            colunasHorarios: definicaoColunas,
            ...infoBlocos,
            recursos_slot: recursosProcessados
        });
    });

    return resultado;
});
</script>

<template>
  <div class="matriz-container">
    <ModalReserva
      v-model="modalAberto"
      :dados-iniciais="dadosParaModal"
      @salvo="dispararBuscaSemanal"
    >
      <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
        <slot v-if="nomeSlot !== 'topo'" :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
      </template>
    </ModalReserva>

    <ModalDetalhesReserva
      v-model="modalDetalhesAberto"
      :reserva="reservaSelecionadaDetalhes"
      @editar="abrirEdicaoDeReserva"
      @excluido="dispararBuscaSemanal"
    />

    <GradeMatrix
      :dias="diasProcessados"
      :carregando="carregando"
      :titulo-padrao="configEntrada.tituloPadrao"
      :mensagem-vazio="props.mensagemVazio"
      @selecionar-intervalo="aoSelecionarIntervalo"
      @clicar-reserva="aoClicarReserva"
    >
      <template #topo>
        <slot name="topo"></slot>
      </template>
    </GradeMatrix>
  </div>
</template>

<style scoped>
.matriz-container {
    width: 100%;
    height: 100%;
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    user-select: none;
}
</style>