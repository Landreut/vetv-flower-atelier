'use client';
import { useEffect, useRef, useState, type FormEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { flushSync } from 'react-dom';
import { ArrowDown, ArrowUpRight, ArrowRight, Check, ChevronDown, ChevronUp, Clock3, ExternalLink, LoaderCircle, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { bouquets, money } from '@/lib/catalog';

const reviews = [
  { quote: 'Заказывала «Тихое утро» маме на юбилей. Букет оказался ещё нежнее, чем на фото, а записку написали от руки.', name: 'Анна К.', detail: '«Тихое утро» · 3 дня назад', mark: 'АК' },
  { quote: 'Очень внимательные флористы. Помогли собрать композицию из двух букетов и бережно упаковали для поездки.', name: 'Михаил Р.', detail: '«Розовый воздух» · 1 неделю назад', mark: 'МР' },
  { quote: 'Понравилось, что всё просто: выбрала цветы, оставила телефон — со мной связались и всё уточнили.', name: 'Елена В.', detail: '«Солнечное письмо» · 2 недели назад', mark: 'ЕВ' },
  { quote: '«Чувства вслух» стал главным подарком вечера. Цвет глубокий, розы свежие, композиция выглядит очень дорого.', name: 'Дмитрий С.', detail: '«Чувства вслух» · 3 недели назад', mark: 'ДС' },
  { quote: 'Забегаю в «Ветвь» за маленькими букетами без повода. Здесь всегда находят что-то особенное.', name: 'Ольга Н.', detail: '«Зелёная история» · месяц назад', mark: 'ОН' },
];

export default function Home() {
  const [selected, setSelected] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [reviewIndex, setReviewIndex] = useState(0);
  const requestId = useRef('');
  const requestPayload = useRef('');
  const sending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const catalogViewportRef = useRef<HTMLDivElement>(null);
  const catalogDragging = useRef(false);
  const catalogDragStartX = useRef(0);
  const catalogDragStartY = useRef(0);
  const catalogDragStartScroll = useRef(0);
  const catalogDragMoved = useRef(false);
  const catalogDirection = useRef(1);
  const catalogPaused = useRef(false);
  const catalogResumeTimer = useRef<number | undefined>(undefined);
  const [catalogProgress, setCatalogProgress] = useState(0);
  const chosenBouquets = bouquets.filter((item) => selected.includes(item.id));
  const total = chosenBouquets.reduce((sum, item) => sum + item.price, 0);
  const [today, setToday] = useState('');
  useEffect(() => { const now = new Date(); setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`); }, []);
  useEffect(() => {
    const viewport = catalogViewportRef.current;
    if (!viewport) return;
    let frame = 0;
    let previous = performance.now();
    const drift = (now: number) => {
      const elapsed = now - previous;
      previous = now;
      if (!catalogPaused.current && !catalogDragging.current && document.visibilityState === 'visible') {
        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        if (maxScroll > 1) {
          let next = viewport.scrollLeft + catalogDirection.current * elapsed * 0.012;
          if (next >= maxScroll) { next = maxScroll; catalogDirection.current = -1; }
          if (next <= 0) { next = 0; catalogDirection.current = 1; }
          viewport.scrollLeft = next;
        }
      }
      frame = window.requestAnimationFrame(drift);
    };
    frame = window.requestAnimationFrame(drift);
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const viewport = catalogViewportRef.current;
    if (!viewport) return;
    const updateProgress = () => {
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      setCatalogProgress(maxScroll ? Math.min(100, Math.max(0, (viewport.scrollLeft / maxScroll) * 100)) : 0);
    };
    updateProgress();
    viewport.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => { viewport.removeEventListener('scroll', updateProgress); window.removeEventListener('resize', updateProgress); };
  }, [bouquets.length]);
  function pauseCatalog() {
    catalogPaused.current = true;
  }
  function resumeCatalog() {
    if (!catalogDragging.current) catalogPaused.current = false;
  }
  function beginCatalogDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = catalogViewportRef.current;
    if (!viewport) return;
    catalogDragging.current = true;
    catalogDragMoved.current = false;
    catalogDragStartX.current = event.clientX;
    catalogDragStartY.current = event.clientY;
    catalogDragStartScroll.current = viewport.scrollLeft;
    catalogPaused.current = true;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(event.pointerId);
  }
  function moveCatalogDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!catalogDragging.current) return;
    const viewport = catalogViewportRef.current;
    if (!viewport) return;
    const delta = event.clientX - catalogDragStartX.current;
    const verticalDelta = event.clientY - catalogDragStartY.current;
    if (!catalogDragMoved.current && Math.abs(verticalDelta) > 5 && Math.abs(verticalDelta) > Math.abs(delta)) {
      catalogDragging.current = false;
      catalogPaused.current = false;
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      return;
    }
    if (Math.abs(delta) > 5) catalogDragMoved.current = true;
    if (catalogDragMoved.current) {
      event.preventDefault();
      viewport.scrollLeft = catalogDragStartScroll.current - delta;
    }
  }
  function endCatalogDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = catalogViewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    catalogDragging.current = false;
    if (viewport) viewport.classList.remove('is-dragging');
    window.clearTimeout(catalogResumeTimer.current);
    catalogResumeTimer.current = window.setTimeout(resumeCatalog, 900);
  }
  function scrollCatalogWithWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const viewport = catalogViewportRef.current;
    if (!viewport || viewport.scrollWidth <= viewport.clientWidth) return;
    if (!event.deltaX || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const delta = event.deltaX;
    event.preventDefault();
    viewport.scrollLeft += delta;
    catalogPaused.current = true;
    window.clearTimeout(catalogResumeTimer.current);
    catalogResumeTimer.current = window.setTimeout(resumeCatalog, 1400);
  }
  function scrubCatalog(value: number) {
    const viewport = catalogViewportRef.current;
    if (!viewport) return;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    catalogPaused.current = true;
    viewport.scrollLeft = maxScroll * (value / 100);
    window.clearTimeout(catalogResumeTimer.current);
    catalogResumeTimer.current = window.setTimeout(resumeCatalog, 1400);
  }
  function preventClickAfterCatalogDrag(event: ReactMouseEvent<HTMLDivElement>) {
    if (catalogDragMoved.current) {
      event.preventDefault();
      event.stopPropagation();
      catalogDragMoved.current = false;
    }
  }
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const options = { signal: lifecycle.signal };
    const register = async () => {
      await context.registerTool({ name: 'list_bouquets', title: 'Коллекция букетов', description: 'Read the fourteen available bouquet designs and their prices in rubles.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => bouquets.map(({ id, name, price, description }) => ({ id, name, price, currency: 'RUB', description })) }, options);
      if (lifecycle.signal.aborted) return;
      await context.registerTool({ name: 'select_bouquets_for_order', title: 'Выбрать букеты для заявки', description: 'Set one or more distinct bouquets in the visible order form and navigate to it. Does not submit or save an order.', inputSchema: { type: 'object', properties: { bouquetIds: { type: 'array', minItems: 1, maxItems: bouquets.length, uniqueItems: true, items: { type: 'string', enum: bouquets.map((item) => item.id) } } }, required: ['bouquetIds'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: (input: unknown) => {
        if (sending.current) throw new Error('Дождитесь сохранения текущей заявки.');
        const ids = input && typeof input === 'object' ? (input as { bouquetIds?: unknown }).bouquetIds : undefined;
        if (!Array.isArray(ids) || !ids.length || ids.length > bouquets.length || new Set(ids).size !== ids.length || ids.some((id) => !bouquets.some((item) => item.id === id))) throw new Error(`Выберите от одного до ${bouquets.length} разных букетов из коллекции.`);
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
  function moveReview(direction: number) {
    setReviewIndex((current) => (current + direction + reviews.length) % reviews.length);
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
        <div className="section-heading"><h2 id="catalog-title">Наша коллекция <span>{String(bouquets.length).padStart(2, '0')}</span></h2><p>Каждый букет — маленькая история</p></div>
        <div className="product-carousel-viewport" ref={catalogViewportRef} onPointerEnter={pauseCatalog} onPointerLeave={resumeCatalog} onPointerDown={beginCatalogDrag} onPointerMove={moveCatalogDrag} onPointerUp={endCatalogDrag} onPointerCancel={endCatalogDrag} onWheel={scrollCatalogWithWheel} onClickCapture={preventClickAfterCatalogDrag} role="region" aria-roledescription="карусель" aria-label="Каталог букетов">
          <div className="product-grid">
          {bouquets.map((item, index) => <article className="product" key={item.id}>
          <button type="button" className="product-image-button" onClick={() => choose(item.id)} aria-label={`Выбрать букет «${item.name}», ${money(item.price)}`}><img className="product-image" src={item.image} alt={item.alt} width="768" height="768" loading={index < 3 ? 'eager' : 'lazy'} />{index === 1 && <span className="product-label">Выбор флориста</span>}<span className="image-action" aria-hidden="true"><ArrowUpRight size={21} /></span></button>
          <div className="product-title"><h3>{item.name}</h3><span>{money(item.price)}</span></div><p className="product-description">{item.description}</p>
        </article>)}
          </div>
        </div>
        <div className="catalog-slider-row"><span className="catalog-slider-label">Листайте коллекцию</span><input className="catalog-slider" type="range" min="0" max="100" step="0.1" value={catalogProgress} onChange={(event) => scrubCatalog(Number(event.target.value))} aria-label="Прокрутка каталога букетов" aria-valuetext={`${Math.round(catalogProgress)} процентов`} /><span className="catalog-slider-value" aria-hidden="true">{String(Math.round(catalogProgress)).padStart(2, '0')}%</span></div>
        <p className="catalog-note">Цветы живые, поэтому оттенки и раскрытие бутонов могут немного отличаться от фотографии.</p>
      </section>
      <section id="reviews" className="reviews-section" aria-labelledby="reviews-title">
        <div className="reviews-layout wrap">
          <div className="reviews-intro"><p className="eyebrow">ЧТО ГОВОРЯТ ГОСТИ</p><h2 id="reviews-title">Слова,<br /><em>которые остаются.</em></h2><p>Спасибо, что делитесь впечатлениями. Мы читаем каждый отзыв и передаём его флористам.</p><div className="review-controls"><button type="button" onClick={() => moveReview(-1)} aria-label="Предыдущий отзыв"><ChevronUp size={19} /></button><span>{String(reviewIndex + 1).padStart(2, '0')} <i>/</i> {String(reviews.length).padStart(2, '0')}</span><button type="button" onClick={() => moveReview(1)} aria-label="Следующий отзыв"><ChevronDown size={19} /></button></div></div>
          <div className="reviews-viewport" aria-live="polite"><div className="reviews-track" style={{ transform: `translateY(-${reviewIndex * 100}%)` }}>{reviews.map((review) => <article className="review-card" key={review.name}><div className="review-quote">“</div><blockquote>{review.quote}</blockquote><footer><span className="review-mark">{review.mark}</span><span><strong>{review.name}</strong><small>{review.detail}</small></span></footer></article>)}</div></div>
        </div>
      </section>
      <section id="visit" className="location-section wrap" aria-labelledby="visit-title">
        <div className="location-copy">
          <p className="eyebrow"><MapPin size={15} /> НАЙДИТЕ НАС</p>
          <h2 id="visit-title">Цветы ждут<br /><em>своей встречи.</em></h2>
          <p className="location-intro">Загляните в мастерскую, чтобы выбрать букет вживую или просто вдохнуть немного свежего воздуха.</p>
          <div className="location-details"><p><strong>Москва, ул. Остоженка, 18/1</strong><br />Вход со стороны Пожарского переулка</p><p><Clock3 size={15} /> Ежедневно, 09:00—21:00</p></div>
          <a className="text-link" href="https://www.openstreetmap.org/?mlat=55.7449&mlon=37.5987#map=17/55.7449/37.5987" target="_blank" rel="noreferrer">Открыть маршрут <ExternalLink size={16} /></a>
        </div>
        <div className={`map-frame${mapActive ? ' is-active' : ''}`}><iframe title="Карта расположения цветочной мастерской «Ветвь»" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=37.588%2C55.737%2C37.608%2C55.752&layer=mapnik&marker=55.7449%2C37.5987" />{mapActive ? <button type="button" className="map-deactivate" onClick={() => setMapActive(false)}>Вернуть обычную прокрутку</button> : <button type="button" className="map-activate" onClick={() => setMapActive(true)}><span>Нажмите, чтобы взаимодействовать с картой</span></button>}</div>
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
    <footer className="wrap site-footer"><a className="footer-brand" href="#">ветвь<span>Цветы ближе, чем кажется.</span></a><p>Авторские букеты, собранные с вниманием.</p><div className="footer-socials" aria-label="Социальные сети"><button type="button" className="footer-social" aria-label="ВКонтакте" title="ВКонтакте">VK</button><button type="button" className="footer-social" aria-label="Телеграм" title="Телеграм">TG</button><button type="button" className="footer-social" aria-label="Одноклассники" title="Одноклассники">OK</button><button type="button" className="footer-social" aria-label="WhatsApp" title="WhatsApp">WA</button></div><a href="#catalog">К коллекции <ArrowUpRight size={16} /></a></footer>
  </>;
}
