import { bouquets } from './catalog';
export function validateOrder(body: unknown) {
  if (!body || typeof body !== 'object') return { error: 'Некорректная заявка.' } as const;
  const value = body as Record<string, unknown>;
  const string = (key: string) => typeof value[key] === 'string' ? (value[key] as string).trim() : '';
  const id = string('requestId');
  const ids: unknown = 'bouquetIds' in value ? value.bouquetIds : [string('bouquetId')];
  const name = string('name'), phone = string('phone'), date = string('date'), wishes = string('wishes');
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return { error: 'Обновите страницу и повторите отправку.' } as const;
  if (!Array.isArray(ids) || !ids.length || ids.length > bouquets.length || new Set(ids).size !== ids.length || ids.some((id) => typeof id !== 'string' || !bouquets.some((item) => item.id === id))) return { error: 'Выберите от одного до шести разных букетов из коллекции.' } as const;
  const items = bouquets.filter((item) => ids.includes(item.id)).map(({ id, name, price }) => ({ id, name, price }));
  const total = items.reduce((sum, item) => sum + item.price, 0);
  if (name.length < 2 || name.length > 80) return { error: 'Укажите имя от 2 до 80 символов.' } as const;
  if (!/^[+\d\s()\-]{10,25}$/.test(phone) || !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) return { error: 'Проверьте номер телефона.' } as const;
  if (value.consent !== true) return { error: 'Необходимо согласие на обработку заявки.' } as const;
  if (wishes.length > 1000) return { error: 'Сократите пожелания до 1000 символов.' } as const;
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || Date.parse(date) < Date.now() - 48 * 60 * 60 * 1000)) return { error: 'Укажите актуальную дату получения.' } as const;
  return { order: { id, items, total, name, phone, date: date || null, wishes } } as const;
}
