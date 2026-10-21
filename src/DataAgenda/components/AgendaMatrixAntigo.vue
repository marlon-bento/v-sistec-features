<!--
========
Este arquivo representa a visualização em grade (matriz) da agenda.
Ele cruza múltiplos recursos e intervalos de tempo a partir do retorno padronizado datas_matriz,
permitindo criar novas reservas nos blocos livres ou visualizar detalhes ao clicar nos blocos reservados.
========
-->
<script setup lang="ts">
import { computed, onMounted, watch, ref, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda.ts';
import ModalReserva from './ModalReserva.vue';
import ModalDetalhesReserva from './ModalDetalhesReserva.vue';

const props = defineProps({
    usaInterceptador: { type: Boolean, default: false },
    tituloPadrao: { type: String, default: '' },
    ocultarTituloModal: { type: Boolean, default: false }
});

const api = inject('api-instance-agenda') as any;
const emit = defineEmits(['before-save']);
const {
    dadosMatrix,
    buscarSlotsMatrix,
    buscarReservas,
    agendaSelecionada,
    dataSelecionada,
    converterParaUtc
} = useAgenda(api);

// Indica se a matriz está buscando e processando dados.
const carregando = ref(false);

// Armazena os IDs (em string) dos recursos visíveis selecionados no filtro.
const recursosVisiveisIds = ref<string[]>([]);

// Controla a abertura do menu dropdown de filtro de salas.
const menuFiltroAberto = ref(false);

// Controla a abertura do modal de criação de reserva.
const modalAberto = ref(false);

// Armazena os dados do slot livre clicado para preencher o modal de criação.
const dadosParaModal = ref({});

// Controla a abertura do modal de detalhes de uma reserva existente.
const modalDetalhesAberto = ref(false);

// Armazena o objeto da reserva clicada para exibição no modal de detalhes.
const reservaSelecionadaDetalhes = ref<any>(null);

// Recebe nada e devolve uma Promise.
// É usada para buscar os slots da matriz e as reservas correspondentes à janela de 7 dias a partir da data selecionada.
const dispararBuscaMatrix = async () => {
    const idAgenda = agendaSelecionada.value;
    if (!idAgenda) return;

    carregando.value = true;

    const valorData = dataSelecionada.value || new Date();
    let dataInicio: Date;

    if (typeof valorData === 'string') {
        const apenasData = String(valorData).substring(0, 10);
        const [ano, mes, dia] = apenasData.split('-');
        dataInicio = new Date(Number(ano), Number(mes) - 1, Number(dia));
    } else {
        dataInicio = new Date(valorData);
    }

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

onMounted(() => { dispararBuscaMatrix(); });

watch([dataSelecionada, agendaSelecionada], () => { dispararBuscaMatrix(); });

// Extrai a lista de recursos presentes no primeiro dia retornado na matriz.
const recursosPermitidosNaMatriz = computed(() => {
    if (!dadosMatrix.value?.datas_matriz?.[0]?.recursos_slot) return [];
    return dadosMatrix.value.datas_matriz[0].recursos_slot;
});

watch(recursosPermitidosNaMatriz, (novosRecursos) => {
    recursosVisiveisIds.value = novosRecursos.map((r: any) => String(r.id_recurso));
}, { immediate: true });

// Marca todos os recursos no filtro de salas.
const selecionarTodos = () => {
    recursosVisiveisIds.value = recursosPermitidosNaMatriz.value.map((r: any) => String(r.id_recurso));
};

// Desmarca todos os recursos no filtro de salas.
const limparFiltros = () => {
    recursosVisiveisIds.value = [];
};

// Recebe uma string ISO e devolve o total de minutos correspondente ao horário local.
const extrairMinutos = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.getHours() * 60 + d.getMinutes();
};

// Monta a lista ordenada de horários (em minutos) para o cabeçalho das colunas da tabela.
const horariosGlobaisEmMinutos = computed(() => {
    if (!dadosMatrix.value?.datas_matriz) return [];
    const setMinutos = new Set<number>();

    dadosMatrix.value.datas_matriz.forEach((dia: any) => {
        dia.recursos_slot.forEach((rec: any) => {
            rec.horarios_slot.forEach((slot: any) => {
                setMinutos.add(extrairMinutos(slot.data_inicio_slot));
            });
        });
    });

    return Array.from(setMinutos).sort((a, b) => a - b);
});

// Processa os dias, filtra os recursos selecionados e calcula o colspan de cada slot de horário.
const matrizProcessada = computed(() => {
    if (!dadosMatrix.value?.datas_matriz || horariosGlobaisEmMinutos.value.length === 0) return [];

    const mapaHorarios = horariosGlobaisEmMinutos.value;

    return dadosMatrix.value.datas_matriz.map((dia: any) => {
        const recursosFiltrados = dia.recursos_slot.filter((res: any) =>
            recursosVisiveisIds.value.includes(String(res.id_recurso))
        );

        if (recursosFiltrados.length === 0) return null;

        const recursosComColspan = recursosFiltrados.map((rec: any) => {
            const slotsCalculados = rec.horarios_slot.map((slot: any) => {
                const inicioMin = extrairMinutos(slot.data_inicio_slot);
                let fimMin = extrairMinutos(slot.data_fim_slot);

                if (fimMin === 0 && new Date(slot.data_fim_slot) > new Date(slot.data_inicio_slot)) {
                    fimMin = 24 * 60;
                }

                let tamanhoColspan = 0;
                for (let h = 0; h < mapaHorarios.length; h++) {
                    if ((mapaHorarios[h] ?? 0) >= inicioMin && (mapaHorarios[h] ?? 0) < fimMin) {
                        tamanhoColspan++;
                    }
                }
                return { ...slot, colspan: tamanhoColspan > 0 ? tamanhoColspan : 1 };
            });
            return { ...rec, horarios_slot: slotsCalculados };
        });

        return { ...dia, recursos_slot: recursosComColspan };
    }).filter((dia: any) => dia !== null);
});

// Recebe minutos totais e devolve a string formatada HH:MM.
const formatarHoraDeMinutos = (minutosTotais: number) => {
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

// Recebe a string YYYY-MM-DD do dia e devolve o texto por extenso em português.
const formatarData = (isoData: string) => {
    const apenasData = String(isoData).substring(0, 10);
    const [ano, mes, dia] = apenasData.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

// Recebe o ID do recurso e o objeto slot clicado.
// Se estiver reservado, abre o modal de detalhes; se estiver livre e reservável, abre o modal de criação.
const aoClicarSlotMatrix = (idRecurso: number, slot: any) => {
    if (slot.reservado_slot && slot.detalhes_reserva) {
        reservaSelecionadaDetalhes.value = slot.detalhes_reserva;
        modalDetalhesAberto.value = true;
        return;
    }

    if (!slot.reservavel_slot) return;

    const extrair = (isoString: string) => {
        const d = new Date(isoString);
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        const horas = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return { data: `${ano}-${mes}-${dia}`, hora: `${horas}:${min}` };
    };

    const inicio = extrair(slot.data_inicio_slot);
    const fim = extrair(slot.data_fim_slot);

    dadosParaModal.value = {
        id_recurso: idRecurso,
        titulo_reserva: '',
        data_inicio: inicio.data,
        hora_inicio: inicio.hora,
        data_fim: fim.data,
        hora_fim: fim.hora
    };

    modalAberto.value = true;
};
</script>

<template>
  <div class="matriz-container">
    <ModalReserva
      v-model="modalAberto"
      :dados-iniciais="dadosParaModal"
      :usa-interceptador="props.usaInterceptador"
      :ocultar-titulo-modal="props.ocultarTituloModal"
      @before-save="$emit('before-save',$event)"
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
      <div class="barra-filtros" v-if="recursosPermitidosNaMatriz.length > 0">
        <div class="dropdown-container">
          <button class="btn-dropdown" @click="menuFiltroAberto = !menuFiltroAberto">
            <span class="texto-btn">
              Filtro de Salas ({{ recursosVisiveisIds.length }}/{{ recursosPermitidosNaMatriz.length }})
            </span>
            <svg
              class="icone-seta"
              :class="{ 'girado': menuFiltroAberto }"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div class="backdrop-invisivel" v-if="menuFiltroAberto" @click="menuFiltroAberto = false"></div>

          <div class="dropdown-menu" v-if="menuFiltroAberto">
            <div class="dropdown-acoes">
              <button class="btn-acao" @click="selecionarTodos">Todos</button>
              <button class="btn-acao" @click="limparFiltros">Nenhum</button>
            </div>

            <div class="dropdown-lista">
              <label
                class="dropdown-item"
                v-for="rec in recursosPermitidosNaMatriz"
                :key="rec.id_recurso"
                :class="{ 'ativo': recursosVisiveisIds.includes(String(rec.id_recurso)) }"
              >
                <input
                  class="checkbox-estiloso"
                  type="checkbox"
                  :value="String(rec.id_recurso)"
                  v-model="recursosVisiveisIds"
                />
                <span>{{ rec.nome_recurso }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="tabela-wrapper" v-if="matrizProcessada.length > 0">
        <table class="tabela-premium">
          <thead>
            <tr>
              <th class="coluna-fixa cabecalho-canto">Nome</th>
              <th v-for="minuto in horariosGlobaisEmMinutos" :key="minuto">
                {{ formatarHoraDeMinutos(minuto) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="dia in matrizProcessada" :key="dia.data_slot">
              <tr class="linha-data">
                <td :colspan="horariosGlobaisEmMinutos.length + 1">
                  <div class="barra-data-full">
                    <span class="texto-data">{{ formatarData(dia.data_slot) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-for="recurso in dia.recursos_slot" :key="recurso.id_recurso">
                <td class="coluna-fixa nome-recurso">{{ recurso.nome_recurso }}</td>
                <td
                  v-for="slot in recurso.horarios_slot"
                  :key="slot.data_inicio_slot"
                  :colspan="slot.colspan"
                >
                  <div
                    class="bloco-tempo"
                    :class="{
                      'reservado': slot.reservado_slot,
                      'bloqueado': !slot.reservavel_slot && !slot.reservado_slot,
                      'livre': slot.reservavel_slot && !slot.reservado_slot,
                      'api-forjada': slot.detalhes_reserva?.origem_criacao_reserva === 'API'
                    }"
                    @click="aoClicarSlotMatrix(recurso.id_recurso, slot)"
                  >
                    <span class="etiqueta-reserva" v-if="slot.reservado_slot">
                      {{ slot.detalhes_reserva?.titulo_reserva?.trim() || props.tituloPadrao }}
                    </span>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="aviso-vazio" v-else>
        <span>Nenhuma sala selecionada.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.matriz-container { width: 100%; height: 100%; background: var(--bg-primary); display: flex; flex-direction: column; }
.matriz-conteudo { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.aviso-vazio { display: flex; flex-direction: column; justify-content: center; align-items: center; flex-grow: 1; color: var(--text-secondary); font-weight: 500; font-size: 1rem; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--border-light); border-top-color: var(--color-brand); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.barra-filtros { padding: 12px 24px; background-color: var(--bg-primary); border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
.dropdown-container { position: relative; display: inline-block; }
.btn-dropdown { display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 8px; color: var(--text-primary); font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
.btn-dropdown:hover { background: var(--bg-hover); border-color: var(--border-editor); }
.icone-seta { transition: transform 0.2s ease; }
.icone-seta.girado { transform: rotate(180deg); }
.backdrop-invisivel { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 40; }
.dropdown-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; width: 260px; background: var(--bg-modal); border: 1px solid var(--border-light); border-radius: 10px; box-shadow: var(--shadow-float); z-index: 50; display: flex; flex-direction: column; overflow: hidden; }
.dropdown-acoes { display: flex; border-bottom: 1px solid var(--border-light); background: var(--bg-secondary); }
.btn-acao { flex: 1; padding: 10px; background: transparent; border: none; font-size: 12px; font-weight: 600; color: var(--color-brand); cursor: pointer; transition: background 0.2s; }
.btn-acao:hover { background: var(--color-brand-light); }
.btn-acao:first-child { border-right: 1px solid var(--border-light); }
.dropdown-lista { max-height: 250px; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-primary); transition: background 0.2s; }
.dropdown-item:hover { background: var(--bg-hover); }
.dropdown-item.ativo { background: var(--color-brand-light); color: var(--color-brand); }
.checkbox-estiloso { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; border: 2px solid var(--border-editor); border-radius: 4px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; background: var(--bg-primary); flex-shrink: 0; }
.dropdown-item.ativo .checkbox-estiloso { background: var(--color-brand); border-color: var(--color-brand); }
.checkbox-estiloso::before { content: ""; width: 10px; height: 10px; transform: scale(0); transition: 0.12s transform ease-in-out; background-color: var(--text-inverse); clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
.dropdown-item.ativo .checkbox-estiloso::before { transform: scale(1); }
.tabela-wrapper { flex-grow: 1; overflow: auto; background: var(--bg-secondary); }
.tabela-premium { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; text-align: center; table-layout: fixed; }
.tabela-premium th, .tabela-premium td { padding: 3px; min-width: 65px; height: 48px; border-bottom: 1px solid var(--border-light); border-right: 1px solid var(--border-light); }
.tabela-premium th:first-child, .tabela-premium td:first-child { border-left: 1px solid var(--border-light); }
.tabela-premium thead th { border-top: 1px solid var(--border-light); background: var(--bg-primary); position: sticky; top: 0; z-index: 3; font-weight: 700; color: var(--text-primary); box-shadow: var(--shadow-sm); }
.coluna-fixa { width: 200px; text-align: left; background: var(--bg-primary); position: sticky; left: 0; z-index: 1; }
.cabecalho-canto { z-index: 4 !important; padding-left: 24px !important; }
.linha-data td { background: transparent !important; border: none !important; padding: 8px 12px !important; }
.barra-data-full { display: flex; align-items: center; width: 100%; background: var(--bg-primary); color: var(--text-primary); padding: 8px 0; border-radius: 8px; box-shadow: var(--shadow-sm); box-sizing: border-box; border: 1px solid var(--border-light); }
.texto-data { position: sticky; left: 24px; font-weight: 700; font-size: 13.5px; text-transform: capitalize; letter-spacing: 0.5px; }
.nome-recurso { font-weight: 600; color: var(--text-primary); background: var(--bg-primary) !important; padding-left: 24px !important; box-shadow: 4px 0 8px rgba(0,0,0,0.02); }
.bloco-tempo { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 6px; transition: all 0.2s ease; box-sizing: border-box; padding: 4px; }
.bloqueado { background-color: var(--border-light); background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.08) 8px, rgba(0, 0, 0, 0.08) 16px); cursor: not-allowed; border: 1px solid var(--border-editor); }
.livre { background-color: transparent; cursor: pointer; }
.livre:hover { background-color: var(--color-brand-light); box-shadow: inset 0 0 0 1px var(--color-brand); }
.reservado { background: var(--color-brand); color: var(--text-inverse); border: 1px solid var(--color-brand); cursor: pointer; }
.reservado:hover { filter: brightness(1.08); }
.api-forjada { background: var(--color-success); color: var(--text-inverse); border: 1px solid var(--color-success); cursor: pointer; }
.etiqueta-reserva { font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 100%; font-weight: 600; }
</style>