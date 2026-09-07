export const bouquets = [
  { id: 'quiet-morning', name: 'Тихое утро', price: 4200, description: 'Белые розы, эустома и эвкалипт', image: '/images/quiet-morning.webp', alt: 'Авторский белый букет из садовых роз, эустомы и эвкалипта' },
  { id: 'pink-air', name: 'Розовый воздух', price: 4900, description: 'Садовые и кустовые розы в нежной гамме', image: '/images/pink-air.webp', alt: 'Нежно-розовый букет из садовых и кустовых роз' },
  { id: 'sunny-letter', name: 'Солнечное письмо', price: 3800, description: 'Персиковые розы, гвоздики и ромашки', image: '/images/sunny-letter.webp', alt: 'Персиковый букет с розами, абрикосовыми гвоздиками и ромашками' },
  { id: 'lilac-evening', name: 'Лиловый вечер', price: 4600, description: 'Сиреневая эустома, розы и статица', image: '/images/lilac-evening.webp', alt: 'Лиловый букет из эустомы, роз и фиолетовой статицы' },
  { id: 'feelings-aloud', name: 'Чувства вслух', price: 5700, description: 'Красные и бордовые розы с глубиной цвета', image: '/images/feelings-aloud.webp', alt: 'Насыщенный букет из бордовых и красных роз с тёмными акцентами' },
  { id: 'green-story', name: 'Зелёная история', price: 4400, description: 'Белая гортензия, вибурнум и зелень', image: '/images/green-story.webp', alt: 'Бело-зелёный букет из гортензии, лаймового вибурнума и ветвей' },
  { id: 'kraft-light', name: 'Крафт и свет', price: 3600, description: 'Текстурная крафт-бумага, лента и карточка', image: '/images/kraft-light.jpg', alt: 'Светлый букет в текстурной крафт-бумаге с зелёной лентой и карточкой' },
  { id: 'white-ribbon', name: 'Белая лента', price: 5200, description: 'Цилиндрическая коробка и широкая атласная лента', image: '/images/white-ribbon.jpg', alt: 'Светлый букет в высокой коробке с широкой атласной лентой' },
  { id: 'warm-note', name: 'Тёплая записка', price: 4100, description: 'Ботаническая бумага, бархатная лента и бирка', image: '/images/warm-note.jpg', alt: 'Персиковый букет в ботанической бумаге с бордовой бархатной лентой' },
  { id: 'garden-box', name: 'Сад в коробке', price: 4700, description: 'Низкая композиция в зелёной коробке со стикером', image: '/images/garden-box.jpg', alt: 'Низкая цветочная композиция в зелёной коробке с круглым стикером' },
  { id: 'letter-on-road', name: 'Письмо в пути', price: 3900, description: 'Двухслойная бумага, бечёвка и открытка', image: '/images/letter-on-road.jpg', alt: 'Свободный букет в голубой бумаге с бечёвкой и открыткой' },
  { id: 'quiet-garden', name: 'Тихий сад', price: 4300, description: 'Веллум, льняная лента и овальная бирка', image: '/images/quiet-garden.jpg', alt: 'Компактный букет в полупрозрачной бумаге с терракотовой льняной лентой' },
  { id: 'just-because', name: 'Подарок без повода', price: 3500, description: 'Розовый рукав, репсовая лента и мини-ярлык', image: '/images/just-because.jpg', alt: 'Жизнерадостный букет в розовом бумажном рукаве с зелёной лентой' },
  { id: 'two-voices', name: 'Два голоса', price: 4900, description: 'Два вида бумаги, кремовая лента и двойная бирка', image: '/images/two-voices.jpg', alt: 'Букет в разделённой крафтовой и лавандовой упаковке с кремовой лентой' },
] as const;
export const money = (price: number) => `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
