/*
========
Este arquivo concentra as funções puras de transformação visual das tabelas de horários.
Realiza a mesclagem de reservas contínuas (colspan/rowspan) e o cálculo de divisões de turnos,
blocos principais e subblocos a partir dos slots retornados pela API.
========
*/

// Recebe a lista de slots de um recurso e o tipo de mesclagem ('colspan' ou 'rowspan'), devolvendo as células processadas.
// É usada para unir visualmente slots consecutivos que pertencem à mesma reserva sem quebrar o índice da tabela.
export function mesclarSlotsReservados(slotsBrutos: any[], chaveSpan: 'colspan' | 'rowspan') {
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
}

// Recebe os horários base do dia, a configuração de blocos e a função de cores, devolvendo os cabeçalhos e metadados de cada slot.
// É usada tanto pela visão em matriz horizontal quanto pela tabela de horários vertical para desenhar turnos e divisórias.
export function calcularEstruturaDeBlocos(
    slotsBase: { horaInicio: string; horaFim: string }[],
    listaBlocosConfig: any[] | null,
    obterCoresBloco: (idx: number) => { corFundo: string; corBorda: string },
    corFundoPadrao: string | null = null,
    prefixoPadrao = 'Bloco'
) {
    const totalSlots = slotsBase.length;

    // Lista de metadados visuais associada posicionalmente a cada horário do dia.
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

    // Registra um subbloco na lista de cabeçalho e marca a borda divisória no último slot correspondente.
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

    // Aplica um bloco principal sobre o intervalo de slots e preenche as cores e rótulos laterais.
    const registrarBloco = (inicioIdx: number, quantidade: number, nome: string, corFundo: string, corBorda: string) => {
        const slotPrimeiro = slotsBase[inicioIdx];
        const slotUltimo = slotsBase[inicioIdx + quantidade - 1];

        blocosPrincipais.push({
            nome,
            colspan: quantidade,
            cor: corFundo,
            corBorda,
            horaInicio: slotPrimeiro?.horaInicio ?? '',
            horaFim: slotUltimo?.horaFim ?? ''
        });

        const metaInicial = metadadosSlots[inicioIdx];
        if (metaInicial) {
            metaInicial.mostrarBlocoLateral = true;
            metaInicial.nomeBlocoLateral = nome;
            metaInicial.rowspanBlocoLateral = quantidade;
        }

        for (let i = 0; i < quantidade; i++) {
            const meta = metadadosSlots[inicioIdx + i];
            if (meta) {
                meta.corFundo = corFundo;
                meta.corBorda = corBorda;
            }
        }

        const metaFinal = metadadosSlots[inicioIdx + quantidade - 1];
        if (metaFinal) metaFinal.fimDeBlocoPrincipal = true;
    };

    listaBlocosConfig.forEach((blocoCfg: any, idxBloco: number) => {
        if (cursor >= totalSlots) return;

        const qtdSolicitada = Number(blocoCfg.quantidade) || 0;
        const qtdReal = Math.min(qtdSolicitada, totalSlots - cursor);
        if (qtdReal <= 0) return;

        const { corFundo, corBorda } = obterCoresBloco(idxBloco);
        const nomeBloco = blocoCfg.nome || `${prefixoPadrao} ${idxBloco + 1}`;

        registrarBloco(cursor, qtdReal, nomeBloco, corFundo, corBorda);

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

        cursor += qtdReal;
    });

    if (cursor < totalSlots) {
        const restante = totalSlots - cursor;
        const { corFundo, corBorda } = obterCoresBloco(blocosPrincipais.length);
        const nomeOutros = prefixoPadrao === 'TURNO' ? 'OUTROS' : 'Outros';

        registrarBloco(cursor, restante, nomeOutros, corFundo, corBorda);
        adicionarSubbloco(cursor, restante, corFundo, corBorda, true, false);
    }

    return {
        temBlocos: blocosPrincipais.length > 0,
        temSubblocos: algumSubblocoDefinido,
        blocosPrincipais,
        subblocos,
        metadadosSlots
    };
}