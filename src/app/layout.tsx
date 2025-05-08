import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '都道府県別人口推移グラフ',
  description: 'ゆめみフロントエンドコーディング試験',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold md:text-2xl">都道府県別人口推移グラフ</h1>
        </header>
        <main className="container mx-auto py-8 px-4">{children}</main>
        <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
          <p>ゆめみフロントエンドコーディング試験</p>
        </footer>
      </body>
    </html>
  );
}