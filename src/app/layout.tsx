import './globals.css';
import { SolanaProvider } from '@/components/solana/solana-provider'
import { Toaster } from 'sonner'
import { ReactQueryProvider } from './react-query-provider'
import { NextUIProvider } from "@nextui-org/react";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata = {
  title: 'OpenVest',
  description: 'Create Vesting Schedules for companies and their employees',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${GeistSans.className}`}>
      <body>
        <ReactQueryProvider>
            <SolanaProvider>
              <NextUIProvider>
                {children}
                <Toaster position="bottom-right" />
              </NextUIProvider>
            </SolanaProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
