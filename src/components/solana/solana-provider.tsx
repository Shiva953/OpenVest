'use client'

import dynamic from 'next/dynamic'
import { AnchorProvider } from '@coral-xyz/anchor'
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
} from '@solana/wallet-adapter-react'
import { ReactNode, useMemo } from 'react'
import { JupiterWalletProvider } from './unified-wallet-provider'
import { Cluster, clusterApiUrl } from '@solana/web3.js'

require('@solana/wallet-adapter-react-ui/styles.css')

export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})

export function SolanaProvider({ children }: { children: ReactNode }) {
  const cluster:Cluster  = "devnet"
  const endpoint = useMemo(() => clusterApiUrl(cluster), [cluster])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <JupiterWalletProvider>
      {/* <WalletProvider wallets={[]} onError={onError} autoConnect={true}>
        <WalletModalProvider> */}
          {children}
        </JupiterWalletProvider>
          {/* </WalletModalProvider>
      </WalletProvider> */}
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return new AnchorProvider(connection, wallet as AnchorWallet, { commitment: 'confirmed' })
}
