'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero } from '../ui/ui-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { useVestingProgram } from './vesting-data-access'
import { VestingCreate, VestingList } from './vesting-ui'
import { AllocationList } from './employee-allocations-list'
import { Button } from '../ui/button'


//FINAL THINGS LEFT:
// 1. SETTING UP ALL THE ROUTES(createCompanyVesting done, now time for others)
// 2. ADD AESTHETIC BG(DOTS) + NEON GLOW AROUND CARDS
// 3. ADD BENEFICIARY/EMPLOYEE ADDRESS OPTION(WHEN CREATING VESTING ACCOUNT FOR EMPLOYEE)
// 4. WALLET DISCONNECTED INTERFACE SHOULD BE INFORMATIVE ENOUGH(KINDA LIKE LANDING PAGE, NOT FULLY)

// DEADLINE - TODAY, EOD.

export default function VestingFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <div className="flex flex-col w-full">
      <AppHero
        title="Token Vesting"
        subtitle={'Reward your project contributors with vested tokens!'}
      >
        <VestingCreate />
      </AppHero>

      <div className="w-full px-4 md:px-6 lg:px-8">
        <Tabs defaultValue="vesting" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vesting">Vesting Accounts</TabsTrigger>
            <TabsTrigger value="allocation">Allocations</TabsTrigger>
          </TabsList>
          <TabsContent value="vesting">
            <Card>
              <CardContent className="pt-6">
                <VestingList />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="allocation">
            <Card>
              <CardContent className="pt-6 bg-[rgb(2,8,23)]">
                <AllocationList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-8">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}