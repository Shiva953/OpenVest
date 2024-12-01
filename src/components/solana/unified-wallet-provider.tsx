'use client'

import { UnifiedWalletProvider,Adapter } from "@jup-ag/wallet-adapter";
import { PhantomWalletAdapter,SolflareWalletAdapter,CoinbaseWalletAdapter,TrustWalletAdapter } from "@solana/wallet-adapter-wallets"
import { useMemo } from "react";
import React from "react";

export const JupiterWalletProvider = ({children} : {children: React.ReactNode}) => {

    const wallets: Adapter[] = useMemo(() => {
        return [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
          new CoinbaseWalletAdapter(),
          new TrustWalletAdapter(),
        ].filter((item) => item && item.name && item.icon) as Adapter[];
      }, []);

  return (
    <UnifiedWalletProvider
      wallets={wallets}
      config={{
        autoConnect: true,
        env: "devnet",
        metadata: {
          name: "UnifiedWallet",
          description: "UnifiedWallet",
          url: "https://jup.ag",
          iconUrls: ["https://jup.ag/favicon.ico"],
        },
        // notificationCallback: {},
        walletlistExplanation: {
          href: "https://station.jup.ag/docs/additional-topics/wallet-list",
        },
        theme: "dark",
        lang: "en",
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
};
