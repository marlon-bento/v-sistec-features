/*
========
Este arquivo isola todas as chamadas HTTP da agenda (recursos, detalhes de agendas,
listagem de reservas, malha de slots da matriz e persistência de agendamentos).
========
*/
import { type Ref } from 'vue';

// Recebe as referências reativas de estado da agenda e devolve os métodos de comunicação com a API.
export function useAgendaApi(
    clienteApi: Ref<any>,
    recursosDisponiveis: Ref<any[]>,
    recursoSelecionado: Ref<number | null>,
    agendasDisponiveis: Ref<any[]>,
    agendaSelecionada: Ref<number | null>,
    reservasBrutas: Ref<any[]>,
    dadosMatrix: Ref<any>,
    aoCarregarAgenda: (idAgenda: number) => void
) {
    // Busca a lista de recursos permitidos e carrega os detalhes de todas as agendas vinculadas em paralelo.
    const carregarRecursosEAgendas = async () => {
        if (!clienteApi.value) return;

        try {
            const resposta = await clienteApi.value.get('/recursos/');
            const dados = resposta.data || resposta;
            if (!dados?.recursos?.length) return;

            recursosDisponiveis.value = dados.recursos;

            if (!recursoSelecionado.value) {
                recursoSelecionado.value = dados.recursos[0].id_recurso;
            }

            const mapaAgendas = new Map<number, { id_agenda: number; nome_agenda: string; detalhes?: any }>();

            for (const rec of dados.recursos) {
                if (rec.id_agenda != null && !mapaAgendas.has(rec.id_agenda)) {
                    mapaAgendas.set(rec.id_agenda, {
                        id_agenda: rec.id_agenda,
                        nome_agenda: rec.nome_agenda || `Agenda ${rec.id_agenda}`
                    });
                }
            }

            await Promise.all(
                Array.from(mapaAgendas.entries()).map(async ([idAg, agendaObj]) => {
                    try {
                        const resp = await clienteApi.value.get(`/agendas/${idAg}/detalhes/`);
                        const detalhes = resp.data || resp;
                        agendaObj.detalhes = detalhes;
                        if (detalhes?.nome_agenda) {
                            agendaObj.nome_agenda = detalhes.nome_agenda;
                        }
                    } catch (erro) {
                        console.error('Erro ao buscar detalhes da agenda:', idAg, erro);
                    }
                })
            );

            agendasDisponiveis.value = Array.from(mapaAgendas.values());

            if (agendasDisponiveis.value.length > 0) {
                if (!agendaSelecionada.value) {
                    agendaSelecionada.value = agendasDisponiveis.value[0].id_agenda;
                }
                aoCarregarAgenda(Number(agendaSelecionada.value));
            }
        } catch (erro) {
            console.error('Erro ao carregar recursos e agendas:', erro);
        }
    };

    // Recebe o intervalo de datas e atualiza a lista de reservas brutas do modo calendário.
    const buscarReservas = async (dataInicio: string, dataFim: string) => {
        if (!clienteApi.value) return;
        try {
            const url = `/reservas/?data_inicio_reserva=${dataInicio}&data_fim_reserva=${dataFim}`;
            const resposta = await clienteApi.value.get(url);
            const dados = resposta.data || resposta;
            if (dados?.reservas) {
                reservasBrutas.value = dados.reservas;
            }
        } catch (erro) {
            console.error('Erro ao buscar reservas:', erro);
        }
    };

    // Recebe o ID da agenda e o intervalo UTC, preenchendo a estrutura dadosMatrix das visões em tabela.
    const buscarSlotsMatrix = async (idAgenda: number, dataInicio: string, dataFim: string) => {
        if (!clienteApi.value) return;
        try {
            const url = `/agendas/${idAgenda}/slots/?data_inicio_slot=${dataInicio}&data_fim_slot=${dataFim}`;
            const resposta = await clienteApi.value.get(url);
            dadosMatrix.value = resposta.data || resposta;
        } catch (erro) {
            console.error('Erro ao buscar os slots da matriz:', erro);
        }
    };

    // Recebe os dados de um novo recurso, salva na API e recarrega a lista local.
    const criarRecurso = async (payloadNovo: any) => {
        const resposta = await clienteApi.value.post('/recursos/', payloadNovo);
        await carregarRecursosEAgendas();
        return resposta.data || resposta;
    };

    // Recebe o ID do recurso e os dados atualizados, salvando na API e atualizando o item em memória.
    const editarRecurso = async (idRecurso: number, payloadEdicao: any) => {
        const resposta = await clienteApi.value.put(`/recursos/${idRecurso}/`, payloadEdicao);
        const atualizado = resposta.data || resposta;
        const idx = recursosDisponiveis.value.findIndex((r: any) => Number(r.id_recurso) === Number(idRecurso));
        if (idx !== -1 && atualizado) {
            recursosDisponiveis.value[idx] = atualizado;
        }
        return atualizado;
    };

    // Recebe o payload de uma reserva simples e cria o agendamento na API.
    const criarReserva = async (payload: any) => {
        return await clienteApi.value.post('/reservas/', payload);
    };

    // Recebe o payload de uma reserva com data limite e cria o lote recorrente na API.
    const criarReservaRecorrente = async (payload: any) => {
        return await clienteApi.value.post('/reservas/recorrentes/', payload);
    };

    // Recebe o código de referência e os novos dados, atualizando a reserva na API.
    const editarReserva = async (codigoReferencia: string, payload: any) => {
        const resposta = await clienteApi.value.put(`/reservas/${codigoReferencia}/`, payload);
        return resposta.data || resposta;
    };

    // Recebe o código de referência e remove o vínculo da reserva com seu grupo de recorrência.
    const desvincularReservaGrupo = async (codigoReferencia: string) => {
        const resposta = await clienteApi.value.post(`/reservas/${codigoReferencia}/desvincular/`, {});
        return resposta.data || resposta;
    };

    // Recebe o código de referência e devolve os detalhes completos da reserva.
    const obterDetalhesReserva = async (codigoReferencia: string) => {
        const resposta = await clienteApi.value.get(`/reservas/${codigoReferencia}/`);
        return resposta.data || resposta;
    };

    // Recebe o código de referência e uma flag indicando se deve excluir todo o lote recorrente.
    const excluirReserva = async (codigoReferencia: string, cancelarGrupo = false) => {
        const query = cancelarGrupo ? '?cancelar_grupo=true' : '';
        return await clienteApi.value.delete(`/reservas/${codigoReferencia}/${query}`);
    };

    return {
        carregarRecursosEAgendas,
        buscarReservas,
        buscarSlotsMatrix,
        criarRecurso,
        editarRecurso,
        criarReserva,
        criarReservaRecorrente,
        editarReserva,
        desvincularReservaGrupo,
        obterDetalhesReserva,
        excluirReserva
    };
}