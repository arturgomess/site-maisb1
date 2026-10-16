export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export type AnalyticsRangeInput = {
  period: AnalyticsPeriod;
  from?: string;
  to?: string;
};

export type AnalyticsRange = {
  startUtc: Date;
  endUtc: Date;
  localDays: string[];
};

const TIME_ZONE = 'America/Sao_Paulo';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function localDateKey(date: Date) {
  const parts = dateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function parseDateKey(value: string | undefined, name: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError(`${name} deve usar o formato AAAA-MM-DD.`);
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new RangeError(`${name} não é uma data válida.`);
  }
  return parsed;
}

function dateKeyFromUtcDate(date: Date) {
  return `${date.getUTCFullYear().toString().padStart(4, '0')}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
}

function shiftDateKey(key: string, days: number) {
  const [year, month, day] = key.split('-').map(Number);
  return dateKeyFromUtcDate(new Date(Date.UTC(year, month - 1, day + days)));
}

// Binary-search the first instant whose Sao Paulo calendar date is this day.
// This handles historical DST changes that skipped or repeated local midnight.
function startOfLocalDayUtc(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  let low = Date.UTC(year, month - 1, day) - 36 * 60 * 60 * 1000;
  let high = Date.UTC(year, month - 1, day) + 36 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localDateKey(new Date(middle)) < key) low = middle;
    else high = middle;
  }
  if (localDateKey(new Date(high)) !== key) throw new RangeError('Não foi possível resolver o início do dia local.');
  return new Date(high);
}

function makeLocalDays(from: string, to: string) {
  const days: string[] = [];
  for (let key = from; key <= to; key = shiftDateKey(key, 1)) days.push(key);
  return days;
}

export function resolveAnalyticsRange(input: AnalyticsRangeInput, now: Date): AnalyticsRange {
  if (!Number.isFinite(now.getTime())) throw new RangeError('Data de referência inválida.');
  const today = localDateKey(now);
  let firstDay: string;
  let lastDay: string;
  let endUtc: Date;

  if (input.period === 'today' || input.period === '7d' || input.period === '30d' || input.period === '90d') {
    const count = input.period === 'today' ? 1 : Number.parseInt(input.period, 10);
    firstDay = shiftDateKey(today, 1 - count);
    lastDay = today;
    endUtc = new Date(now);
  } else if (input.period === 'custom') {
    firstDay = dateKeyFromUtcDate(parseDateKey(input.from, 'Início'));
    lastDay = dateKeyFromUtcDate(parseDateKey(input.to, 'Fim'));
    if (lastDay < firstDay) throw new RangeError('O fim do período deve ser igual ou posterior ao início.');
    if (lastDay > today) throw new RangeError('O período personalizado não pode terminar no futuro.');
    const inclusiveDays = (Date.parse(`${lastDay}T00:00:00Z`) - Date.parse(`${firstDay}T00:00:00Z`)) / 86_400_000 + 1;
    if (inclusiveDays > 90) throw new RangeError('O período personalizado não pode exceder 90 dias.');
    endUtc = startOfLocalDayUtc(shiftDateKey(lastDay, 1));
  } else {
    throw new RangeError('Período inválido.');
  }

  return { startUtc: startOfLocalDayUtc(firstDay), endUtc, localDays: makeLocalDays(firstDay, lastDay) };
}
