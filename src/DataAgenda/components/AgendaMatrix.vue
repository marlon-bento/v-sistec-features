<script setup lang="ts">
import { computed, onMounted, watch, ref, inject } from 'vue';
import { useAgenda } from '../composables/useAgenda';
import ModalReserva from './ModalReserva.vue';
const props = defineProps({
    usaInterceptador: { type: Boolean, default: false },
    
});
const api = inject('api-instance-agenda') as any; // Recebe a instância do v-api-fetch do projeto consumidor
const emit = defineEmits(['before-save']);
const { 
    dadosMatrix, 
    buscarSlotsMatrix,
    buscarReservas,
    agendaSelecionada, 
    dataSelecionada,
    converterParaUtc 
} = useAgenda(api);

const carregando = ref(false);
const recursosVisiveisIds = ref<string[]>([]);
const menuFiltroAberto = ref(false);

const modalAberto = ref(false);
const dadosParaModal = ref({});

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

    // CORREÇÃO: Converter para UTC e forçar o URL Encoding do símbolo "+".
    // Isso envia ex: "2026-09-10T03:00:00+0000" e impede o LibreBooking de
    // deduzir o fuso e devolver blocos iniciados às 21:00 do dia anterior.
    const inicioUtc = encodeURIComponent(converterParaUtc(strInicio, '00:00'));
    const fimUtc = encodeURIComponent(converterParaUtc(strFim, '23:59'));
    
    await buscarSlotsMatrix(idAgenda, inicioUtc, fimUtc);
    
    // A rota normal de reservas pode não precisar do Encode, mas a de Slots do Librebooking é estrita
    await buscarReservas(`${strInicio}T00:00:00`, `${strFim}T23:59:59`);
    carregando.value = false;
};

onMounted(() => { dispararBuscaMatrix(); });

watch([dataSelecionada, agendaSelecionada], () => { dispararBuscaMatrix(); });

const recursosPermitidosNaMatriz = computed(() => {
    if (!dadosMatrix.value?.dates?.[0]?.resources) return [];
    return dadosMatrix.value.dates[0].resources;
});

watch(recursosPermitidosNaMatriz, (novosRecursos) => {
    recursosVisiveisIds.value = novosRecursos.map((r: any) => String(r.resourceId));
}, { immediate: true });

const selecionarTodos = () => {
    recursosVisiveisIds.value = recursosPermitidosNaMatriz.value.map((r: any) => String(r.resourceId));
};

const limparFiltros = () => {
    recursosVisiveisIds.value = [];
};

const extrairMinutos = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.getHours() * 60 + d.getMinutes();
};

const horariosGlobaisEmMinutos = computed(() => {
    if (!dadosMatrix.value?.dates) return [];
    const setMinutos = new Set<number>();

    dadosMatrix.value.dates.forEach((dia: any) => {
        dia.resources.forEach((rec: any) => {
            rec.slots.forEach((slot: any) => {
                setMinutos.add(extrairMinutos(slot.startDateTime));
            });
        });
    });

    return Array.from(setMinutos).sort((a, b) => a - b);
});

const matrizProcessada = computed(() => {
    if (!dadosMatrix.value?.dates || horariosGlobaisEmMinutos.value.length === 0) return [];
    
    const mapaHorarios = horariosGlobaisEmMinutos.value;

    return dadosMatrix.value.dates.map((dia: any) => {
        const recursosFiltrados = dia.resources.filter((res: any) => 
            recursosVisiveisIds.value.includes(String(res.resourceId))
        );

        if (recursosFiltrados.length === 0) return null;

        const resourcesComColspan = recursosFiltrados.map((rec: any) => {
            const slotsCalculados = rec.slots.map((slot: any) => {
                const inicioMin = extrairMinutos(slot.startDateTime);
                let fimMin = extrairMinutos(slot.endDateTime);
                
                if (fimMin === 0 && new Date(slot.endDateTime) > new Date(slot.startDateTime)) {
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
            return { ...rec, slots: slotsCalculados };
        });

        return { ...dia, resources: resourcesComColspan };
    }).filter((dia: any) => dia !== null);
});

const formatarHoraDeMinutos = (minutosTotais: number) => {
    const horas = Math.floor(minutosTotais / 60);
    const minutos = minutosTotais % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

const formatarData = (isoData: string) => {
    // CORREÇÃO: Corta a string estritamente nos 10 primeiros caracteres (YYYY-MM-DD)
    // Isso garante que se a data vier no padrão UTC, ela não vai sofrer shift no front.
    const apenasData = String(isoData).substring(0, 10);
    const [ano, mes, dia] = apenasData.split('-');
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};

const iniciarReservaMatrix = (recursoId: number, slot: any) => {
    if (!slot.isReservable || slot.isReserved) return;

    const extrair = (isoString: string) => {
        const d = new Date(isoString);
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        const horas = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return { data: `${ano}-${mes}-${dia}`, hora: `${horas}:${min}` };
    };

    const inicio = extrair(slot.startDateTime);
    const fim = extrair(slot.endDateTime);

    dadosParaModal.value = {
        resourceId: recursoId,
        title: '',
        startDate: inicio.data,
        startTime: inicio.hora,
        endDate: fim.data,
        endTime: fim.hora
    };

    modalAberto.value = true;
};
</script>
<template>
  <div class="matriz-container">
    <ModalReserva
      v-model="modalAberto"
      :dados-iniciais="dadosParaModal"
      :usa-interceptador="usaInterceptador"
      @before-save="$emit('before-save', $event)"
      @salvo="dispararBuscaMatrix"
    >
      <template #campos-extras>
        <slot name="campos-extras"></slot>
      </template>
    </ModalReserva>

    <div class="aviso-vazio" v-if="carregando">
      <div class="spinner"></div>
      <span>Processando grade temporal...</span>
    </div>

    <div class="matriz-conteudo" v-else-if="dadosMatrix.dates">
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
                :key="rec.resourceId"
                :class="{ 'ativo': recursosVisiveisIds.includes(String(rec.resourceId)) }"
              >
                <input
                  class="checkbox-estiloso"
                  type="checkbox"
                  :value="String(rec.resourceId)"
                  v-model="recursosVisiveisIds"
                />
                <span>{{ rec.resourceName }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="tabela-wrapper" v-if="matrizProcessada.length > 0">
        <table class="tabela-premium">
          <thead>
            <tr>
              <th class="coluna-fixa cabecalho-canto">Recurso / Horário</th>
              <th v-for="minuto in horariosGlobaisEmMinutos" :key="minuto">
                {{ formatarHoraDeMinutos(minuto) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="dia in matrizProcessada" :key="dia.date">
              <tr class="linha-data">
                <td :colspan="horariosGlobaisEmMinutos.length + 1">
                  <div class="barra-data-full">
                    <span class="texto-data">{{ formatarData(dia.date) }}</span>
                  </div>
                </td>
              </tr>

              <tr v-for="recurso in dia.resources" :key="recurso.resourceId">
                <td class="coluna-fixa nome-recurso">{{ recurso.resourceName }}</td>
                <td
                  v-for="slot in recurso.slots"
                  :key="slot.startDateTime"
                  :colspan="slot.colspan"
                >
                  <div
                    class="bloco-tempo"
                    :class="{
                      'reservado': slot.isReserved,
                      'bloqueado': !slot.isReservable,
                      'livre': slot.isReservable && !slot.isReserved,
                      'api-forjada': slot.reservation?.title?.includes('[API]')
                    }"
                    @click="iniciarReservaMatrix(recurso.resourceId, slot)"
                  >
                    <span class="etiqueta-reserva" v-if="slot.isReserved">
                      {{ slot.reservation?.title || slot.label }}
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
.matriz-container { width: 100%; height: 100%; background: #ffffff; display: flex; flex-direction: column; }
.matriz-conteudo { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.aviso-vazio { display: flex; flex-direction: column; justify-content: center; align-items: center; flex-grow: 1; color: #64748b; font-weight: 500; font-size: 1rem; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.barra-filtros { padding: 12px 24px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.dropdown-container { position: relative; display: inline-block; }
.btn-dropdown { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; color: #334155; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
.btn-dropdown:hover { background: #f1f5f9; border-color: #94a3b8; }
.icone-seta { transition: transform 0.2s ease; }
.icone-seta.girado { transform: rotate(180deg); }
.backdrop-invisivel { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 40; }
.dropdown-menu { position: absolute; top: 100%; left: 0; margin-top: 8px; width: 260px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); z-index: 50; display: flex; flex-direction: column; overflow: hidden; }
.dropdown-acoes { display: flex; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
.btn-acao { flex: 1; padding: 10px; background: transparent; border: none; font-size: 12px; font-weight: 600; color: #3b82f6; cursor: pointer; transition: background 0.2s; }
.btn-acao:hover { background: #e0f2fe; }
.btn-acao:first-child { border-right: 1px solid #f1f5f9; }
.dropdown-lista { max-height: 250px; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.dropdown-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: #475569; transition: background 0.2s; }
.dropdown-item:hover { background: #f1f5f9; }
.dropdown-item.ativo { background: #f0f9ff; color: #0369a1; }
.checkbox-estiloso { appearance: none; -webkit-appearance: none; width: 16px; height: 16px; border: 2px solid #94a3b8; border-radius: 4px; display: grid; place-content: center; cursor: pointer; transition: all 0.2s ease; background: #ffffff; flex-shrink: 0; }
.dropdown-item.ativo .checkbox-estiloso { background: #3b82f6; border-color: #3b82f6; }
.checkbox-estiloso::before { content: ""; width: 10px; height: 10px; transform: scale(0); transition: 0.12s transform ease-in-out; background-color: #ffffff; clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%); }
.dropdown-item.ativo .checkbox-estiloso::before { transform: scale(1); }
.tabela-wrapper { flex-grow: 1; overflow: auto; background: #f8fafc; }
.tabela-premium { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12.5px; text-align: center; table-layout: fixed; }
.tabela-premium th, .tabela-premium td { padding: 3px; min-width: 65px; height: 48px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
.tabela-premium th:first-child, .tabela-premium td:first-child { border-left: 1px solid #e2e8f0; }
.tabela-premium thead th { border-top: 1px solid #e2e8f0; background: #ffffff; position: sticky; top: 0; z-index: 3; font-weight: 700; color: #475569; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.coluna-fixa { width: 200px; text-align: left; background: #ffffff; position: sticky; left: 0; z-index: 1; }
.cabecalho-canto { z-index: 4 !important; padding-left: 24px !important; }
.linha-data td { background: transparent !important; border: none !important; padding: 8px 12px !important; }
.barra-data-full { display: flex; align-items: center; width: 100%; background: #334155; color: #ffffff; padding: 8px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); box-sizing: border-box; }
.texto-data { position: sticky; left: 24px; font-weight: 700; font-size: 13.5px; text-transform: capitalize; letter-spacing: 0.5px; }
.nome-recurso { font-weight: 600; color: #334155; background: #ffffff !important; padding-left: 24px !important; box-shadow: 4px 0 8px rgba(0,0,0,0.02); }
.bloco-tempo { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 6px; transition: all 0.2s ease; box-sizing: border-box; padding: 4px; }
.bloqueado { background-color: #cbd5e1; background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(15, 23, 42, 0.08) 8px, rgba(15, 23, 42, 0.08) 16px); cursor: not-allowed; border: 1px solid #94a3b8; }
.livre { background-color: transparent; cursor: pointer; }
.livre:hover { background-color: #e0f2fe; box-shadow: inset 0 0 0 1px #7dd3fc; }
.reservado { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25); border: 1px solid #1d4ed8; }
.api-forjada { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25); border: 1px solid #047857; }
.etiqueta-reserva { font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 100%; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
</style>