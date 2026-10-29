<!--
========
Este arquivo concentra a regra de negócio do modelo 'tabela-horario'.
Ele sincroniza o recurso selecionado, agrupa dias com grades de horários equivalentes, calcula
os turnos laterais e alimenta o componente visual puro GradeTabelaHorario.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { computed, watch } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useCoresAgenda } from '../composables/useCoresAgenda';
import {
  SIGLAS_DIAS_JS,
  TITULOS_DIAS_CABECALHO,
  extrairDataHoraLocal,
  extrairHoraFormatada,
  criarDataLocal,
  mesclarSlotsReservados,
  useGradeSemanal,
  useSincronizarRecursoUnico
} from '../composables/useGradeCompartilhada';
import GradeTabelaHorario from './Grades/GradeTabelaHorario.vue';
import ModalReserva from './ModalReserva.vue';
import ModalDetalhesReserva from './ModalDetalhesReserva.vue';

interface MetadadoLinha {
  horaInicio: string;
  horaFim: string;
  corFundo: string;
  corBorda: string;
  mostrarBlocoLateral: boolean;
  nomeBlocoLateral: string;
  rowspanBlocoLateral: number;
  fimDeSubbloco: boolean;
  fimDeBlocoPrincipal: boolean;
}

const { configEntrada, agendaSelecionada, recursosDisponiveis, recursoSelecionado } = useAgenda();
const { theme, obterCoresBloco } = useCoresAgenda();

useSincronizarRecursoUnico();

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

// Quando a agenda muda no seletor e não há idRecursoUnico fixo, garante que o recursoSelecionado pertença à agenda ativa.
watch(agendaSelecionada, (novoIdAgenda) => {
  if (!novoIdAgenda || configEntrada.idRecursoUnico) return;
  const pertence = recursosDisponiveis.value.some(
    (r: any) => Number(r.id_recurso) === Number(recursoSelecionado.value) && Number(r.id_agenda) === Number(novoIdAgenda)
  );
  if (!pertence) {
    const primeiroDaAgenda = recursosDisponiveis.value.find(
      (r: any) => Number(r.id_agenda) === Number(novoIdAgenda)
    );
    if (primeiroDaAgenda) {
      recursoSelecionado.value = Number(primeiroDaAgenda.id_recurso);
    }
  }
});

const recursosDaAgendaAtual = computed(() => {
  if (!agendaSelecionada.value) return recursosDisponiveis.value;
  return recursosDisponiveis.value.filter(
    (r: any) => Number(r.id_agenda) === Number(agendaSelecionada.value)
  );
});

const idRecursoAtivo = computed(() => {
  if (configEntrada.idRecursoUnico) return Number(configEntrada.idRecursoUnico);
  if (recursoSelecionado.value) return Number(recursoSelecionado.value);
  const primeiro = recursosDaAgendaAtual.value[0];
  return primeiro ? Number(primeiro.id_recurso) : null;
});

const recursosEmExibicao = computed(() => {
  if (!idRecursoAtivo.value) return [];
  const encontrado = recursosDisponiveis.value.find(
    (r: any) => Number(r.id_recurso) === Number(idRecursoAtivo.value)
  );
  return encontrado ? [encontrado] : [];
});

defineExpose({ recursosEmExibicao });

// Abre o modal de detalhes da reserva clicada na GradeTabelaHorario.
const aoClicarReserva = (detalhesReserva: any) => {
  reservaSelecionadaDetalhes.value = detalhesReserva;
  modalDetalhesAberto.value = true;
};

// Abre o modal de criação com o intervalo vertical selecionado na GradeTabelaHorario.
const aoSelecionarIntervalo = (itensSelecionados: any[]) => {
  if (!idRecursoAtivo.value) return;
  const slotInicial = itensSelecionados[0];
  const slotFinal = itensSelecionados[itensSelecionados.length - 1];
  if (!slotInicial || !slotFinal) return;

  const inicio = extrairDataHoraLocal(slotInicial.data_inicio_slot);
  const fim = extrairDataHoraLocal(slotFinal.data_fim_slot);

  dadosParaModal.value = {
    id_recurso: idRecursoAtivo.value,
    titulo_reserva: '',
    data_inicio: inicio.data,
    hora_inicio: inicio.hora,
    data_fim: fim.data,
    hora_fim: fim.hora
  };

  modalAberto.value = true;
};

// Processa a lista de horários de um grupo de dias e gera os metadados de cada linha (bloco lateral, cor e bordas de subdivisão).
const mapearLinhasComBlocos = (horariosBase: { horaInicio: string; horaFim: string }[], siglaDia: string) => {
  const total = horariosBase.length;
  const listaBlocos = obterBlocosDoDia(siglaDia);

  const metadadosLinhas: MetadadoLinha[] = horariosBase.map((h) => ({
    horaInicio: h.horaInicio,
    horaFim: h.horaFim,
    corFundo: theme.value === 'dark' ? 'var(--bg-primary)' : '#FFFFFF',
    corBorda: 'var(--border-light)',
    mostrarBlocoLateral: false,
    nomeBlocoLateral: '',
    rowspanBlocoLateral: 1,
    fimDeSubbloco: false,
    fimDeBlocoPrincipal: false
  }));

  if (!listaBlocos || listaBlocos.length === 0) {
    return { temColunaTurno: false, linhas: metadadosLinhas };
  }

  let cursor = 0;

  listaBlocos.forEach((blocoCfg: any, idxBloco: number) => {
    if (cursor >= total) return;
    const qtdSolicitada = Number(blocoCfg.quantidade) || 0;
    const qtdReal = Math.min(qtdSolicitada, total - cursor);
    if (qtdReal <= 0) return;

    const { corFundo, corBorda } = obterCoresBloco(idxBloco);

    const metaCursor = metadadosLinhas[cursor];
    if (metaCursor) {
      metaCursor.mostrarBlocoLateral = true;
      metaCursor.nomeBlocoLateral = blocoCfg.nome || `TURNO ${idxBloco + 1}`;
      metaCursor.rowspanBlocoLateral = qtdReal;
    }

    for (let i = 0; i < qtdReal; i++) {
      const metaItem = metadadosLinhas[cursor + i];
      if (metaItem) {
        metaItem.corFundo = corFundo;
        metaItem.corBorda = corBorda;
      }
    }

    const subFixo = Number(blocoCfg.subdivisao) || 0;
    const subLista = Array.isArray(blocoCfg.subdivisoes) ? blocoCfg.subdivisoes : null;

    if (subLista && subLista.length > 0) {
      let consumido = 0;
      subLista.forEach((tam: number) => {
        if (consumido >= qtdReal) return;
        consumido += Math.min(Number(tam) || 1, qtdReal - consumido);
        const metaFimSub = metadadosLinhas[cursor + consumido - 1];
        if (metaFimSub) metaFimSub.fimDeSubbloco = true;
      });
    } else if (subFixo > 0) {
      let consumido = 0;
      while (consumido < qtdReal) {
        consumido += Math.min(subFixo, qtdReal - consumido);
        const metaFimSub = metadadosLinhas[cursor + consumido - 1];
        if (metaFimSub) metaFimSub.fimDeSubbloco = true;
      }
    }

    const metaFimPrincipal = metadadosLinhas[cursor + qtdReal - 1];
    if (metaFimPrincipal) metaFimPrincipal.fimDeBlocoPrincipal = true;
    cursor += qtdReal;
  });

  if (cursor < total) {
    const restante = total - cursor;
    const { corFundo, corBorda } = obterCoresBloco(listaBlocos.length);

    const metaRestante = metadadosLinhas[cursor];
    if (metaRestante) {
      metaRestante.mostrarBlocoLateral = true;
      metaRestante.nomeBlocoLateral = 'OUTROS';
      metaRestante.rowspanBlocoLateral = restante;
    }

    for (let i = 0; i < restante; i++) {
      const metaItem = metadadosLinhas[cursor + i];
      if (metaItem) {
        metaItem.corFundo = corFundo;
        metaItem.corBorda = corBorda;
      }
    }

    const metaUltimo = metadadosLinhas[total - 1];
    if (metaUltimo) metaUltimo.fimDeBlocoPrincipal = true;
  }

  return { temColunaTurno: true, linhas: metadadosLinhas };
};

// Constrói a estrutura completa de grupos de colunas e calcula o rowspan das reservas.
const estruturaGradeHorario = computed(() => {
  if (!dadosMatrix.value?.datas_matriz || !idRecursoAtivo.value) {
    return { grupos: [], maxLinhas: 0, temColunaTurnoPrincipal: false };
  }

  const diasOperacionais = dadosMatrix.value.datas_matriz.filter(
    (d: any) => d.dia_operacional_slot !== false
  );

  const gruposPorAssinatura = new Map<string, any>();

  diasOperacionais.forEach((dia: any) => {
    const recObj = (dia.recursos_slot || []).find(
      (r: any) => Number(r.id_recurso) === Number(idRecursoAtivo.value)
    );
    if (!recObj) return;

    const slotsReservaveis = (recObj.horarios_slot || []).filter((s: any) => !s.bloqueado_slot);
    if (slotsReservaveis.length === 0) return;

    const horariosDia = slotsReservaveis.map((s: any) => ({
      horaInicio: extrairHoraFormatada(s.data_inicio_slot),
      horaFim: extrairHoraFormatada(s.data_fim_slot)
    }));

    const assinatura = horariosDia.map((h: any) => `${h.horaInicio}-${h.horaFim}`).join('|');
    const dtLocal = criarDataLocal(dia.data_slot);
    const siglaDia = SIGLAS_DIAS_JS[dtLocal.getDay()] || 'SEG';
    const tituloDia = TITULOS_DIAS_CABECALHO[dtLocal.getDay()] || siglaDia;
    const dataCurta = dtLocal.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    if (!gruposPorAssinatura.has(assinatura)) {
      const infoLinhas = mapearLinhasComBlocos(horariosDia, siglaDia);
      gruposPorAssinatura.set(assinatura, {
        assinatura,
        siglaReferencia: siglaDia,
        temColunaTurno: infoLinhas.temColunaTurno,
        linhasMetadados: infoLinhas.linhas,
        dias: []
      });
    }

    gruposPorAssinatura.get(assinatura).dias.push({
      data_slot: dia.data_slot,
      tituloDia,
      dataCurta,
      celulas: mesclarSlotsReservados(slotsReservaveis, 'rowspan')
    });
  });

  const listaGrupos = Array.from(gruposPorAssinatura.values());
  const maxLinhas = listaGrupos.reduce((acc, g) => Math.max(acc, g.linhasMetadados.length), 0);
  const temColunaTurnoPrincipal = listaGrupos[0]?.temColunaTurno || false;

  return {
    grupos: listaGrupos,
    maxLinhas,
    temColunaTurnoPrincipal
  };
});
</script>

<template>
  <div class="tabela-horario-container">
    <ModalReserva
      v-model="modalAberto"
      :dados-iniciais="dadosParaModal"
      @salvo="dispararBuscaSemanal"
    >
      <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
        <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
      </template>
    </ModalReserva>

    <ModalDetalhesReserva
      v-model="modalDetalhesAberto"
      :reserva="reservaSelecionadaDetalhes"
      @editar="abrirEdicaoDeReserva"
      @excluido="dispararBuscaSemanal"
    />

    <GradeTabelaHorario
      :estrutura="estruturaGradeHorario"
      :carregando="carregando"
      :titulo-padrao="configEntrada.tituloPadrao"
      @selecionar-intervalo="aoSelecionarIntervalo"
      @clicar-reserva="aoClicarReserva"
    >
      <template #topo>
        <div class="barra-topo-recurso" v-if="!configEntrada.idRecursoUnico && recursosDaAgendaAtual.length > 0">
          <label for="select-recurso-grade">Sala / Laboratório:</label>
          <select id="select-recurso-grade" v-model="recursoSelecionado">
            <option v-for="rec in recursosDaAgendaAtual" :key="rec.id_recurso" :value="rec.id_recurso">
              {{ rec.nome_recurso }}
            </option>
          </select>
          <span class="dica-arrasto">
            Dica: Clique em um horário ou segure e arraste para baixo para agendar vários blocos.
          </span>
        </div>
      </template>
    </GradeTabelaHorario>
  </div>
</template>

<style scoped>
.tabela-horario-container {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  user-select: none;
}

.barra-topo-recurso {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}

.barra-topo-recurso select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.dica-arrasto {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
</style>