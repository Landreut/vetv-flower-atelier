import { orderDatabase } from '@/db/orders';
import { validateOrder } from '@/lib/order-validation';
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Отправьте заявку через сайт магазина.' }, { status: 403 });
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'Некорректный формат заявки.' }, { status: 415 });
  try {
    const text = await request.text();
    if (text.length > 8000) return Response.json({ error: 'Заявка слишком длинная.' }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(text); } catch { return Response.json({ error: 'Некорректная заявка.' }, { status: 400 }); }
    const validation = validateOrder(body);
    if ('error' in validation) return Response.json({ error: validation.error }, { status: 400 });
    const { id, bouquet, name, phone, date, wishes } = validation.order;
    const now = new Date().toISOString();
    await orderDatabase().prepare('INSERT INTO orders (id, bouquet_id, bouquet_name, price_rub, customer_name, phone, requested_date, wishes, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(id, bouquet.id, bouquet.name, bouquet.price, name, phone, date, wishes, now, now).run();
    return Response.json({ reference: `В-${id.slice(0, 8).toUpperCase()}` }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Не удалось сохранить заявку. Ваши данные остались в форме — попробуйте ещё раз.' }, { status: 503 });
  }
}
