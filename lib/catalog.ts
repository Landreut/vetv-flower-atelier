export const bouquets = [
  { id: 'quiet-morning', name: 'Тихое утро', price: 4200, description: 'Белые розы, эустома и эвкалипт', image: '/images/quiet-morning.webp', alt: 'Авторский белый букет из садовых роз, эустомы и эвкалипта' },
  { id: 'pink-air', name: 'Розовый воздух', price: 4900, description: 'Садовые и кустовые розы в нежной гамме', image: '/images/pink-air.webp', alt: 'Нежно-розовый букет из садовых и кустовых роз' },
  { id: 'sunny-letter', name: 'Солнечное письмо', price: 3800, description: 'Персиковые розы, гвоздики и ромашки', image: '/images/sunny-letter.webp', alt: 'Персиковый букет с розами, абрикосовыми гвоздиками и ромашками' },
  { id: 'lilac-evening', name: 'Лиловый вечер', price: 4600, description: 'Сиреневая эустома, розы и статица', image: '/images/lilac-evening.webp', alt: 'Лиловый букет из эустомы, роз и фиолетовой статицы' },
  { id: 'feelings-aloud', name: 'Чувства вслух', price: 5700, description: 'Красные и бордовые розы с глубиной цвета', image: '/images/feelings-aloud.webp', alt: 'Насыщенный букет из бордовых и красных роз с тёмными акцентами' },
  { id: 'green-story', name: 'Зелёная история', price: 4400, description: 'Белая гортензия, вибурнум и зелень', image: '/images/green-story.webp', alt: 'Бело-зелёный букет из гортензии, лаймового вибурнума и ветвей' },
] as const;
export const money = (price: number) => `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
