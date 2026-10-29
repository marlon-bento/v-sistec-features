<!--
========
Este arquivo representa o componente visual puro da grade vertical de horários por turno.
Ele renderiza as colunas laterais de turno, os grupos de horários/dias e gerencia a seleção vertical
por arrasto, emitindo os eventos de agendamento e visualização de detalhes para o componente pai.
========
-->
<script setup lang="ts">
import { useSelecaoArrasto } from '../../composables/useSelecaoArrasto';
import BlocoArrastavel from '../BlocoArrastavel.vue';

const props = withDefaults(defineProps<{
  estrutura: {
    grupos: any[];
    maxLinhas: number;
    temColunaTurnoPrincipal: boolean;
  };
  carregando?: boolean;
  tituloPadrao?: string;
}>(), {
  carregando: false,
  tituloPadrao: 'Reservado'
});

const emit = defineEmits<{
  (e: 'selecionar-intervalo', itensSelecionados: any[]): void;
  (e: 'clicar-reserva', detalhesReserva: any): void;
}>();

// Controlador visual de seleção por arrasto vertical nas colunas de dias da semana.
const controladorArrastoVertical = useSelecaoArrasto({
  aoClicarItemIndisponivel: (celula) => {
    if (celula?.reservado_slot && celula?.detalhes_reserva) {
      emit('clicar-reserva', celula.detalhes_reserva);
    }
  },
  aoFinalizarSelecao: ({ itensSelecionados }) => {
    emit('selecionar-intervalo', itensSelecionados);
  }
});
</script>

<template>
  <div class="aviso-vazio" v-if="props.carregando">
    <div class="spinner"></div>
    <span>Processando grade de horários...</span>
  </div>

  <div class="horario-conteudo" v-else-if="props.estrutura.grupos.length > 0">
    <slot name="topo"></slot>

    <div class="grade-scroll-wrapper">
      <table class="tabela-estilo-puc">
        <thead>
          <tr>
            <th v-if="props.estrutura.temColunaTurnoPrincipal" class="th-canto-vazio"></th>

            <template v-for="(grupo, idxGrupo) in props.estrutura.grupos" :key="grupo.assinatura">
              <th :class="idxGrupo === 0 ? 'th-cabecalho-padrao th-col-horas' : 'th-cabecalho-especifico th-col-horas'">
                HORAS
              </th>

              <th
                v-for="dia in grupo.dias"
                :key="dia.data_slot"
                :class="idxGrupo === 0 ? 'th-cabecalho-padrao' : 'th-cabecalho-especifico'"
              >
                <div class="th-dia-nome">{{ dia.tituloDia }}</div>
                <div class="th-dia-data">{{ dia.dataCurta }}</div>
              </th>
            </template>
          </tr>
        </thead>

        <tbody>
          <tr v-for="idxLinha in props.estrutura.maxLinhas" :key="idxLinha">
            <template v-if="props.estrutura.temColunaTurnoPrincipal">
              <td
                v-if="props.estrutura.grupos[0]?.linhasMetadados[idxLinha - 1]?.mostrarBlocoLateral"
                :rowspan="props.estrutura.grupos[0].linhasMetadados[idxLinha - 1].rowspanBlocoLateral"
                :style="{
                  backgroundColor: props.estrutura.grupos[0].linhasMetadados[idxLinha - 1].corFundo,
                  borderColor: props.estrutura.grupos[0].linhasMetadados[idxLinha - 1].corBorda
                }"
                class="td-turno-vertical"
              >
                <div class="div-texto-turno-vertical">
                  <span class="texto-turno-vertical">
                    {{ props.estrutura.grupos[0].linhasMetadados[idxLinha - 1].nomeBlocoLateral }}
                  </span>
                </div>
              </td>
            </template>

            <template v-for="grupo in props.estrutura.grupos" :key="grupo.assinatura + '-' + idxLinha">
              <template v-if="(idxLinha - 1) < grupo.linhasMetadados.length">
                <td
                  class="td-celula-horas"
                  :class="{
                    'borda-subbloco': grupo.linhasMetadados[idxLinha - 1]?.fimDeSubbloco,
                    'borda-bloco-principal': grupo.linhasMetadados[idxLinha - 1]?.fimDeBlocoPrincipal
                  }"
                  :style="{
                    backgroundColor: grupo.linhasMetadados[idxLinha - 1]?.corFundo,
                    borderColor: grupo.linhasMetadados[idxLinha - 1]?.corBorda
                  }"
                >
                  <div class="horas-empilhadas">
                    <span>{{ grupo.linhasMetadados[idxLinha - 1]?.horaInicio }}</span>
                    <span>{{ grupo.linhasMetadados[idxLinha - 1]?.horaFim }}</span>
                  </div>
                </td>

                <template v-for="dia in grupo.dias" :key="dia.data_slot + '-' + idxLinha">
                  <BlocoArrastavel
                    v-if="!dia.celulas[idxLinha - 1]?.ocultaPorRowspan"
                    tag="td"
                    :grupo="dia.data_slot"
                    :indice="idxLinha - 1"
                    :item="dia.celulas[idxLinha - 1]"
                    :disponivel="Boolean(dia.celulas[idxLinha - 1]?.reservavel_slot && !dia.celulas[idxLinha - 1]?.reservado_slot)"
                    :controlador="controladorArrastoVertical"
                    :rowspan="dia.celulas[idxLinha - 1]?.rowspan || 1"
                    class="td-slot-agendavel"
                    :class="{
                      'slot-ocupado': dia.celulas[idxLinha - 1]?.reservado_slot,
                      'slot-api': dia.celulas[idxLinha - 1]?.detalhes_reserva?.origem_criacao_reserva === 'API',
                      'slot-selecionado-arrasto': controladorArrastoVertical.verificarSelecionado(dia.data_slot, idxLinha - 1),
                      'borda-subbloco': grupo.linhasMetadados[(idxLinha - 1) + (dia.celulas[idxLinha - 1]?.rowspan || 1) - 1]?.fimDeSubbloco,
                      'borda-bloco-principal': grupo.linhasMetadados[(idxLinha - 1) + (dia.celulas[idxLinha - 1]?.rowspan || 1) - 1]?.fimDeBlocoPrincipal
                    }"
                    :style="{
                      backgroundColor: controladorArrastoVertical.verificarSelecionado(dia.data_slot, idxLinha - 1)
                        ? 'var(--color-brand-light)'
                        : grupo.linhasMetadados[idxLinha - 1]?.corFundo,
                      borderColor: grupo.linhasMetadados[idxLinha - 1]?.corBorda
                    }"
                  >
                    <div class="conteudo-slot-horario" v-if="dia.celulas[idxLinha - 1]?.reservado_slot">
                      <span class="titulo-reserva-grade">
                        {{ dia.celulas[idxLinha - 1]?.detalhes_reserva?.titulo_reserva?.trim() || props.tituloPadrao || 'Reservado' }}
                      </span>
                    </div>
                  </BlocoArrastavel>
                </template>
              </template>

              <template v-else-if="idxLinha - 1 === grupo.linhasMetadados.length">
                <td
                  :colspan="grupo.dias.length + 1"
                  :rowspan="props.estrutura.maxLinhas - grupo.linhasMetadados.length"
                  class="td-espaco-vazio-relativo"
                ></td>
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
</template>

<style scoped>
.horario-conteudo {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
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

.div-texto-turno-vertical {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
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
  to { transform: rotate(360deg); }
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