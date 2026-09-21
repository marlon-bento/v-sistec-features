/*
========
Encapsula o estado global e a comunicação com a API.
Adicionada a funcionalidade para enviar a requisição de criação de reserva para o back-end.
========
*/
import { ref, watch } from 'vue';



type FormatoDataSimplesVueCal = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

const reservasBrutas = ref<any[]>([]);
const recursosDisponiveis = ref<any[]>([]);
const agendasDisponiveis = ref<any[]>([]);

const agendaSelecionada = ref<number | null>(null); 
const recursoSelecionado = ref<number | null>(null); 

const dataSelecionada = ref(new Date());
const dataVisao = ref(new Date());
const visaoAtiva = ref('week');
const minutosInicio = ref(8 * 60);
const minutosFim = ref(19 * 60);
const datasDesabilitadas = ref<FormatoDataSimplesVueCal[]>([]);
const dadosMatrix = ref<any>({});
const periodsAgenda = ref<any[]>([]);

export function useAgenda(api: any) {
    
    // Função auxiliar para converter a data/hora local do input para UTC no formato do LibreBooking
    const converterParaUtc = (dataStr: string, horaStr: string) => {
        const d = new Date(`${dataStr}T${horaStr}:00`);
        const ano = d.getUTCFullYear();
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const horas = String(d.getUTCHours()).padStart(2, '0');
        const minutos = String(d.getUTCMinutes()).padStart(2, '0');
        const segundos = String(d.getUTCSeconds()).padStart(2, '0');
        return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}+0000`;
    };
    const processarDetalhesAgenda = (idAgenda: number) => {
        const agenda = agendasDisponiveis.value.find(a => a.id === idAgenda);
        if (!agenda || !agenda.detalhes) return;
        const detalhes = agenda.detalhes;

        if (detalhes.weekdayStart !== undefined && detalhes.daysVisible !== undefined) {
            const startDayLB = parseInt(detalhes.weekdayStart);
            const daysVisible = parseInt(detalhes.daysVisible);
            const diasVisiveisVueCal: number[] = [];
            for (let i = 0; i < daysVisible; i++) {
                let diaLogico = (startDayLB + i) % 7;
                diasVisiveisVueCal.push(diaLogico === 0 ? 7 : diaLogico);
            }

            const todosOsDias = [1, 2, 3, 4, 5, 6, 7];
            const diasBloqueados = todosOsDias.filter(d => !diasVisiveisVueCal.includes(d));
            const datas: FormatoDataSimplesVueCal[] = [];
            const anoAtual = new Date().getFullYear();

            for (let ano = anoAtual - 1; ano <= anoAtual + 1; ano++) {
                for (let mes = 0; mes < 12; mes++) {
                    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
                    for (let dia = 1; dia <= diasNoMes; dia++) {
                        const dataAtual = new Date(ano, mes, dia);
                        const diaDaSemana = dataAtual.getDay() === 0 ? 7 : dataAtual.getDay();
                        if (diasBloqueados.includes(diaDaSemana)) {
                            const anoStr = dataAtual.getFullYear();
                            const mesStr = String(dataAtual.getMonth() + 1).padStart(2, '0');
                            const diaStr = String(dataAtual.getDate()).padStart(2, '0');
                            datas.push(`${anoStr}-${mesStr}-${diaStr}` as FormatoDataSimplesVueCal);
                        }
                    }
                }
            }
            datasDesabilitadas.value = datas;
        }

        if (detalhes.periods && Array.isArray(detalhes.periods)) {
            let menorMinuto = 24 * 60;
            let maiorMinuto = 0;
            detalhes.periods.forEach((dia: any[]) => {
                dia.forEach((slot: any) => {
                    if (slot.isReservable) {
                        const [horaInicio, minInicio] = slot.startTime.split(':');
                        const [horaFim, minFim] = slot.endTime.split(':');
                        const tempoInicio = parseInt(horaInicio) * 60 + parseInt(minInicio);
                        const tempoFim = parseInt(horaFim) * 60 + parseInt(minFim);
                        if (tempoInicio < menorMinuto) menorMinuto = tempoInicio;
                        if (tempoFim > maiorMinuto) maiorMinuto = tempoFim;
                    }
                });
            });
            if (menorMinuto < 24 * 60) minutosInicio.value = menorMinuto;
            if (maiorMinuto > 0) minutosFim.value = maiorMinuto;
        }
    };

    const carregarRecursosEAgendas = async () => {
        try {
            const resposta = await api.get('/recursos/');
            const dados = resposta.data || resposta;
            if (dados?.recursos?.length > 0) {
                recursosDisponiveis.value = dados.recursos;
                
                if (!recursoSelecionado.value) {
                    recursoSelecionado.value = dados.recursos[0].id;
                }

                const mapaAgendas = new Map<number, { id: number, nome: string, detalhes?: any }>();
                
                dados.recursos.forEach((r: any) => {
                    const sId = r.scheduleId || r.schedule_id;
                    if (sId !== undefined && sId !== null) {
                        const nomeAgenda = r.scheduleName || r.schedule_name || `Agenda ${sId}`;
                        if (!mapaAgendas.has(sId)) {
                            mapaAgendas.set(sId, { id: sId, nome: nomeAgenda });
                        }
                    }
                });

                for (const [sId, agendaObj] of mapaAgendas.entries()) {
                    try {
                        const respDetalhes = await api.get(`/agendas/${sId}/detalhes/`);
                        const detalhes = respDetalhes.data || respDetalhes;
                        agendaObj.detalhes = detalhes;
                        
                        if (detalhes && detalhes.name) {
                            agendaObj.nome = detalhes.name;
                        }
                    } catch (e) {
                        console.error("Erro ao buscar detalhes da agenda", sId);
                    }
                }

                agendasDisponiveis.value = Array.from(mapaAgendas.values());

                if (agendasDisponiveis.value.length > 0 && !agendaSelecionada.value) {
                    agendaSelecionada.value = agendasDisponiveis.value[0].id;
                    processarDetalhesAgenda(agendasDisponiveis.value[0].id);
                }
            }
        } catch (erro) {
            console.error("Erro em carregarRecursosEAgendas:", erro);
        }
    };

    watch(agendaSelecionada, (novoId) => {
        if (novoId) processarDetalhesAgenda(novoId);
    });

    watch(recursoSelecionado, (novoId) => {
        if (novoId) {
            const recurso = recursosDisponiveis.value.find(r => r.id === novoId);
            const sId = recurso?.scheduleId || recurso?.schedule_id;
            if (sId) processarDetalhesAgenda(sId);
        }
    });

    const buscarReservas = async (dataInicio: string, dataFim: string) => {
        try {
            const resposta = await api.get(`/reservas/?data_inicio=${dataInicio}&data_fim=${dataFim}`);
            const dados = resposta.data || resposta;
            if (dados?.reservas) reservasBrutas.value = dados.reservas;
        } catch (erro) {
            console.error("Erro em buscarReservas:", erro);
        }
    };

    const buscarSlotsMatrix = async (idAgenda: number, dataInicio: string, dataFim: string) => {
        try {
            const resposta = await api.get(`/agendas/${idAgenda}/slots/?startDateTime=${dataInicio}&endDateTime=${dataFim}`);
            dadosMatrix.value = resposta.data || resposta;
        } catch (erro) {
            console.error("Erro ao buscar a malha da matriz:", erro);
        }
    };

    /*
    Recebe: Objeto contendo os dados da reserva (resourceId, title, startDateTime, endDateTime)
    Devolve: Resposta do servidor
    Por que é usada: Envia a requisição de criação para a API e lança erro caso falhe para o frontend reagir.
    */
    const criarReserva = async (payload: any) => {
        try {
            // Rota configurada no seu agenda_view.py
            const resposta = await api.post('/reservas/criar/', payload);
            return resposta;
        } catch (erro) {
            console.error("Erro na API ao criar reserva:", erro);
            throw erro;
        }
    };

    const buscarPeriodosAgenda = async (scheduleId: number | string) => {
        try {
            const resposta = await api.get(`/agenda/schedules/${scheduleId}/`);
            periodsAgenda.value = resposta.data.periods || [];
        } catch (e) {
            console.error("Erro ao buscar períodos da agenda:", e);
            periodsAgenda.value = [];
        }
    };

    return {
        reservasBrutas,
        recursosDisponiveis,
        recursoSelecionado,
        agendasDisponiveis,
        agendaSelecionada,
        dataSelecionada,
        dataVisao,
        visaoAtiva,
        minutosInicio,
        minutosFim,
        datasDesabilitadas,
        dadosMatrix,
        carregarRecursosEAgendas,
        buscarReservas,
        buscarSlotsMatrix,
        criarReserva,
        converterParaUtc,
        periodsAgenda,
        buscarPeriodosAgenda
    };
}