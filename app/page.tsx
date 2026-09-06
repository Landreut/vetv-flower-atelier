'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowUpRight, ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { bouquets, money } from '@/lib/catalog';

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const requestId = useRef('');
  const requestPayload = useRef('');
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const chosenBouquets = bouquets.filter((item) => selected.includes(item.id));
  const total = chosenBouquets.reduce((sum, item) => sum + item.price, 0);
  const [today, setToday] = useState('');
  useEffect(() => { const now = new Date(); setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`); }, []);
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const options = { signal: lifecycle.signal };
    const register = async () => {
      await context.registerTool({ name: 'list_bouquets', title: 'Коллекция букетов', description: 'Read the six available bouquet designs and their prices in rubles.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => bouquets.map(({ id, name, price, description }) => ({ id, name, price, currency: 'RUB', description })) }, options);
      if (lifecycle.signal.aborted) return;
      await context.registerTool({ name: 'select_bouquets_for_order', title: 'Выбрать букеты для заявки', description: 'Set one or more distinct bouquets in the visible order form and navigate to it. Does not submit or save an order.', inputSchema: { type: 'object', properties: { bouquetIds: { type: 'array', minItems: 1, maxItems: bouquets.length, uniqueItems: true, items: { type: 'string', enum: bouquets.map((item) => item.id) } } }, required: ['bouquetIds'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input: unknown) => {
        if (sending.current) throw new Error('Дождитесь сохранения текущей заявки.');
        const ids = input && typeof input === 'object' ? (input as { bouquetIds?: unknown }).bouquetIds : undefined;
        if (!Array.isArray(ids) || !ids.length || ids.length > bouquets.length || new Set(ids).size !== ids.length || ids.some((id) => !bouquets.some((item) => item.id === id))) throw new Error('Выберите от одного до шести разных букетов из коллекции.');
        const items = bouquets.filter((item) => ids.includes(item.id));
        flushSync(() => { setSelected(items.map((item) => item.id)); setStatus((current) => current === 'success' ? 'idle' : current); });
        document.getElementById('order')?.scrollIntoView();
        return { selectedBouquets: items.map((item) => item.id), total: items.reduce((sum, item) => sum + item.price, 0), submitted: false };
      } }, options);
    };
    void register().catch(() => { lifecycle.abort(); });
    return () => lifecycle.abort();
  }, []);
  function choose(id: string) {
    if (sending.current) return;
    setSelected((current) => current.includes(id) ? current : [...current, id]); if (status === 'success') setStatus('idle');
    document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' });
    window.setTimeout(() => document.getElementById('name')?.focus({ preventScroll: true }), 450);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (status === 'sending') return;
    if (!chosenBouquets.length) { setError('Выберите хотя бы один букет.'); setStatus('error'); document.getElementById('bouquet-select')?.focus(); return; }
    if (!consent) { setError('Подтвердите согласие на обработку заявки.'); setStatus('error'); return; }
    const data = new FormData(event.currentTarget);
    const phone = String(data.get('phone') || '').replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 15) { setError('Проверьте телефон: укажите от 10 до 15 цифр с кодом страны.'); setStatus('error'); document.getElementById('phone')?.focus(); return; }
    const payload = { bouquetIds: chosenBouquets.map((item) => item.id), name: data.get('name'), phone: data.get('phone'), date: data.get('date'), wishes: data.get('wishes'), consent };
    const serialized = JSON.stringify(payload);
    if (!requestId.current || serialized !== requestPayload.current) requestId.current = crypto.randomUUID();
    requestPayload.current = serialized;
    sending.current = true; setStatus('sending'); setError('');
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: requestId.current, ...payload }) });
      const result = await response.json() as { error?: string; reference?: string };
      if (!response.ok) throw new Error(result.error || 'Не получилось сохранить заявку. Попробуйте ещё раз.');
      if (typeof result.reference !== 'string') throw new Error('Не удалось получить подтверждение. Повторите отправку.');
      setReference(result.reference); setStatus('success'); requestId.current = ''; formRef.current?.reset(); setConsent(false);
    } catch (err) { setError(err instanceof Error && !(err instanceof TypeError) ? err.message : 'Нет соединения. Проверьте интернет и повторите отправку.'); setStatus('error'); } finally { sending.current = false; }
  }
  return <>
    <a className="skip-link" href="#catalog">Перейти к букетам</a>
    <div className="announcement">Собираем с чувством. Дарим со смыслом.</div>
    <header className="site-header wrap">
      <a href="#catalog" className="nav-link">Коллекция букетов</a>
      <a className="brand" href="#" aria-label="Ветвь — на главную"><img src="/images/brand-mark.png" width="52" height="58" alt="" /><span className="brand-name">ветвь<span className="brand-caption">ЦВЕТОЧНАЯ МАСТЕРСКАЯ</span></span></a>
      <a href="#order" className="nav-link order-link">Заказать букет <ArrowUpRight size={17} /></a>
    </header>
    <main>
      <section className="intro wrap" aria-labelledby="intro-title"><div><p className="eyebrow"><span className="small-dot" /> АВТОРСКИЕ БУКЕТЫ</p><h1 id="intro-title">Маленький жест.<br /><em>Большие чувства.</em></h1></div><div className="intro-note"><p>Для особенного человека.<br />Для важного момента.<br />И просто так.</p><a className="text-link" href="#catalog">Найти свой букет <ArrowDown size={17} /></a></div></section>
      <section id="catalog" className="catalog wrap" aria-labelledby="catalog-title">
        <div className="section-heading"><h2 id="catalog-title">Наша коллекция <span>06</span></h2><p>Каждый букет — маленькая история</p></div>
        <div className="product-grid">{bouquets.map((item, index) => <article className="product" key={item.id}>
          <button type="button" className="product-image-button" onClick={() => choose(item.id)} aria-label={`Выбрать букет «${item.name}», ${money(item.price)}`}><img className="product-image" src={item.image} alt={item.alt} width="768" height="768" loading={index < 3 ? 'eager' : 'lazy'} />{index === 1 && <span className="product-label">Выбор флориста</span>}<span className="image-action" aria-hidden="true"><ArrowUpRight size={21} /></span></button>
          <div className="product-title"><h3>{item.name}</h3><span>{money(item.price)}</span></div><p className="product-description">{item.description}</p>
        </article>)}</div>
        <p className="catalog-note">Цветы живые, поэтому оттенки и раскрытие бутонов могут немного отличаться от фотографии.</p>
      </section>
      <section id="order" className="order-section" aria-labelledby="order-title"><div className="order-layout wrap">
        <div className="order-story"><p className="eyebrow">ОТ ВЫБОРА — К ЧУВСТВАМ</p><h2 id="order-title">Ваши цветы<br /><em>почти у вас.</em></h2><p className="order-intro">Выберите цветы и оставьте данные<br className="desktop-break" /> для оформления заявки.</p><div className="selection-summary" aria-live="polite"><span className="mini-label">ВАШ ВЫБОР</span>{chosenBouquets.length ? <><ul className="selected-list">{chosenBouquets.map((item) => <li className="selected-preview" key={item.id}><img src={item.image} alt="" width="72" height="80" /><div><h3>{item.name}</h3><p>{money(item.price)}</p></div></li>)}</ul><p className="selection-total"><span>Итого</span><strong>{money(total)}</strong></p></> : <p className="selection-empty">Отметьте один или несколько букетов в анкете.</p>}</div><p className="order-footnote">Оплата на сайте не требуется.<br />Детали получения согласовываются отдельно.</p></div>
        <div className="form-panel">{status === 'success' ? <div className="success-panel" role="status" tabIndex={-1}><span className="success-icon"><Check size={30} /></span><p className="eyebrow">СПАСИБО ЗА ВАШ ВЫБОР</p><h3>Заявка сохранена</h3><p>Ваш номер — <strong>{reference}</strong>.</p><ul className="success-items">{chosenBouquets.map((item) => <li key={item.id}><span>{item.name}</span><span>{money(item.price)}</span></li>)}</ul><p className="selection-total"><span>Итого</span><strong>{money(total)}</strong></p><p className="secondary-text">Заявка ещё не подтверждает дату и условия получения.</p><button className="submit-button" onClick={() => setStatus('idle')} type="button">Вернуться к анкете <ArrowRight size={18} /></button></div> : <form ref={formRef} onSubmit={submit} aria-labelledby="form-title"><h3 id="form-title" className="form-title">Оформить заявку</h3><fieldset disabled={status === 'sending'}>
          <div className="field"><label id="bouquet-label">Букеты <span>*</span></label><Select multiple value={selected} disabled={status === 'sending'} onValueChange={(value) => setSelected(value)} items={bouquets.map((item) => ({ value: item.id, label: `${item.name} · ${money(item.price)}` }))}><SelectTrigger id="bouquet-select" className="bouquet-select" aria-labelledby="bouquet-label" aria-describedby="bouquet-note"><SelectValue>{chosenBouquets.length ? chosenBouquets.length === 1 ? chosenBouquets[0].name : `Выбрано букетов: ${chosenBouquets.length}` : 'Выберите букеты'}</SelectValue></SelectTrigger><SelectContent className="bouquet-options" alignItemWithTrigger={false}>{bouquets.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {money(item.price)}</SelectItem>)}</SelectContent></Select><span id="bouquet-note" className="field-note">Можно выбрать несколько. Нажмите повторно, чтобы убрать букет.</span></div>
          <div className="form-row"><div className="field"><label htmlFor="name">Ваше имя <span>*</span></label><input id="name" name="name" autoComplete="given-name" placeholder="Как к вам обращаться" required minLength={2} maxLength={80} /></div><div className="field"><label htmlFor="phone">Телефон <span>*</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+7 (999) 123-45-67" required maxLength={25} /></div></div>
          <div className="field"><label htmlFor="date">Желаемая дата <span className="optional">необязательно</span></label><input id="date" name="date" type="date" min={today} aria-describedby="date-note" /><span id="date-note" className="field-note">Уточним возможность подготовить букет к этой дате.</span></div>
          <div className="field"><label htmlFor="wishes">Ваши пожелания <span className="optional">необязательно</span></label><textarea id="wishes" name="wishes" rows={3} placeholder="Повод, текст открытки или что-то важное для нас…" maxLength={1000} /></div>
          <label className="consent"><Checkbox checked={consent} onCheckedChange={(checked) => setConsent(Boolean(checked))} aria-label="Согласие на использование данных для обработки заявки" /><span>Разрешаю использовать мои данные для обработки этой заявки.</span></label>
          {status === 'error' && <p className="form-error" role="alert">{error}</p>}
          <button className="submit-button" type="submit" disabled={status === 'sending'}>{status === 'sending' ? <>Сохраняем заявку <LoaderCircle className="spin" size={19} /></> : <>Оставить заявку <ArrowUpRight size={20} /></>}</button><p className="required-note">* Обязательные поля</p>
        </fieldset></form>}</div>
      </div></section>
    </main>
    <footer className="wrap site-footer"><a className="footer-brand" href="#">ветвь<span>Цветы ближе, чем кажется.</span></a><p>Авторские букеты, собранные с вниманием.</p><a href="#catalog">К коллекции <ArrowUpRight size={16} /></a></footer>
  </>;
}
