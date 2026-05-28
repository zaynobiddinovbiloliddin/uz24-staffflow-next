'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          dedupingInterval: 5000,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
