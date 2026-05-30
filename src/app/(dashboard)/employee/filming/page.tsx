'use client';
import dynamic from 'next/dynamic';
const FilmingPage = dynamic(() => import('@/components/filming/FilmingPage').then((m) => m.FilmingPage), { ssr: false });
export default function Page() { return <FilmingPage canEdit={false} />; }
