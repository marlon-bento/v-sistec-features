<!--
========
Este arquivo representa o componente visual puro da grade em matriz horizontal.
Ele renderiza as barras de data, cabeçalhos de blocos/subblocos, colunas fixas de recursos e células
arrastáveis na horizontal, emitindo eventos para o componente pai ao selecionar horários ou clicar em reservas.
========
-->
<script setup lang="ts">
import { useSelecaoArrasto } from '../../composables/useSelecaoArrasto';
import BlocoArrastavel from '../BlocoArrastavel.vue';

const props = withDefaults(defineProps<{
  dias: any[];
  carregando?: boolean;
  tituloPadrao?: string;
  mensagemVazio?: string;
}>(), {
  carregando: false,
  tituloPadrao: 'Reservado',
  mensagemVazio: 'Nenhuma sala selecionada.'
});

const emit = defineEmits<{
  (e: 'selecionar-intervalo', itensSelecionados: any[]): void;
  (e: 'clicar-reserva', detalhesReserva: any): void;
}>();

// Controlador visual de seleção por arrasto horizontal nas linhas de recursos.
const controladorArrastoHorizontal = useSelecaoArrasto({
  aoClicarItemIndisponivel: (item) => {
    if (item?.slot?.reservado_slot && item?.slot?.detalhes_reserva) {
      emit('clicar-reserva', item.slot.detalhes_reserva);
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
    <span>Processando grade temporal...</span>
  </div>

  <div class="matriz-conteudo" v-else>
    <slot name="topo"></slot>

    <div class="tabelas-scroll-container" v-if="props.dias.length > 0">
      <div
        class="bloco-dia-tabela"
        v-for="dia in props.dias"
        :key="dia.data_slot"
      >
        <div class="barra-data-full">
          <span class="texto-data">{{ dia.dataFormatada }}</span>
        </div>

        <div class="scroll-horizontal-tabela">
          <table class="tabela-premium">
            <thead>
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
    </div>

    <div class="aviso-vazio" v-else>
      <span>{{ props.mensagemVazio }}</span>
    </div>
  </div>
</template>

<style scoped>
.matriz-conteudo {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
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

.tabelas-scroll-container {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 24px;
}

.bloco-dia-tabela {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.scroll-horizontal-tabela {
  width: 100%;
  overflow-x: auto;
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

.hora-topo,
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
  background-image: repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.06) 10px, transparent 10px, transparent 20px) !important;
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
  background-color: var(--color-brand);
  color: #FFFFFF;
  padding: 9px 0;
  box-sizing: border-box;
  text-align: center;
  border-top: 1px solid #005291;
  border-bottom: 1px solid #005291;
  border-color: color-mix(in srgb, var(--color-brand) 90%, black) !important;
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
  background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03) 10px, transparent 10px, transparent 20px) !important;
}

[data-bs-theme="dark"] .barra-data-full {
  background-color: color-mix(in srgb, var(--color-brand) 50%, black) !important;
  border-color: color-mix(in srgb, var(--color-brand) 70%, black) !important;
}
</style>