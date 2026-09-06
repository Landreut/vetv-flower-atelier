import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Ветвь — авторские букеты',
  description: 'Цветочная мастерская «Ветвь». Шесть авторских букетов с характером. Выберите свою историю и оставьте заявку.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
