/*
========
Composable utilitário que centraliza cálculos de datas semanais, formatação de horários,
busca de matriz na API, mesclagem de reservas contínuas, cálculo unificado de blocos/subblocos
e sincronização automática de recurso único.
========
*/
import { ref, computed, watch } from 'vue';
import { useAgenda } from './useAgenda';

export const SIGLAS_DIAS_JS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export const TITULOS_DIAS_CABECALHO = [
    'DOMINGO',
    '2ª FEIRA',
    '3ª FEIRA',
    '4ª FEIRA',
    '5ª FEIRA',
    '6ª FEIRA',
    'SÁBADO'
];

// Recebe uma string ISO UTC e devolve objeto com data (YYYY-MM-DD) e hora (HH:MM) locais.
export const extrairDataHoraLocal = (isoString: string) => {
    const d = new Date(isoString);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return { data: `${ano}-${mes}-${dia}`, hora: `${horas}:${min}` };
};

// Recebe uma string ISO UTC e devolve apenas o horário local formatado em HH:MM.
export const extrairHoraFormatada = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Recebe uma string YYYY-MM-DD ou Date e devolve um objeto Date local zerado no início do dia.
export const criarDataLocal = (valorData: string | Date) => {
    if (typeof valorData === 'string') {
        const [ano, mes, dia] = valorData.substring(0, 10).split('-').map(Number);
        return new Date(ano!, mes! - 1, dia!);
    }
    return new Date(valorData.getFullYear(), valorData.getMonth(), valorData.getDate());
};

// Recebe um objeto Date e devolve a string correspondente no formato YYYY-MM-DD.
export const formatarDataIso = (dt: Date) => {
    const ano = dt.getFullYear();
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const dia = String(dt.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

// Recebe a data de referência e o dia inicial no formato Python (0=SEG..6=DOM) e devolve o Date do início da semana.
export const calcularDataInicioSemana = (dataRef: string | Date, diaInicioPython = 0) => {
    const d = criarDataLocal(dataRef);
    const diaInicioJs = (Number(diaInicioPython) + 1) % 7;
    const diff = (d.getDay() - diaInicioJs + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
};

// Recebe a lista de slots disponíveis de um recurso e a chave de span ('colspan' ou 'rowspan').
// Devolve a lista de células com reservas consecutivas de mesmo código mescladas.
export const mesclarSlotsReservados = (slotsBrutos: any[], chaveSpan: 'colspan' | 'rowspan') => {
    const chaveIndice = chaveSpan === 'colspan' ? 'indiceColuna' : 'indiceLinha';
    const chaveOculta = chaveSpan === 'colspan' ? 'ocultaPorColspan' : 'ocultaPorRowspan';
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
                [chaveIndice]: i,
                [chaveSpan]: span,
                [chaveOculta]: false
            });

            for (let k = 1; k < span; k++) {
                celulasMescladas.push({
                    ...slotsBrutos[i + k],
                    [chaveIndice]: i + k,
                    [chaveSpan]: 1,
                    [chaveOculta]: true
                });
            }
            i += span;
        } else {
            celulasMescladas.push({
                ...slotAtual,
                [chaveIndice]: i,
                [chaveSpan]: 1,
                [chaveOculta]: false
            });
            i++;
        }
    }

    return celulasMescladas;
};

// Recebe os horários base do dia, a lista de blocos configurados e o gerador de cores.
// Devolve de forma unificada os blocos principais, subblocos e metadados individuais de cada slot.
export const calcularEstruturaDeBlocos = (
    slotsBase: { horaInicio: string; horaFim: string }[],
    listaBlocosConfig: any[] | null,
    obterCoresBloco: (idx: number) => { corFundo: string; corBorda: string },
    corFundoPadrao: string | null = null,
    prefixoPadrao = 'Bloco'
) => {
    const totalSlots = slotsBase.length;

    const metadadosSlots = slotsBase.map((h) => ({
        horaInicio: h.horaInicio,
        horaFim: h.horaFim,
        corFundo: corFundoPadrao,
        corBorda: 'var(--border-light)',
        mostrarBlocoLateral: false,
        nomeBlocoLateral: '',
        rowspanBlocoLateral: 1,
        fimDeSubbloco: false,
        fimDeBlocoPrincipal: false
    }));

    if (!listaBlocosConfig || listaBlocosConfig.length === 0) {
        return {
            temBlocos: false,
            temSubblocos: false,
            blocosPrincipais: [],
            subblocos: [],
            metadadosSlots
        };
    }

    const blocosPrincipais: any[] = [];
    const subblocos: any[] = [];
    let cursor = 0;
    let algumSubblocoDefinido = false;

    const adicionarSubbloco = (
        inicioIdx: number,
        tam: number,
        cor: string,
        corBorda: string,
        fimPrincipal: boolean,
        marcarSub: boolean
    ) => {
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
            const metaFimSub = metadadosSlots[inicioIdx + tam - 1];
            if (metaFimSub) metaFimSub.fimDeSubbloco = true;
        }
    };

    listaBlocosConfig.forEach((blocoCfg: any, idxBloco: number) => {
        if (cursor >= totalSlots) return;

        const qtdSolicitada = Number(blocoCfg.quantidade) || 0;
        const qtdReal = Math.min(qtdSolicitada, totalSlots - cursor);
        if (qtdReal <= 0) return;

        const { corFundo, corBorda } = obterCoresBloco(idxBloco);
        const slotPrimeiro = slotsBase[cursor];
        const slotUltimo = slotsBase[cursor + qtdReal - 1];
        const nomeBloco = blocoCfg.nome || `${prefixoPadrao} ${idxBloco + 1}`;

        blocosPrincipais.push({
            nome: nomeBloco,
            colspan: qtdReal,
            cor: corFundo,
            corBorda,
            horaInicio: slotPrimeiro?.horaInicio ?? '',
            horaFim: slotUltimo?.horaFim ?? ''
        });

        const metaCursor = metadadosSlots[cursor];
        if (metaCursor) {
            metaCursor.mostrarBlocoLateral = true;
            metaCursor.nomeBlocoLateral = nomeBloco;
            metaCursor.rowspanBlocoLateral = qtdReal;
        }

        for (let i = 0; i < qtdReal; i++) {
            const meta = metadadosSlots[cursor + i];
            if (meta) {
                meta.corFundo = corFundo;
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
                adicionarSubbloco(cursor + consumido, tamEfetivo, corFundo, corBorda, ehUltimo, true);
                consumido += tamEfetivo;
            });
            if (consumido < qtdReal) {
                adicionarSubbloco(cursor + consumido, qtdReal - consumido, corFundo, corBorda, true, true);
            }
        } else if (tamanhoSubFixo > 0) {
            algumSubblocoDefinido = true;
            let consumido = 0;
            while (consumido < qtdReal) {
                const tamEfetivo = Math.min(tamanhoSubFixo, qtdReal - consumido);
                const ehUltimo = (consumido + tamEfetivo) >= qtdReal;
                adicionarSubbloco(cursor + consumido, tamEfetivo, corFundo, corBorda, ehUltimo, true);
                consumido += tamEfetivo;
            }
        } else {
            adicionarSubbloco(cursor, qtdReal, corFundo, corBorda, true, false);
        }

        const metaFimPrincipal = metadadosSlots[cursor + qtdReal - 1];
        if (metaFimPrincipal) metaFimPrincipal.fimDeBlocoPrincipal = true;

        cursor += qtdReal;
    });

    if (cursor < totalSlots) {
        const restante = totalSlots - cursor;
        const { corFundo: corRestante, corBorda: corBordaRestante } = obterCoresBloco(blocosPrincipais.length);
        const slotPrimeiro = slotsBase[cursor];
        const slotUltimo = slotsBase[totalSlots - 1];
        const nomeOutros = prefixoPadrao === 'TURNO' ? 'OUTROS' : 'Outros';

        blocosPrincipais.push({
            nome: nomeOutros,
            colspan: restante,
            cor: corRestante,
            corBorda: corBordaRestante,
            horaInicio: slotPrimeiro?.horaInicio ?? '',
            horaFim: slotUltimo?.horaFim ?? ''
        });

        const metaRestante = metadadosSlots[cursor];
        if (metaRestante) {
            metaRestante.mostrarBlocoLateral = true;
            metaRestante.nomeBlocoLateral = nomeOutros;
            metaRestante.rowspanBlocoLateral = restante;
        }

        for (let i = 0; i < restante; i++) {
            const meta = metadadosSlots[cursor + i];
            if (meta) {
                meta.corFundo = corRestante;
                meta.corBorda = corBordaRestante;
            }
        }

        adicionarSubbloco(cursor, restante, corRestante, corBordaRestante, true, false);

        const metaUltimo = metadadosSlots[totalSlots - 1];
        if (metaUltimo) metaUltimo.fimDeBlocoPrincipal = true;
    }

    return {
        temBlocos: blocosPrincipais.length > 0,
        temSubblocos: algumSubblocoDefinido,
        blocosPrincipais,
        subblocos,
        metadadosSlots
    };
};

// Gerencia o ciclo de busca semanal da matriz e a configuração de blocos lendo direto do useAgenda.
export function useGradeSemanal() {
    const {
        configEntrada,
        dadosMatrix,
        buscarSlotsMatrix,
        agendasDisponiveis,
        agendaSelecionada,
        dataSelecionada,
        converterParaUtc,
        registrarAtualizadorVisao
    } = useAgenda();

    const carregando = ref(false);

    // Consulta no backend apenas os slots da matriz, pois o endpoint /slots/ já embute detalhes_reserva em cada horário ocupado.
    const dispararBuscaSemanal = async () => {
        const idAgenda = agendaSelecionada.value;
        if (!idAgenda) return;

        carregando.value = true;
        const agendaObj = agendasDisponiveis.value.find((a: any) => Number(a.id_agenda) === Number(idAgenda));
        const diaInicioPython = agendaObj?.detalhes?.dia_inicio_semana_agenda ?? 0;

        const dataInicio = calcularDataInicioSemana(dataSelecionada.value || new Date(), diaInicioPython);
        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);

        const strInicio = formatarDataIso(dataInicio);
        const strFim = formatarDataIso(dataFim);

        const inicioUtc = encodeURIComponent(converterParaUtc(strInicio, '00:00'));
        const fimUtc = encodeURIComponent(converterParaUtc(strFim, '23:59'));

        await buscarSlotsMatrix(idAgenda, inicioUtc, fimUtc);
        carregando.value = false;
    };

    // Registra a busca semanal como atualizador padrão quando os modais centralizados salvarem ou excluírem reservas.
    registrarAtualizadorVisao(dispararBuscaSemanal);

    watch([dataSelecionada, agendaSelecionada], dispararBuscaSemanal, { immediate: true });

    const configuracaoAgendaAtual = computed(() => {
        const configBruta = configEntrada.configuracaoBlocos;
        if (!configBruta || !agendaSelecionada.value) return null;
        const idAtual = Number(agendaSelecionada.value);

        if (Array.isArray(configBruta)) {
            return configBruta.find((c: any) => Number(c.id_agenda) === idAtual) || null;
        }
        if (typeof configBruta === 'object') {
            if (Number(configBruta.id_agenda) === idAtual) return configBruta;
            if (configBruta[idAtual]) return configBruta[idAtual];
        }
        return null;
    });

    // Extrai a lista de blocos configurados para um dia específico da semana ou padrão da agenda.
    const obterBlocosDoDia = (siglaDia: string): any[] | null => {
        const cfg = configuracaoAgendaAtual.value;
        if (!cfg) return null;
        if (cfg.por_dia && cfg.por_dia[siglaDia]) return cfg.por_dia[siglaDia];
        if (Array.isArray(cfg.blocos)) return cfg.blocos;
        return null;
    };

    return {
        dadosMatrix,
        carregando,
        configuracaoAgendaAtual,
        obterBlocosDoDia,
        dispararBuscaSemanal
    };
}

// Sincroniza automaticamente o recursoSelecionado e a agendaSelecionada observando o idRecursoUnico global do useAgenda.
export function useSincronizarRecursoUnico() {
    const { configEntrada, recursosDisponiveis, agendaSelecionada, recursoSelecionado } = useAgenda();

    watch([() => configEntrada.idRecursoUnico, recursosDisponiveis], ([idRec]) => {
        if (!idRec || recursosDisponiveis.value.length === 0) return;

        const encontrado = recursosDisponiveis.value.find(
            (r: any) => Number(r.id_recurso) === Number(idRec)
        );

        if (encontrado) {
            recursoSelecionado.value = Number(encontrado.id_recurso);
            if (encontrado.id_agenda && agendaSelecionada.value !== encontrado.id_agenda) {
                agendaSelecionada.value = encontrado.id_agenda;
            }
        }
    }, { immediate: true });
}