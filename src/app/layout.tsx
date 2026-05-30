import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'O\'zbekiston24',
  description: 'O\'zbekiston 24 telekanali — xodimlar boshqaruv tizimi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        {/* Prevent dark-mode flash on reload */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Toaster
          richColors
          position="bottom-center"
          toastOptions={{
            style: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
            className: 'text-sm font-medium',
          }}
          expand={false}
          closeButton
        />
      </body>
    </html>
  );
}
