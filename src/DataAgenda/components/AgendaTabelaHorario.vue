<!--
========
Este arquivo implementa o modelo visual 'tabela-horario' com os turnos na vertical à esquerda,
colunas de horários seguidas pelos dias da semana e suporte a colunas de horários específicas (como Sábado)
com altura proporcional, mesclagem vertical de reservas contínuas, seleção vertical via BlocoArrastavel
e exposição da lista contendo o recurso atualmente em exibição.
========
-->
<script setup lang="ts">
defineSlots<{ [key: string]: any }>();
import { computed, watch, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import { useCoresAgenda } from '../composables/useCoresAgenda';
import { useSelecaoArrasto } from '../composables/useSelecaoArrasto';
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
import BlocoArrastavel from './BlocoArrastavel.vue';
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

const props = defineProps<{
  idRecursoUnico?: number | string | null;
  usaInterceptador?: boolean;
  tituloPadrao?: string;
  ocultarTituloModal?: boolean;
  configuracaoBlocos?: any;
}>();

const api = inject('api-instance-agenda') as any;
defineEmits(['before-save']);

const { agendaSelecionada, recursosDisponiveis, recursoSelecionado } = useAgenda(api);
const { theme, obterCoresBloco } = useCoresAgenda();

useSincronizarRecursoUnico(api, () => props.idRecursoUnico);

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
} = useGradeSemanal(api, () => props.configuracaoBlocos);

// Quando a agenda muda no seletor e não há idRecursoUnico fixo, garante que o recursoSelecionado pertença à agenda ativa.
watch(agendaSelecionada, (novoIdAgenda) => {
  if (!novoIdAgenda || props.idRecursoUnico) return;
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
  if (props.idRecursoUnico) return Number(props.idRecursoUnico);
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

const controladorArrastoVertical = useSelecaoArrasto({
  aoClicarItemIndisponivel: (celula) => {
    if (celula?.reservado_slot && celula?.detalhes_reserva) {
      reservaSelecionadaDetalhes.value = celula.detalhes_reserva;
      modalDetalhesAberto.value = true;
    }
  },
  aoFinalizarSelecao: ({ itensSelecionados }) => {
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
  }
});

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
    <ModalReserva v-model="modalAberto" :dados-iniciais="dadosParaModal" :usa-interceptador="props.usaInterceptador"
      :ocultar-titulo-modal="props.ocultarTituloModal" @before-save="$emit('before-save', $event)"
      @salvo="dispararBuscaSemanal">
      <template v-for="(_, nomeSlot) in $slots" :key="nomeSlot" #[nomeSlot]="slotProps">
        <slot :name="nomeSlot" v-bind="slotProps ?? {}"></slot>
      </template>
    </ModalReserva>

    <ModalDetalhesReserva
      v-model="modalDetalhesAberto"
      :reserva="reservaSelecionadaDetalhes"
      :titulo-padrao="props.tituloPadrao"
      @editar="abrirEdicaoDeReserva"
      @excluido="dispararBuscaSemanal"
    />

    <div class="aviso-vazio" v-if="carregando">
      <div class="spinner"></div>
      <span>Processando grade de horários...</span>
    </div>

    <div class="horario-conteudo" v-else-if="estruturaGradeHorario.grupos.length > 0">
      <div class="barra-topo-recurso" v-if="!props.idRecursoUnico && recursosDaAgendaAtual.length > 0">
        <label for="select-recurso-grade">Sala / Laboratório:</label>
        <select id="select-recurso-grade" v-model="recursoSelecionado">
          <option v-for="rec in recursosDaAgendaAtual" :key="rec.id_recurso" :value="rec.id_recurso">
            {{ rec.nome_recurso }}
          </option>
        </select>
        <span class="dica-arrasto">Dica: Clique em um horário ou segure e arraste para baixo para agendar vários
          blocos.</span>
      </div>

      <div class="grade-scroll-wrapper">
        <table class="tabela-estilo-puc">
          <thead>
            <tr>
              <th v-if="estruturaGradeHorario.temColunaTurnoPrincipal" class="th-canto-vazio"></th>

              <template v-for="(grupo, idxGrupo) in estruturaGradeHorario.grupos" :key="grupo.assinatura">
                <th
                  :class="idxGrupo === 0 ? 'th-cabecalho-padrao th-col-horas' : 'th-cabecalho-especifico th-col-horas'">
                  HORAS
                </th>

                <th v-for="dia in grupo.dias" :key="dia.data_slot"
                  :class="idxGrupo === 0 ? 'th-cabecalho-padrao' : 'th-cabecalho-especifico'">
                  <div class="th-dia-nome">{{ dia.tituloDia }}</div>
                  <div class="th-dia-data">{{ dia.dataCurta }}</div>
                </th>
              </template>
            </tr>
          </thead>

          <tbody>
            <tr v-for="idxLinha in estruturaGradeHorario.maxLinhas" :key="idxLinha">
              <template v-if="estruturaGradeHorario.temColunaTurnoPrincipal">
                <td v-if="estruturaGradeHorario.grupos[0]?.linhasMetadados[idxLinha - 1]?.mostrarBlocoLateral"
                  :rowspan="estruturaGradeHorario.grupos[0].linhasMetadados[idxLinha - 1].rowspanBlocoLateral" :style="{
                    backgroundColor: estruturaGradeHorario.grupos[0].linhasMetadados[idxLinha - 1].corFundo,
                    borderColor: estruturaGradeHorario.grupos[0].linhasMetadados[idxLinha - 1].corBorda
                  }" class="td-turno-vertical">
                  <div class="texto-turno-vertical">
                    {{ estruturaGradeHorario.grupos[0].linhasMetadados[idxLinha - 1].nomeBlocoLateral }}
                  </div>
                </td>
              </template>

              <template v-for="grupo in estruturaGradeHorario.grupos" :key="grupo.assinatura + '-' + idxLinha">
                <template v-if="(idxLinha - 1) < grupo.linhasMetadados.length">
                  <td class="td-celula-horas" :class="{
                    'borda-subbloco': grupo.linhasMetadados[idxLinha - 1]?.fimDeSubbloco,
                    'borda-bloco-principal': grupo.linhasMetadados[idxLinha - 1]?.fimDeBlocoPrincipal
                  }" :style="{
                      backgroundColor: grupo.linhasMetadados[idxLinha - 1]?.corFundo,
                      borderColor: grupo.linhasMetadados[idxLinha - 1]?.corBorda
                    }">
                    <div class="horas-empilhadas">
                      <span>{{ grupo.linhasMetadados[idxLinha - 1]?.horaInicio }}</span>
                      <span>{{ grupo.linhasMetadados[idxLinha - 1]?.horaFim }}</span>
                    </div>
                  </td>

                  <template v-for="dia in grupo.dias" :key="dia.data_slot + '-' + idxLinha">
                    <BlocoArrastavel v-if="!dia.celulas[idxLinha - 1]?.ocultaPorRowspan" tag="td" :grupo="dia.data_slot"
                      :indice="idxLinha - 1" :item="dia.celulas[idxLinha - 1]"
                      :disponivel="Boolean(dia.celulas[idxLinha - 1]?.reservavel_slot && !dia.celulas[idxLinha - 1]?.reservado_slot)"
                      :controlador="controladorArrastoVertical" :rowspan="dia.celulas[idxLinha - 1]?.rowspan || 1"
                      class="td-slot-agendavel" :class="{
                        'slot-ocupado': dia.celulas[idxLinha - 1]?.reservado_slot,
                        'slot-api': dia.celulas[idxLinha - 1]?.detalhes_reserva?.origem_criacao_reserva === 'API',
                        'slot-selecionado-arrasto': controladorArrastoVertical.verificarSelecionado(dia.data_slot, idxLinha - 1),
                        'borda-subbloco': grupo.linhasMetadados[(idxLinha - 1) + (dia.celulas[idxLinha - 1]?.rowspan || 1) - 1]?.fimDeSubbloco,
                        'borda-bloco-principal': grupo.linhasMetadados[(idxLinha - 1) + (dia.celulas[idxLinha - 1]?.rowspan || 1) - 1]?.fimDeBlocoPrincipal
                      }" :style="{
                        backgroundColor: controladorArrastoVertical.verificarSelecionado(dia.data_slot, idxLinha - 1)
                          ? 'var(--color-brand-light)'
                          : grupo.linhasMetadados[idxLinha - 1]?.corFundo,
                        borderColor: grupo.linhasMetadados[idxLinha - 1]?.corBorda
                      }">
                      <div class="conteudo-slot-horario" v-if="dia.celulas[idxLinha - 1]?.reservado_slot">
                        <span class="titulo-reserva-grade">
                          {{ dia.celulas[idxLinha - 1]?.detalhes_reserva?.titulo_reserva?.trim() || props.tituloPadrao
                          || 'Reservado' }}
                        </span>
                      </div>
                    </BlocoArrastavel>
                  </template>
                </template>

                <template v-else-if="idxLinha - 1 === grupo.linhasMetadados.length">
                  <td :colspan="grupo.dias.length + 1"
                    :rowspan="estruturaGradeHorario.maxLinhas - grupo.linhasMetadados.length"
                    class="td-espaco-vazio-relativo"></td>
                </template>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="aviso-vazio" v-else>
      <span>Nenhum horário operacional encontrado para este recurso.</span>
    </div>
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

.horario-conteudo {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
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

.grade-scroll-wrapper {
  flex-grow: 1;
  overflow: auto;
  padding: 16px;
  background: var(--bg-primary);
}

.tabela-estilo-puc {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12.5px;
  text-align: center;
}

.th-canto-vazio {
  width: 36px;
  min-width: 36px;
  max-width: 36px;
  background: transparent !important;
  border: none !important;
}

.th-col-horas {
  width: 78px;
  min-width: 78px;
  max-width: 78px;
}

.th-cabecalho-padrao {
  background-color: var(--color-brand) !important;
  color: #FFFFFF !important;
  font-weight: 800;
  padding: 8px 6px;
  border: 1px solid #005291;
  letter-spacing: 0.4px;
  position: sticky;
  top: 0;
  z-index: 4;
  border-color: color-mix(in srgb, var(--color-brand) 70%, white) !important;
}

.th-cabecalho-especifico {
  background-color: #808080 !important;
  color: #FFFFFF !important;
  font-weight: 800;
  padding: 8px 6px;
  border: 1px solid #666666;
  letter-spacing: 0.4px;
  position: sticky;
  top: 0;
  z-index: 4;
}

.th-dia-nome {
  font-size: 13px;
  line-height: 1.2;
}

.th-dia-data {
  font-size: 10.5px;
  font-weight: 600;
  opacity: 0.9;
}

.td-turno-vertical {
  width: 36px;
  min-width: 36px;
  max-width: 36px;
  border: 1.5px solid;
  padding: 4px 0;
  vertical-align: middle;
  text-align: center;
  color: #111827 !important;
}

.texto-turno-vertical {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-weight: 800;
  font-size: 13.5px;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0 auto;
  white-space: nowrap;
}

.td-celula-horas {
  border: 1px solid;
  padding: 4px 2px;
  height: 40px;
  color: #111827 !important;
  font-weight: 700;
  font-size: 11.5px;
}

.horas-empilhadas {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.15;
}

.td-slot-agendavel {
  border: 1px solid;
  padding: 4px 6px;
  height: 40px;
  cursor: pointer;
  transition: filter 0.12s ease, box-shadow 0.12s ease;
  vertical-align: middle;
  color: #111827 !important;
}

.td-slot-agendavel:hover {
  filter: brightness(0.93);
  box-shadow: inset 0 0 0 1.5px var(--color-brand);
}

.slot-selecionado-arrasto {
  box-shadow: inset 0 0 0 2px var(--color-brand) !important;
}

.slot-ocupado {
  font-weight: 700;
  background-color: #e5e7eb !important;
  background-image: repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.06) 10px, transparent 10px, transparent 20px) !important;
}

.conteudo-slot-horario {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.titulo-reserva-grade {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
  line-height: 1.25;
  word-break: break-word;
}

.borda-subbloco {
  border-bottom-width: 2px !important;
}

.borda-bloco-principal {
  border-bottom-width: 2.5px !important;
}

.td-espaco-vazio-relativo {
  background: transparent !important;
  border: none !important;
  pointer-events: none;
}

.aviso-vazio {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 1rem;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-light);
  border-top-color: var(--color-brand);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
[data-bs-theme="dark"] .td-turno-vertical,
[data-bs-theme="dark"] .texto-turno-vertical,
[data-bs-theme="dark"] .td-celula-horas,
[data-bs-theme="dark"] .horas-empilhadas span,
[data-bs-theme="dark"] .td-slot-agendavel,
[data-bs-theme="dark"] .titulo-reserva-grade {
  color: var(--text-primary) !important;
}

[data-bs-theme="dark"] .slot-ocupado {
  background-color: #374151 !important;
  background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03) 10px, transparent 10px, transparent 20px) !important;
}

[data-bs-theme="dark"] .th-cabecalho-padrao {
  background-color: color-mix(in srgb, var(--color-brand) 50%, black) !important;
  border-color: color-mix(in srgb, var(--color-brand) 70%, black) !important;
}
[data-bs-theme="dark"] .th-cabecalho-especifico {
  background-color: #4b5563 !important;
  border-color: #838a95 !important;
}
</style>