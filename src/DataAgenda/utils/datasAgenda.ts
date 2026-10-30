/*
========
Este arquivo reúne todas as funções utilitárias puras de manipulação, formatação e conversão de datas e horários.
Não possui estado reativo, garantindo fácil leitura e reaproveitamento em qualquer parte da agenda.
========
*/

// Lista constante com as siglas dos dias da semana ordenadas segundo o padrão Date.getDay() do JavaScript (0=DOM..6=SAB).
export const SIGLAS_DIAS_JS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

// Lista constante com os títulos completos dos dias da semana para exibição nos cabeçalhos das tabelas.
export const TITULOS_DIAS_CABECALHO = [
    'DOMINGO',
    '2ª FEIRA',
    '3ª FEIRA',
    '4ª FEIRA',
    '5ª FEIRA',
    '6ª FEIRA',
    'SÁBADO'
];

// Recebe uma string ISO UTC e devolve um objeto contendo a data (YYYY-MM-DD) e a hora (HH:MM) convertidas para o fuso local.
// É usada para preencher formulários e exibir agendamentos no horário local do navegador.
export function extrairDataHoraLocal(isoString: string) {
    const d = new Date(isoString);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const horas = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return { data: `${ano}-${mes}-${dia}`, hora: `${horas}:${min}` };
}

// Recebe uma string ISO UTC e devolve apenas o horário local formatado em HH:MM.
// É usada para montar os rótulos de início e fim das colunas e linhas nas grades.
export function extrairHoraFormatada(isoStr: string) {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Recebe uma string YYYY-MM-DD ou um objeto Date e devolve uma nova instância de Date zerada no início do dia local.
// É usada para evitar desvios de fuso horário ao navegar entre dias do calendário.
export function criarDataLocal(valorData: string | Date) {
    if (typeof valorData === 'string') {
        const [ano, mes, dia] = valorData.substring(0, 10).split('-').map(Number);
        return new Date(ano!, mes! - 1, dia!);
    }
    return new Date(valorData.getFullYear(), valorData.getMonth(), valorData.getDate());
}

// Recebe um objeto Date e devolve a string correspondente formatada no padrão ISO curto (YYYY-MM-DD).
// É usada para comparações de datas desabilitadas e parâmetros de consulta.
export function formatarDataIso(dt: Date) {
    const ano = dt.getFullYear();
    const mes = String(dt.getMonth() + 1).padStart(2, '0');
    const dia = String(dt.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// Recebe uma data de referência e o dia inicial da semana no padrão Python (0=SEG..6=DOM) e devolve o Date do início daquela semana.
// É usada para alinhar a busca semanal da tabela com a configuração definida para a agenda no backend.
export function calcularDataInicioSemana(dataRef: string | Date, diaInicioPython = 0) {
    const d = criarDataLocal(dataRef);
    const diaInicioJs = (Number(diaInicioPython) + 1) % 7;
    const diff = (d.getDay() - diaInicioJs + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
}

// Recebe strings locais de data (YYYY-MM-DD) e hora (HH:MM) e devolve a string correspondente em UTC ISO 8601.
// É usada antes de enviar parâmetros de criação, edição ou busca de slots para o backend.
export function converterParaUtc(dataStr: string, horaStr: string) {
    const d = new Date(`${dataStr}T${horaStr}:00`);
    return `${d.toISOString().slice(0, 19)}Z`;
}

// Recebe uma string de horário (HH:MM) e devolve o total de minutos corridos desde o início do dia.
// É usada para cálculos de encaixe de horários na grade e limites de expediente.
export function converterHoraParaMinutos(horaStr: string): number {
    const [h, m] = horaStr.split(':').map(Number) as [number, number];
    return h * 60 + m;
}

// Recebe o total de minutos corridos no dia e devolve a string formatada em HH:MM.
// É usada para atualizar os campos do formulário após validar o encaixe na grade.
export function formatarMinutosParaHora(totalMinutos: number): string {
    const horas = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
    const minutos = String(totalMinutos % 60).padStart(2, '0');
    return `${horas}:${minutos}`;
}